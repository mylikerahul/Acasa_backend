import express from 'express';
import * as amenityController from '../../controllers/properties/commercial_amenities.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create (Admin)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  amenityController.createAmenity
);

// Get All (Public)
router.get(
  '/all', 
  amenityController.getAllAmenities
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(amenityController.getAmenityById)
  .put(isAuthenticated, isAdmin, amenityController.updateAmenity)
  .delete(isAuthenticated, isAdmin, amenityController.deleteAmenity);

export default router;