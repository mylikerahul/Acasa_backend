// routes/admin/Lifestyle/Lifestyle.routes.js

import express from 'express';
import { isAdmin, isAuthenticated } from '../../guards/guards.js'; // Assuming guards path
import * as LifestyleController from '../../controllers/lifestyle/lifestyle.controller.js';

const router = express.Router();

/* =========================================================
   TABLE SETUP (Admin Only)
========================================================= */
router.post('/create-table', isAuthenticated, isAdmin, LifestyleController.createLifestyleTable);

/* =========================================================
   PUBLIC ROUTES (No Auth Required)
========================================================= */
router.get('/public', LifestyleController.getActiveLifestyles);
router.get('/public/slug/:slug', LifestyleController.getLifestyleBySlug);
router.get('/public/search', LifestyleController.searchLifestyles); // Might search only active in public context

/* =========================================================
   ADMIN ROUTES - GET (Read Operations)
========================================================= */
router.get('/', isAuthenticated, isAdmin, LifestyleController.getAllLifestyles);
router.get('/active', isAuthenticated, isAdmin, LifestyleController.getActiveLifestyles);
router.get('/paginate', isAuthenticated, isAdmin, LifestyleController.getLifestylesWithPagination);
router.get('/search', isAuthenticated, isAdmin, LifestyleController.searchLifestyles);

/* =========================================================
   ADMIN ROUTES - STATS & UTILITIES
========================================================= */
router.get('/stats', isAuthenticated, isAdmin, LifestyleController.getLifestyleStats);
router.get('/check-slug/:slug', isAuthenticated, isAdmin, LifestyleController.checkSlugAvailability);
router.post('/generate-unique-slug', isAuthenticated, isAdmin, LifestyleController.generateUniqueSlug);

// Dropdown data (if needed for forms, e.g., country_id, developer_id)
router.get('/countries', isAuthenticated, isAdmin, LifestyleController.getAllCountries);
router.get('/developers', isAuthenticated, isAdmin, LifestyleController.getAllDevelopers);


/* =========================================================
   ADMIN ROUTES - SINGLE LIFESTYLE OPERATIONS
========================================================= */
router.get('/id/:id', isAuthenticated, isAdmin, LifestyleController.getLifestyleById);
router.get('/slug/:slug', isAuthenticated, isAdmin, LifestyleController.getLifestyleBySlug); // Admin can also get by slug
router.get('/status/:status', isAuthenticated, isAdmin, LifestyleController.getLifestylesByStatus);

/* =========================================================
   ADMIN ROUTES - CREATE
========================================================= */
router.post('/', isAuthenticated, isAdmin, LifestyleController.createLifestyle);

/* =========================================================
   ADMIN ROUTES - UPDATE
========================================================= */
router.put('/:id', isAuthenticated, isAdmin, LifestyleController.updateLifestyle);
router.patch('/:id/status', isAuthenticated, isAdmin, LifestyleController.updateLifestyleStatus);
router.patch('/:id/toggle-status', isAuthenticated, isAdmin, LifestyleController.toggleLifestyleStatus);

/* =========================================================
   ADMIN ROUTES - DELETE
========================================================= */
router.delete('/:id', isAuthenticated, isAdmin, LifestyleController.deleteLifestyle);

/* =========================================================
   ADMIN ROUTES - BULK OPERATIONS
========================================================= */
router.post('/bulk-update-status', isAuthenticated, isAdmin, LifestyleController.bulkUpdateStatus);
router.post('/bulk-delete', isAuthenticated, isAdmin, LifestyleController.bulkDeleteLifestyles);
router.delete('/clear-all', isAuthenticated, isAdmin, LifestyleController.clearAllLifestyles);

export default router;