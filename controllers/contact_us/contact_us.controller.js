// backend/controllers/contact_us/contact_us.controller.js

import path from 'path';
import fs from 'fs';
import * as ContactUsModel from '../../models/contact_us/contact_us.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_BASE_PATH = 'uploads';
const ITEMS_PER_PAGE = 20;
const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

// ==================== HELPER FUNCTIONS ====================

/**
 * Build full URL for uploaded files
 * @param {string} filePath - Relative file path
 * @returns {string|null} - Full URL or null
 */
const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  return `${API_BASE_URL}/${filePath.replace(/\\/g, '/')}`;
};

/**
 * Delete uploaded file
 * @param {string} filePath - Relative file path
 */
const deleteUploadedFile = async (filePath) => {
  if (!filePath) return;
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted file: ${fullPath}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

/**
 * Format contact inquiry response with file URLs
 * @param {object} inquiry - Contact inquiry object
 * @returns {object} - Formatted inquiry
 */
const formatContactUsResponse = (inquiry) => {
  if (!inquiry) return null;
  
  return {
    ...inquiry,
    profile_url: buildFileUrl(inquiry.profile),
    resume_url: buildFileUrl(inquiry.resume)
  };
};

/**
 * Format multiple inquiries
 * @param {array} inquiries - Array of inquiries
 * @returns {array} - Formatted inquiries
 */
const formatMultipleContactUs = (inquiries) => {
  return inquiries.map(formatContactUsResponse);
};

// ==================== PUBLIC CONTROLLERS ====================

/**
 * @desc    Get all active contact inquiries (public)
 * @route   GET /api/contact-us
 * @access  Public
 */
export const getAllContactUs = catchAsyncErrors(async (req, res, next) => {
  const {
    search,
    source,
    type,
    property_type,
    contact_type,
    lead_status,
    orderBy,
    order,
    page = 1,
    limit = ITEMS_PER_PAGE
  } = req.query;

  const filters = {
    search,
    source,
    type,
    property_type,
    contact_type,
    lead_status,
    orderBy,
    order
  };

  const pagination = { page: parseInt(page), limit: parseInt(limit) };

  const result = await ContactUsModel.getAllContactUs(filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Contact inquiries fetched successfully',
    data: formatMultipleContactUs(result.inquiries),
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  });
});

/**
 * @desc    Get single contact inquiry by ID (public)
 * @route   GET /api/contact-us/:id
 * @access  Public
 */
export const getContactUsById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid inquiry ID', 400));
  }

  const inquiry = await ContactUsModel.getContactUsById(parseInt(id));

  if (!inquiry) {
    return next(new ErrorHandler('Contact inquiry not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Contact inquiry fetched successfully',
    data: formatContactUsResponse(inquiry)
  });
});

/**
 * @desc    Create a new contact inquiry (public submission)
 * @route   POST /api/contact-us
 * @access  Public
 */
export const createContactUs = catchAsyncErrors(async (req, res, next) => {
  const contactData = { ...req.body };

  // Handle file uploads
  if (req.files) {
    if (req.files.profile && req.files.profile[0]) {
      contactData.profile = req.files.profile[0].path;
    }
    if (req.files.resume && req.files.resume[0]) {
      contactData.resume = req.files.resume[0].path;
    }
  }

  // Handle single file upload
  if (req.file) {
    if (req.body.fileType === 'profile') {
      contactData.profile = req.file.path;
    } else if (req.body.fileType === 'resume') {
      contactData.resume = req.file.path;
    }
  }

  try {
    const newInquiry = await ContactUsModel.createContactUs(contactData);

    res.status(201).json({
      success: true,
      message: 'Contact inquiry submitted successfully',
      data: formatContactUsResponse(newInquiry)
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (contactData.profile) await deleteUploadedFile(contactData.profile);
    if (contactData.resume) await deleteUploadedFile(contactData.resume);
    
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      return next(new ErrorHandler(error.message, 409));
    }
    throw error;
  }
});

// ==================== ADMIN CONTROLLERS ====================

/**
 * @desc    Get all contact inquiries (admin - includes inactive)
 * @route   GET /api/admin/contact-us
 * @access  Admin
 */
export const getAllContactUsAdmin = catchAsyncErrors(async (req, res, next) => {
  const {
    search,
    source,
    type,
    property_type,
    contact_type,
    lead_status,
    status,
    agent_id,
    orderBy,
    order,
    page = 1,
    limit = ITEMS_PER_PAGE
  } = req.query;

  const filters = {
    search,
    source,
    type,
    property_type,
    contact_type,
    lead_status,
    status: status !== undefined ? parseInt(status) : undefined,
    agent_id: agent_id ? parseInt(agent_id) : undefined,
    orderBy,
    order
  };

  const pagination = { page: parseInt(page), limit: parseInt(limit) };

  const result = await ContactUsModel.getAllContactUsAdmin(filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Contact inquiries fetched successfully',
    data: formatMultipleContactUs(result.inquiries),
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  });
});

/**
 * @desc    Get single contact inquiry by ID (admin)
 * @route   GET /api/admin/contact-us/:id
 * @access  Admin
 */
export const getContactUsByIdAdmin = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid inquiry ID', 400));
  }

  const inquiry = await ContactUsModel.getContactUsByIdAdmin(parseInt(id));

  if (!inquiry) {
    return next(new ErrorHandler('Contact inquiry not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Contact inquiry fetched successfully',
    data: formatContactUsResponse(inquiry)
  });
});

/**
 * @desc    Create a new contact inquiry (admin)
 * @route   POST /api/admin/contact-us
 * @access  Admin
 */
export const createContactUsAdmin = catchAsyncErrors(async (req, res, next) => {
  const contactData = { ...req.body };

  // Handle file uploads
  if (req.files) {
    if (req.files.profile && req.files.profile[0]) {
      contactData.profile = req.files.profile[0].path;
    }
    if (req.files.resume && req.files.resume[0]) {
      contactData.resume = req.files.resume[0].path;
    }
  }

  try {
    const newInquiry = await ContactUsModel.createContactUs(contactData);

    res.status(201).json({
      success: true,
      message: 'Contact inquiry created successfully',
      data: formatContactUsResponse(newInquiry)
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (contactData.profile) await deleteUploadedFile(contactData.profile);
    if (contactData.resume) await deleteUploadedFile(contactData.resume);
    
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      return next(new ErrorHandler(error.message, 409));
    }
    throw error;
  }
});

/**
 * @desc    Update a contact inquiry
 * @route   PUT /api/admin/contact-us/:id
 * @access  Admin
 */
export const updateContactUs = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid inquiry ID', 400));
  }

  const existingInquiry = await ContactUsModel.getContactUsByIdAdmin(parseInt(id));

  if (!existingInquiry) {
    return next(new ErrorHandler('Contact inquiry not found', 404));
  }

  // Handle file uploads
  if (req.files) {
    if (req.files.profile && req.files.profile[0]) {
      // Delete old profile if exists
      if (existingInquiry.profile) {
        await deleteUploadedFile(existingInquiry.profile);
      }
      updateData.profile = req.files.profile[0].path;
    }
    if (req.files.resume && req.files.resume[0]) {
      // Delete old resume if exists
      if (existingInquiry.resume) {
        await deleteUploadedFile(existingInquiry.resume);
      }
      updateData.resume = req.files.resume[0].path;
    }
  }

  try {
    const updatedInquiry = await ContactUsModel.updateContactUs(parseInt(id), updateData);

    res.status(200).json({
      success: true,
      message: 'Contact inquiry updated successfully',
      data: formatContactUsResponse(updatedInquiry)
    });
  } catch (error) {
    // Clean up newly uploaded files on error
    if (updateData.profile && updateData.profile !== existingInquiry.profile) {
      await deleteUploadedFile(updateData.profile);
    }
    if (updateData.resume && updateData.resume !== existingInquiry.resume) {
      await deleteUploadedFile(updateData.resume);
    }
    
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      return next(new ErrorHandler(error.message, 409));
    }
    throw error;
  }
});

/**
 * @desc    Soft delete a contact inquiry
 * @route   DELETE /api/admin/contact-us/:id
 * @access  Admin
 */
export const deleteContactUs = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid inquiry ID', 400));
  }

  try {
    await ContactUsModel.deleteContactUs(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Contact inquiry deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Contact inquiry not found') {
      return next(new ErrorHandler(error.message, 404));
    }
    throw error;
  }
});

/**
 * @desc    Permanently delete a contact inquiry
 * @route   DELETE /api/admin/contact-us/:id/permanent
 * @access  Admin
 */
export const permanentDeleteContactUs = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid inquiry ID', 400));
  }

  const existingInquiry = await ContactUsModel.getContactUsByIdAdmin(parseInt(id));

  if (!existingInquiry) {
    return next(new ErrorHandler('Contact inquiry not found', 404));
  }

  // Delete associated files
  if (existingInquiry.profile) {
    await deleteUploadedFile(existingInquiry.profile);
  }
  if (existingInquiry.resume) {
    await deleteUploadedFile(existingInquiry.resume);
  }

  try {
    await ContactUsModel.permanentDeleteContactUs(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Contact inquiry permanently deleted'
    });
  } catch (error) {
    if (error.message === 'Contact inquiry not found') {
      return next(new ErrorHandler(error.message, 404));
    }
    throw error;
  }
});

/**
 * @desc    Bulk update contact inquiry status
 * @route   PATCH /api/admin/contact-us/bulk-status
 * @access  Admin
 */
export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Please provide valid inquiry IDs', 400));
  }

  if (status === undefined || ![0, 1].includes(parseInt(status))) {
    return next(new ErrorHandler('Please provide a valid status (0 or 1)', 400));
  }

  try {
    await ContactUsModel.bulkUpdateStatus(ids.map(id => parseInt(id)), parseInt(status));

    res.status(200).json({
      success: true,
      message: `${ids.length} inquiries status updated successfully`
    });
  } catch (error) {
    throw error;
  }
});

/**
 * @desc    Bulk update contact inquiry lead status
 * @route   PATCH /api/admin/contact-us/bulk-lead-status
 * @access  Admin
 */
export const bulkUpdateLeadStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, lead_status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Please provide valid inquiry IDs', 400));
  }

  if (!lead_status) {
    return next(new ErrorHandler('Please provide a lead status', 400));
  }

  try {
    await ContactUsModel.bulkUpdateLeadStatus(ids.map(id => parseInt(id)), lead_status);

    res.status(200).json({
      success: true,
      message: `${ids.length} inquiries lead status updated successfully`
    });
  } catch (error) {
    if (error.message.includes('Invalid lead status')) {
      return next(new ErrorHandler(error.message, 400));
    }
    throw error;
  }
});

/**
 * @desc    Get contact inquiry statistics
 * @route   GET /api/admin/contact-us/stats
 * @access  Admin
 */
export const getContactUsStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await ContactUsModel.getContactUsStats();

  res.status(200).json({
    success: true,
    message: 'Contact inquiry statistics fetched successfully',
    data: stats
  });
});

/**
 * @desc    Get contact inquiries by source
 * @route   GET /api/admin/contact-us/source/:source
 * @access  Admin
 */
export const getContactUsBySource = catchAsyncErrors(async (req, res, next) => {
  const { source } = req.params;

  if (!source) {
    return next(new ErrorHandler('Please provide a source', 400));
  }

  const inquiries = await ContactUsModel.getContactUsBySource(source);

  res.status(200).json({
    success: true,
    message: `Contact inquiries from source '${source}' fetched successfully`,
    data: formatMultipleContactUs(inquiries),
    total: inquiries.length
  });
});

/**
 * @desc    Get contact inquiries by type
 * @route   GET /api/admin/contact-us/type/:type
 * @access  Admin
 */
export const getContactUsByType = catchAsyncErrors(async (req, res, next) => {
  const { type } = req.params;

  if (!type) {
    return next(new ErrorHandler('Please provide a type', 400));
  }

  const inquiries = await ContactUsModel.getContactUsByType(type);

  res.status(200).json({
    success: true,
    message: `Contact inquiries of type '${type}' fetched successfully`,
    data: formatMultipleContactUs(inquiries),
    total: inquiries.length
  });
});

/**
 * @desc    Restore a soft-deleted contact inquiry
 * @route   PATCH /api/admin/contact-us/:id/restore
 * @access  Admin
 */
export const restoreContactUs = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid inquiry ID', 400));
  }

  const existingInquiry = await ContactUsModel.getContactUsByIdAdmin(parseInt(id));

  if (!existingInquiry) {
    return next(new ErrorHandler('Contact inquiry not found', 404));
  }

  if (existingInquiry.status === 1) {
    return next(new ErrorHandler('Contact inquiry is already active', 400));
  }

  try {
    await ContactUsModel.updateContactUs(parseInt(id), { status: 1 });

    res.status(200).json({
      success: true,
      message: 'Contact inquiry restored successfully'
    });
  } catch (error) {
    throw error;
  }
});

/**
 * @desc    Check if CUID exists
 * @route   GET /api/admin/contact-us/check-cuid/:cuid
 * @access  Admin
 */
export const checkCuidExists = catchAsyncErrors(async (req, res, next) => {
  const { cuid } = req.params;
  const { excludeId } = req.query;

  if (!cuid) {
    return next(new ErrorHandler('Please provide a CUID', 400));
  }

  const exists = await ContactUsModel.checkCuidExists(cuid, excludeId ? parseInt(excludeId) : null);

  res.status(200).json({
    success: true,
    exists
  });
});

/**
 * @desc    Check if email exists
 * @route   GET /api/admin/contact-us/check-email/:email
 * @access  Admin
 */
export const checkEmailExists = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.params;
  const { excludeId } = req.query;

  if (!email) {
    return next(new ErrorHandler('Please provide an email', 400));
  }

  const exists = await ContactUsModel.checkEmailExists(email, excludeId ? parseInt(excludeId) : null);

  res.status(200).json({
    success: true,
    exists
  });
});

/**
 * @desc    Check if phone exists
 * @route   GET /api/admin/contact-us/check-phone/:phone
 * @access  Admin
 */
export const checkPhoneExists = catchAsyncErrors(async (req, res, next) => {
  const { phone } = req.params;
  const { excludeId } = req.query;

  if (!phone) {
    return next(new ErrorHandler('Please provide a phone number', 400));
  }

  const exists = await ContactUsModel.checkPhoneExists(phone, excludeId ? parseInt(excludeId) : null);

  res.status(200).json({
    success: true,
    exists
  });
});

// ==================== EXPORT ====================
export default {
  // Public
  getAllContactUs,
  getContactUsById,
  createContactUs,
  
  // Admin
  getAllContactUsAdmin,
  getContactUsByIdAdmin,
  createContactUsAdmin,
  updateContactUs,
  deleteContactUs,
  permanentDeleteContactUs,
  bulkUpdateStatus,
  bulkUpdateLeadStatus,
  getContactUsStats,
  getContactUsBySource,
  getContactUsByType,
  restoreContactUs,
  checkCuidExists,
  checkEmailExists,
  checkPhoneExists
};