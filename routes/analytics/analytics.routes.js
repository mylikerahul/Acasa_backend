import express from 'express';
import * as AnalyticsController from '../../controllers/analytics/analytics.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Track analytics event (can be public for client-side tracking)
router.post('/track', AnalyticsController.createAnalyticsEvent);

// ==================== PROTECTED ROUTES (Admin Only) ====================

// Get all analytics
router.get(
  '/',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getAllAnalytics
);

// Get analytics stats (dashboard)
router.get(
  '/stats',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getAnalyticsStats
);

// Get recent analytics
router.get(
  '/recent',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getRecentAnalytics
);

// Get popular pages
router.get(
  '/popular-pages',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getPopularPages
);

// Get device stats
router.get(
  '/device-stats',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getDeviceStats
);

// Get browser stats
router.get(
  '/browser-stats',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getBrowserStats
);

// Get country stats
router.get(
  '/country-stats',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getCountryStats
);

// Search analytics
router.get(
  '/search',
  isAuthenticated,
  isAdmin,
  AnalyticsController.searchAnalytics
);

// Get analytics by date range
router.get(
  '/date-range',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getAnalyticsByDateRange
);

// Get analytics by user ID
router.get(
  '/user/:userId',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getAnalyticsByUserId
);

// Get analytics by session ID
router.get(
  '/session/:sessionId',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getAnalyticsBySessionId
);

// Get analytics by event type
router.get(
  '/event-type/:eventType',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getAnalyticsByEventType
);

// Get analytics by category
router.get(
  '/category/:category',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getAnalyticsByCategory
);

// Get analytics by ID
router.get(
  '/:id',
  isAuthenticated,
  isAdmin,
  AnalyticsController.getAnalyticsById
);

// Update analytics event (admin only)
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  AnalyticsController.updateAnalyticsEvent
);

// Delete analytics event (admin only)
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  AnalyticsController.deleteAnalyticsEvent
);

// Delete old analytics (admin only)
router.delete(
  '/cleanup/old',
  isAuthenticated,
  isAdmin,
  AnalyticsController.deleteOldAnalytics
);

// Clear all analytics (admin only - use with caution)
router.delete(
  '/cleanup/all',
  isAuthenticated,
  isAdmin,
  AnalyticsController.clearAllAnalytics
);

export default router;