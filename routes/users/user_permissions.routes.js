import express from 'express';
import * as permissionController from '../../controllers/users/user_permissions.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create new permission set (Admin only)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  permissionController.createPermission
);

// Get all permissions (Admin only)
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  permissionController.getAllPermissions
);

// Get permission by user type (e.g. /type/manager)
router.get(
  '/type/:userType', 
  isAuthenticated, 
  permissionController.getPermissionByUserType
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, isAdmin, permissionController.getPermissionById)
  .put(isAuthenticated, isAdmin, permissionController.updatePermission)
  .delete(isAuthenticated, isAdmin, permissionController.deletePermission);

export default router;