// routes/admin/Deals/Deals.routes.js

import express from 'express';
import * as DealsController from '../../controllers/deals/deals.controller.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';

const router = express.Router();

// ==================== TABLE CREATION ====================
router.post('/create-table', isAuthenticated, isAdmin, DealsController.createDealsTable);

// ==================== STATS & ANALYTICS ====================
router.get('/stats', isAuthenticated, isAdmin, DealsController.getDealStats);
router.get('/recent', isAuthenticated, isAdmin, DealsController.getRecentDeals);
router.get('/search', isAuthenticated, isAdmin, DealsController.searchDeals);

// ==================== FILTER ROUTES ====================
router.get('/status/:status', isAuthenticated, isAdmin, DealsController.getDealsByClosingStatus);
router.get('/month/:year/:month', isAuthenticated, isAdmin, DealsController.getDealsByMonth);
router.get('/closing/:closingId', isAuthenticated, isAdmin, DealsController.getDealByClosingId);

// ==================== BULK OPERATIONS ====================
router.post('/bulk-delete', isAuthenticated, isAdmin, DealsController.bulkDeleteDeals);

// ==================== CRUD OPERATIONS ====================
router.get('/', isAuthenticated, isAdmin, DealsController.getAllDeals);
router.get('/:id', isAuthenticated, isAdmin, DealsController.getDealById);
router.post('/', isAuthenticated, isAdmin, DealsController.createDeal);
router.put('/:id', isAuthenticated, isAdmin, DealsController.updateDeal);
router.delete('/:id', isAuthenticated, isAdmin, DealsController.deleteDeal);

// ==================== SECTION & STATUS UPDATE ====================
router.patch('/:id/status', isAuthenticated, isAdmin, DealsController.updateDealStatus);
router.patch('/:id/section/:section', isAuthenticated, isAdmin, DealsController.updateDealSection);

export default router;