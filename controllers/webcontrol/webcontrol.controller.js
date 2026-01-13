// controllers/webcontrol.controller.js

import path from 'path';
import * as WebControlModel from '../../models/webcontrol/webcontrol.model.js'; // Adjust path if necessary
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';


// ==================== CONSTANTS ====================
// Must match UPLOAD_BASE_PATH in uploads.js if images are stored relative to this base
const UPLOAD_BASE_PATH = 'webcontrol';
const ITEMS_PER_PAGE = 20; // Default items per page for pagination

// API_BASE_URL (ensure this is available in your Node.js environment)
const API_BASE_URL = process.env.API_URL ;

// ==================== Logger (minimal for controllers) ====================
// Only log errors in controllers for production-ready minimalism
const _logError = (msg, errorDetails = '') => {
    console.error(`[WebControlController ERROR] ${msg}`);
    if (errorDetails) console.error(`   Details: ${errorDetails}`);
};

// ==================== CREATE WEB CONTROL ====================
export const createWebControl = catchAsyncErrors(async (req, res, next) => {
  const { title, slug, heading, descriptions, descriptions_other,
          enable_modules, seo_title, seo_keyword, seo_description, status } = req.body;
  let imageurl = null;

  // Basic validation
  if (!title || !slug) {
    return next(new ErrorHandler('Title and Slug are required.', 400));
  }

  // Handle image upload if a file is provided
  if (req.file) {
    try {
      imageurl = await uploadImage(req.file, UPLOAD_BASE_PATH);
    } catch (uploadError) {
      _logError('Image upload failed for web control creation', uploadError.message);
      return next(new ErrorHandler('Image upload failed.', 500));
    }
  }

  try {
    const newWebControl = await WebControlModel.addWebControl({
      title,
      slug,
      heading,
      imageurl,
      descriptions,
      descriptions_other,
      enable_modules: enable_modules ? JSON.parse(enable_modules) : {}, // Parse JSON string if sent
      seo_title,
      seo_keyword,
      seo_description,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Web control created successfully',
      webControl: newWebControl,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // Handle duplicate slug error specifically
      return next(new ErrorHandler('Web control with this slug already exists.', 409));
    }
    _logError('Error creating web control in DB', error.message);
    next(new ErrorHandler('Failed to create web control.', 500));
  }
});

// ==================== GET ALL WEB CONTROLS ====================
export const getAllWebControls = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || ITEMS_PER_PAGE;
  const offset = (page - 1) * limit;
  const status = req.query.status; // Optional filter

  const filters = { limit, offset, status };

  try {
    const webControls = await WebControlModel.getAllWebControls(filters);
    // You might want to get a total count for pagination metadata
    // const totalCount = await WebControlModel.getWebControlsCount(filters);

    res.status(200).json({
      success: true,
      webControls,
      // totalCount,
      // page,
      // limit,
      message: 'Web controls fetched successfully',
    });
  } catch (error) {
    _logError('Error fetching all web controls', error.message);
    next(new ErrorHandler('Failed to fetch web controls.', 500));
  }
});

// ==================== GET SINGLE WEB CONTROL ====================
export const getWebControlDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // Can be ID or slug based on your route config

  try {
    const webControl = await WebControlModel.getWebControl(id);

    if (!webControl) {
      return next(new ErrorHandler(`Web control not found with ID/slug: ${id}`, 404));
    }

    res.status(200).json({
      success: true,
      webControl,
      message: 'Web control fetched successfully',
    });
  } catch (error) {
    _logError(`Error fetching web control ${id}`, error.message);
    next(new ErrorHandler('Failed to fetch web control details.', 500));
  }
});

// ==================== UPDATE WEB CONTROL ====================
export const updateWebControl = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { old_image_url, ...updateData } = req.body; // old_image_url for deletion
  let imageurl = updateData.imageurl; // Use existing if not updated

  // Handle image upload if a new file is provided
  if (req.file) {
    try {
      // Upload new image
      imageurl = await uploadImage(req.file, UPLOAD_BASE_PATH);
      // Delete old image if it exists and a new one was uploaded
      if (old_image_url) {
        await deleteImage(old_image_url);
      }
    } catch (uploadError) {
      _logError('Image upload failed for web control update', uploadError.message);
      return next(new ErrorHandler('Image upload failed.', 500));
    }
  } else if (old_image_url === '') { // If old_image_url was explicitly set to empty, delete current
      try {
        const existingControl = await WebControlModel.getWebControl(id);
        if (existingControl && existingControl.imageurl) {
            await deleteImage(existingControl.imageurl);
            imageurl = null; // Set to null after deletion
        }
      } catch (deleteError) {
        _logError('Error deleting old image for web control update', deleteError.message);
        // Do not block the update, but log the error
      }
  }

  // Update imageurl in data if it changed
  if (imageurl !== undefined) {
    updateData.imageurl = imageurl;
  }

  // Parse enable_modules if it's sent as a string (e.g., from FormData)
  if (updateData.enable_modules && typeof updateData.enable_modules === 'string') {
    try {
      updateData.enable_modules = JSON.parse(updateData.enable_modules);
    } catch (parseError) {
      _logError('Failed to parse enable_modules JSON', parseError.message);
      return next(new ErrorHandler('Invalid format for enable_modules.', 400));
    }
  }

  try {
    const affectedRows = await WebControlModel.updateWebControl(id, updateData);

    if (affectedRows === 0) {
      return next(new ErrorHandler(`Web control not found or no changes made with ID: ${id}`, 404));
    }

    res.status(200).json({
      success: true,
      message: 'Web control updated successfully',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return next(new ErrorHandler('Web control with this slug already exists.', 409));
    }
    _logError(`Error updating web control ${id} in DB`, error.message);
    next(new ErrorHandler('Failed to update web control.', 500));
  }
});

// ==================== DELETE WEB CONTROL ====================
export const deleteWebControl = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  try {
    // Optionally, fetch the web control first to get its imageurl for deletion
    const webControlToDelete = await WebControlModel.getWebControl(id);

    const affectedRows = await WebControlModel.deleteWebControl(id);

    if (affectedRows === 0) {
      return next(new ErrorHandler(`Web control not found with ID: ${id}`, 404));
    }

    // Delete associated image if it exists
    if (webControlToDelete && webControlToDelete.imageurl) {
      try {
        await deleteImage(webControlToDelete.imageurl);
      } catch (imageDeleteError) {
        _logError(`Error deleting image for web control ${id}`, imageDeleteError.message);
        // Do not block the response, but log the error.
      }
    }

    res.status(200).json({
      success: true,
      message: 'Web control deleted successfully',
    });
  } catch (error) {
    _logError(`Error deleting web control ${id} from DB`, error.message);
    next(new ErrorHandler('Failed to delete web control.', 500));
  }
});