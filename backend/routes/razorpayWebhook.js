import crypto from 'crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

/**
 * POST /api/orders/razorpay/webhook
 * Register with express.raw({ type: 'application/json' }) so req.body is the raw payload string/buffer.
 * Dashboard: https://dashboard.razorpay.com/app/webhooks — use the same secret as RAZORPAY_WEBHOOK_SECRET.
 */
export default async function razorpayWebhookHandler(req, res) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET is not set; acknowledging webhook without processing');
      return res.status(200).json({ received: true, configured: false });
    }

    const signature = req.get('X-Razorpay-Signature');
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing X-Razorpay-Signature' });
    }

    const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
    const expected = crypto.createHmac('sha256', webhookSecret).update(bodyString).digest('hex');
    if (expected !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(bodyString);

    if (event.event === 'payment.captured') {
      const pay = event.payload?.payment?.entity;
      const razorpayOrderId = pay?.order_id;
      if (pay?.id && razorpayOrderId) {
        const updated = await Order.findOneAndUpdate(
          { razorpayOrderId, paymentStatus: 'Pending' },
          {
            $set: {
              razorpayPaymentId: pay.id,
              paymentStatus: 'Completed',
              status: 'Confirmed',
              updatedAt: new Date(),
            },
          },
          { new: true }
        );
        if (updated) {
          await Cart.findOneAndUpdate({ user: updated.user }, { items: [] });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
