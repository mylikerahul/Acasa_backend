import express from 'express';
import * as submenuController from '../../controllers/admin/admin_submenu.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
// import upload from '../../middleware/multer.js'; // Uncomment if using multer

const router = express.Router();

// Create new Submenu Item
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  // upload.single('thumbnail'), // Uncomment if using multer
  submenuController.createSubmenu
);

// Get All Submenus
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  submenuController.getAllSubmenus
);

// Get Submenus by Parent (Menu Item ID)
router.get(
  '/parent/:parentId', 
  isAuthenticated, 
  isAdmin, 
  submenuController.getSubmenusByParent
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, isAdmin, submenuController.getSubmenuById)
  .put(
    isAuthenticated, 
    isAdmin, 
    // upload.single('thumbnail'), // Uncomment if using multer
    submenuController.updateSubmenu
  )
  .delete(isAuthenticated, isAdmin, submenuController.deleteSubmenu);

export default router;