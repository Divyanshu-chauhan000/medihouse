import crypto from 'crypto';

/**
 * Validate payment amount
 */
export const validatePaymentAmount = (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ success: false, message: 'Amount is required' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
  }

  // Razorpay minimum amount is ₹1
  if (amount < 1) {
    return res.status(400).json({ success: false, message: 'Amount must be at least ₹1' });
  }

  // Razorpay maximum amount is ₹50,00,000 (5 million)
  if (amount > 5000000) {
    return res.status(400).json({ success: false, message: 'Amount cannot exceed ₹50,00,000' });
  }

  next();
};

/**
 * Validate payment signature
 */
export const validatePaymentSignature = (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: 'Payment details (orderId, paymentId, signature) are required'
    });
  }

  // Validate signature format
  if (typeof razorpaySignature !== 'string' || razorpaySignature.length !== 64) {
    return res.status(400).json({
      success: false,
      message: 'Invalid signature format'
    });
  }

  next();
};

/**
 * Verify payment signature
 */
export const verifyPaymentSignature = (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: 'Payment signature verification failed. Payment may be fraudulent.'
    });
  }

  next();
};

/**
 * Validate refund amount
 */
export const validateRefundAmount = (req, res, next) => {
  const { amount } = req.body;

  if (amount && (typeof amount !== 'number' || amount <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'Refund amount must be a positive number'
    });
  }

  next();
};

/**
 * Validate order status
 */
export const validateOrderStatus = (validStatuses) => {
  return (req, res, next) => {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Validate shipping address
 */
export const validateShippingAddress = (req, res, next) => {
  const { shippingAddress } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required'
    });
  }

  const { street, city, state, zipCode, country } = shippingAddress;

  if (!street || !city || !state || !zipCode || !country) {
    return res.status(400).json({
      success: false,
      message: 'All address fields (street, city, state, zipCode, country) are required'
    });
  }

  // Validate ZIP code format (basic validation)
  if (!/^\d{6}$/.test(zipCode)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ZIP code format. Use 6 digits.'
    });
  }

  next();
};

/**
 * Validate order items
 */
export const validateOrderItems = (req, res, next) => {
  const { orderItems } = req.body;

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one item is required in the order'
    });
  }

  // Validate each item
  for (let item of orderItems) {
    if (!item.product || !item.quantity || !item.price) {
      return res.status(400).json({
        success: false,
        message: 'Each item must have product, quantity, and price'
      });
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    if (typeof item.price !== 'number' || item.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    // Validate product ID format (MongoDB ObjectId)
    if (!/^[0-9a-f]{24}$/i.test(item.product)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
  }

  next();
};

/**
 * Prevent double payments
 */
export const preventDoublePayment = (async (req, res, next) => {
  const { orderId } = req.body;

  if (!orderId) {
    return next();
  }

  // Check if order is already paid
  // This would typically query the database
  // For now, we'll just pass through

  next();
});

/**
 * Rate limit for payment endpoints (basic)
 */
export const paymentRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const userAttempts = attempts.get(userId) || [];

    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many payment attempts. Try again after ${Math.ceil(windowMs / 1000)} seconds.`
      });
    }

    recentAttempts.push(now);
    attempts.set(userId, recentAttempts);

    next();
  };
};
