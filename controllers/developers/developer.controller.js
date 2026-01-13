// backend/controllers/developer/developer.controller.js
import path from 'path';
import fs from 'fs/promises';
import * as DeveloperModel from '../../models/developers/developer.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/**
 * Delete old image file
 */
export const deleteOldImage = async (imagePath) => {
  if (!imagePath) return;
  
  try {
    const fullPath = path.join(process.cwd(), imagePath);
    await fs.unlink(fullPath);
    console.log(`Deleted old image: ${imagePath}`);
  } catch (error) {
    console.error(`Error deleting image: ${imagePath}`, error);
  }
};

/**
 * Generate unique slug from name
 */
export const generateUniqueSlug = async (name, excludeId = null) => {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  let finalSlug = slug;
  let counter = 1;
  
  while (await DeveloperModel.checkSlugExists(finalSlug, excludeId)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return finalSlug;
};

/* =========================================================
   PUBLIC CONTROLLERS
========================================================= */

/**
 * @desc    Get all active developers (public)
 * @route   GET /api/developers
 * @access  Public
 */
export const getAllDevelopers = catchAsyncErrors(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    orderBy = 'name', 
    order = 'ASC',
    country = ''
  } = req.query;

  const filters = {
    status: 1, // Only active developers
    search: search.trim(),
    orderBy,
    order,
    country: country.trim()
  };

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await DeveloperModel.getAllDevelopers(filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Developers fetched successfully',
    data: result
  });
});

/**
 * @desc    Get public developer statistics
 * @route   GET /api/developers/stats
 * @access  Public
 */
export const getDeveloperStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await DeveloperModel.getDeveloperStats();
  
  res.status(200).json({
    success: true,
    message: 'Developer statistics fetched successfully',
    data: {
      total_developers: stats.active_developers, // Only show active count publicly
      total_projects: stats.total_all_projects,
      total_projects_withus: stats.total_projects_withus
    }
  });
});

/**
 * @desc    Get single developer by ID or slug (public)
 * @route   GET /api/developers/:slugOrId
 * @access  Public
 */
export const getDeveloperBySlugOrId = catchAsyncErrors(async (req, res, next) => {
  const { slugOrId } = req.params;

  const developer = await DeveloperModel.getDeveloperByIdOrSlug(slugOrId);

  if (!developer) {
    return next(new ErrorHandler('Developer not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Developer fetched successfully',
    data: developer
  });
});

/* =========================================================
   ADMIN CONTROLLERS
========================================================= */

/**
 * @desc    Get all developers (admin - includes inactive)
 * @route   GET /api/developers/admin/all
 * @access  Private/Admin
 */
export const getAllDevelopersAdmin = catchAsyncErrors(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    orderBy = 'created_at', 
    order = 'DESC',
    status = ''
  } = req.query;

  const filters = {
    search: search.trim(),
    orderBy,
    order
  };

  // Add status filter if provided
  if (status !== '') {
    filters.status = parseInt(status);
  }

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await DeveloperModel.getAllDevelopersAdmin(filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Developers fetched successfully',
    data: result
  });
});

/**
 * @desc    Get full developer statistics (admin)
 * @route   GET /api/developers/admin/stats
 * @access  Private/Admin
 */
export const getDeveloperStatsAdmin = catchAsyncErrors(async (req, res, next) => {
  const stats = await DeveloperModel.getDeveloperStats();
  
  res.status(200).json({
    success: true,
    message: 'Developer statistics fetched successfully',
    data: stats
  });
});

/**
 * @desc    Get single developer by ID (admin)
 * @route   GET /api/developers/admin/:id
 * @access  Private/Admin
 */
export const getDeveloperById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new ErrorHandler('Invalid developer ID', 400));
  }

  const developer = await DeveloperModel.getDeveloperById(id);

  if (!developer) {
    return next(new ErrorHandler('Developer not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Developer fetched successfully',
    data: developer
  });
});

/**
 * @desc    Create new developer
 * @route   POST /api/developers/admin/create
 * @access  Private/Admin
 */
export const createDeveloper = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    year_established,
    country,
    website,
    responsible_agent,
    ceo_name,
    email,
    mobile,
    address,
    total_project,
    total_project_withus,
    total_url,
    informations,
    seo_title,
    seo_keywork,
    seo_description,
    status
  } = req.body;

  // Validate required fields
  if (!name || name.trim() === '') {
    // Delete uploaded image if validation fails
    if (req.file) {
      await deleteOldImage(req.file.path);
    }
    return next(new ErrorHandler('Developer name is required', 400));
  }

  // Generate slug if not provided
  let slug = total_url;
  if (!slug || slug.trim() === '') {
    slug = await generateUniqueSlug(name);
  } else {
    // Check if provided slug already exists
    if (await DeveloperModel.checkSlugExists(slug)) {
      // Delete uploaded image if validation fails
      if (req.file) {
        await deleteOldImage(req.file.path);
      }
      return next(new ErrorHandler('This slug/URL already exists', 400));
    }
  }

  // Prepare developer data
  const developerData = {
    name: name.trim(),
    year_established: year_established || null,
    country: country || null,
    website: website || null,
    responsible_agent: responsible_agent || null,
    ceo_name: ceo_name || null,
    email: email || null,
    mobile: mobile || null,
    address: address || null,
    image: req.file ? req.file.path : null,
    total_project: parseInt(total_project) || 0,
    total_project_withus: parseInt(total_project_withus) || 0,
    total_url: slug,
    informations: informations || null,
    seo_title: seo_title || null,
    seo_keywork: seo_keywork || null,
    seo_description: seo_description || null,
    status: parseInt(status) || 1
  };

  try {
    const developer = await DeveloperModel.createDeveloper(developerData);

    res.status(201).json({
      success: true,
      message: 'Developer created successfully',
      data: developer
    });
  } catch (error) {
    // Delete uploaded image if error occurs
    if (req.file) {
      await deleteOldImage(req.file.path);
    }
    return next(new ErrorHandler(error.message || 'Failed to create developer', 500));
  }
});

/**
 * @desc    Update developer
 * @route   PUT /api/developers/admin/:id
 * @access  Private/Admin
 */
export const updateDeveloper = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    // Delete uploaded image if validation fails
    if (req.file) {
      await deleteOldImage(req.file.path);
    }
    return next(new ErrorHandler('Invalid developer ID', 400));
  }

  // Check if developer exists
  const existingDeveloper = await DeveloperModel.getDeveloperById(id);
  if (!existingDeveloper) {
    // Delete uploaded image if developer not found
    if (req.file) {
      await deleteOldImage(req.file.path);
    }
    return next(new ErrorHandler('Developer not found', 404));
  }

  const {
    name,
    year_established,
    country,
    website,
    responsible_agent,
    ceo_name,
    email,
    mobile,
    address,
    total_project,
    total_project_withus,
    total_url,
    informations,
    seo_title,
    seo_keywork,
    seo_description,
    status
  } = req.body;

  // Prepare update data
  const updateData = {};

  if (name && name.trim() !== '') {
    updateData.name = name.trim();
  }

  if (year_established !== undefined) updateData.year_established = year_established || null;
  if (country !== undefined) updateData.country = country || null;
  if (website !== undefined) updateData.website = website || null;
  if (responsible_agent !== undefined) updateData.responsible_agent = responsible_agent || null;
  if (ceo_name !== undefined) updateData.ceo_name = ceo_name || null;
  if (email !== undefined) updateData.email = email || null;
  if (mobile !== undefined) updateData.mobile = mobile || null;
  if (address !== undefined) updateData.address = address || null;
  if (total_project !== undefined) updateData.total_project = parseInt(total_project) || 0;
  if (total_project_withus !== undefined) updateData.total_project_withus = parseInt(total_project_withus) || 0;
  if (informations !== undefined) updateData.informations = informations || null;
  if (seo_title !== undefined) updateData.seo_title = seo_title || null;
  if (seo_keywork !== undefined) updateData.seo_keywork = seo_keywork || null;
  if (seo_description !== undefined) updateData.seo_description = seo_description || null;
  if (status !== undefined) updateData.status = parseInt(status);

  // Handle slug update
  if (total_url !== undefined) {
    let slug = total_url;
    if (!slug || slug.trim() === '') {
      slug = await generateUniqueSlug(updateData.name || existingDeveloper.name, id);
    } else {
      // Check if slug is being changed and if new slug already exists
      if (slug !== existingDeveloper.total_url) {
        if (await DeveloperModel.checkSlugExists(slug, id)) {
          // Delete uploaded image if error occurs
          if (req.file) {
            await deleteOldImage(req.file.path);
          }
          return next(new ErrorHandler('This slug/URL already exists', 400));
        }
      }
    }
    updateData.total_url = slug;
  }

  // Handle image update
  if (req.file) {
    // Delete old image
    if (existingDeveloper.image) {
      await deleteOldImage(existingDeveloper.image);
    }
    updateData.image = req.file.path;
  }

  try {
    const updatedDeveloper = await DeveloperModel.updateDeveloper(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Developer updated successfully',
      data: updatedDeveloper
    });
  } catch (error) {
    // Delete uploaded image if error occurs
    if (req.file) {
      await deleteOldImage(req.file.path);
    }
    return next(new ErrorHandler(error.message || 'Failed to update developer', 500));
  }
});

/**
 * @desc    Soft delete developer (set status to 0)
 * @route   DELETE /api/developers/admin/:id
 * @access  Private/Admin
 */
export const deleteDeveloper = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new ErrorHandler('Invalid developer ID', 400));
  }

  await DeveloperModel.deleteDeveloper(id);

  res.status(200).json({
    success: true,
    message: 'Developer deleted successfully'
  });
});

/**
 * @desc    Permanently delete developer
 * @route   DELETE /api/developers/admin/:id/permanent
 * @access  Private/Admin
 */
export const permanentDeleteDeveloper = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new ErrorHandler('Invalid developer ID', 400));
  }

  // Get developer to delete image
  const developer = await DeveloperModel.getDeveloperById(id);
  if (!developer) {
    return next(new ErrorHandler('Developer not found', 404));
  }

  // Delete image if exists
  if (developer.image) {
    await deleteOldImage(developer.image);
  }

  await DeveloperModel.permanentDeleteDeveloper(id);

  res.status(200).json({
    success: true,
    message: 'Developer permanently deleted successfully'
  });
});

/**
 * @desc    Bulk update developer status
 * @route   PUT /api/developers/admin/bulk-status
 * @access  Private/Admin
 */
export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, status } = req.body;

  // Validate input
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Please provide an array of developer IDs', 400));
  }

  if (status === undefined || ![0, 1].includes(parseInt(status))) {
    return next(new ErrorHandler('Status must be 0 or 1', 400));
  }

  await DeveloperModel.bulkUpdateStatus(ids, parseInt(status));

  res.status(200).json({
    success: true,
    message: `${ids.length} developer(s) status updated successfully`
  });
});

/**
 * @desc    Delete developer image only
 * @route   DELETE /api/developers/admin/:id/image
 * @access  Private/Admin
 */
export const deleteDeveloperImage = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new ErrorHandler('Invalid developer ID', 400));
  }

  const developer = await DeveloperModel.getDeveloperById(id);
  if (!developer) {
    return next(new ErrorHandler('Developer not found', 404));
  }

  if (!developer.image) {
    return next(new ErrorHandler('No image to delete', 400));
  }

  // Delete image file
  await deleteOldImage(developer.image);

  // Update database
  await DeveloperModel.updateDeveloper(id, { image: null });

  res.status(200).json({
    success: true,
    message: 'Developer image deleted successfully'
  });
});

/* =========================================================
   EXPORT ALL CONTROLLERS
========================================================= */

export default {
  // Public
  getAllDevelopers,
  getDeveloperStats,
  getDeveloperBySlugOrId,
  
  // Admin
  getAllDevelopersAdmin,
  getDeveloperStatsAdmin,
  getDeveloperById,
  createDeveloper,
  updateDeveloper,
  deleteDeveloper,
  permanentDeleteDeveloper,
  bulkUpdateStatus,
  deleteDeveloperImage
};