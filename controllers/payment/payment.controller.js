// controllers/payment/payment.controller.js

import Stripe from 'stripe';
import * as PaymentModel from '../../models/payment/payment.model.js';
import * as UserModel from '../../models/user/user.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';
import pool from '../../config/db.js';

/* =========================================================
   STRIPE INITIALIZATION
========================================================= */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET);

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/**
 * Get or Create Stripe Customer
 * Handles cases where stripe_customer_id column might not exist
 */
const getOrCreateStripeCustomer = async (user) => {
  try {
    // Try to get existing customer ID from database
    let customerId = null;

    try {
      const result = await pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [user.id]
      );
      customerId = result.rows[0]?.stripe_customer_id;
    } catch (dbErr) {
      // Column might not exist - continue without it
      console.log('Note: stripe_customer_id column check:', dbErr.message);
    }

    // If customer ID exists, verify it's valid in Stripe
    if (customerId) {
      try {
        const existingCustomer = await stripe.customers.retrieve(customerId);
        if (!existingCustomer.deleted) {
          console.log('✅ Using existing Stripe customer:', customerId);
          return customerId;
        }
      } catch (stripeErr) {
        // Customer doesn't exist in Stripe, create new one
        console.log('Stripe customer not found, creating new one');
        customerId = null;
      }
    }

    // Create new Stripe customer
    console.log('Creating new Stripe customer for:', user.email);

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      metadata: {
        user_id: user.id.toString(),
        created_from: 'payment_intent'
      }
    });

    console.log('✅ Created Stripe customer:', customer.id);

    // Try to save customer ID to database
    try {
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customer.id, user.id]
      );
      console.log('✅ Saved Stripe customer ID to database');
    } catch (saveErr) {
      // Column might not exist - payment will still work
      console.log('Note: Could not save stripe_customer_id:', saveErr.message);
    }

    return customer.id;
  } catch (error) {
    console.error('Error in getOrCreateStripeCustomer:', error.message);

    // Fallback: Create customer without saving to DB
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { user_id: user.id.toString() }
    });

    return customer.id;
  }
};

/**
 * Convert amount to smallest currency unit
 * AED, USD, EUR etc. need to be multiplied by 100
 */
const toSmallestUnit = (amount, currency) => {
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];
  const curr = currency.toLowerCase();

  if (zeroDecimalCurrencies.includes(curr)) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
};

/**
 * Convert from smallest unit to standard amount
 */
const fromSmallestUnit = (amount, currency) => {
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];
  const curr = currency.toLowerCase();

  if (zeroDecimalCurrencies.includes(curr)) {
    return amount;
  }

  return amount / 100;
};

/* =========================================================
   PAYMENT INTENT CONTROLLERS
========================================================= */

/**
 * @desc    Create Payment Intent
 * @route   POST /api/v1/payment/create-payment-intent
 * @access  Private
 */
export const createPaymentIntent = catchAsyncErrors(async (req, res, next) => {
  const {
    amount,
    currency = 'aed',
    description,
    projectId,
    paymentType = 'full',
    metadata = {}
  } = req.body;

  // Validation
  if (!amount || amount <= 0) {
    return next(new ErrorHandler('Valid amount is required', 400));
  }

  if (amount > 999999999) {
    return next(new ErrorHandler('Amount exceeds maximum limit', 400));
  }

  // Get user
  const user = await UserModel.getUserById(req.user.id);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('📤 Creating Payment Intent');
  console.log('User:', user.email);
  console.log('Amount:', amount, currency.toUpperCase());
  console.log('Type:', paymentType);
  console.log('Project ID:', projectId || 'N/A');
  console.log('═══════════════════════════════════════════════════');

  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toSmallestUnit(amount, currency),
      currency: currency.toLowerCase(),
      customer: customerId,
      description: description || `${paymentType} payment by ${user.name}`,
      metadata: {
        user_id: user.id.toString(),
        user_email: user.email,
        user_name: user.name,
        project_id: projectId?.toString() || '',
        payment_type: paymentType,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Optional: Add statement descriptor (appears on customer's bank statement)
      // statement_descriptor_suffix: 'ACASA',
    });

    console.log('✅ Payment Intent created:', paymentIntent.id);

    // Save payment to database
    try {
      await PaymentModel.createPayment({
        user_id: user.id,
        project_id: projectId || null,
        stripe_payment_id: paymentIntent.id,
        stripe_customer_id: customerId,
        amount: amount,
        currency: currency.toLowerCase(),
        payment_status: 'pending',
        payment_type: paymentType,
        description: description || `${paymentType} payment`,
        metadata: {
          payment_intent_id: paymentIntent.id,
          project_id: projectId,
          customer_name: metadata.customerName || user.name,
          customer_email: metadata.customerEmail || user.email,
          customer_phone: metadata.customerPhone || user.phone,
          ...metadata
        }
      });
      console.log('✅ Payment saved to database');
    } catch (dbErr) {
      console.error('⚠️ Error saving payment to DB:', dbErr.message);
      // Continue anyway - Stripe payment will still work
    }

    // Return response
    res.status(200).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency.toLowerCase(),
        customerId: customerId
      }
    });

  } catch (stripeError) {
    console.error('❌ Stripe Error:', stripeError.message);

    // Handle specific Stripe errors
    if (stripeError.type === 'StripeCardError') {
      return next(new ErrorHandler(stripeError.message, 400));
    }

    if (stripeError.type === 'StripeInvalidRequestError') {
      return next(new ErrorHandler('Invalid payment request: ' + stripeError.message, 400));
    }

    return next(new ErrorHandler('Payment initialization failed. Please try again.', 500));
  }
});

/**
 * @desc    Verify Payment
 * @route   POST /api/v1/payment/verify-payment
 * @access  Private
 */
export const verifyPayment = catchAsyncErrors(async (req, res, next) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return next(new ErrorHandler('Payment Intent ID is required', 400));
  }

  console.log('🔍 Verifying payment:', paymentIntentId);

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('Payment status from Stripe:', paymentIntent.status);

    // Map Stripe status to our status
    const statusMap = {
      'succeeded': 'succeeded',
      'processing': 'processing',
      'requires_payment_method': 'failed',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'canceled': 'canceled',
      'requires_capture': 'pending'
    };

    const mappedStatus = statusMap[paymentIntent.status] || paymentIntent.status;

    // Update payment status in database
    let payment = null;
    try {
      payment = await PaymentModel.updatePaymentStatus(paymentIntentId, mappedStatus, {
        payment_method: paymentIntent.payment_method_types?.[0] || null
      });
    } catch (dbErr) {
      console.log('Note: Could not update payment in DB:', dbErr.message);
    }

    // Build response
    const responseData = {
      id: payment?.id || null,
      stripe_payment_id: paymentIntentId,
      amount: fromSmallestUnit(paymentIntent.amount, paymentIntent.currency),
      currency: paymentIntent.currency,
      status: mappedStatus,
      payment_method: paymentIntent.payment_method_types?.[0] || null,
      created_at: payment?.created_at || new Date(),
      receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null
    };

    console.log('✅ Payment verified:', mappedStatus);

    res.status(200).json({
      success: true,
      message: paymentIntent.status === 'succeeded'
        ? 'Payment verified successfully'
        : `Payment status: ${mappedStatus}`,
      data: responseData
    });

  } catch (stripeError) {
    console.error('❌ Stripe verification error:', stripeError.message);
    return next(new ErrorHandler('Payment verification failed', 400));
  }
});

/**
 * @desc    Get User Payment History
 * @route   GET /api/v1/payment/my-payments
 * @access  Private
 */
export const getUserPaymentHistory = catchAsyncErrors(async (req, res, next) => {
  const { limit = 50, offset = 0 } = req.query;

  const payments = await PaymentModel.getUserPayments(
    req.user.id,
    parseInt(limit),
    parseInt(offset)
  );

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});

/**
 * @desc    Get Single Payment Details
 * @route   GET /api/v1/payment/:paymentId
 * @access  Private
 */
export const getPaymentDetails = catchAsyncErrors(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await PaymentModel.getPaymentById(paymentId);

  if (!payment) {
    return next(new ErrorHandler('Payment not found', 404));
  }

  // Check authorization
  if (payment.user_id !== req.user.id && req.user.usertype !== 'admin') {
    return next(new ErrorHandler('Unauthorized access', 403));
  }

  // Get refunds if any
  const refunds = await PaymentModel.getPaymentRefunds(paymentId);

  res.status(200).json({
    success: true,
    data: {
      ...payment,
      refunds
    }
  });
});

/* =========================================================
   SUBSCRIPTION CONTROLLERS
========================================================= */

/**
 * @desc    Create Subscription
 * @route   POST /api/v1/payment/subscription/create
 * @access  Private
 */
export const createSubscription = catchAsyncErrors(async (req, res, next) => {
  const { priceId, planName, planAmount, planInterval = 'month' } = req.body;

  if (!priceId) {
    return next(new ErrorHandler('Price ID is required', 400));
  }

  if (!planName || !planAmount) {
    return next(new ErrorHandler('Plan name and amount are required', 400));
  }

  const user = await UserModel.getUserById(req.user.id);

  // Check for existing active subscription
  const existingSub = await PaymentModel.getUserActiveSubscription(user.id);
  if (existingSub) {
    return next(new ErrorHandler('You already have an active subscription', 400));
  }

  console.log('Creating subscription for:', user.email);

  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user);

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: user.id.toString(),
        plan_name: planName
      }
    });

    // Save to database
    await PaymentModel.createSubscription({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      plan_name: planName,
      plan_amount: planAmount,
      plan_interval: planInterval,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000)
    });

    console.log('✅ Subscription created:', subscription.id);

    res.status(200).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        status: subscription.status
      }
    });

  } catch (stripeError) {
    console.error('❌ Subscription error:', stripeError.message);
    return next(new ErrorHandler('Failed to create subscription: ' + stripeError.message, 400));
  }
});

/**
 * @desc    Get User Subscription
 * @route   GET /api/v1/payment/subscription/me
 * @access  Private
 */
export const getUserSubscription = catchAsyncErrors(async (req, res, next) => {
  const subscription = await PaymentModel.getUserActiveSubscription(req.user.id);

  res.status(200).json({
    success: true,
    data: subscription || null
  });
});

/**
 * @desc    Cancel Subscription
 * @route   DELETE /api/v1/payment/subscription/:subscriptionId/cancel
 * @access  Private
 */
export const cancelSubscription = catchAsyncErrors(async (req, res, next) => {
  const { subscriptionId } = req.params;

  const subscription = await PaymentModel.getSubscriptionByStripeId(subscriptionId);

  if (!subscription) {
    return next(new ErrorHandler('Subscription not found', 404));
  }

  // Check authorization
  if (subscription.user_id !== req.user.id && req.user.usertype !== 'admin') {
    return next(new ErrorHandler('Unauthorized access', 403));
  }

  try {
    // Cancel in Stripe (at period end)
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    // Update in database
    const updatedSub = await PaymentModel.cancelSubscription(subscriptionId);

    console.log('✅ Subscription cancelled:', subscriptionId);

    res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      data: updatedSub
    });

  } catch (stripeError) {
    console.error('❌ Cancel subscription error:', stripeError.message);
    return next(new ErrorHandler('Failed to cancel subscription', 400));
  }
});

/* =========================================================
   REFUND CONTROLLERS
========================================================= */

/**
 * @desc    Create Refund
 * @route   POST /api/v1/payment/:paymentId/refund
 * @access  Private
 */
export const createRefund = catchAsyncErrors(async (req, res, next) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;

  const payment = await PaymentModel.getPaymentById(paymentId);

  if (!payment) {
    return next(new ErrorHandler('Payment not found', 404));
  }

  // Check authorization (only payment owner or admin)
  if (payment.user_id !== req.user.id && req.user.usertype !== 'admin') {
    return next(new ErrorHandler('Unauthorized access', 403));
  }

  if (payment.payment_status !== 'succeeded') {
    return next(new ErrorHandler('Only successful payments can be refunded', 400));
  }

  // Check if already refunded
  const existingRefunds = await PaymentModel.getPaymentRefunds(paymentId);
  const totalRefunded = existingRefunds.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  if (totalRefunded >= parseFloat(payment.amount)) {
    return next(new ErrorHandler('This payment has already been fully refunded', 400));
  }

  // Calculate refund amount
  const refundAmount = amount || (parseFloat(payment.amount) - totalRefunded);

  if (refundAmount <= 0) {
    return next(new ErrorHandler('Invalid refund amount', 400));
  }

  if (refundAmount > (parseFloat(payment.amount) - totalRefunded)) {
    return next(new ErrorHandler('Refund amount exceeds available balance', 400));
  }

  console.log('Creating refund for payment:', payment.stripe_payment_id);

  try {
    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_id,
      amount: toSmallestUnit(refundAmount, payment.currency),
      reason: reason === 'duplicate' ? 'duplicate'
        : reason === 'fraudulent' ? 'fraudulent'
          : 'requested_by_customer'
    });

    // Save refund to database
    const savedRefund = await PaymentModel.createRefund({
      payment_id: payment.id,
      stripe_refund_id: refund.id,
      amount: refundAmount,
      reason: reason || 'Customer request',
      status: refund.status
    });

    // Update payment status if fully refunded
    if (totalRefunded + refundAmount >= parseFloat(payment.amount)) {
      await PaymentModel.updatePaymentStatus(payment.stripe_payment_id, 'refunded');
    }

    console.log('✅ Refund created:', refund.id);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: savedRefund
    });

  } catch (stripeError) {
    console.error('❌ Refund error:', stripeError.message);
    return next(new ErrorHandler('Refund failed: ' + stripeError.message, 400));
  }
});

/* =========================================================
   WEBHOOK HANDLER
========================================================= */

/**
 * @desc    Handle Stripe Webhooks
 * @route   POST /api/v1/payment/webhook
 * @access  Public (Stripe only)
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📩 Webhook received:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await PaymentModel.updatePaymentStatus(paymentIntent.id, 'succeeded');
        console.log('✅ Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object;
        await PaymentModel.updatePaymentStatus(failedPayment.id, 'failed');
        console.log('❌ Payment failed:', failedPayment.id);
        break;
      }

      case 'payment_intent.canceled': {
        const canceledPayment = event.data.object;
        await PaymentModel.updatePaymentStatus(canceledPayment.id, 'canceled');
        console.log('🚫 Payment canceled:', canceledPayment.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        if (charge.payment_intent) {
          const isFullRefund = charge.amount_refunded === charge.amount;
          await PaymentModel.updatePaymentStatus(
            charge.payment_intent,
            isFullRefund ? 'refunded' : 'partially_refunded'
          );
          console.log('💰 Charge refunded:', charge.payment_intent);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log('📋 Subscription created:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const updatedSub = event.data.object;
        await PaymentModel.updateSubscription(updatedSub.id, {
          status: updatedSub.status,
          current_period_start: new Date(updatedSub.current_period_start * 1000),
          current_period_end: new Date(updatedSub.current_period_end * 1000),
          cancel_at_period_end: updatedSub.cancel_at_period_end
        });
        console.log('📝 Subscription updated:', updatedSub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object;
        await PaymentModel.updateSubscription(deletedSub.id, {
          status: 'canceled',
          canceled_at: new Date()
        });
        console.log('🗑️ Subscription deleted:', deletedSub.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('📄 Invoice paid:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        console.log('📄 Invoice payment failed:', failedInvoice.id);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error.message);
  }

  // Always return 200 to acknowledge receipt
  res.status(200).json({ received: true });
};

/* =========================================================
   ADMIN CONTROLLERS
========================================================= */

/**
 * @desc    Get All Payments (Admin)
 * @route   GET /api/v1/payment/admin/all
 * @access  Private/Admin
 */
export const adminGetAllPayments = catchAsyncErrors(async (req, res, next) => {
  const {
    limit = 100,
    offset = 0,
    status,
    startDate,
    endDate
  } = req.query;

  const payments = await PaymentModel.getAllPayments({
    limit: parseInt(limit),
    offset: parseInt(offset),
    status: status || null,
    startDate: startDate || null,
    endDate: endDate || null
  });

  const totalCount = await PaymentModel.getPaymentCount(status || null);

  res.status(200).json({
    success: true,
    count: payments.length,
    total: totalCount,
    data: payments
  });
});

/**
 * @desc    Get Payment Statistics (Admin)
 * @route   GET /api/v1/payment/admin/stats
 * @access  Private/Admin
 */
export const adminGetPaymentStats = catchAsyncErrors(async (req, res, next) => {
  const { period = 'all' } = req.query;

  const stats = await PaymentModel.getPaymentStats(period);
  const revenueByDate = await PaymentModel.getRevenueByDate(30);
  const topCustomers = await PaymentModel.getTopCustomers(5);

  res.status(200).json({
    success: true,
    data: {
      overview: stats,
      revenueByDate,
      topCustomers
    }
  });
});

/* =========================================================
   EXPORTS
========================================================= */

export default {
  createPaymentIntent,
  verifyPayment,
  getUserPaymentHistory,
  getPaymentDetails,
  createSubscription,
  getUserSubscription,
  cancelSubscription,
  createRefund,
  handleWebhook,
  adminGetAllPayments,
  adminGetPaymentStats
};