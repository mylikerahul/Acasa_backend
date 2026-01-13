import express from 'express';
import * as NoticesController from '../../controllers/notices/notices.controllers.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get all notices (public access)
router.get('/', NoticesController.getAllNotices);

// Get recent notices with optional limit (public access)
router.get('/recent', NoticesController.getRecentNotices);

// Search notices by query (public access)
router.get('/search', NoticesController.searchNotices);

// Get notices by date range (public access)
router.get('/date-range', NoticesController.getNoticesByDateRange);

// Get notice by ID (public access)
router.get('/:id', NoticesController.getNoticeById);

// Get notice by slug (public access)
router.get('/slug/:slug', NoticesController.getNoticeBySlug);

// Get notices by assignee (public access)
router.get('/assignee/:assignee', NoticesController.getNoticesByAssignee);

// ==================== ADMIN PROTECTED ROUTES ====================

// Create new notice (admin only)
router.post(
    '/',
    isAuthenticated,
    isAdmin,
    NoticesController.createNotice
);

// Update notice by ID (admin only)
router.put(
    '/:id',
    isAuthenticated,
    isAdmin,
    NoticesController.updateNotice
);

// Delete notice by ID (admin only)
router.delete(
    '/:id',
    isAuthenticated,
    isAdmin,
    NoticesController.deleteNotice
);

export default router;