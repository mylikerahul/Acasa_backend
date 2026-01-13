import path from 'path';
import fs from 'fs/promises';
import * as DeveloperModel from '../../models/developers/developer.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// Helper functions
const deleteOldImage = async (filename) => {
  if (!filename) return;
  
  const filePath = path.join(process.cwd(), 'uploads', 'developers', filename);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error deleting image:', error);
    }
  }
};

const generateUniqueSlug = async (name, excludeId = null) => {
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

// Public controllers
export const getAllDevelopers = catchAsyncErrors(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    orderBy = 'name', 
    order = 'ASC',
  } = req.query;

  const result = await DeveloperModel.getAllDevelopers({
    status: 1,
    search,
    orderBy,
    order
  }, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

export const getDeveloperStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await DeveloperModel.getDeveloperStats();
  res.status(200).json({
    success: true,
    data: stats
  });
});

export const getDeveloperBySlugOrId = catchAsyncErrors(async (req, res, next) => {
  const { slugOrId } = req.params;
  const developer = await DeveloperModel.getDeveloperByIdOrSlug(slugOrId);

  if (!developer) {
    return next(new ErrorHandler('Developer not found', 404));
  }

  res.status(200).json({
    success: true,
    data: developer
  });
});

// Admin controllers
export const getAllDevelopersAdmin = catchAsyncErrors(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    orderBy = 'created_at', 
    order = 'DESC',
    status
  } = req.query;

  const result = await DeveloperModel.getAllDevelopersAdmin({
    search,
    orderBy,
    order,
    status: status !== undefined ? parseInt(status) : undefined
  }, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

export const getDeveloperById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const developer = await DeveloperModel.getDeveloperById(id);

  if (!developer) {
    return next(new ErrorHandler('Developer not found', 404));
  }

  res.status(200).json({
    success: true,
    data: developer
  });
});

export const createDeveloper = catchAsyncErrors(async (req, res, next) => {
  const { name, seo_slug } = req.body;

  if (!name) {
    if (req.file) await deleteOldImage(req.file.filename);
    return next(new ErrorHandler('Developer name is required', 400));
  }

  let slug = seo_slug || name;
  slug = await generateUniqueSlug(slug);

  const developerData = {
    ...req.body,
    image: req.file ? req.file.filename : null,
    total_url: slug,
    seo_slug: slug,
    status: req.body.status || 1
  };

  try {
    const result = await DeveloperModel.createDeveloper(developerData);
    res.status(201).json({
      success: true,
      message: 'Developer created successfully',
      data: { id: result.insertId, ...developerData }
    });
  } catch (error) {
    if (req.file) await deleteOldImage(req.file.filename);
    return next(new ErrorHandler(error.message, 500));
  }
});

export const updateDeveloper = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  const existingDev = await DeveloperModel.getDeveloperById(id);
  if (!existingDev) {
    if (req.file) await deleteOldImage(req.file.filename);
    return next(new ErrorHandler('Developer not found', 404));
  }

  const updateData = { ...req.body };

  if (updateData.seo_slug && updateData.seo_slug !== existingDev.seo_slug) {
    const isUnique = !(await DeveloperModel.checkSlugExists(updateData.seo_slug, id));
    if (!isUnique) {
      if (req.file) await deleteOldImage(req.file.filename);
      return next(new ErrorHandler('This slug is already taken', 400));
    }
    updateData.total_url = updateData.seo_slug;
  }

  if (req.file) {
    if (existingDev.image) {
      await deleteOldImage(existingDev.image);
    }
    updateData.image = req.file.filename;
  }

  await DeveloperModel.updateDeveloper(id, updateData);
  const updatedDev = await DeveloperModel.getDeveloperById(id);

  res.status(200).json({
    success: true,
    message: 'Developer updated successfully',
    data: updatedDev
  });
});

export const deleteDeveloper = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  await DeveloperModel.deleteDeveloper(id);
  res.status(200).json({
    success: true,
    message: 'Developer deleted successfully'
  });
});

export const permanentDeleteDeveloper = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const developer = await DeveloperModel.getDeveloperById(id);
  
  if (developer && developer.image) {
    await deleteOldImage(developer.image);
  }

  await DeveloperModel.permanentDeleteDeveloper(id);
  
  res.status(200).json({
    success: true,
    message: 'Developer permanently deleted'
  });
});

export const checkSlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;
  const exists = await DeveloperModel.checkSlugExists(slug);
  res.status(200).json({ success: true, exists });
});

export const deleteDeveloperImage = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const developer = await DeveloperModel.getDeveloperById(id);

  if (developer && developer.image) {
    await deleteOldImage(developer.image);
    await DeveloperModel.updateDeveloper(id, { image: null });
  }

  res.status(200).json({
    success: true,
    message: 'Image removed successfully'
  });
});