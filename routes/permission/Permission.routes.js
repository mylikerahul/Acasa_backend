// /**
//  * ============================================================================
//  * PERMISSION ROUTES - ADMIN AS HIGHEST AUTHORITY
//  * ============================================================================
//  */

// import express from 'express';
// import { isAdminAuthenticated } from '../../../guards/guards.js';
// import { requireAdmin } from '../../../middleware/checkPermission.js';
// import * as PermissionController from '../../../controllers/admin/Permission/Permission.controller.js';

// const router = express.Router();

// // All routes require authentication
// router.use(isAdminAuthenticated);

// // ============================================================================
// // ROLE ROUTES
// // ============================================================================

// router.get('/roles', PermissionController.getAllRoles);
// router.get('/roles/:id', PermissionController.getRoleById);

// // Admin only routes
// router.post('/roles', requireAdmin, PermissionController.createRole);
// router.put('/roles/:id', requireAdmin, PermissionController.updateRole);
// router.delete('/roles/:id', requireAdmin, PermissionController.deleteRole);

// // ============================================================================
// // PERMISSION ROUTES
// // ============================================================================

// router.get('/', PermissionController.getAllPermissions);
// router.get('/modules', PermissionController.getModules);
// router.get('/actions', PermissionController.getActions);
// router.get('/my-permissions', PermissionController.getMyPermissions);
// router.get('/check', PermissionController.checkPermission);
// router.get('/role/:roleId', PermissionController.getPermissionsByRole);

// // Admin only routes
// router.put('/', requireAdmin, PermissionController.updateAllPermissions);
// router.put('/role/:roleId', requireAdmin, PermissionController.updateRolePermissions);
// router.patch('/toggle', requireAdmin, PermissionController.togglePermission);
// router.post('/reset', requireAdmin, PermissionController.resetPermissions);

// export default router;