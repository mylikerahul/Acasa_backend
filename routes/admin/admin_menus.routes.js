import express from 'express';
import * as adminMenuController from '../../controllers/admin/admin_menus.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Since these are "Admin Menus", all routes should generally be protected by isAdmin

// Create new Menu Item
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  adminMenuController.createAdminMenu
);

// Get All Menu Items
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  adminMenuController.getAllAdminMenus
);

// Get Menus by Type (e.g., /type/sidebar)
router.get(
  '/type/:menuType', 
  isAuthenticated, 
  isAdmin, 
  adminMenuController.getMenusByType
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, isAdmin, adminMenuController.getAdminMenuById)
  .put(isAuthenticated, isAdmin, adminMenuController.updateAdminMenu)
  .delete(isAuthenticated, isAdmin, adminMenuController.deleteAdminMenu);

export default router;