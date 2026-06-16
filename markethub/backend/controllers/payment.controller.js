const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @POST /api/payment/create-order
const createPaymentOrder = async (req, res, next) => {
  try {
    const { order_id } = req.body;

    // Verify order belongs to user and is pending
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND buyer_id = ? AND payment_status = "pending"',
      [order_id, req.user.id]
    );

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found or already paid.' });
    }

    const order = orders[0];

    // Create Razorpay order (amount in paise = rupees * 100)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total_amount * 100),
      currency: 'INR',
      receipt: `order_${order_id}`,
      notes: { order_id: String(order_id), buyer_id: String(req.user.id) },
    });

    // Save Razorpay order ID
    await pool.execute(
      'UPDATE orders SET razorpay_order_id = ? WHERE id = ?',
      [razorpayOrder.id, order_id]
    );

    res.json({
      success: true,
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/payment/verify - called after successful payment on frontend
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    // Verify signature (CRITICAL security step)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // Update order payment status
    await pool.execute(
      `UPDATE orders SET payment_status = 'paid', status = 'confirmed',
       razorpay_payment_id = ? WHERE id = ? AND buyer_id = ?`,
      [razorpay_payment_id, order_id, req.user.id]
    );

    // Update seller total sales
    const [items] = await pool.execute(
      'SELECT seller_id, SUM(price * quantity) as amount FROM order_items WHERE order_id = ? GROUP BY seller_id',
      [order_id]
    );

    for (const item of items) {
      await pool.execute(
        'UPDATE seller_profiles SET total_sales = total_sales + ? WHERE user_id = ?',
        [item.amount, item.seller_id]
      );
    }

    res.json({ success: true, message: 'Payment verified. Order confirmed!' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPaymentOrder, verifyPayment };
