// backend/routes/contact_us/contact_us.routes.js

import express from 'express';
import * as ContactUsController from '../../controllers/contact_us/contact_us.controller.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIGURATION ====================
const contactUsUpload = createUploader('contact', {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
});

// Multiple file fields for profile and resume
const uploadFields = contactUsUpload.fields([
  { name: 'profile', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/contact-us
 * @desc    Get all active contact inquiries
 * @access  Public
 */
router.get('/', ContactUsController.getAllContactUs);

/**
 * @route   GET /api/contact-us/:id
 * @desc    Get single contact inquiry by ID
 * @access  Public
 */
router.get('/:id', ContactUsController.getContactUsById);

/**
 * @route   POST /api/contact-us
 * @desc    Create a new contact inquiry (public submission)
 * @access  Public
 */
router.post('/', uploadFields, ContactUsController.createContactUs);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/admin/contact-us/stats
 * @desc    Get contact inquiry statistics
 * @access  Admin
 * @note    This route must be before /:id to prevent 'stats' being treated as an ID
 */
router.get('/admin/stats', isAuthenticated, isAdmin, ContactUsController.getContactUsStats);

/**
 * @route   GET /api/admin/contact-us
 * @desc    Get all contact inquiries (includes inactive)
 * @access  Admin
 */
router.get('/admin', isAuthenticated, isAdmin, ContactUsController.getAllContactUsAdmin);

/**
 * @route   GET /api/admin/contact-us/source/:source
 * @desc    Get contact inquiries by source
 * @access  Admin
 */
router.get('/admin/source/:source', isAuthenticated, isAdmin, ContactUsController.getContactUsBySource);

/**
 * @route   GET /api/admin/contact-us/type/:type
 * @desc    Get contact inquiries by type
 * @access  Admin
 */
router.get('/admin/type/:type', isAuthenticated, isAdmin, ContactUsController.getContactUsByType);

/**
 * @route   GET /api/admin/contact-us/check-cuid/:cuid
 * @desc    Check if CUID exists
 * @access  Admin
 */
router.get('/admin/check-cuid/:cuid', isAuthenticated, isAdmin, ContactUsController.checkCuidExists);

/**
 * @route   GET /api/admin/contact-us/check-email/:email
 * @desc    Check if email exists
 * @access  Admin
 */
router.get('/admin/check-email/:email', isAuthenticated, isAdmin, ContactUsController.checkEmailExists);

/**
 * @route   GET /api/admin/contact-us/check-phone/:phone
 * @desc    Check if phone exists
 * @access  Admin
 */
router.get('/admin/check-phone/:phone', isAuthenticated, isAdmin, ContactUsController.checkPhoneExists);

/**
 * @route   GET /api/admin/contact-us/:id
 * @desc    Get single contact inquiry by ID (admin)
 * @access  Admin
 */
router.get('/admin/:id', isAuthenticated, isAdmin, ContactUsController.getContactUsByIdAdmin);

/**
 * @route   POST /api/admin/contact-us
 * @desc    Create a new contact inquiry (admin)
 * @access  Admin
 */
router.post('/admin', isAuthenticated, isAdmin, uploadFields, ContactUsController.createContactUsAdmin);

/**
 * @route   PUT /api/admin/contact-us/:id
 * @desc    Update a contact inquiry
 * @access  Admin
 */
router.put('/admin/:id', isAuthenticated, isAdmin, uploadFields, ContactUsController.updateContactUs);

/**
 * @route   DELETE /api/admin/contact-us/:id
 * @desc    Soft delete a contact inquiry
 * @access  Admin
 */
router.delete('/admin/:id', isAuthenticated, isAdmin, ContactUsController.deleteContactUs);

/**
 * @route   DELETE /api/admin/contact-us/:id/permanent
 * @desc    Permanently delete a contact inquiry
 * @access  Admin
 */
router.delete('/admin/:id/permanent', isAuthenticated, isAdmin, ContactUsController.permanentDeleteContactUs);

/**
 * @route   PATCH /api/admin/contact-us/bulk-status
 * @desc    Bulk update contact inquiry status
 * @access  Admin
 */
router.patch('/admin/bulk-status', isAuthenticated, isAdmin, ContactUsController.bulkUpdateStatus);

/**
 * @route   PATCH /api/admin/contact-us/bulk-lead-status
 * @desc    Bulk update contact inquiry lead status
 * @access  Admin
 */
router.patch('/admin/bulk-lead-status', isAuthenticated, isAdmin, ContactUsController.bulkUpdateLeadStatus);

/**
 * @route   PATCH /api/admin/contact-us/:id/restore
 * @desc    Restore a soft-deleted contact inquiry
 * @access  Admin
 */
router.patch('/admin/:id/restore', isAuthenticated, isAdmin, ContactUsController.restoreContactUs);

export default router;