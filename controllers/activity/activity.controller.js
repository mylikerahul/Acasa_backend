import * as ActivityModel from '../../models/activity/activity.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== VALID OPTIONS ====================
const VALID_ACTIONS = ['create', 'read', 'update', 'delete', 'login', 'logout', 'view', 'download', 'upload', 'export', 'import'];
const VALID_MODULES = ['users', 'blogs', 'notices', 'tasks', 'settings', 'reports', 'orders', 'products', 'categories'];
const VALID_STATUSES = ['pending', 'completed', 'failed', 'cancelled'];

// ==================== CREATE ACTIVITY ====================
export const createActivity = catchAsyncErrors(async (req, res, next) => {
  const {
    activity_type,
    activity_title,
    activity_description,
    user_name,
    user_id,
    module,
    module_id,
    action,
    ip_address,
    user_agent,
    metadata,
    status
  } = req.body;

  // Validate - at least activity_title or activity_type required
  if (!activity_title && !activity_type) {
    return next(new ErrorHandler('Activity title or type is required', 400));
  }

  // Validate action if provided
  if (action && !VALID_ACTIONS.includes(action.toLowerCase())) {
    return next(new ErrorHandler(`Invalid action. Valid actions: ${VALID_ACTIONS.join(', ')}`, 400));
  }

  // Validate status if provided
  if (status && !VALID_STATUSES.includes(status.toLowerCase())) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const activityData = {
    activity_type: activity_type || null,
    activity_title: activity_title || null,
    activity_description: activity_description || null,
    user_name: user_name || null,
    user_id: user_id || null,
    module: module || null,
    module_id: module_id || null,
    action: action ? action.toLowerCase() : null,
    ip_address: ip_address || req.ip || null,
    user_agent: user_agent || req.headers['user-agent'] || null,
    metadata: metadata || null,
    status: status ? status.toLowerCase() : 'completed'
  };

  const result = await ActivityModel.createActivity(activityData);
  const newActivity = await ActivityModel.getActivityById(result.insertId);

  res.status(201).json({
    success: true,
    message: 'Activity logged successfully',
    data: newActivity
  });
});

// ==================== GET ALL ACTIVITIES ====================
export const getAllActivities = catchAsyncErrors(async (req, res, next) => {
  const activities = await ActivityModel.getAllActivities();

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== GET ACTIVITY BY ID ====================
export const getActivityById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid activity ID', 400));
  }

  const activity = await ActivityModel.getActivityById(parseInt(id));

  if (!activity) {
    return next(new ErrorHandler('Activity not found', 404));
  }

  res.status(200).json({
    success: true,
    data: activity
  });
});

// ==================== GET ACTIVITIES BY USER ID ====================
export const getActivitiesByUserId = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId || isNaN(userId)) {
    return next(new ErrorHandler('Please provide a valid user ID', 400));
  }

  const activities = await ActivityModel.getActivitiesByUserId(parseInt(userId));

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== GET ACTIVITIES BY USER NAME ====================
export const getActivitiesByUserName = catchAsyncErrors(async (req, res, next) => {
  const { userName } = req.params;

  if (!userName) {
    return next(new ErrorHandler('Please provide a user name', 400));
  }

  const activities = await ActivityModel.getActivitiesByUserName(userName);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== GET ACTIVITIES BY MODULE ====================
export const getActivitiesByModule = catchAsyncErrors(async (req, res, next) => {
  const { module } = req.params;

  if (!module) {
    return next(new ErrorHandler('Please provide a module name', 400));
  }

  const activities = await ActivityModel.getActivitiesByModule(module);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== GET ACTIVITIES BY ACTION ====================
export const getActivitiesByAction = catchAsyncErrors(async (req, res, next) => {
  const { action } = req.params;

  if (!action) {
    return next(new ErrorHandler('Please provide an action', 400));
  }

  const activities = await ActivityModel.getActivitiesByAction(action.toLowerCase());

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== GET ACTIVITIES BY TYPE ====================
export const getActivitiesByType = catchAsyncErrors(async (req, res, next) => {
  const { type } = req.params;

  if (!type) {
    return next(new ErrorHandler('Please provide an activity type', 400));
  }

  const activities = await ActivityModel.getActivitiesByType(type);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== UPDATE ACTIVITY ====================
export const updateActivity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    activity_type,
    activity_title,
    activity_description,
    user_name,
    user_id,
    module,
    module_id,
    action,
    ip_address,
    user_agent,
    metadata,
    status
  } = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid activity ID', 400));
  }

  // Check if activity exists
  const existingActivity = await ActivityModel.getActivityById(parseInt(id));
  if (!existingActivity) {
    return next(new ErrorHandler('Activity not found', 404));
  }

  // Validate action if provided
  if (action && !VALID_ACTIONS.includes(action.toLowerCase())) {
    return next(new ErrorHandler(`Invalid action. Valid actions: ${VALID_ACTIONS.join(', ')}`, 400));
  }

  // Validate status if provided
  if (status && !VALID_STATUSES.includes(status.toLowerCase())) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const updateData = {
    activity_type: activity_type !== undefined ? activity_type : existingActivity.activity_type,
    activity_title: activity_title !== undefined ? activity_title : existingActivity.activity_title,
    activity_description: activity_description !== undefined ? activity_description : existingActivity.activity_description,
    user_name: user_name !== undefined ? user_name : existingActivity.user_name,
    user_id: user_id !== undefined ? user_id : existingActivity.user_id,
    module: module !== undefined ? module : existingActivity.module,
    module_id: module_id !== undefined ? module_id : existingActivity.module_id,
    action: action !== undefined ? action.toLowerCase() : existingActivity.action,
    ip_address: ip_address !== undefined ? ip_address : existingActivity.ip_address,
    user_agent: user_agent !== undefined ? user_agent : existingActivity.user_agent,
    metadata: metadata !== undefined ? metadata : existingActivity.metadata,
    status: status !== undefined ? status.toLowerCase() : existingActivity.status
  };

  await ActivityModel.updateActivity(parseInt(id), updateData);
  const updatedActivity = await ActivityModel.getActivityById(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'Activity updated successfully',
    data: updatedActivity
  });
});

// ==================== DELETE ACTIVITY ====================
export const deleteActivity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid activity ID', 400));
  }

  const existingActivity = await ActivityModel.getActivityById(parseInt(id));
  if (!existingActivity) {
    return next(new ErrorHandler('Activity not found', 404));
  }

  await ActivityModel.deleteActivity(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'Activity deleted successfully'
  });
});

// ==================== DELETE OLD ACTIVITIES ====================
export const deleteOldActivities = catchAsyncErrors(async (req, res, next) => {
  const { days = 30 } = req.query;

  const result = await ActivityModel.deleteOldActivities(parseInt(days));

  res.status(200).json({
    success: true,
    message: `Activities older than ${days} days deleted successfully`,
    deletedCount: result.affectedRows
  });
});

// ==================== SEARCH ACTIVITIES ====================
export const searchActivities = catchAsyncErrors(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorHandler('Please provide a search query', 400));
  }

  const activities = await ActivityModel.searchActivities(query);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== GET ACTIVITIES BY DATE RANGE ====================
export const getActivitiesByDateRange = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ErrorHandler('Please provide both start and end dates', 400));
  }

  const activities = await ActivityModel.getActivitiesByDateRange(startDate, endDate);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== GET RECENT ACTIVITIES ====================
export const getRecentActivities = catchAsyncErrors(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const activities = await ActivityModel.getRecentActivities(parseInt(limit));

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ==================== GET ACTIVITY STATS ====================
export const getActivityStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await ActivityModel.getActivityStats();
  const byModule = await ActivityModel.getActivityCountByModule();
  const byAction = await ActivityModel.getActivityCountByAction();

  res.status(200).json({
    success: true,
    data: {
      overview: stats,
      byModule,
      byAction
    }
  });
});

// ==================== CLEAR ALL ACTIVITIES ====================
export const clearAllActivities = catchAsyncErrors(async (req, res, next) => {
  await ActivityModel.clearAllActivities();

  res.status(200).json({
    success: true,
    message: 'All activities cleared successfully'
  });
});

// ==================== LOG ACTIVITY HELPER (for internal use) ====================
export const logActivity = async (data) => {
  try {
    await ActivityModel.createActivity(data);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};