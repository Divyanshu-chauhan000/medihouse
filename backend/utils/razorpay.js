import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Initialize Razorpay instance
 */
export const initializeRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Create Razorpay order
 */
export const createRazorpayOrder = async (amount, receipt, description = '') => {
  try {
    const razorpay = initializeRazorpay();
    
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      ...(description ? { notes: { description } } : {}),
    };

    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const razorpay = initializeRazorpay();
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error('Error fetching payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Capture authorized payment
 */
export const capturePayment = async (paymentId, amount) => {
  try {
    const razorpay = initializeRazorpay();
    const captured = await razorpay.payments.capture(paymentId, Math.round(amount * 100));
    return { success: true, payment: captured };
  } catch (error) {
    console.error('Error capturing payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (paymentId, amount = null, notes = '') => {
  try {
    const razorpay = initializeRazorpay();
    
    const refundOptions = {
      notes: { refund_reason: notes }
    };

    if (amount) {
      refundOptions.amount = Math.round(amount * 100);
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return { success: true, refund };
  } catch (error) {
    console.error('Error refunding payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get order details
 */
export const getOrderDetails = async (orderId) => {
  try {
    const razorpay = initializeRazorpay();
    const order = await razorpay.orders.fetch(orderId);
    return { success: true, order };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate payment receipt
 */
export const generateReceipt = (orderId) => {
  return `order_${orderId}_${Date.now()}`;
};

/**
 * Validate amount
 */
export const validateAmount = (amount) => {
  return amount && !isNaN(amount) && amount > 0;
};

/**
 * Format amount for Razorpay (INR in paise)
 */
export const formatAmountForRazorpay = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Format amount from Razorpay (paise to INR)
 */
export const formatAmountFromRazorpay = (amount) => {
  return Math.round(amount) / 100;
};
