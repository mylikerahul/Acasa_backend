// /**
//  * ============================================================================
//  * PERMISSION MODEL - ADMIN AS HIGHEST AUTHORITY
//  * ============================================================================
//  */

// import pool from '../../../config/db.js';
// import { MODULES, ACTIONS, ADMIN_ROLE } from '../../../config/permissions.config.js';

// // ============================================================================
// // TABLE CREATION
// // ============================================================================

// export const createPermissionTable = async () => {
//   const query = `
//     CREATE TABLE IF NOT EXISTS permissions (
//       id SERIAL PRIMARY KEY,
//       role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
//       module VARCHAR(50) NOT NULL,
//       action VARCHAR(20) NOT NULL,
//       is_allowed BOOLEAN DEFAULT FALSE,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       UNIQUE(role_id, module, action)
//     );

//     CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role_id);
//     CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
//     CREATE INDEX IF NOT EXISTS idx_permissions_lookup ON permissions(role_id, module, action);
//   `;

//   await pool.query(query);
//   await initializeDefaultPermissions();
// };

// // ============================================================================
// // INITIALIZE DEFAULT PERMISSIONS
// // ============================================================================

// export const initializeDefaultPermissions = async () => {
//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     const rolesResult = await client.query('SELECT id FROM roles WHERE is_active = TRUE');
//     const roles = rolesResult.rows;

//     for (const role of roles) {
//       for (const module of MODULES) {
//         for (const action of ACTIONS) {
//           const checkQuery = `
//             SELECT id FROM permissions 
//             WHERE role_id = $1 AND module = $2 AND action = $3
//           `;
//           const existing = await client.query(checkQuery, [role.id, module, action]);

//           if (existing.rows.length === 0) {
//             // Admin gets all permissions by default
//             const isAllowed = role.id === ADMIN_ROLE;

//             const insertQuery = `
//               INSERT INTO permissions (role_id, module, action, is_allowed)
//               VALUES ($1, $2, $3, $4)
//             `;
//             await client.query(insertQuery, [role.id, module, action, isAllowed]);
//           }
//         }
//       }
//     }

//     await client.query('COMMIT');
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// // ============================================================================
// // PERMISSION CRUD OPERATIONS
// // ============================================================================

// export const getAllPermissions = async () => {
//   const query = `
//     SELECT 
//       p.role_id,
//       p.module,
//       p.action,
//       p.is_allowed,
//       r.name as role_name
//     FROM permissions p
//     JOIN roles r ON p.role_id = r.id
//     WHERE r.is_active = TRUE
//     ORDER BY r.name, p.module, p.action
//   `;

//   const result = await pool.query(query);

//   const structured = {};

//   result.rows.forEach(row => {
//     if (!structured[row.role_id]) {
//       structured[row.role_id] = {};
//     }
//     if (!structured[row.role_id][row.module]) {
//       structured[row.role_id][row.module] = {};
//     }
//     structured[row.role_id][row.module][row.action] = row.is_allowed;
//   });

//   return structured;
// };

// export const getPermissionsByRole = async (roleId) => {
//   const query = `
//     SELECT module, action, is_allowed
//     FROM permissions
//     WHERE role_id = $1
//     ORDER BY module, action
//   `;

//   const result = await pool.query(query, [roleId]);

//   const structured = {};

//   result.rows.forEach(row => {
//     if (!structured[row.module]) {
//       structured[row.module] = {};
//     }
//     structured[row.module][row.action] = row.is_allowed;
//   });

//   return structured;
// };

// /**
//  * Check if role has specific permission
//  * Admin always has all permissions
//  */
// export const hasPermission = async (roleId, module, action) => {
//   // Admin always has permission
//   if (roleId === ADMIN_ROLE) {
//     return true;
//   }

//   const query = `
//     SELECT is_allowed FROM permissions
//     WHERE role_id = $1 AND module = $2 AND action = $3
//   `;

//   const result = await pool.query(query, [roleId, module, action]);

//   if (result.rows.length === 0) {
//     return false;
//   }

//   return result.rows[0].is_allowed;
// };

// /**
//  * Update single permission
//  * Admin permissions cannot be modified
//  */
// export const updatePermission = async (roleId, module, action, isAllowed) => {
//   // Don't allow modifying admin permissions
//   if (roleId === ADMIN_ROLE) {
//     throw new Error('Admin permissions cannot be modified');
//   }

//   if (!MODULES.includes(module)) {
//     throw new Error(`Invalid module: ${module}`);
//   }
//   if (!ACTIONS.includes(action)) {
//     throw new Error(`Invalid action: ${action}`);
//   }

//   const query = `
//     INSERT INTO permissions (role_id, module, action, is_allowed)
//     VALUES ($1, $2, $3, $4)
//     ON CONFLICT (role_id, module, action)
//     DO UPDATE SET is_allowed = $4, updated_at = CURRENT_TIMESTAMP
//     RETURNING *
//   `;

//   const result = await pool.query(query, [roleId, module, action, isAllowed]);
//   return result.rows[0];
// };

// /**
//  * Bulk update permissions for a role
//  */
// export const bulkUpdatePermissions = async (roleId, permissions) => {
//   // Don't allow modifying admin permissions
//   if (roleId === ADMIN_ROLE) {
//     throw new Error('Admin permissions cannot be modified');
//   }

//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     const updatedPermissions = [];

//     for (const [module, actions] of Object.entries(permissions)) {
//       if (!MODULES.includes(module)) {
//         throw new Error(`Invalid module: ${module}`);
//       }

//       for (const [action, isAllowed] of Object.entries(actions)) {
//         if (!ACTIONS.includes(action)) {
//           throw new Error(`Invalid action: ${action}`);
//         }

//         const query = `
//           INSERT INTO permissions (role_id, module, action, is_allowed)
//           VALUES ($1, $2, $3, $4)
//           ON CONFLICT (role_id, module, action)
//           DO UPDATE SET is_allowed = $4, updated_at = CURRENT_TIMESTAMP
//           RETURNING *
//         `;

//         const result = await client.query(query, [roleId, module, action, isAllowed]);
//         updatedPermissions.push(result.rows[0]);
//       }
//     }

//     await client.query('COMMIT');
//     return updatedPermissions;
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// /**
//  * Bulk update all permissions (for all roles)
//  */
// export const updateAllPermissions = async (allPermissions) => {
//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     for (const [roleId, modules] of Object.entries(allPermissions)) {
//       // Skip admin - admin always has all permissions
//       if (roleId === ADMIN_ROLE) {
//         continue;
//       }

//       const roleCheck = await client.query('SELECT id FROM roles WHERE id = $1', [roleId]);
//       if (roleCheck.rows.length === 0) {
//         throw new Error(`Role not found: ${roleId}`);
//       }

//       for (const [module, actions] of Object.entries(modules)) {
//         if (!MODULES.includes(module)) {
//           throw new Error(`Invalid module: ${module}`);
//         }

//         for (const [action, isAllowed] of Object.entries(actions)) {
//           if (!ACTIONS.includes(action)) {
//             throw new Error(`Invalid action: ${action}`);
//           }

//           const query = `
//             INSERT INTO permissions (role_id, module, action, is_allowed)
//             VALUES ($1, $2, $3, $4)
//             ON CONFLICT (role_id, module, action)
//             DO UPDATE SET is_allowed = $4, updated_at = CURRENT_TIMESTAMP
//           `;

//           await client.query(query, [roleId, module, action, isAllowed]);
//         }
//       }
//     }

//     await client.query('COMMIT');
//     return await getAllPermissions();
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// /**
//  * Reset permissions for a role to default (all false)
//  */
// export const resetRolePermissions = async (roleId) => {
//   if (roleId === ADMIN_ROLE) {
//     throw new Error('Admin permissions cannot be reset');
//   }

//   const query = `
//     UPDATE permissions 
//     SET is_allowed = FALSE, updated_at = CURRENT_TIMESTAMP
//     WHERE role_id = $1
//     RETURNING *
//   `;

//   const result = await pool.query(query, [roleId]);
//   return result.rows;
// };

// /**
//  * Reset all permissions (except admin)
//  */
// export const resetAllPermissions = async () => {
//   const query = `
//     UPDATE permissions 
//     SET is_allowed = FALSE, updated_at = CURRENT_TIMESTAMP
//     WHERE role_id != $1
//     RETURNING *
//   `;

//   const result = await pool.query(query, [ADMIN_ROLE]);
//   return result.rows;
// };

// export const getModules = () => {
//   return MODULES.map(module => ({
//     id: module,
//     name: module.charAt(0).toUpperCase() + module.slice(1)
//   }));
// };

// export const getActions = () => {
//   return ACTIONS;
// };

// export const initializeRolePermissions = async (roleId) => {
//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     for (const module of MODULES) {
//       for (const action of ACTIONS) {
//         const query = `
//           INSERT INTO permissions (role_id, module, action, is_allowed)
//           VALUES ($1, $2, $3, FALSE)
//           ON CONFLICT (role_id, module, action) DO NOTHING
//         `;
//         await client.query(query, [roleId, module, action]);
//       }
//     }

//     await client.query('COMMIT');
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// export default {
//   createPermissionTable,
//   initializeDefaultPermissions,
//   getAllPermissions,
//   getPermissionsByRole,
//   hasPermission,
//   updatePermission,
//   bulkUpdatePermissions,
//   updateAllPermissions,
//   resetRolePermissions,
//   resetAllPermissions,
//   getModules,
//   getActions,
//   initializeRolePermissions
// };