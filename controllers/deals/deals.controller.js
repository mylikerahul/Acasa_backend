// controllers/admin/Deals/Deals.controller.js

import * as DealsModel from '../../models/deals/deals.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CREATE DEALS TABLE ====================

export const createDealsTable = catchAsyncErrors(async (req, res, next) => {
  await DealsModel.createDealsTable();
  
  res.status(200).json({
    success: true,
    message: 'Deals table created successfully'
  });
});

// ==================== GET ALL DEALS ====================

// ==================== GET ALL DEALS ====================

export const getAllDeals = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // ✅ Build options object (Model expects options object, not separate params)
  const options = {
    page,
    limit,
    status: req.query.closing_status || req.query.status,
    city: req.query.listing_city || req.query.city,
    developer: req.query.developer,
    search: req.query.search,
    sortBy: req.query.sortBy || 'id',
    sortOrder: req.query.sortOrder || 'desc'
  };

  const result = await DealsModel.getAllDeals(options);

  res.status(200).json({
    success: true,
    message: 'Deals fetched successfully',
    data: result.data,  // ✅ Model returns "data", not "deals"
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasMore: result.hasMore
    }
  });
});

// ==================== GET DEAL BY ID ====================

export const getDealById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const deal = await DealsModel.getDealById(id);

  if (!deal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Deal fetched successfully',
    data: deal
  });
});

// ==================== GET DEAL BY CLOSING ID ====================

export const getDealByClosingId = catchAsyncErrors(async (req, res, next) => {
  const { closingId } = req.params;

  const deal = await DealsModel.getDealByClosingId(closingId);

  if (!deal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Deal fetched successfully',
    data: deal
  });
});

// ==================== CREATE DEAL ====================

export const createDeal = catchAsyncErrors(async (req, res, next) => {
  const dealData = req.body;

  // Generate slug if not provided
  if (!dealData.slug && dealData.closing_name) {
    dealData.slug = dealData.closing_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }

  const deal = await DealsModel.createDeal(dealData);

  res.status(201).json({
    success: true,
    message: 'Deal created successfully',
    data: deal
  });
});

// ==================== UPDATE DEAL ====================

export const updateDeal = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const dealData = req.body;

  // Check if deal exists
  const existingDeal = await DealsModel.getDealById(id);
  if (!existingDeal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  const updated = await DealsModel.updateDeal(id, dealData);

  if (!updated) {
    return next(new ErrorHandler('Failed to update deal', 400));
  }

  const updatedDeal = await DealsModel.getDealById(id);

  res.status(200).json({
    success: true,
    message: 'Deal updated successfully',
    data: updatedDeal
  });
});

// ==================== UPDATE DEAL SECTION ====================

export const updateDealSection = catchAsyncErrors(async (req, res, next) => {
  const { id, section } = req.params;
  const sectionData = req.body;

  // Check if deal exists
  const existingDeal = await DealsModel.getDealById(id);
  if (!existingDeal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  const updated = await DealsModel.updateDealSection(id, section, sectionData);

  if (!updated) {
    return next(new ErrorHandler('Failed to update deal section', 400));
  }

  const updatedDeal = await DealsModel.getDealById(id);

  res.status(200).json({
    success: true,
    message: `Deal ${section} updated successfully`,
    data: updatedDeal
  });
});

// ==================== DELETE DEAL ====================

export const deleteDeal = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Check if deal exists
  const existingDeal = await DealsModel.getDealById(id);
  if (!existingDeal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  const deleted = await DealsModel.deleteDeal(id);

  if (!deleted) {
    return next(new ErrorHandler('Failed to delete deal', 400));
  }

  res.status(200).json({
    success: true,
    message: 'Deal deleted successfully'
  });
});

// ==================== BULK DELETE DEALS ====================

export const bulkDeleteDeals = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Please provide deal IDs to delete', 400));
  }

  const deletedCount = await DealsModel.bulkDeleteDeals(ids);

  res.status(200).json({
    success: true,
    message: `${deletedCount} deal(s) deleted successfully`,
    deletedCount
  });
});

// ==================== UPDATE DEAL STATUS ====================

export const updateDealStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(new ErrorHandler('Please provide status', 400));
  }

  // Check if deal exists
  const existingDeal = await DealsModel.getDealById(id);
  if (!existingDeal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  const updated = await DealsModel.updateDealStatus(id, status);

  if (!updated) {
    return next(new ErrorHandler('Failed to update deal status', 400));
  }

  res.status(200).json({
    success: true,
    message: 'Deal status updated successfully'
  });
});

// ==================== GET DEAL STATS ====================

export const getDealStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await DealsModel.getDealStats();

  res.status(200).json({
    success: true,
    message: 'Deal stats fetched successfully',
    data: stats
  });
});

// ==================== SEARCH DEALS ====================

export const searchDeals = catchAsyncErrors(async (req, res, next) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (!q) {
    return next(new ErrorHandler('Please provide search term', 400));
  }

  const deals = await DealsModel.searchDeals(q, page, limit);

  res.status(200).json({
    success: true,
    message: 'Search results fetched successfully',
    data: deals,
    count: deals.length
  });
});

// ==================== GET RECENT DEALS ====================

export const getRecentDeals = catchAsyncErrors(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 5;

  const deals = await DealsModel.getRecentDeals(limit);

  res.status(200).json({
    success: true,
    message: 'Recent deals fetched successfully',
    data: deals
  });
});

// ==================== GET DEALS BY CLOSING STATUS ====================

export const getDealsByClosingStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.params;

  const deals = await DealsModel.getDealsByClosingStatus(status);

  res.status(200).json({
    success: true,
    message: 'Deals fetched successfully',
    data: deals,
    count: deals.length
  });
});

// ==================== GET DEALS BY MONTH ====================

export const getDealsByMonth = catchAsyncErrors(async (req, res, next) => {
  const { year, month } = req.params;

  if (!year || !month) {
    return next(new ErrorHandler('Please provide year and month', 400));
  }

  const deals = await DealsModel.getDealsByMonth(parseInt(year), parseInt(month));

  res.status(200).json({
    success: true,
    message: 'Deals fetched successfully',
    data: deals,
    count: deals.length
  });
});

// ==================== EXPORT DEFAULT ====================

export default {
  createDealsTable,
  getAllDeals,
  getDealById,
  getDealByClosingId,
  createDeal,
  updateDeal,
  updateDealSection,
  deleteDeal,
  bulkDeleteDeals,
  updateDealStatus,
  getDealStats,
  searchDeals,
  getRecentDeals,
  getDealsByClosingStatus,
  getDealsByMonth
};