import express from 'express';
import * as columnActionController from '../../controllers/settings/column_action.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create (Admin)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  columnActionController.createColumnAction
);

// Get All
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin,
  columnActionController.getAllColumnActions
);

// Get by Module (e.g. /module/properties)
router.get(
  '/module/:moduleName', 
  isAuthenticated, 
  isAdmin,
  columnActionController.getActionsByModule
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, isAdmin, columnActionController.getColumnActionById)
  .put(isAuthenticated, isAdmin, columnActionController.updateColumnAction)
  .delete(isAuthenticated, isAdmin, columnActionController.deleteColumnAction);

export default router;