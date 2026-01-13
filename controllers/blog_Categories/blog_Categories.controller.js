import BlogCategoriesModel from '../../../models/admin/Blog_Categories/Blog_Categories.models.js';
import catchAsyncErrors from '../../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../../utils/errorHandler.js';

// ==================== CRUD CONTROLLERS ====================

// GET all categories
export const getAllCategories = catchAsyncErrors(async (req, res) => {
  const { page = 1, limit = 10, search, sort_by, sort_order } = req.query;
  const offset = (page - 1) * limit;
  
  const categories = await BlogCategoriesModel.getAllBlogCategories({
    search,
    sort_by,
    sort_order,
    limit,
    offset
  });
  
  const total = await BlogCategoriesModel.getBlogCategoriesCount({ search });
  
  res.json({
    success: true,
    data: categories,
    pagination: {
      total,
      page: +page,
      limit: +limit,
      pages: Math.ceil(total / limit)
    }
  });
});

// GET single category
export const getCategory = catchAsyncErrors(async (req, res, next) => {
  const category = await BlogCategoriesModel.getBlogCategoryById(req.params.id);
  if (!category) return next(new ErrorHandler('Category not found', 404));
  res.json({ success: true, data: category });
});

// CREATE category
export const createCategory = catchAsyncErrors(async (req, res, next) => {
  const { name, slug, description } = req.body;
  
  if (!name || !slug) {
    return next(new ErrorHandler('Name and slug are required', 400));
  }

  try {
    const category = await BlogCategoriesModel.createBlogCategory({
      name,
      slug,
      description
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return next(new ErrorHandler(error.message, 409));
    }
    next(error);
  }
});

// UPDATE category
export const updateCategory = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const category = await BlogCategoriesModel.updateBlogCategory(id, req.body);
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return next(new ErrorHandler(error.message, 404));
    }
    if (error.message.includes('already exists')) {
      return next(new ErrorHandler(error.message, 409));
    }
    next(error);
  }
});

// DELETE category
export const deleteCategory = catchAsyncErrors(async (req, res, next) => {
  const deleted = await BlogCategoriesModel.deleteBlogCategory(req.params.id);
  if (!deleted) return next(new ErrorHandler('Category not found', 404));
  
  res.json({
    success: true,
    message: 'Category deleted successfully',
    data: deleted
  });
});

// ==================== HELPER CONTROLLERS ====================

// Generate slug
export const generateSlug = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new ErrorHandler('Name is required', 400));
  
  const slug = await BlogCategoriesModel.generateSlug(name);
  res.json({ success: true, slug });
});

// Search categories
export const searchCategories = catchAsyncErrors(async (req, res) => {
  const { q, limit = 10 } = req.query;
  const categories = await BlogCategoriesModel.searchBlogCategories(q, limit);
  res.json({ success: true, data: categories });
});

// Get stats
export const getCategoryStats = catchAsyncErrors(async (req, res) => {
  const total = await BlogCategoriesModel.getBlogCategoriesCount();
  res.json({ success: true, total });
});

// Bulk delete
export const bulkDelete = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('IDs array is required', 400));
  }

  const results = await Promise.allSettled(
    ids.map(id => BlogCategoriesModel.deleteBlogCategory(id))
  );
  
  const deleted = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
  
  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason?.message || 'Unknown error');
  
  res.json({
    success: true,
    message: `Deleted ${deleted.length} categories`,
    deletedCount: deleted.length,
    failedCount: failed.length,
    errors: failed.length > 0 ? failed : undefined
  });
});