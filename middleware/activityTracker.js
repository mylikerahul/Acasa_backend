// middleware/activityTracker.js

import * as ActivityModel from '../models/admin/Activity/Activity.model.js';

// Helper function to get IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.ip || 
         req.connection?.remoteAddress || 
         'unknown';
};

// Auto track activity on each request
export const trackActivity = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      await ActivityModel.updateAdminActivity(req.user.id);
    }
    next();
  } catch (error) {
    console.error('Activity tracking error:', error);
    next(); // Don't block request on error
  }
};

// Track specific actions - returns middleware function
export const trackAction = (action, action_type = 'general', options = {}) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.id) {
        const ip_address = getClientIP(req);
        const user_agent = req.headers['user-agent'];

        await ActivityModel.logActivity({
          admin_id: req.user.id,
          action,
          action_type,
          ip_address,
          user_agent,
          entity_type: options.entity_type || null,
          entity_id: req.params.id || options.entity_id || null,
          description: options.description || null,
          metadata: options.metadata || {}
        });
      }
      next();
    } catch (error) {
      console.error('Action tracking error:', error);
      next();
    }
  };
};

// Track login - call this after successful login
export const trackLogin = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const ip_address = getClientIP(req);
      const user_agent = req.headers['user-agent'];
      
      await ActivityModel.recordLogin(req.user.id, ip_address, user_agent);
    }
    next();
  } catch (error) {
    console.error('Login tracking error:', error);
    next();
  }
};

// Track logout
export const trackLogout = async (req, session_duration = 0) => {
  try {
    if (req.user && req.user.id) {
      await ActivityModel.recordLogout(req.user.id, session_duration);
    }
  } catch (error) {
    console.error('Logout tracking error:', error);
  }
};

// Track CRUD operations dynamically
export const trackCRUD = (entity_type) => {
  return {
    create: trackAction(`Created ${entity_type}`, 'create', { entity_type }),
    read: trackAction(`Viewed ${entity_type}`, 'read', { entity_type }),
    update: trackAction(`Updated ${entity_type}`, 'update', { entity_type }),
    delete: trackAction(`Deleted ${entity_type}`, 'delete', { entity_type })
  };
};