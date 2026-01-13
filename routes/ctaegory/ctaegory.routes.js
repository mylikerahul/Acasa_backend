import express from 'express';
import * as ctaegoryController from '../../controllers/ctaegory/ctaegory.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';


const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Get all categories (public access for frontend display)
router.get('/', ctaegoryController.getAllCtaegories);

// Get category by ID (public)
router.get('/id/:id', ctaegoryController.getCtaegoryById);

// Get category by slug (public)
router.get('/slug/:slug', ctaegoryController.getCtaegoryBySlug);

// Get category count (public)
router.get('/count', ctaegoryController.getCtaegoryCount);

// Check if category exists (public)
router.get('/exists', ctaegoryController.checkCtaegoryExists);

// ==================== ADMIN ONLY ROUTES ====================
// Create new category
router.post('/', isAuthenticated, isAdmin, ctaegoryController.createCtaegory);

// Update category
router.put('/:id', isAuthenticated, isAdmin, ctaegoryController.updateCtaegory);

// Delete category
router.delete('/:id', isAuthenticated, isAdmin, ctaegoryController.deleteCtaegory);

// Bulk create categories
router.post('/bulk', isAuthenticated, isAdmin, ctaegoryController.bulkCreateCtaegories);

export default router;