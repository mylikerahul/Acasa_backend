import express from 'express';
import * as jobController from '../../controllers/jobs/applied_jobs.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
// import upload from '../../middleware/multer.js'; // Import your multer config

const router = express.Router();

// Public Route: Submit Application
router.post(
  '/submit', 
  // upload.single('resume'), // Uncomment if using multer for file uploads
  jobController.submitApplication
);

// Admin Routes: Manage Applications
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  jobController.getAllApplications
);

router.route('/:id')
  .get(isAuthenticated, isAdmin, jobController.getApplicationById)
  .put(
    isAuthenticated, 
    isAdmin, 
    // upload.single('resume'), 
    jobController.updateApplication
  )
  .delete(isAuthenticated, isAdmin, jobController.deleteApplication);

export default router;