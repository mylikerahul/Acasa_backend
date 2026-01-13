import express from 'express';
import * as unitController from '../../controllers/units/units.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create new Unit
router.post(
  '/create', 
  isAuthenticated, 
  // isAdmin, // Uncomment if only admins can create units
  unitController.createUnit
);

// Get All Units
router.get(
  '/all', 
  unitController.getAllUnits
);

// Get Units by Module (e.g., /module/project/15 or /module/property/10)
router.get(
  '/module/:moduleType/:moduleId', 
  unitController.getUnitsByModule
);

// Get, Update, Delete Unit by ID
router.route('/:id')
  .get(unitController.getUnitById)
  .put(
    isAuthenticated, 
    // isAdmin, // Uncomment if restricted
    unitController.updateUnit
  )
  .delete(
    isAuthenticated, 
    // isAdmin, // Uncomment if restricted
    unitController.deleteUnit
  );

export default router;