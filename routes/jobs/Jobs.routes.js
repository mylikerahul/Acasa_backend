import express from 'express';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import * as JobsController from '../../controllers/jobs/jobs.controller.js';

const router = express.Router();

/* =========================================================
   TABLE SETUP (Admin Only)
========================================================= */
router.post('/create-table', isAuthenticated, isAdmin, JobsController.createJobsTable);

/* =========================================================
   PUBLIC ROUTES (No Auth Required)
========================================================= */
router.get('/public', JobsController.getActiveJobs);
router.get('/public/recent', JobsController.getRecentJobs);
router.get('/public/search', JobsController.searchActiveJobs);
router.get('/public/slug/:slug', JobsController.getJobBySlug);
router.get('/public/type/:type', JobsController.getJobsByType);
router.get('/public/city/:city', JobsController.getJobsByCity);
router.get('/public/cities', JobsController.getAllCities);
router.get('/public/types', JobsController.getAllJobTypes);
router.get('/public/filter', JobsController.filterJobs);

/* =========================================================
   ADMIN ROUTES - GET (Read Operations)
========================================================= */
router.get('/', isAuthenticated, isAdmin, JobsController.getAllJobs);
router.get('/active', isAuthenticated, isAdmin, JobsController.getActiveJobs);
router.get('/recent', isAuthenticated, isAdmin, JobsController.getRecentJobs);
router.get('/paginate', isAuthenticated, isAdmin, JobsController.getJobsWithPagination);
router.get('/search', isAuthenticated, isAdmin, JobsController.searchJobs);
router.get('/filter', isAuthenticated, isAdmin, JobsController.filterJobs);
router.get('/date-range', isAuthenticated, isAdmin, JobsController.getJobsByDateRange);

/* =========================================================
   ADMIN ROUTES - STATS & COUNTS
========================================================= */
router.get('/stats', isAuthenticated, isAdmin, JobsController.getJobStats);
router.get('/count-by-type', isAuthenticated, isAdmin, JobsController.getJobsCountByType);
router.get('/count-by-city', isAuthenticated, isAdmin, JobsController.getJobsCountByCity);
router.get('/cities', isAuthenticated, isAdmin, JobsController.getAllCities);
router.get('/types', isAuthenticated, isAdmin, JobsController.getAllJobTypes);

/* =========================================================
   ADMIN ROUTES - SLUG CHECK
========================================================= */
router.get('/check-slug/:slug', isAuthenticated, isAdmin, JobsController.checkSlugAvailability);

/* =========================================================
   ADMIN ROUTES - SINGLE JOB OPERATIONS (GET)
========================================================= */
router.get('/id/:id', isAuthenticated, isAdmin, JobsController.getJobById);
router.get('/slug/:slug', isAuthenticated, isAdmin, JobsController.getJobBySlug);
router.get('/status/:status', isAuthenticated, isAdmin, JobsController.getJobsByStatus);
router.get('/type/:type', isAuthenticated, isAdmin, JobsController.getJobsByType);
router.get('/city/:city', isAuthenticated, isAdmin, JobsController.getJobsByCity);

/* =========================================================
   ADMIN ROUTES - CREATE
========================================================= */
router.post('/', isAuthenticated, isAdmin, JobsController.createJob);

/* =========================================================
   ADMIN ROUTES - UPDATE
========================================================= */
router.put('/:id', isAuthenticated, isAdmin, JobsController.updateJob);
router.patch('/:id/status', isAuthenticated, isAdmin, JobsController.updateJobStatus);
router.patch('/:id/toggle-status', isAuthenticated, isAdmin, JobsController.toggleJobStatus);

/* =========================================================
   ADMIN ROUTES - DELETE
========================================================= */
router.delete('/:id', isAuthenticated, isAdmin, JobsController.deleteJob);

/* =========================================================
   ADMIN ROUTES - BULK OPERATIONS
========================================================= */
router.post('/bulk-update-status', isAuthenticated, isAdmin, JobsController.bulkUpdateStatus);
router.post('/bulk-delete', isAuthenticated, isAdmin, JobsController.bulkDeleteJobs);
router.delete('/clear-all', isAuthenticated, isAdmin, JobsController.clearAllJobs);

export default router;