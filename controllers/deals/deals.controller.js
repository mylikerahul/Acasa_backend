import * as DealsModel from '../../models/deals/deals.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE DEAL
========================================================= */

export const createDeal = catchAsyncErrors(async (req, res, next) => {
  const dealData = req.body;

  // Check if slug already exists (if provided)
  if (dealData.slug) {
    const existingDeal = await DealsModel.getDealBySlug(dealData.slug);
    if (existingDeal) {
      return next(new ErrorHandler('Deal with this slug already exists', 400));
    }
  }

  const result = await DealsModel.createDeal(dealData);

  res.status(201).json({
    success: true,
    message: 'Deal created successfully',
    data: {
      id: result.insertId,
      ...dealData
    }
  });
});

/* =========================================================
   GET ALL DEALS
========================================================= */

export const getAllDeals = catchAsyncErrors(async (req, res, next) => {
  const deals = await DealsModel.getAllDeals();

  res.status(200).json({
    success: true,
    count: deals.length,
    data: deals
  });
});

/* =========================================================
   GET DEAL BY ID
========================================================= */

export const getDealById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const deal = await DealsModel.getDealById(id);

  if (!deal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  res.status(200).json({
    success: true,
    data: deal
  });
});

/* =========================================================
   GET DEAL BY SLUG
========================================================= */

export const getDealBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  const deal = await DealsModel.getDealBySlug(slug);

  if (!deal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  res.status(200).json({
    success: true,
    data: deal
  });
});

/* =========================================================
   GET DEALS BY STATUS
========================================================= */

export const getDealsByStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.params;

  const deals = await DealsModel.getDealsByStatus(status);

  res.status(200).json({
    success: true,
    count: deals.length,
    data: deals
  });
});

/* =========================================================
   GET DEALS BY BROKER
========================================================= */

export const getDealsByBroker = catchAsyncErrors(async (req, res, next) => {
  const { brokerName } = req.params;

  const deals = await DealsModel.getDealsByBroker(brokerName);

  res.status(200).json({
    success: true,
    count: deals.length,
    data: deals
  });
});

/* =========================================================
   GET DEALS BY DATE RANGE
========================================================= */

export const getDealsByDateRange = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ErrorHandler('Please provide both startDate and endDate', 400));
  }

  const deals = await DealsModel.getDealsByDateRange(startDate, endDate);

  res.status(200).json({
    success: true,
    count: deals.length,
    data: deals
  });
});

/* =========================================================
   GET DEALS STATISTICS
========================================================= */

export const getDealsStatistics = catchAsyncErrors(async (req, res, next) => {
  const statistics = await DealsModel.getDealsStatistics();

  res.status(200).json({
    success: true,
    data: statistics
  });
});

/* =========================================================
   UPDATE DEAL
========================================================= */

export const updateDeal = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if deal exists
  const existingDeal = await DealsModel.getDealById(id);
  if (!existingDeal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  // Check if slug is being updated and if it already exists
  if (updateData.slug && updateData.slug !== existingDeal.slug) {
    const dealWithSlug = await DealsModel.getDealBySlug(updateData.slug);
    if (dealWithSlug) {
      return next(new ErrorHandler('Deal with this slug already exists', 400));
    }
  }

  const result = await DealsModel.updateDeal(id, updateData);

  if (result.affectedRows === 0) {
    return next(new ErrorHandler('Failed to update deal', 400));
  }

  // Fetch updated deal
  const updatedDeal = await DealsModel.getDealById(id);

  res.status(200).json({
    success: true,
    message: 'Deal updated successfully',
    data: updatedDeal
  });
});

/* =========================================================
   DELETE DEAL
========================================================= */

export const deleteDeal = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Check if deal exists
  const existingDeal = await DealsModel.getDealById(id);
  if (!existingDeal) {
    return next(new ErrorHandler('Deal not found', 404));
  }

  const result = await DealsModel.deleteDeal(id);

  if (result.affectedRows === 0) {
    return next(new ErrorHandler('Failed to delete deal', 400));
  }

  res.status(200).json({
    success: true,
    message: 'Deal deleted successfully'
  });
});

/* =========================================================
   BULK CREATE DEALS
========================================================= */

export const bulkCreateDeals = catchAsyncErrors(async (req, res, next) => {
  const { deals } = req.body;

  if (!Array.isArray(deals) || deals.length === 0) {
    return next(new ErrorHandler('Please provide an array of deals', 400));
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < deals.length; i++) {
    try {
      const result = await DealsModel.createDeal(deals[i]);
      results.push({
        index: i,
        id: result.insertId,
        success: true
      });
    } catch (error) {
      errors.push({
        index: i,
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `${results.length} deals created successfully`,
    created: results.length,
    failed: errors.length,
    results,
    errors
  });
});

/* =========================================================
   SEARCH DEALS
========================================================= */

export const searchDeals = catchAsyncErrors(async (req, res, next) => {
  const { 
    keyword, 
    status, 
    broker, 
    minPrice, 
    maxPrice,
    startDate,
    endDate 
  } = req.query;

  let deals = await DealsModel.getAllDeals();

  // Filter by keyword (searches in multiple fields)
  if (keyword) {
    const searchTerm = keyword.toLowerCase();
    deals = deals.filter(deal => 
      (deal.closing_name && deal.closing_name.toLowerCase().includes(searchTerm)) ||
      (deal.Listing && deal.Listing.toLowerCase().includes(searchTerm)) ||
      (deal.Buyers && deal.Buyers.toLowerCase().includes(searchTerm)) ||
      (deal.Sellers && deal.Sellers.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by status
  if (status) {
    deals = deals.filter(deal => deal.Closing_Status === status);
  }

  // Filter by broker
  if (broker) {
    deals = deals.filter(deal => 
      deal.Closing_Broker === broker ||
      deal.Second_Broker === broker ||
      deal.Third_Broker === broker ||
      deal.Fourth_broker === broker
    );
  }

  // Filter by price range
  if (minPrice) {
    deals = deals.filter(deal => deal.Sales_Price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    deals = deals.filter(deal => deal.Sales_Price <= parseFloat(maxPrice));
  }

  // Filter by date range
  if (startDate && endDate) {
    deals = deals.filter(deal => {
      const dealDate = new Date(deal.closing_date);
      return dealDate >= new Date(startDate) && dealDate <= new Date(endDate);
    });
  }

  res.status(200).json({
    success: true,
    count: deals.length,
    data: deals
  });
});