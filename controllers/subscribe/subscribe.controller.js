import * as SubscribesModel from '../../../models/admin/Subscribe/Subscribe.model.js';
import catchAsyncErrors from '../../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../../utils/errorHandler.js';
import { sendEmail } from '../../../utils/sendEmail.js';

// ==================== HELPER ====================
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ==================== CREATE TABLE ====================
export const initSubscribeTable = catchAsyncErrors(async (req, res, next) => {
  await SubscribesModel.createSubscribeTable();
  res.status(200).json({
    success: true,
    message: 'Subscribe table initialized successfully'
  });
});

// ==================== PUBLIC: SUBSCRIBE ====================
export const subscribe = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler('Email is required', 400));
  }

  if (!validateEmail(email)) {
    return next(new ErrorHandler('Please provide a valid email', 400));
  }

  const subscriber = await SubscribesModel.createSubscriber(email);

  // Send welcome email
  try {
    await sendEmail({
      email: subscriber.email,
      subject: 'Welcome to Our Newsletter! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Thank you for subscribing!</h2>
          <p>You will now receive our latest updates and news.</p>
          <p>If you didn't subscribe, you can <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${subscriber.email}">unsubscribe here</a>.</p>
        </div>
      `
    });
  } catch (emailError) {
    console.log('Welcome email failed:', emailError.message);
  }

  res.status(201).json({
    success: true,
    message: 'Subscribed successfully!',
    data: subscriber
  });
});

// ==================== PUBLIC: UNSUBSCRIBE ====================
export const unsubscribe = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler('Email is required', 400));
  }

  const subscriber = await SubscribesModel.unsubscribeByEmail(email);

  if (!subscriber) {
    return next(new ErrorHandler('Email not found in subscribers', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Unsubscribed successfully'
  });
});

// ==================== ADMIN: GET ALL SUBSCRIBERS ====================
export const getAllSubscribers = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  const data = await SubscribesModel.getAllSubscribers(
    parseInt(page),
    parseInt(limit),
    search
  );

  res.status(200).json({
    success: true,
    ...data
  });
});

// ==================== ADMIN: GET SINGLE SUBSCRIBER ====================
export const getSubscriber = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const subscriber = await SubscribesModel.getSubscriberById(id);

  if (!subscriber) {
    return next(new ErrorHandler('Subscriber not found', 404));
  }

  res.status(200).json({
    success: true,
    data: subscriber
  });
});

// ==================== ADMIN: UPDATE SUBSCRIBER STATUS ====================
export const updateSubscriberStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const existing = await SubscribesModel.getSubscriberById(id);
  if (!existing) {
    return next(new ErrorHandler('Subscriber not found', 404));
  }

  const subscriber = await SubscribesModel.updateSubscriberStatus(id, is_active);

  res.status(200).json({
    success: true,
    message: `Subscriber ${is_active ? 'activated' : 'deactivated'} successfully`,
    data: subscriber
  });
});

// ==================== ADMIN: DELETE SUBSCRIBER ====================
export const deleteSubscriber = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existing = await SubscribesModel.getSubscriberById(id);
  if (!existing) {
    return next(new ErrorHandler('Subscriber not found', 404));
  }

  await SubscribesModel.deleteSubscriber(id);

  res.status(200).json({
    success: true,
    message: 'Subscriber deleted successfully'
  });
});

// ==================== ADMIN: GET STATS ====================
export const getSubscriberStats = catchAsyncErrors(async (req, res, next) => {
  const activeCount = await SubscribesModel.getActiveSubscribersCount();
  const allData = await SubscribesModel.getAllSubscribers(1, 1000000, '');

  res.status(200).json({
    success: true,
    data: {
      total: allData.total,
      active: activeCount,
      inactive: allData.total - activeCount
    }
  });
});

// ==================== ADMIN: SEND NEWSLETTER ====================
export const sendNewsletter = catchAsyncErrors(async (req, res, next) => {
  const { subject, content } = req.body;

  if (!subject || !content) {
    return next(new ErrorHandler('Subject and content are required', 400));
  }

  // Get all active subscribers
  const data = await SubscribesModel.getAllSubscribers(1, 1000000, '');
  const activeSubscribers = data.subscribers.filter(sub => sub.is_active);

  if (activeSubscribers.length === 0) {
    return next(new ErrorHandler('No active subscribers found', 404));
  }

  let successCount = 0;
  let failCount = 0;

  for (const subscriber of activeSubscribers) {
    try {
      await sendEmail({
        email: subscriber.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            ${content}
            <hr style="margin-top: 30px;">
            <p style="font-size: 12px; color: #666;">
              <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${subscriber.email}">Unsubscribe</a>
            </p>
          </div>
        `
      });
      successCount++;
    } catch (error) {
      failCount++;
      console.log(`Failed to send to ${subscriber.email}:`, error.message);
    }
  }

  res.status(200).json({
    success: true,
    message: `Newsletter sent! Success: ${successCount}, Failed: ${failCount}`
  });
});