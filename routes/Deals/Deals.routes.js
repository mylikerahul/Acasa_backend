import express from 'express';
import * as dealsController from '../../controllers/deals/deals.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
// Folder name 'deals'
const imageUpload = createUploader('deals', {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// ==================== PUBLIC ROUTES ====================

// Get all deals
router.get('/', dealsController.getAllDeals);

// Get deal by ID
router.get('/id/:id', dealsController.getDealById);

// Get deal by slug
router.get('/slug/:slug', dealsController.getDealBySlug);

// Get deals by status
router.get('/status/:status', dealsController.getDealsByStatus);

// Get deals by broker
router.get('/broker/:brokerName', dealsController.getDealsByBroker);

// Get deals by date range (query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
router.get('/date-range', dealsController.getDealsByDateRange);

// Get deals statistics
router.get('/statistics', dealsController.getDealsStatistics);

// Search deals (query params: ?keyword=&status=&broker=&minPrice=&maxPrice=&startDate=&endDate=)
router.get('/search', dealsController.searchDeals);

// ==================== AUTHENTICATED ROUTES ====================

// Create new deal (with optional image upload)
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  imageUpload.single('image'),
  dealsController.createDeal
);

// Bulk create deals
router.post(
  '/bulk-create',
  isAuthenticated,
  isAdmin,
  dealsController.bulkCreateDeals
);

// Update deal (with optional image upload)
router.put(
  '/update/:id',
  isAuthenticated,
  isAdmin,
  imageUpload.single('image'),
  dealsController.updateDeal
);

// Delete deal
router.delete(
  '/delete/:id',
  isAuthenticated,
  isAdmin,
  dealsController.deleteDeal
);

// ==================== EXPORT ====================

export default router;