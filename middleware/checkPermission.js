/**
 * ============================================================================
 * PERMISSION MIDDLEWARE - ADMIN AS HIGHEST AUTHORITY
 * ============================================================================
 */

import ErrorHandler from '../utils/errorHandler.js';
import * as PermissionModel from '../models/admin/Permission/Permission.models.js';
import { ADMIN_ROLE } from '../config/permissions.config.js';

/**
 * Check if user has required permission
 */
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ErrorHandler('Authentication required', 401));
      }

      const userRole = req.user.role;

      // Admin bypasses all permission checks
      if (userRole === ADMIN_ROLE) {
        return next();
      }

      const hasPermission = await PermissionModel.hasPermission(userRole, module, action);

      if (!hasPermission) {
        return next(
          new ErrorHandler(
            `Access denied. You don't have permission to ${action} ${module}.`,
            403
          )
        );
      }

      next();
    } catch (error) {
      return next(new ErrorHandler('Permission check failed', 500));
    }
  };
};

/**
 * Check multiple permissions (user needs ALL permissions)
 */
export const checkAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ErrorHandler('Authentication required', 401));
      }

      const userRole = req.user.role;

      if (userRole === ADMIN_ROLE) {
        return next();
      }

      for (const { module, action } of permissions) {
        const hasPermission = await PermissionModel.hasPermission(userRole, module, action);
        
        if (!hasPermission) {
          return next(
            new ErrorHandler(
              `Access denied. Missing permission: ${action} ${module}.`,
              403
            )
          );
        }
      }

      next();
    } catch (error) {
      return next(new ErrorHandler('Permission check failed', 500));
    }
  };
};

/**
 * Check multiple permissions (user needs ANY ONE permission)
 */
export const checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ErrorHandler('Authentication required', 401));
      }

      const userRole = req.user.role;

      if (userRole === ADMIN_ROLE) {
        return next();
      }

      for (const { module, action } of permissions) {
        const hasPermission = await PermissionModel.hasPermission(userRole, module, action);
        
        if (hasPermission) {
          return next();
        }
      }

      return next(new ErrorHandler('Access denied. Insufficient permissions.', 403));
    } catch (error) {
      return next(new ErrorHandler('Permission check failed', 500));
    }
  };
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Access denied. Required role: ${roles.join(' or ')}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Require admin only
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler('Authentication required', 401));
  }

  if (req.user.role !== ADMIN_ROLE) {
    return next(new ErrorHandler('Admin access required', 403));
  }

  next();
};

/**
 * Add permissions to request object
 */
export const attachPermissions = async (req, res, next) => {
  try {
    if (req.user) {
      const permissions = await PermissionModel.getPermissionsByRole(req.user.role);
      req.userPermissions = permissions;
    }
    next();
  } catch (error) {
    next();
  }
};

export default {
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,
  requireRole,
  requireAdmin,
  attachPermissions
};