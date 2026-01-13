// middleware/maintenance.js

/**
 * ============================================================================
 * MAINTENANCE MODE MIDDLEWARE
 * ============================================================================
 */

import * as SettingsModel from '../models/admin/Settings/Settings.model.js';

export const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Skip for admin routes
    if (req.path.startsWith('/api/v1/admin')) {
      return next();
    }

    // Skip for public settings route
    if (req.path === '/api/v1/admin/settings/public') {
      return next();
    }

    // Skip for maintenance status check
    if (req.path === '/api/v1/admin/settings/maintenance-status') {
      return next();
    }

    const isMaintenanceMode = await SettingsModel.isMaintenanceMode();

    if (isMaintenanceMode) {
      return res.status(503).json({
        success: false,
        message: 'Site is currently under maintenance. Please try again later.',
        maintenanceMode: true
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance check error:', error);
    next();
  }
};

export default checkMaintenanceMode;    