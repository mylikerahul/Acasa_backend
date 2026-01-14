// routes/jobs/jobs.routes.js

import express from 'express';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import * as JobsController from '../../controllers/jobs/jobs.controller.js';

const router = express.Router();

/* =========================================================
   TABLE SETUP (Admin Only)
========================================================= */
router.post('/create-table', isAuthenticated, isAdmin, JobsController.createJobsTable);

/* =========================================================
   PUBLIC ROUTES
========================================================= */
router.get('/public', JobsController.getActiveJobs);
router.get('/public/recent', JobsController.getRecentJobs);
router.get('/public/slug/:slug', JobsController.getJobBySlug);

/* =========================================================
   ADMIN ROUTES - MAIN LISTING
========================================================= */
router.get('/', isAuthenticated, isAdmin, JobsController.getJobsDynamic);
router.get('/stats', isAuthenticated, isAdmin, JobsController.getJobStats);
router.get('/filter-options', isAuthenticated, isAdmin, JobsController.getFilterOptions);

/* =========================================================
   ADMIN ROUTES - SINGLE OPERATIONS
========================================================= */
router.get('/id/:id', isAuthenticated, isAdmin, JobsController.getJobById);
router.get('/slug/:slug', isAuthenticated, isAdmin, JobsController.getJobBySlug);
router.get('/check-slug/:slug', isAuthenticated, isAdmin, JobsController.checkSlugAvailability);

/* =========================================================
   ADMIN ROUTES - CREATE/UPDATE/DELETE
========================================================= */
router.post('/', isAuthenticated, isAdmin, JobsController.createJob);
router.put('/:id', isAuthenticated, isAdmin, JobsController.updateJob);
router.patch('/:id/inline', isAuthenticated, isAdmin, JobsController.inlineUpdate);
router.patch('/:id/status', isAuthenticated, isAdmin, JobsController.updateJobStatus);
router.patch('/:id/toggle-status', isAuthenticated, isAdmin, JobsController.toggleJobStatus);
router.patch('/:id/toggle-featured', isAuthenticated, isAdmin, JobsController.toggleFeatured);
router.post('/:id/duplicate', isAuthenticated, isAdmin, JobsController.duplicateJob);
router.delete('/:id', isAuthenticated, isAdmin, JobsController.deleteJob);

/* =========================================================
   ADMIN ROUTES - BULK OPERATIONS
========================================================= */
router.post('/bulk/status', isAuthenticated, isAdmin, JobsController.bulkUpdateStatus);
router.post('/bulk/featured', isAuthenticated, isAdmin, JobsController.bulkUpdateFeatured);
router.post('/bulk/delete', isAuthenticated, isAdmin, JobsController.bulkDeleteJobs);

export default router;