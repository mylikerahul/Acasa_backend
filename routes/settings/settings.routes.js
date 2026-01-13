// // routes/admin/Settings/Settings.routes.js

// /**
//  * ============================================================================
//  * SETTINGS ROUTES - COMPLETE SETTINGS MANAGEMENT
//  * ============================================================================
//  */

// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import { isAdminAuthenticated } from '../../../guards/guards.js';
// import { requireAdmin, checkPermission } from '../../../middleware/checkPermission.js';
// import * as SettingsController from '../../../controllers/admin/Settings/Settings.controller.js';

// const router = express.Router();

// // ============================================================================
// // MULTER CONFIG FOR FILE UPLOADS
// // ============================================================================

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads/settings');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/ico'];
  
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only images are allowed.'), false);
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   }
// });

// // ============================================================================
// // PUBLIC ROUTES (No Auth Required)
// // ============================================================================

// // Get public settings (for frontend)
// router.get('/public', SettingsController.getPublicSettings);

// // Check maintenance status
// router.get('/maintenance-status', SettingsController.getMaintenanceStatus);

// // ============================================================================
// // PROTECTED ROUTES (Auth Required)
// // ============================================================================

// router.use(isAdminAuthenticated);

// // ==================== GET ROUTES ====================

// // Get all settings
// router.get('/', SettingsController.getAllSettings);

// // Get categories
// router.get('/categories', SettingsController.getCategories);

// // Get settings history
// router.get('/history', requireAdmin, SettingsController.getSettingsHistory);

// // Get specific setting history
// router.get('/history/:category/:key', requireAdmin, SettingsController.getSettingHistory);

// // ==================== CATEGORY SPECIFIC GET ROUTES ====================

// // General settings
// router.get('/general', SettingsController.getGeneralSettings);

// // Footer settings
// router.get('/footer', SettingsController.getFooterSettings);

// // Layout settings
// router.get('/layout', SettingsController.getLayoutSettings);

// // Payment settings
// router.get('/payment', SettingsController.getPaymentSettings);

// // Social media settings
// router.get('/social', SettingsController.getSocialSettings);

// // AddThis & Disqus settings
// router.get('/addthis-disqus', SettingsController.getAddthisDisqusSettings);

// // About page settings
// router.get('/about', SettingsController.getAboutSettings);

// // Contact page settings
// router.get('/contact', SettingsController.getContactSettings);

// // Other settings
// router.get('/other', SettingsController.getOtherSettings);

// // Get by category (dynamic)
// router.get('/:category', SettingsController.getSettingsByCategory);

// // Get single setting
// router.get('/:category/:key', SettingsController.getSetting);

// // ==================== UPDATE ROUTES (Admin Only) ====================

// // Update all settings
// router.put('/', requireAdmin, SettingsController.updateAllSettings);

// // ==================== CATEGORY SPECIFIC UPDATE ROUTES ====================

// // General settings
// router.put('/general', requireAdmin, SettingsController.updateGeneralSettings);

// // Footer settings
// router.put('/footer', requireAdmin, SettingsController.updateFooterSettings);

// // Layout settings
// router.put('/layout', requireAdmin, SettingsController.updateLayoutSettings);

// // Payment settings
// router.put('/payment', requireAdmin, SettingsController.updatePaymentSettings);

// // Social media settings
// router.put('/social', requireAdmin, SettingsController.updateSocialSettings);

// // AddThis & Disqus settings
// router.put('/addthis-disqus', requireAdmin, SettingsController.updateAddthisDisqusSettings);

// // About page settings
// router.put('/about', requireAdmin, SettingsController.updateAboutSettings);

// // Contact page settings
// router.put('/contact', requireAdmin, SettingsController.updateContactSettings);

// // Other settings
// router.put('/other', requireAdmin, SettingsController.updateOtherSettings);

// // Update by category (dynamic)
// router.put('/:category', requireAdmin, SettingsController.updateCategorySettings);

// // Update single setting
// router.patch('/:category/:key', requireAdmin, SettingsController.updateSetting);

// // ==================== FILE UPLOAD ROUTES ====================

// // Upload logo
// router.post('/upload/logo', requireAdmin, upload.single('logo'), SettingsController.uploadLogo);

// // Upload favicon
// router.post('/upload/favicon', requireAdmin, upload.single('favicon'), SettingsController.uploadFavicon);

// // Upload title background image
// router.post('/upload/title-bg', requireAdmin, upload.single('title_bg'), SettingsController.uploadTitleBgImage);

// // ==================== RESET ROUTES ====================

// // Reset all settings
// router.post('/reset-all', requireAdmin, SettingsController.resetAllSettings);

// // Reset category settings
// router.post('/reset/:category', requireAdmin, SettingsController.resetCategorySettings);

// // ==================== UTILITY ROUTES ====================

// // Toggle maintenance mode
// router.post('/toggle-maintenance', requireAdmin, SettingsController.toggleMaintenanceMode);

// export default router;