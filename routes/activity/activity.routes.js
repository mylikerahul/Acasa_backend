import express from 'express';
import * as ActivityController from '../../controllers/activity/activity.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get all activities
router.get('/', ActivityController.getAllActivities);

// Get recent activities
router.get('/recent', ActivityController.getRecentActivities);

// Get activity stats
router.get('/stats', ActivityController.getActivityStats);

// Search activities
router.get('/search', ActivityController.searchActivities);

// Get activities by date range
router.get('/date-range', ActivityController.getActivitiesByDateRange);

// Get activities by user ID
router.get('/user/:userId', ActivityController.getActivitiesByUserId);

// Get activities by user name
router.get('/user-name/:userName', ActivityController.getActivitiesByUserName);

// Get activities by module
router.get('/module/:module', ActivityController.getActivitiesByModule);

// Get activities by action
router.get('/action/:action', ActivityController.getActivitiesByAction);

// Get activities by type
router.get('/type/:type', ActivityController.getActivitiesByType);

// Get activity by ID
router.get('/:id', ActivityController.getActivityById);

// ==================== ADMIN PROTECTED ROUTES ====================

// Create new activity (admin only)
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  ActivityController.createActivity
);

// Update activity by ID (admin only)
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  ActivityController.updateActivity
);

// Delete activity by ID (admin only)
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  ActivityController.deleteActivity
);

// Delete old activities (admin only)
router.delete(
  '/cleanup/old',
  isAuthenticated,
  isAdmin,
  ActivityController.deleteOldActivities
);

// Clear all activities (admin only - use with caution)
router.delete(
  '/cleanup/all',
  isAuthenticated,
  isAdmin,
  ActivityController.clearAllActivities
);

export default router;