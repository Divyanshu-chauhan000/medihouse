import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const VALID_PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'COD'];

function mapClientPaymentMethod(raw) {
  if (raw && VALID_PAYMENT_METHODS.includes(raw)) return raw;
  if (raw === 'card') return 'Debit Card';
  if (raw === 'cod' || raw === 'COD') return 'COD';
  return 'COD';
}

function mapRazorpayPaymentMethod(method) {
  const m = String(method || '').toLowerCase();
  if (m === 'card') return 'Credit Card';
  if (m === 'upi') return 'UPI';
  if (m === 'netbanking') return 'Net Banking';
  if (m === 'wallet') return 'Wallet';
  return 'Debit Card';
}

/** totalAmount = line subtotal; payable = subtotal + shipping - discount */
function payableRupees(order) {
  return (order.totalAmount || 0) + (order.shippingCost || 0) - (order.discount || 0);
}

function payablePaise(order) {
  return Math.round(payableRupees(order) * 100);
}

function getRazorpayOrThrow() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured (missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET)');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ============================================
// CREATE ORDER WITH ITEMS AND CALCULATE AMOUNT
// ============================================
// @route   POST /api/orders/create
// @desc    Create order with items before payment
router.post('/create', protect, async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, shippingCost: sc, discount: disc } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    let itemsSubtotal = 0;
    const resolvedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product).select('price stock name');
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }
      const unit = Number(product.price);
      if (Number(item.price) !== unit) {
        return res.status(400).json({
          success: false,
          message: `Price mismatch for ${product.name}. Refresh cart and try again.`,
        });
      }
      const qty = Number(item.quantity);
      itemsSubtotal += unit * qty;
      resolvedItems.push({
        product: item.product,
        quantity: qty,
        price: unit,
        requiresPrescription: item.requiresPrescription,
        prescriptionId: item.prescriptionId,
      });
    }

    const shippingCost = Math.max(0, Number(sc) || 0);
    const discount = Math.max(0, Number(disc) || 0);
    const payable = itemsSubtotal + shippingCost - discount;

    if (payable < 1) {
      return res.status(400).json({ success: false, message: 'Order total must be at least ₹1' });
    }

    const mappedMethod = mapClientPaymentMethod(paymentMethod);

    const order = new Order({
      user: req.user.id,
      items: resolvedItems,
      shippingAddress,
      paymentMethod: mappedMethod,
      totalAmount: itemsSubtotal,
      shippingCost,
      discount,
      paymentStatus: 'Pending',
      status: 'Pending',
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
      itemsSubtotal,
      shippingCost,
      discount,
      payable,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// CREATE RAZORPAY PAYMENT ORDER
// ============================================
// @route   POST /api/orders/razorpay/create
// @desc    Create Razorpay order for payment
router.post('/razorpay/create', protect, async (req, res) => {
  try {
    const razorpayInstance = getRazorpayOrThrow();
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (order.paymentStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    const expectedPaise = payablePaise(order);
    if (expectedPaise < 100) {
      return res.status(400).json({ success: false, message: 'Amount must be at least ₹1' });
    }

    const receipt = `r_${String(orderId).slice(-20)}_${Date.now()}`.slice(0, 40);

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: expectedPaise,
      currency: 'INR',
      receipt,
      notes: {
        mongoOrderId: String(order._id),
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Razorpay order created',
      razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID,
      payable: payableRupees(order),
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// VERIFY RAZORPAY PAYMENT SIGNATURE
// ============================================
// @route   POST /api/orders/razorpay/verify
// @desc    Verify Razorpay payment and complete order
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const razorpayInstance = getRazorpayOrThrow();

    const razorpayOrderId = req.body.razorpayOrderId || req.body.razorpay_order_id;
    const razorpayPaymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
    const razorpaySignature = req.body.razorpaySignature || req.body.razorpay_signature;
    const orderId = req.body.orderId || req.body.order_id;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (order.paymentStatus === 'Completed') {
      const populated = await Order.findById(orderId).populate('items.product');
      return res.json({
        success: true,
        message: 'Order already paid',
        order: populated,
      });
    }

    if (!order.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'No Razorpay session for this order. Create payment from checkout again.',
      });
    }

    const sigBody = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sigBody)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature',
      });
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Razorpay order mismatch' });
    }

    let payment = await razorpayInstance.payments.fetch(razorpayPaymentId);

    if (payment.status === 'authorized') {
      payment = await razorpayInstance.payments.capture(
        razorpayPaymentId,
        payment.amount,
        payment.currency || 'INR'
      );
    }

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: `Payment status is ${payment.status}`,
      });
    }

    if (payment.order_id && payment.order_id !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Payment does not belong to this checkout' });
    }

    const expectedPaise = payablePaise(order);
    if (Math.abs(Number(payment.amount) - expectedPaise) > 1) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount does not match order total',
      });
    }

    const methodFromClient = req.body.paymentMethod && mapClientPaymentMethod(req.body.paymentMethod);
    const paymentMethod =
      methodFromClient && methodFromClient !== 'COD'
        ? methodFromClient
        : mapRazorpayPaymentMethod(payment.method);

    const updated = await Order.findByIdAndUpdate(
      orderId,
      {
        razorpayOrderId,
        razorpayPaymentId,
        paymentStatus: 'Completed',
        status: 'Confirmed',
        paymentMethod,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate('items.product');

    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });

    res.json({
      success: true,
      message: 'Payment verified and order confirmed',
      order: updated,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// CAPTURE PAYMENT (For authorized payments)
// ============================================
// @route   POST /api/orders/razorpay/capture
// @desc    Capture authorized payment
router.post('/razorpay/capture', protect, authorize('admin'), async (req, res) => {
  try {
    const razorpayInstance = getRazorpayOrThrow();
    const { paymentId, amount } = req.body;

    if (!paymentId || !amount) {
      return res.status(400).json({ success: false, message: 'Payment ID and amount required' });
    }

    const capturedPayment = await razorpayInstance.payments.capture(
      paymentId,
      Math.round(Number(amount) * 100),
      'INR'
    );

    res.json({ 
      success: true, 
      message: 'Payment captured successfully',
      payment: capturedPayment 
    });
  } catch (error) {
    console.error('Payment capture error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// REFUND PAYMENT
// ============================================
// @route   POST /api/orders/:orderId/refund
// @desc    Refund payment for an order
router.post('/:orderId/refund', protect, authorize('admin'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'No payment ID found for this order' });
    }

    const razorpayInstance = getRazorpayOrThrow();
    const fullPaise = payablePaise(order);
    const refundAmount = amount != null && amount !== ''
      ? Math.round(Number(amount) * 100)
      : fullPaise;

    const refund = await razorpayInstance.payments.refund(order.razorpayPaymentId, {
      amount: refundAmount,
      notes: `Refund for order ${orderId}`
    });

    // Update order status
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'Refunded',
      status: 'Cancelled',
      updatedAt: Date.now()
    });

    res.json({ 
      success: true, 
      message: 'Payment refunded successfully',
      refund 
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// GET USER ORDERS
// ============================================
// @route   GET /api/orders/myorders
// @desc    Get logged in user orders
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort('-createdAt');
    
    res.json({ 
      success: true, 
      orders,
      total: orders.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// GET VENDOR ORDERS
// ============================================
// @route   GET /api/orders/vendor
// @desc    Get vendor's orders
router.get('/vendor', protect, authorize('vendor'), async (req, res) => {
  try {
    // 1. Find all products belonging to this vendor
    const vendorProducts = await Product.find({ vendor: req.user.id }).select('_id');
    const productIds = vendorProducts.map(p => p._id);

    // 2. Find orders containing any of these products
    const orders = await Order.find({
      'items.product': { $in: productIds }
    })
    .populate('user', 'name email phone')
    .populate('items.product')
    .sort('-createdAt');

    res.json({
      success: true,
      orders,
      total: orders.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// GET ORDER BY ID
// ============================================
// @route   GET /api/orders/:id
// @desc    Get order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'vendor') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // If vendor, check if they own at least one item
    if (req.user.role === 'vendor') {
      const vendorProducts = await Product.find({ vendor: req.user.id }).select('_id');
      const productIds = vendorProducts.map(p => String(p._id));
      const hasVendorProduct = order.items.some(item => productIds.includes(String(item.product?._id || item.product)));
      if (!hasVendorProduct) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// GET ALL ORDERS (ADMIN)
// ============================================
// @route   GET /api/orders
// @desc    Get all orders (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(filter)
      .populate('user', 'id name email')
      .populate('items.product')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({ 
      success: true, 
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// UPDATE ORDER STATUS
// ============================================
// @route   PUT /api/orders/:id
// @desc    Update order status (Admin and Vendor who owns a product in the order)
router.put('/:id', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization for vendor
    if (req.user.role === 'vendor') {
      const vendorProducts = await Product.find({ vendor: req.user.id }).select('_id');
      const productIds = vendorProducts.map(p => String(p._id));
      const hasVendorProduct = order.items.some(item => productIds.includes(String(item.product)));
      if (!hasVendorProduct) {
        return res.status(401).json({ success: false, message: 'Not authorized to update this order' });
      }
    }

    order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        notes,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('items.product');

    res.json({ 
      success: true, 
      message: 'Order updated successfully',
      order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// DELETE ORDER (ADMIN)
// ============================================
// @route   DELETE /api/orders/:id
// @desc    Delete order (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ 
      success: true, 
      message: 'Order deleted successfully',
      order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
