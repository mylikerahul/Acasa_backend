/**
 * ============================================================================
 * PERMISSIONS CONFIG - ADMIN AS HIGHEST AUTHORITY
 * ============================================================================
 */

// Admin role is the highest authority
export const ADMIN_ROLE = 'admin';

// All available modules
export const MODULES = [
  'dashboard',
  'users',
  'properties',
  'bookings',
  'payments',
  'reports',
  'settings',
  'roles',
  'permissions'
];

// All available actions
export const ACTIONS = ['create', 'view', 'update', 'delete'];

// Default roles
export const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access - highest authority',
    is_system: true,
    is_deletable: false
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage most resources',
    is_system: true,
    is_deletable: false
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can create and edit content',
    is_system: false,
    is_deletable: true
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access',
    is_system: false,
    is_deletable: true
  }
];

export default {
  ADMIN_ROLE,
  MODULES,
  ACTIONS,
  DEFAULT_ROLES
};