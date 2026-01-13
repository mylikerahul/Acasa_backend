import express from 'express';
import * as agencyController from '../../controllers/agency/agency.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create new Agency (Admin Only usually, or public registration)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  agencyController.createAgency
);

// Get All Agencies
router.get(
  '/all', 
  isAuthenticated, 
  // isAdmin, // Uncomment if strictly private
  agencyController.getAllAgencies
);

// Get Agency by CUID (Public identifier lookup)
router.get(
  '/cuid/:cuid', 
  agencyController.getAgencyByCuid
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, agencyController.getAgencyById)
  .put(isAuthenticated, isAdmin, agencyController.updateAgency)
  .delete(isAuthenticated, isAdmin, agencyController.deleteAgency);

export default router;