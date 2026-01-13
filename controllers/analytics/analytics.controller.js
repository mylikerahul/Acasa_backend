import * as AnalyticsModel from '../../models/analytics/analytics.models.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== VALID OPTIONS ====================
const VALID_EVENT_TYPES = ['page_view', 'click', 'form_submit', 'download', 'video_play', 'signup', 'login', 'logout', 'purchase', 'search', 'scroll', 'share'];
const VALID_CATEGORIES = ['engagement', 'conversion', 'navigation', 'error', 'performance', 'user_action'];
const VALID_DEVICE_TYPES = ['desktop', 'mobile', 'tablet'];
const VALID_STATUSES = ['recorded', 'processed', 'ignored'];

// ==================== CREATE ANALYTICS EVENT ====================
export const createAnalyticsEvent = catchAsyncErrors(async (req, res, next) => {
  const {
    event_type,
    event_name,
    category,
    user_id,
    user_name,
    session_id,
    page_url,
    page_title,
    referrer,
    device_type,
    browser,
    os,
    screen_resolution,
    country,
    city,
    ip_address,
    duration,
    metadata,
    status
  } = req.body;

  // Validate event type
  if (event_type && !VALID_EVENT_TYPES.includes(event_type.toLowerCase())) {
    return next(new ErrorHandler(`Invalid event type. Valid types: ${VALID_EVENT_TYPES.join(', ')}`, 400));
  }

  const analyticsData = {
    event_type: event_type ? event_type.toLowerCase() : null,
    event_name: event_name || null,
    category: category || null,
    user_id: user_id || null,
    user_name: user_name || null,
    session_id: session_id || null,
    page_url: page_url || null,
    page_title: page_title || null,
    referrer: referrer || null,
    device_type: device_type || null,
    browser: browser || null,
    os: os || null,
    screen_resolution: screen_resolution || null,
    country: country || null,
    city: city || null,
    ip_address: ip_address || req.ip || null,
    duration: duration || null,
    metadata: metadata || null,
    status: status ? status.toLowerCase() : 'recorded'
  };

  const result = await AnalyticsModel.createAnalyticsEvent(analyticsData);
  const newEvent = await AnalyticsModel.getAnalyticsById(result.insertId);

  res.status(201).json({
    success: true,
    message: 'Analytics event recorded successfully',
    data: newEvent
  });
});

// ==================== GET ALL ANALYTICS ====================
export const getAllAnalytics = catchAsyncErrors(async (req, res, next) => {
  const analytics = await AnalyticsModel.getAllAnalytics();

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics
  });
});

// ==================== GET ANALYTICS BY ID ====================
export const getAnalyticsById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid analytics ID', 400));
  }

  const analytics = await AnalyticsModel.getAnalyticsById(parseInt(id));

  if (!analytics) {
    return next(new ErrorHandler('Analytics event not found', 404));
  }

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// ==================== GET ANALYTICS BY USER ID ====================
export const getAnalyticsByUserId = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId || isNaN(userId)) {
    return next(new ErrorHandler('Please provide a valid user ID', 400));
  }

  const analytics = await AnalyticsModel.getAnalyticsByUserId(parseInt(userId));

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics
  });
});

// ==================== GET ANALYTICS BY SESSION ID ====================
export const getAnalyticsBySessionId = catchAsyncErrors(async (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return next(new ErrorHandler('Please provide a session ID', 400));
  }

  const analytics = await AnalyticsModel.getAnalyticsBySessionId(sessionId);

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics
  });
});

// ==================== GET ANALYTICS BY EVENT TYPE ====================
export const getAnalyticsByEventType = catchAsyncErrors(async (req, res, next) => {
  const { eventType } = req.params;

  if (!eventType) {
    return next(new ErrorHandler('Please provide an event type', 400));
  }

  const analytics = await AnalyticsModel.getAnalyticsByEventType(eventType.toLowerCase());

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics
  });
});

// ==================== GET ANALYTICS BY CATEGORY ====================
export const getAnalyticsByCategory = catchAsyncErrors(async (req, res, next) => {
  const { category } = req.params;

  if (!category) {
    return next(new ErrorHandler('Please provide a category', 400));
  }

  const analytics = await AnalyticsModel.getAnalyticsByCategory(category);

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics
  });
});

// ==================== UPDATE ANALYTICS EVENT ====================
export const updateAnalyticsEvent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    event_type,
    event_name,
    category,
    user_id,
    user_name,
    session_id,
    page_url,
    page_title,
    referrer,
    device_type,
    browser,
    os,
    screen_resolution,
    country,
    city,
    ip_address,
    duration,
    metadata,
    status
  } = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid analytics ID', 400));
  }

  const existingEvent = await AnalyticsModel.getAnalyticsById(parseInt(id));
  if (!existingEvent) {
    return next(new ErrorHandler('Analytics event not found', 404));
  }

  const updateData = {
    event_type: event_type !== undefined ? event_type?.toLowerCase() : existingEvent.event_type,
    event_name: event_name !== undefined ? event_name : existingEvent.event_name,
    category: category !== undefined ? category : existingEvent.category,
    user_id: user_id !== undefined ? user_id : existingEvent.user_id,
    user_name: user_name !== undefined ? user_name : existingEvent.user_name,
    session_id: session_id !== undefined ? session_id : existingEvent.session_id,
    page_url: page_url !== undefined ? page_url : existingEvent.page_url,
    page_title: page_title !== undefined ? page_title : existingEvent.page_title,
    referrer: referrer !== undefined ? referrer : existingEvent.referrer,
    device_type: device_type !== undefined ? device_type : existingEvent.device_type,
    browser: browser !== undefined ? browser : existingEvent.browser,
    os: os !== undefined ? os : existingEvent.os,
    screen_resolution: screen_resolution !== undefined ? screen_resolution : existingEvent.screen_resolution,
    country: country !== undefined ? country : existingEvent.country,
    city: city !== undefined ? city : existingEvent.city,
    ip_address: ip_address !== undefined ? ip_address : existingEvent.ip_address,
    duration: duration !== undefined ? duration : existingEvent.duration,
    metadata: metadata !== undefined ? metadata : existingEvent.metadata,
    status: status !== undefined ? status?.toLowerCase() : existingEvent.status
  };

  await AnalyticsModel.updateAnalyticsEvent(parseInt(id), updateData);
  const updatedEvent = await AnalyticsModel.getAnalyticsById(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'Analytics event updated successfully',
    data: updatedEvent
  });
});

// ==================== DELETE ANALYTICS EVENT ====================
export const deleteAnalyticsEvent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid analytics ID', 400));
  }

  const existingEvent = await AnalyticsModel.getAnalyticsById(parseInt(id));
  if (!existingEvent) {
    return next(new ErrorHandler('Analytics event not found', 404));
  }

  await AnalyticsModel.deleteAnalyticsEvent(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'Analytics event deleted successfully'
  });
});

// ==================== DELETE OLD ANALYTICS ====================
export const deleteOldAnalytics = catchAsyncErrors(async (req, res, next) => {
  const { days = 90 } = req.query;

  const result = await AnalyticsModel.deleteOldAnalytics(parseInt(days));

  res.status(200).json({
    success: true,
    message: `Analytics older than ${days} days deleted successfully`,
    deletedCount: result.affectedRows
  });
});

// ==================== SEARCH ANALYTICS ====================
export const searchAnalytics = catchAsyncErrors(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorHandler('Please provide a search query', 400));
  }

  const analytics = await AnalyticsModel.searchAnalytics(query);

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics
  });
});

// ==================== GET ANALYTICS BY DATE RANGE ====================
export const getAnalyticsByDateRange = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ErrorHandler('Please provide both start and end dates', 400));
  }

  const analytics = await AnalyticsModel.getAnalyticsByDateRange(startDate, endDate);

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics
  });
});

// ==================== GET RECENT ANALYTICS ====================
export const getRecentAnalytics = catchAsyncErrors(async (req, res, next) => {
  const { limit = 20 } = req.query;

  const analytics = await AnalyticsModel.getRecentAnalytics(parseInt(limit));

  res.status(200).json({
    success: true,
    count: analytics.length,
    data: analytics
  });
});

// ==================== GET ANALYTICS STATS ====================
export const getAnalyticsStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await AnalyticsModel.getAnalyticsStats();
  const eventsByType = await AnalyticsModel.getEventCountByType();
  const eventsByCategory = await AnalyticsModel.getEventCountByCategory();
  const popularPages = await AnalyticsModel.getPopularPages(10);
  const deviceStats = await AnalyticsModel.getDeviceStats();
  const browserStats = await AnalyticsModel.getBrowserStats();
  const countryStats = await AnalyticsModel.getCountryStats();
  const hourlyDist = await AnalyticsModel.getHourlyDistribution();
  const dailyDist = await AnalyticsModel.getDailyDistribution();

  res.status(200).json({
    success: true,
    data: {
      overview: stats,
      eventsByType,
      eventsByCategory,
      popularPages,
      deviceStats,
      browserStats,
      countryStats,
      hourlyDistribution: hourlyDist,
      dailyDistribution: dailyDist
    }
  });
});

// ==================== GET POPULAR PAGES ====================
export const getPopularPages = catchAsyncErrors(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const pages = await AnalyticsModel.getPopularPages(parseInt(limit));

  res.status(200).json({
    success: true,
    count: pages.length,
    data: pages
  });
});

// ==================== GET DEVICE STATS ====================
export const getDeviceStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await AnalyticsModel.getDeviceStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

// ==================== GET BROWSER STATS ====================
export const getBrowserStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await AnalyticsModel.getBrowserStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

// ==================== GET COUNTRY STATS ====================
export const getCountryStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await AnalyticsModel.getCountryStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

// ==================== CLEAR ALL ANALYTICS ====================
export const clearAllAnalytics = catchAsyncErrors(async (req, res, next) => {
  await AnalyticsModel.clearAllAnalytics();

  res.status(200).json({
    success: true,
    message: 'All analytics cleared successfully'
  });
});

// ==================== TRACK EVENT HELPER (for internal use) ====================
export const trackEvent = async (eventData) => {
  try {
    await AnalyticsModel.createAnalyticsEvent(eventData);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};