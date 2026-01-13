// backend/routes/developer/developer.routes.js
import express from 'express';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';
import * as DeveloperController from '../../controllers/developers/developer.controller.js';

const router = express.Router();

/* =========================================================
   UPLOAD MIDDLEWARE
========================================================= */

// Uploader for developer images/logos
const developerImageUploader = createUploader('developers', {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
}).single('image');

/* =========================================================
   UPLOAD WRAPPER MIDDLEWARE
========================================================= */

/**
 * Wrapper to handle multer upload in route
 */
const uploadMiddleware = (req, res, next) => {
  developerImageUploader(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed'
      });
    }
    next();
  });
};

/* =========================================================
   PUBLIC ROUTES
========================================================= */

/**
 * @route   GET /api/developers
 * @desc    Get all active developers (public)
 * @access  Public
 */
router.get('/', DeveloperController.getAllDevelopers);

/**
 * @route   GET /api/developers/stats
 * @desc    Get public developer statistics
 * @access  Public
 */
router.get('/stats', DeveloperController.getDeveloperStats);

/**
 * @route   GET /api/developers/:slugOrId
 * @desc    Get single developer by ID or slug (public)
 * @access  Public
 */
router.get('/:slugOrId', DeveloperController.getDeveloperBySlugOrId);

/* =========================================================
   ADMIN ROUTES
========================================================= */

/**
 * @route   GET /api/developers/admin/all
 * @desc    Get all developers (admin - includes inactive)
 * @access  Private/Admin
 */
router.get('/admin/all', isAuthenticated, isAdmin, DeveloperController.getAllDevelopersAdmin);

/**
 * @route   GET /api/developers/admin/stats
 * @desc    Get full developer statistics (admin)
 * @access  Private/Admin
 */
router.get('/admin/stats', isAuthenticated, isAdmin, DeveloperController.getDeveloperStatsAdmin);

/**
 * @route   GET /api/developers/admin/:id
 * @desc    Get single developer by ID (admin)
 * @access  Private/Admin
 */
router.get('/admin/:id', isAuthenticated, isAdmin, DeveloperController.getDeveloperById);

/**
 * @route   POST /api/developers/admin/create
 * @desc    Create new developer
 * @access  Private/Admin
 */
router.post(
  '/admin/create',
  isAuthenticated,
  isAdmin,
  uploadMiddleware,
  DeveloperController.createDeveloper
);

/**
 * @route   PUT /api/developers/admin/:id
 * @desc    Update developer
 * @access  Private/Admin
 */
router.put(
  '/admin/:id',
  isAuthenticated,
  isAdmin,
  uploadMiddleware,
  DeveloperController.updateDeveloper
);

/**
 * @route   DELETE /api/developers/admin/:id
 * @desc    Soft delete developer (set status to 0)
 * @access  Private/Admin
 */
router.delete('/admin/:id', isAuthenticated, isAdmin, DeveloperController.deleteDeveloper);

/**
 * @route   DELETE /api/developers/admin/:id/permanent
 * @desc    Permanently delete developer
 * @access  Private/Admin
 */
router.delete(
  '/admin/:id/permanent',
  isAuthenticated,
  isAdmin,
  DeveloperController.permanentDeleteDeveloper
);

/**
 * @route   PUT /api/developers/admin/bulk-status
 * @desc    Bulk update developer status
 * @access  Private/Admin
 */
router.put('/admin/bulk-status', isAuthenticated, isAdmin, DeveloperController.bulkUpdateStatus);

/**
 * @route   DELETE /api/developers/admin/:id/image
 * @desc    Delete developer image only
 * @access  Private/Admin
 */
router.delete(
  '/admin/:id/image',
  isAuthenticated,
  isAdmin,
  DeveloperController.deleteDeveloperImage
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

export default router;