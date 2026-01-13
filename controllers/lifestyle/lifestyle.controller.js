// controllers/admin/Lifestyle/Lifestyle.controller.js

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import * as LifestyleModel from '../../models/lifestyle/lifestyle.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// If you have separate models for Country/Developer, import them here
// import * as CountryModel from '../../../models/admin/Country/Country.model.js';
// import * as DeveloperModel from '../../../models/admin/Developer/Developer.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   CREATE LIFESTYLE TABLE
========================================================= */

export const createLifestyleTable = catchAsyncErrors(async (req, res, next) => {
  await LifestyleModel.createLifestyleTable();
  
  res.status(200).json({
    success: true,
    message: 'Lifestyle table created successfully'
  });
});

/* =========================================================
   CREATE LIFESTYLE ENTRY
========================================================= */

export const createLifestyle = catchAsyncErrors(async (req, res, next) => {
  const {
    slug, name, title, country_id, developer_id, subtitle, 
    description, image, seo_title, seo_description, 
    seo_focus_keyword, status
  } = req.body;

  // Validation
  if (!name || !title || !description) {
    return next(new ErrorHandler('Name, Title, and Description are required', 400));
  }
  if (!slug) {
    return next(new ErrorHandler('Slug is required', 400));
  }

  // Check if slug already exists
  const slugExists = await LifestyleModel.checkSlugExists(slug);
  if (slugExists) {
    return next(new ErrorHandler('Slug already exists', 400));
  }

  const lifestyleData = {
    slug,
    name,
    title,
    country_id,
    developer_id,
    subtitle,
    description,
    image,
    seo_title,
    seo_description,
    seo_focus_keyword,
    status: status || 'active'
  };

  const result = await LifestyleModel.createLifestyle(lifestyleData);

  res.status(201).json({
    success: true,
    message: 'Lifestyle entry created successfully',
    data: {
      id: result.insertId,
      ...lifestyleData
    }
  });
});

/* =========================================================
   GET ALL LIFESTYLE ENTRIES
========================================================= */

export const getAllLifestyles = catchAsyncErrors(async (req, res, next) => {
  const lifestyles = await LifestyleModel.getAllLifestyles();

  res.status(200).json({
    success: true,
    count: lifestyles.length,
    data: lifestyles
  });
});

/* =========================================================
   GET ACTIVE LIFESTYLE ENTRIES
========================================================= */

export const getActiveLifestyles = catchAsyncErrors(async (req, res, next) => {
  const lifestyles = await LifestyleModel.getActiveLifestyles();

  res.status(200).json({
    success: true,
    count: lifestyles.length,
    data: lifestyles
  });
});

/* =========================================================
   GET LIFESTYLE ENTRY BY ID
========================================================= */

export const getLifestyleById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const lifestyle = await LifestyleModel.getLifestyleById(id);

  if (!lifestyle) {
    return next(new ErrorHandler('Lifestyle entry not found', 404));
  }

  res.status(200).json({
    success: true,
    data: lifestyle
  });
});

/* =========================================================
   GET LIFESTYLE ENTRY BY SLUG
========================================================= */

export const getLifestyleBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  const lifestyle = await LifestyleModel.getLifestyleBySlug(slug);

  if (!lifestyle) {
    return next(new ErrorHandler('Lifestyle entry not found', 404));
  }

  res.status(200).json({
    success: true,
    data: lifestyle
  });
});

/* =========================================================
   GET LIFESTYLE ENTRIES BY STATUS
========================================================= */

export const getLifestylesByStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.params;

  const lifestyles = await LifestyleModel.getLifestylesByStatus(status);

  res.status(200).json({
    success: true,
    count: lifestyles.length,
    data: lifestyles
  });
});

/* =========================================================
   UPDATE LIFESTYLE ENTRY
========================================================= */

export const updateLifestyle = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    slug, name, title, country_id, developer_id, subtitle, 
    description, image, seo_title, seo_description, 
    seo_focus_keyword, status
  } = req.body;

  // Check if lifestyle entry exists
  const existingLifestyle = await LifestyleModel.getLifestyleById(id);
  if (!existingLifestyle) {
    return next(new ErrorHandler('Lifestyle entry not found', 404));
  }

  // Check slug uniqueness if slug is being updated
  if (slug && slug !== existingLifestyle.slug) {
    const slugExists = await LifestyleModel.checkSlugExists(slug, id);
    if (slugExists) {
      return next(new ErrorHandler('Slug already exists', 400));
    }
  }
  
  // Validation (can be more detailed)
  if (!name || !title || !description) {
    return next(new ErrorHandler('Name, Title, and Description are required', 400));
  }
  if (!slug) {
    return next(new ErrorHandler('Slug is required', 400));
  }

  const lifestyleData = {
    slug: slug ?? existingLifestyle.slug,
    name: name ?? existingLifestyle.name,
    title: title ?? existingLifestyle.title,
    country_id: country_id ?? existingLifestyle.country_id,
    developer_id: developer_id ?? existingLifestyle.developer_id,
    subtitle: subtitle ?? existingLifestyle.subtitle,
    description: description ?? existingLifestyle.description,
    image: image ?? existingLifestyle.image,
    seo_title: seo_title ?? existingLifestyle.seo_title,
    seo_description: seo_description ?? existingLifestyle.seo_description,
    seo_focus_keyword: seo_focus_keyword ?? existingLifestyle.seo_focus_keyword,
    status: status ?? existingLifestyle.status
  };

  await LifestyleModel.updateLifestyle(id, lifestyleData);

  res.status(200).json({
    success: true,
    message: 'Lifestyle entry updated successfully',
    data: { id: parseInt(id), ...lifestyleData }
  });
});

/* =========================================================
   UPDATE LIFESTYLE STATUS
========================================================= */

export const updateLifestyleStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(new ErrorHandler('Status is required', 400));
  }

  const existingLifestyle = await LifestyleModel.getLifestyleById(id);
  if (!existingLifestyle) {
    return next(new ErrorHandler('Lifestyle entry not found', 404));
  }

  await LifestyleModel.updateLifestyleStatus(id, status);

  res.status(200).json({
    success: true,
    message: 'Lifestyle status updated successfully'
  });
});

/* =========================================================
   TOGGLE LIFESTYLE STATUS
========================================================= */

export const toggleLifestyleStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingLifestyle = await LifestyleModel.getLifestyleById(id);
  if (!existingLifestyle) {
    return next(new ErrorHandler('Lifestyle entry not found', 404));
  }

  await LifestyleModel.toggleLifestyleStatus(id);

  const newStatus = existingLifestyle.status === 'active' ? 'inactive' : 'active';

  res.status(200).json({
    success: true,
    message: `Lifestyle status changed to ${newStatus}`,
    data: { status: newStatus }
  });
});

/* =========================================================
   DELETE LIFESTYLE ENTRY
========================================================= */

export const deleteLifestyle = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingLifestyle = await LifestyleModel.getLifestyleById(id);
  if (!existingLifestyle) {
    return next(new ErrorHandler('Lifestyle entry not found', 404));
  }

  await LifestyleModel.deleteLifestyle(id);

  res.status(200).json({
    success: true,
    message: 'Lifestyle entry deleted successfully'
  });
});

/* =========================================================
   SEARCH LIFESTYLE ENTRIES
========================================================= */

export const searchLifestyles = catchAsyncErrors(async (req, res, next) => {
  const { q, query, search } = req.query;
  const searchTerm = q || query || search;

  if (!searchTerm) {
    return next(new ErrorHandler('Search term is required', 400));
  }

  const lifestyles = await LifestyleModel.searchLifestyles(searchTerm);

  res.status(200).json({
    success: true,
    count: lifestyles.length,
    data: lifestyles
  });
});

/* =========================================================
   GET LIFESTYLE ENTRIES WITH PAGINATION
========================================================= */

export const getLifestylesWithPagination = catchAsyncErrors(async (req, res, next) => {
  const { page, limit, status } = req.query;

  const result = await LifestyleModel.getLifestylesWithPagination(
    page || 1,
    limit || 10,
    status || null
  );

  res.status(200).json({
    success: true,
    ...result
  });
});

/* =========================================================
   GET LIFESTYLE STATS
========================================================= */

export const getLifestyleStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await LifestyleModel.getLifestyleStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

/* =========================================================
   CHECK SLUG AVAILABILITY
========================================================= */

export const checkSlugAvailability = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;
  const { exclude_id } = req.query;

  const exists = await LifestyleModel.checkSlugExists(slug, exclude_id || null);

  res.status(200).json({
    success: true,
    available: !exists,
    message: exists ? 'Slug already taken' : 'Slug is available'
  });
});

/* =========================================================
   GENERATE UNIQUE SLUG (Controller Helper)
========================================================= */

export const generateUniqueSlug = catchAsyncErrors(async (req, res, next) => {
  const { text } = req.body;
  if (!text) {
    return next(new ErrorHandler('Text is required to generate slug', 400));
  }
  const baseSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const uniqueSlug = await LifestyleModel.generateUniqueSlug(baseSlug);
  res.status(200).json({ success: true, slug: uniqueSlug });
});


/* =========================================================
   BULK UPDATE STATUS
========================================================= */

export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Lifestyle IDs array is required', 400));
  }

  if (!status) {
    return next(new ErrorHandler('Status is required', 400));
  }

  const result = await LifestyleModel.bulkUpdateStatus(ids, status);

  res.status(200).json({
    success: true,
    message: `${result.affectedRows} lifestyle entries updated successfully`
  });
});

/* =========================================================
   BULK DELETE LIFESTYLE ENTRIES
========================================================= */

export const bulkDeleteLifestyles = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Lifestyle IDs array is required', 400));
  }

  const result = await LifestyleModel.bulkDeleteLifestyles(ids);

  res.status(200).json({
    success: true,
    message: `${result.affectedRows} lifestyle entries deleted successfully`
  });
});

/* =========================================================
   CLEAR ALL LIFESTYLE ENTRIES
========================================================= */

export const clearAllLifestyles = catchAsyncErrors(async (req, res, next) => {
  await LifestyleModel.clearAllLifestyles();

  res.status(200).json({
    success: true,
    message: 'All lifestyle entries cleared successfully'
  });
});

// Assuming you might need to fetch Countries and Developers for dropdowns
// Placeholder functions for now, integrate with actual models if available
export const getAllCountries = catchAsyncErrors(async (req, res, next) => {
    // Replace with actual database call, e.g., CountryModel.getAllCountries();
    const countries = [{id: 1, name: 'USA'}, {id: 2, name: 'India'}, {id: 3, name: 'Canada'}];
    res.status(200).json({ success: true, data: countries });
});

export const getAllDevelopers = catchAsyncErrors(async (req, res, next) => {
    // Replace with actual database call, e.g., DeveloperModel.getAllDevelopers();
    const developers = [{id: 1, name: 'Developer A'}, {id: 2, name: 'Developer B'}];
    res.status(200).json({ success: true, data: developers });
});