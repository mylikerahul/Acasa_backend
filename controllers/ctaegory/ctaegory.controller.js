import path from 'path';
import fs from 'fs/promises';
import * as CtaegoryModel from '../../models/ctaegory/ctaegory.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CREATE CTAEGORY ====================
export const createCtaegory = catchAsyncErrors(async (req, res, next) => {
  const { category_name, slug } = req.body;

  if (!category_name) {
    return next(new ErrorHandler('Category name is required', 400));
  }

  const result = await CtaegoryModel.createCtaegory({
    category_name: category_name.trim(),
    slug: slug?.trim()
  });

  if (!result.success) {
    return next(new ErrorHandler(result.message, 400));
  }

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: {
      id: result.id,
      category_name,
      slug: result.slug
    }
  });
});

// ==================== GET ALL CTAEGORIES ====================
export const getAllCtaegories = catchAsyncErrors(async (req, res, next) => {
  const {
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page,
    limit
  } = req.query;

  const filters = {
    search,
    sortBy,
    sortOrder,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined
  };

  const result = await CtaegoryModel.getAllCtaegories(filters);

  if (!result.success) {
    return next(new ErrorHandler('Failed to fetch categories', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Categories fetched successfully',
    data: result.data,
    ...(result.pagination && { pagination: result.pagination })
  });
});

// ==================== GET CTAEGORY BY ID ====================
export const getCtaegoryById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid category ID is required', 400));
  }

  const result = await CtaegoryModel.getCtaegoryById(parseInt(id));

  if (!result.success) {
    return next(new ErrorHandler(result.message, 404));
  }

  res.status(200).json({
    success: true,
    message: 'Category fetched successfully',
    data: result.data
  });
});

// ==================== GET CTAEGORY BY SLUG ====================
export const getCtaegoryBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  if (!slug) {
    return next(new ErrorHandler('Category slug is required', 400));
  }

  const result = await CtaegoryModel.getCtaegoryBySlug(slug);

  if (!result.success) {
    return next(new ErrorHandler(result.message, 404));
  }

  res.status(200).json({
    success: true,
    message: 'Category fetched successfully',
    data: result.data
  });
});

// ==================== UPDATE CTAEGORY ====================
export const updateCtaegory = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid category ID is required', 400));
  }

  // Trim string fields
  if (updateData.category_name) {
    updateData.category_name = updateData.category_name.trim();
  }
  if (updateData.slug) {
    updateData.slug = updateData.slug.trim();
  }

  const result = await CtaegoryModel.updateCtaegory(parseInt(id), updateData);

  if (!result.success) {
    return next(new ErrorHandler(result.message, result.message.includes('not found') ? 404 : 400));
  }

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// ==================== DELETE CTAEGORY ====================
export const deleteCtaegory = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid category ID is required', 400));
  }

  const result = await CtaegoryModel.deleteCtaegory(parseInt(id));

  if (!result.success) {
    return next(new ErrorHandler(result.message, 404));
  }

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// ==================== BULK CREATE CTAEGORIES ====================
export const bulkCreateCtaegories = catchAsyncErrors(async (req, res, next) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return next(new ErrorHandler('Categories array is required', 400));
  }

  // Validate each category
  for (const category of categories) {
    if (!category.category_name) {
      return next(new ErrorHandler('All categories must have a category_name', 400));
    }
  }

  const result = await CtaegoryModel.bulkCreateCtaegories(categories);

  if (!result.success) {
    return next(new ErrorHandler('Failed to create categories', 500));
  }

  res.status(201).json({
    success: true,
    message: `${result.count} categories created successfully`,
    data: {
      createdCount: result.count,
      ids: result.ids
    }
  });
});

// ==================== GET CTAEGORY COUNT ====================
export const getCtaegoryCount = catchAsyncErrors(async (req, res, next) => {
  const result = await CtaegoryModel.getCtaegoryCount();

  if (!result.success) {
    return next(new ErrorHandler('Failed to get category count', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Category count fetched successfully',
    data: {
      total: result.count
    }
  });
});

// ==================== CHECK CTAEGORY EXISTS ====================
export const checkCtaegoryExists = catchAsyncErrors(async (req, res, next) => {
  const { identifier, type = 'id' } = req.query;

  if (!identifier) {
    return next(new ErrorHandler('Identifier is required', 400));
  }

  if (!['id', 'slug'].includes(type)) {
    return next(new ErrorHandler('Type must be either "id" or "slug"', 400));
  }

  const result = await CtaegoryModel.ctaegoryExists(identifier, type);

  if (!result.success) {
    return next(new ErrorHandler('Failed to check category existence', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Category existence checked successfully',
    data: {
      exists: result.exists
    }
  });
});