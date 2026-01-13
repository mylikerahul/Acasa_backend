/**
 * ============================================================================
 * PERMISSION CONTROLLER - ADMIN AS HIGHEST AUTHORITY
 * ============================================================================
 */

import catchAsyncErrors from '../../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../../utils/errorHandler.js';
import * as PermissionModel from '../../../models/admin/Permission/Permission.models.js';
import * as RoleModel from '../../../models/admin/Role/Role.model.js';
import { MODULES, ACTIONS, ADMIN_ROLE } from '../../../config/permissions.config.js';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const validatePermissionStructure = (permissions) => {
  if (!permissions || typeof permissions !== 'object') {
    throw new Error('Permissions must be an object');
  }

  for (const [roleId, modules] of Object.entries(permissions)) {
    if (typeof modules !== 'object') {
      throw new Error(`Invalid modules structure for role: ${roleId}`);
    }

    for (const [module, actions] of Object.entries(modules)) {
      if (!MODULES.includes(module)) {
        throw new Error(`Invalid module: ${module}`);
      }

      if (typeof actions !== 'object') {
        throw new Error(`Invalid actions structure for module: ${module}`);
      }

      for (const [action, value] of Object.entries(actions)) {
        if (!ACTIONS.includes(action)) {
          throw new Error(`Invalid action: ${action}`);
        }

        if (typeof value !== 'boolean') {
          throw new Error(`Permission value must be boolean for ${module}.${action}`);
        }
      }
    }
  }

  return true;
};

/**
 * Check if current user is admin
 */
const isAdmin = (req) => req.user.role === ADMIN_ROLE;

// ============================================================================
// ROLE CONTROLLERS
// ============================================================================

/**
 * @route   GET /api/v1/admin/permissions/roles
 */
export const getAllRoles = catchAsyncErrors(async (req, res, next) => {
  const { includeInactive } = req.query;

  const roles = await RoleModel.getAllRoles(includeInactive === 'true');

  res.status(200).json({
    success: true,
    count: roles.length,
    roles
  });
});

/**
 * @route   GET /api/v1/admin/permissions/roles/:id
 */
export const getRoleById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const role = await RoleModel.getRoleById(id);

  if (!role) {
    return next(new ErrorHandler('Role not found', 404));
  }

  const permissions = await PermissionModel.getPermissionsByRole(id);

  res.status(200).json({
    success: true,
    role: {
      ...role,
      permissions
    }
  });
});

/**
 * @route   POST /api/v1/admin/permissions/roles
 * @access  Admin only
 */
export const createRole = catchAsyncErrors(async (req, res, next) => {
  if (!isAdmin(req)) {
    return next(new ErrorHandler('Only admin can create roles', 403));
  }

  const { name, description } = req.body;

  if (!name || name.trim().length < 2) {
    return next(new ErrorHandler('Role name is required (min 2 characters)', 400));
  }

  const roleId = name.toLowerCase().replace(/\s+/g, '_');
  const existingRole = await RoleModel.getRoleById(roleId);

  if (existingRole) {
    return next(new ErrorHandler('Role with this name already exists', 409));
  }

  const role = await RoleModel.createRole({
    id: roleId,
    name: name.trim(),
    description: description?.trim()
  });

  await PermissionModel.initializeRolePermissions(role.id);

  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    role
  });
});

/**
 * @route   PUT /api/v1/admin/permissions/roles/:id
 * @access  Admin only
 */
export const updateRole = catchAsyncErrors(async (req, res, next) => {
  if (!isAdmin(req)) {
    return next(new ErrorHandler('Only admin can update roles', 403));
  }

  const { id } = req.params;
  const { name, description, is_active } = req.body;

  const role = await RoleModel.getRoleById(id);

  if (!role) {
    return next(new ErrorHandler('Role not found', 404));
  }

  if (role.is_system && is_active === false) {
    return next(new ErrorHandler('System roles cannot be deactivated', 400));
  }

  const updatedRole = await RoleModel.updateRole(id, {
    name: name?.trim(),
    description: description?.trim(),
    is_active
  });

  res.status(200).json({
    success: true,
    message: 'Role updated successfully',
    role: updatedRole
  });
});

/**
 * @route   DELETE /api/v1/admin/permissions/roles/:id
 * @access  Admin only
 */
export const deleteRole = catchAsyncErrors(async (req, res, next) => {
  if (!isAdmin(req)) {
    return next(new ErrorHandler('Only admin can delete roles', 403));
  }

  const { id } = req.params;

  try {
    const deletedRole = await RoleModel.deleteRole(id);

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
      role: deletedRole
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ============================================================================
// PERMISSION CONTROLLERS
// ============================================================================

/**
 * @route   GET /api/v1/admin/permissions
 */
export const getAllPermissions = catchAsyncErrors(async (req, res, next) => {
  const permissions = await PermissionModel.getAllPermissions();
  const roles = await RoleModel.getAllRoles();
  const modules = PermissionModel.getModules();
  const actions = PermissionModel.getActions();

  res.status(200).json({
    success: true,
    permissions,
    roles,
    modules,
    actions
  });
});

/**
 * @route   GET /api/v1/admin/permissions/role/:roleId
 */
export const getPermissionsByRole = catchAsyncErrors(async (req, res, next) => {
  const { roleId } = req.params;

  const roleExists = await RoleModel.roleExists(roleId);

  if (!roleExists) {
    return next(new ErrorHandler('Role not found', 404));
  }

  const permissions = await PermissionModel.getPermissionsByRole(roleId);

  res.status(200).json({
    success: true,
    roleId,
    permissions
  });
});

/**
 * @route   PUT /api/v1/admin/permissions
 * @access  Admin only
 */
export const updateAllPermissions = catchAsyncErrors(async (req, res, next) => {
  if (!isAdmin(req)) {
    return next(new ErrorHandler('Only admin can update permissions', 403));
  }

  const { permissions } = req.body;

  if (!permissions) {
    return next(new ErrorHandler('Permissions data is required', 400));
  }

  try {
    validatePermissionStructure(permissions);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }

  const updatedPermissions = await PermissionModel.updateAllPermissions(permissions);

  res.status(200).json({
    success: true,
    message: 'Permissions updated successfully',
    permissions: updatedPermissions
  });
});

/**
 * @route   PUT /api/v1/admin/permissions/role/:roleId
 * @access  Admin only
 */
export const updateRolePermissions = catchAsyncErrors(async (req, res, next) => {
  if (!isAdmin(req)) {
    return next(new ErrorHandler('Only admin can update permissions', 403));
  }

  const { roleId } = req.params;
  const { permissions } = req.body;

  if (roleId === ADMIN_ROLE) {
    return next(new ErrorHandler('Admin permissions cannot be modified', 400));
  }

  const roleExists = await RoleModel.roleExists(roleId);

  if (!roleExists) {
    return next(new ErrorHandler('Role not found', 404));
  }

  if (!permissions || typeof permissions !== 'object') {
    return next(new ErrorHandler('Permissions data is required', 400));
  }

  const updatedPermissions = await PermissionModel.bulkUpdatePermissions(roleId, permissions);

  res.status(200).json({
    success: true,
    message: `Permissions for ${roleId} updated successfully`,
    count: updatedPermissions.length
  });
});

/**
 * @route   PATCH /api/v1/admin/permissions/toggle
 * @access  Admin only
 */
export const togglePermission = catchAsyncErrors(async (req, res, next) => {
  if (!isAdmin(req)) {
    return next(new ErrorHandler('Only admin can modify permissions', 403));
  }

  const { roleId, module, action, isAllowed } = req.body;

  if (!roleId || !module || !action || typeof isAllowed !== 'boolean') {
    return next(new ErrorHandler('roleId, module, action, and isAllowed are required', 400));
  }

  if (roleId === ADMIN_ROLE) {
    return next(new ErrorHandler('Admin permissions cannot be modified', 400));
  }

  try {
    const permission = await PermissionModel.updatePermission(roleId, module, action, isAllowed);

    res.status(200).json({
      success: true,
      message: 'Permission updated',
      permission
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

/**
 * @route   POST /api/v1/admin/permissions/reset
 * @access  Admin only
 */
export const resetPermissions = catchAsyncErrors(async (req, res, next) => {
  if (!isAdmin(req)) {
    return next(new ErrorHandler('Only admin can reset permissions', 403));
  }

  const { roleId } = req.body;

  if (roleId === ADMIN_ROLE) {
    return next(new ErrorHandler('Admin permissions cannot be reset', 400));
  }

  let result;

  if (roleId) {
    const roleExists = await RoleModel.roleExists(roleId);
    if (!roleExists) {
      return next(new ErrorHandler('Role not found', 404));
    }
    result = await PermissionModel.resetRolePermissions(roleId);
  } else {
    result = await PermissionModel.resetAllPermissions();
  }

  res.status(200).json({
    success: true,
    message: roleId 
      ? `Permissions for ${roleId} reset successfully` 
      : 'All permissions reset successfully',
    count: result.length
  });
});

/**
 * @route   GET /api/v1/admin/permissions/check
 */
export const checkPermission = catchAsyncErrors(async (req, res, next) => {
  const { module, action } = req.query;

  if (!module || !action) {
    return next(new ErrorHandler('Module and action are required', 400));
  }

  const hasPermission = await PermissionModel.hasPermission(req.user.role, module, action);

  res.status(200).json({
    success: true,
    hasPermission,
    module,
    action,
    role: req.user.role
  });
});

/**
 * @route   GET /api/v1/admin/permissions/my-permissions
 */
export const getMyPermissions = catchAsyncErrors(async (req, res, next) => {
  const permissions = await PermissionModel.getPermissionsByRole(req.user.role);

  res.status(200).json({
    success: true,
    role: req.user.role,
    isAdmin: isAdmin(req),
    permissions
  });
});

/**
 * @route   GET /api/v1/admin/permissions/modules
 */
export const getModules = catchAsyncErrors(async (req, res) => {
  const modules = PermissionModel.getModules();

  res.status(200).json({
    success: true,
    modules
  });
});

/**
 * @route   GET /api/v1/admin/permissions/actions
 */
export const getActions = catchAsyncErrors(async (req, res) => {
  const actions = PermissionModel.getActions();

  res.status(200).json({
    success: true,
    actions
  });
});

export default {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  getPermissionsByRole,
  updateAllPermissions,
  updateRolePermissions,
  togglePermission,
  resetPermissions,
  checkPermission,
  getMyPermissions,
  getModules,
  getActions
};