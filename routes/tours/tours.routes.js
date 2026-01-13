import express from 'express';
import * as tourController from '../../controllers/tours/tours.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create new Tour (Can be public if it comes from a landing page, 
// or authenticated if created by admin/agent. Using auth here for consistency)
router.post(
  '/create', 
  // isAuthenticated, // Uncomment if only logged in users can book tours
  tourController.createTour
);

// Get All Tours (Admin Only)
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  tourController.getAllTours
);

// Get My Tours (Agent sees their assigned tours)
router.get(
  '/my-tours', 
  isAuthenticated, 
  tourController.getMyTours
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, tourController.getTourById)
  .put(isAuthenticated, tourController.updateTour)
  .delete(isAuthenticated, isAdmin, tourController.deleteTour);

export default router;