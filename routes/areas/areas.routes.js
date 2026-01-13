import express from 'express';
import * as areaController from '../../controllers/areas/areas.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
// import upload from '../../middleware/multer.js'; // Import if handling image uploads

const router = express.Router();

// Create new Area (Admin)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  // upload.single('Upload'), // Maps to 'Upload' field in DB
  areaController.createArea
);

// Get All Areas (Public)
router.get(
  '/all', 
  areaController.getAllAreas
);

// Get Area by Slug (Public)
router.get(
  '/slug/:slug', 
  areaController.getAreaBySlug
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(areaController.getAreaById)
  .put(
    isAuthenticated, 
    isAdmin, 
    // upload.single('Upload'), 
    areaController.updateArea
  )
  .delete(isAuthenticated, isAdmin, areaController.deleteArea);

export default router;