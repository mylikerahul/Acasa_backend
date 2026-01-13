// routes/payment/payment.routes.js

import express from 'express';
import * as paymentController from '../../controllers/payment/payment.controller.js';
import { isAuthenticated } from '../../guards/guards.js';

const router = express.Router();

/* =========================================================
   WEBHOOK ROUTE (PUBLIC - No Auth)
   ⚠️ Must be BEFORE body parser middleware
========================================================= */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

/* =========================================================
   ONE-TIME PAYMENT ROUTES
========================================================= */

// Create payment intent
router.post(
  '/create-payment-intent',
  isAuthenticated,
  paymentController.createPaymentIntent
);

// Verify payment
router.post(
  '/verify-payment',
  isAuthenticated,
  paymentController.verifyPayment
);

// Get user payment history
router.get(
  '/my-payments',
  isAuthenticated,
  paymentController.getUserPaymentHistory
);

// Get single payment details
router.get(
  '/:paymentId',
  isAuthenticated,
  paymentController.getPaymentDetails
);

/* =========================================================
   SUBSCRIPTION ROUTES
========================================================= */

// Create subscription
router.post(
  '/subscription/create',
  isAuthenticated,
  paymentController.createSubscription
);

// Get user subscription
router.get(
  '/subscription/me',
  isAuthenticated,
  paymentController.getUserSubscription
);

// Cancel subscription
router.delete(
  '/subscription/:subscriptionId/cancel',
  isAuthenticated,
  paymentController.cancelSubscription
);

/* =========================================================
   REFUND ROUTES
========================================================= */

// Create refund (Admin or User)
router.post(
  '/:paymentId/refund',
  isAuthenticated,
  paymentController.createRefund
);

/* =========================================================
   ADMIN ROUTES
========================================================= */

// Get all payments
router.get(
  '/admin/all',
  isAuthenticated,
  paymentController.adminGetAllPayments
);

// Get payment statistics
router.get(
  '/admin/stats',
  isAuthenticated,
  paymentController.adminGetPaymentStats
);

export default router;