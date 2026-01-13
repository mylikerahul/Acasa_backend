import express from 'express';
import * as menuItemController from '../../controllers/admin/admin_menu_items.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
// import upload from '../../middleware/multer.js'; // Import if handling file uploads

const router = express.Router();

// Create new Item (Admin)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  // upload.single('image_icon'), // Uncomment if using multer
  menuItemController.createMenuItem
);

// Get All Items
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  menuItemController.getAllMenuItems
);

// Get Items by Menu ID (e.g. to render a specific menu tree)
router.get(
  '/menu/:menuId', 
  isAuthenticated, 
  menuItemController.getItemsByMenu
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, isAdmin, menuItemController.getMenuItemById)
  .put(
    isAuthenticated, 
    isAdmin, 
    // upload.single('image_icon'), // Uncomment if using multer
    menuItemController.updateMenuItem
  )
  .delete(isAuthenticated, isAdmin, menuItemController.deleteMenuItem);

export default router;