import express from 'express';
import * as styleController from '../../controllers/properties/building_style.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create new Style (Admin)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  styleController.createStyle
);

// Get All Styles (Public - usually for dropdowns)
router.get(
  '/all', 
  styleController.getAllStyles
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(styleController.getStyleById)
  .put(isAuthenticated, isAdmin, styleController.updateStyle)
  .delete(isAuthenticated, isAdmin, styleController.deleteStyle);

export default router;