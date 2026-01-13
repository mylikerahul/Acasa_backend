// controllers/admin/Settings/Settings.controller.js

/**
 * ============================================================================
 * SETTINGS CONTROLLER - COMPLETE SETTINGS MANAGEMENT
 * ============================================================================
 */

import catchAsyncErrors from '../../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../../utils/errorHandler.js';
import * as SettingsModel from '../../../models/admin/Settings/Settings.model.js';
import { SETTING_CATEGORIES } from '../../../config/settings.config.js';
import path from 'path';
import fs from 'fs';

// ============================================================================
// GET SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings
 * @desc    Get all settings
 * @access  Private (Admin)
 */
export const getAllSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getAllSettings();
  const categories = SettingsModel.getCategories();

  res.status(200).json({
    success: true,
    settings,
    categories
  });
});

/**
 * @route   GET /api/v1/admin/settings/public
 * @desc    Get public settings (no auth required)
 * @access  Public
 */
export const getPublicSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getPublicSettings();

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   GET /api/v1/admin/settings/categories
 * @desc    Get all setting categories
 * @access  Private (Admin)
 */
export const getCategories = catchAsyncErrors(async (req, res, next) => {
  const categories = SettingsModel.getCategories();

  res.status(200).json({
    success: true,
    categories
  });
});

/**
 * @route   GET /api/v1/admin/settings/:category
 * @desc    Get settings by category
 * @access  Private (Admin)
 */
export const getSettingsByCategory = catchAsyncErrors(async (req, res, next) => {
  const { category } = req.params;

  if (!Object.values(SETTING_CATEGORIES).includes(category)) {
    return next(new ErrorHandler(`Invalid category: ${category}`, 400));
  }

  const settings = await SettingsModel.getSettingsByCategory(category);

  res.status(200).json({
    success: true,
    category,
    settings
  });
});

/**
 * @route   GET /api/v1/admin/settings/:category/:key
 * @desc    Get single setting
 * @access  Private (Admin)
 */
export const getSetting = catchAsyncErrors(async (req, res, next) => {
  const { category, key } = req.params;

  const value = await SettingsModel.getSetting(category, key);

  if (value === null) {
    return next(new ErrorHandler(`Setting not found: ${category}.${key}`, 404));
  }

  res.status(200).json({
    success: true,
    category,
    key,
    value
  });
});

// ============================================================================
// UPDATE SETTINGS
// ============================================================================

/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Update all settings
 * @access  Private (Admin only)
 */
export const updateAllSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return next(new ErrorHandler('Settings data is required', 400));
  }

  const adminId = req.user?.id;
  const updatedSettings = await SettingsModel.updateAllSettings(settings, adminId);

  res.status(200).json({
    success: true,
    message: 'All settings updated successfully',
    settings: updatedSettings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/:category
 * @desc    Update settings by category
 * @access  Private (Admin only)
 */
export const updateCategorySettings = catchAsyncErrors(async (req, res, next) => {
  const { category } = req.params;
  const { settings } = req.body;

  if (!Object.values(SETTING_CATEGORIES).includes(category)) {
    return next(new ErrorHandler(`Invalid category: ${category}`, 400));
  }

  if (!settings || typeof settings !== 'object') {
    return next(new ErrorHandler('Settings data is required', 400));
  }

  const adminId = req.user?.id;
  const updatedSettings = await SettingsModel.updateCategorySettings(category, settings, adminId);

  res.status(200).json({
    success: true,
    message: `${category} settings updated successfully`,
    category,
    count: updatedSettings.length
  });
});

/**
 * @route   PATCH /api/v1/admin/settings/:category/:key
 * @desc    Update single setting
 * @access  Private (Admin only)
 */
export const updateSetting = catchAsyncErrors(async (req, res, next) => {
  const { category, key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return next(new ErrorHandler('Value is required', 400));
  }

  const adminId = req.user?.id;

  try {
    const updated = await SettingsModel.updateSetting(category, key, value, adminId);

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      setting: updated
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ============================================================================
// GENERAL SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/general
 * @desc    Get general settings
 * @access  Private (Admin)
 */
export const getGeneralSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('general');

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/general
 * @desc    Update general settings
 * @access  Private (Admin only)
 */
export const updateGeneralSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  const updated = await SettingsModel.updateCategorySettings('general', settings, adminId);

  res.status(200).json({
    success: true,
    message: 'General settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// FOOTER SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/footer
 * @desc    Get footer settings
 * @access  Private (Admin)
 */
export const getFooterSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('footer');

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/footer
 * @desc    Update footer settings
 * @access  Private (Admin only)
 */
export const updateFooterSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  const updated = await SettingsModel.updateCategorySettings('footer', settings, adminId);

  res.status(200).json({
    success: true,
    message: 'Footer settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// LAYOUT SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/layout
 * @desc    Get layout settings
 * @access  Private (Admin)
 */
export const getLayoutSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('layout');

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/layout
 * @desc    Update layout settings
 * @access  Private (Admin only)
 */
export const updateLayoutSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  const updated = await SettingsModel.updateCategorySettings('layout', settings, adminId);

  res.status(200).json({
    success: true,
    message: 'Layout settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// PAYMENT SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/payment
 * @desc    Get payment settings
 * @access  Private (Admin)
 */
export const getPaymentSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('payment');

  // Mask sensitive data
  if (settings.stripe_secret) {
    settings.stripe_secret = settings.stripe_secret.replace(/./g, '*').slice(0, 20) + '...';
  }
  if (settings.paypal_secret) {
    settings.paypal_secret = settings.paypal_secret.replace(/./g, '*').slice(0, 20) + '...';
  }

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/payment
 * @desc    Update payment settings
 * @access  Private (Admin only)
 */
export const updatePaymentSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  // Don't update if masked value sent
  const cleanSettings = { ...settings };
  if (cleanSettings.stripe_secret?.includes('*')) {
    delete cleanSettings.stripe_secret;
  }
  if (cleanSettings.paypal_secret?.includes('*')) {
    delete cleanSettings.paypal_secret;
  }

  const updated = await SettingsModel.updateCategorySettings('payment', cleanSettings, adminId);

  res.status(200).json({
    success: true,
    message: 'Payment settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// SOCIAL MEDIA SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/social
 * @desc    Get social media settings
 * @access  Private (Admin)
 */
export const getSocialSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('social');

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/social
 * @desc    Update social media settings
 * @access  Private (Admin only)
 */
export const updateSocialSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  const updated = await SettingsModel.updateCategorySettings('social', settings, adminId);

  res.status(200).json({
    success: true,
    message: 'Social media settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// ADDTHIS & DISQUS SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/addthis-disqus
 * @desc    Get AddThis & Disqus settings
 * @access  Private (Admin)
 */
export const getAddthisDisqusSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('addthis_disqus');

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/addthis-disqus
 * @desc    Update AddThis & Disqus settings
 * @access  Private (Admin only)
 */
export const updateAddthisDisqusSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  const updated = await SettingsModel.updateCategorySettings('addthis_disqus', settings, adminId);

  res.status(200).json({
    success: true,
    message: 'AddThis & Disqus settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// ABOUT PAGE SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/about
 * @desc    Get about page settings
 * @access  Private (Admin)
 */
export const getAboutSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('about');

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/about
 * @desc    Update about page settings
 * @access  Private (Admin only)
 */
export const updateAboutSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  const updated = await SettingsModel.updateCategorySettings('about', settings, adminId);

  res.status(200).json({
    success: true,
    message: 'About page settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// CONTACT PAGE SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/contact
 * @desc    Get contact page settings
 * @access  Private (Admin)
 */
export const getContactSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('contact');

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/contact
 * @desc    Update contact page settings
 * @access  Private (Admin only)
 */
export const updateContactSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  const updated = await SettingsModel.updateCategorySettings('contact', settings, adminId);

  res.status(200).json({
    success: true,
    message: 'Contact page settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// OTHER SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/other
 * @desc    Get other settings
 * @access  Private (Admin)
 */
export const getOtherSettings = catchAsyncErrors(async (req, res, next) => {
  const settings = await SettingsModel.getSettingsByCategory('other');

  res.status(200).json({
    success: true,
    settings
  });
});

/**
 * @route   PUT /api/v1/admin/settings/other
 * @desc    Update other settings
 * @access  Private (Admin only)
 */
export const updateOtherSettings = catchAsyncErrors(async (req, res, next) => {
  const { settings } = req.body;
  const adminId = req.user?.id;

  const updated = await SettingsModel.updateCategorySettings('other', settings, adminId);

  res.status(200).json({
    success: true,
    message: 'Other settings updated successfully',
    count: updated.length
  });
});

// ============================================================================
// FILE UPLOADS
// ============================================================================

/**
 * @route   POST /api/v1/admin/settings/upload/logo
 * @desc    Upload logo
 * @access  Private (Admin only)
 */
export const uploadLogo = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler('Please upload a file', 400));
  }

  const logoPath = `/uploads/settings/${req.file.filename}`;
  const adminId = req.user?.id;

  await SettingsModel.updateLogo(logoPath, adminId);

  res.status(200).json({
    success: true,
    message: 'Logo uploaded successfully',
    path: logoPath
  });
});

/**
 * @route   POST /api/v1/admin/settings/upload/favicon
 * @desc    Upload favicon
 * @access  Private (Admin only)
 */
export const uploadFavicon = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler('Please upload a file', 400));
  }

  const faviconPath = `/uploads/settings/${req.file.filename}`;
  const adminId = req.user?.id;

  await SettingsModel.updateFavicon(faviconPath, adminId);

  res.status(200).json({
    success: true,
    message: 'Favicon uploaded successfully',
    path: faviconPath
  });
});

/**
 * @route   POST /api/v1/admin/settings/upload/title-bg
 * @desc    Upload title background image
 * @access  Private (Admin only)
 */
export const uploadTitleBgImage = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler('Please upload a file', 400));
  }

  const imagePath = `/uploads/settings/${req.file.filename}`;
  const adminId = req.user?.id;

  await SettingsModel.updateTitleBgImage(imagePath, adminId);

  res.status(200).json({
    success: true,
    message: 'Title background image uploaded successfully',
    path: imagePath
  });
});

// ============================================================================
// RESET SETTINGS
// ============================================================================

/**
 * @route   POST /api/v1/admin/settings/reset/:category
 * @desc    Reset category to defaults
 * @access  Private (Admin only)
 */
export const resetCategorySettings = catchAsyncErrors(async (req, res, next) => {
  const { category } = req.params;

  if (!Object.values(SETTING_CATEGORIES).includes(category)) {
    return next(new ErrorHandler(`Invalid category: ${category}`, 400));
  }

  const adminId = req.user?.id;
  await SettingsModel.resetCategoryToDefaults(category, adminId);

  res.status(200).json({
    success: true,
    message: `${category} settings reset to defaults`
  });
});

/**
 * @route   POST /api/v1/admin/settings/reset-all
 * @desc    Reset all settings to defaults
 * @access  Private (Admin only)
 */
export const resetAllSettings = catchAsyncErrors(async (req, res, next) => {
  const adminId = req.user?.id;
  const settings = await SettingsModel.resetAllToDefaults(adminId);

  res.status(200).json({
    success: true,
    message: 'All settings reset to defaults',
    settings
  });
});

// ============================================================================
// SETTINGS HISTORY
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/history
 * @desc    Get settings change history
 * @access  Private (Admin only)
 */
export const getSettingsHistory = catchAsyncErrors(async (req, res, next) => {
  const { limit = 50, offset = 0 } = req.query;

  const history = await SettingsModel.getSettingsHistory(
    parseInt(limit),
    parseInt(offset)
  );

  res.status(200).json({
    success: true,
    count: history.length,
    history
  });
});

/**
 * @route   GET /api/v1/admin/settings/history/:category/:key
 * @desc    Get history for specific setting
 * @access  Private (Admin only)
 */
export const getSettingHistory = catchAsyncErrors(async (req, res, next) => {
  const { category, key } = req.params;
  const { limit = 20 } = req.query;

  const history = await SettingsModel.getSettingHistory(category, key, parseInt(limit));

  res.status(200).json({
    success: true,
    category,
    key,
    count: history.length,
    history
  });
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * @route   GET /api/v1/admin/settings/maintenance-status
 * @desc    Check maintenance mode status
 * @access  Public
 */
export const getMaintenanceStatus = catchAsyncErrors(async (req, res, next) => {
  const isMaintenanceMode = await SettingsModel.isMaintenanceMode();

  res.status(200).json({
    success: true,
    maintenanceMode: isMaintenanceMode
  });
});

/**
 * @route   POST /api/v1/admin/settings/toggle-maintenance
 * @desc    Toggle maintenance mode
 * @access  Private (Admin only)
 */
export const toggleMaintenanceMode = catchAsyncErrors(async (req, res, next) => {
  const currentStatus = await SettingsModel.isMaintenanceMode();
  const newStatus = !currentStatus;
  const adminId = req.user?.id;

  await SettingsModel.updateSetting('other', 'maintenance_mode', newStatus, adminId);

  res.status(200).json({
    success: true,
    message: `Maintenance mode ${newStatus ? 'enabled' : 'disabled'}`,
    maintenanceMode: newStatus
  });
});

export default {
  getAllSettings,
  getPublicSettings,
  getCategories,
  getSettingsByCategory,
  getSetting,
  updateAllSettings,
  updateCategorySettings,
  updateSetting,
  getGeneralSettings,
  updateGeneralSettings,
  getFooterSettings,
  updateFooterSettings,
  getLayoutSettings,
  updateLayoutSettings,
  getPaymentSettings,
  updatePaymentSettings,
  getSocialSettings,
  updateSocialSettings,
  getAddthisDisqusSettings,
  updateAddthisDisqusSettings,
  getAboutSettings,
  updateAboutSettings,
  getContactSettings,
  updateContactSettings,
  getOtherSettings,
  updateOtherSettings,
  uploadLogo,
  uploadFavicon,
  uploadTitleBgImage,
  resetCategorySettings,
  resetAllSettings,
  getSettingsHistory,
  getSettingHistory,
  getMaintenanceStatus,
  toggleMaintenanceMode
};