// /**
//  * ============================================================================
//  * ROLE MODEL - PRODUCTION READY
//  * ============================================================================
//  * @description Role management with full CRUD operations
//  */

// import pool from '../../../config/db.js';
// import { DEFAULT_ROLES } from '../../../config/permissions.config.js';

// // ============================================================================
// // TABLE CREATION
// // ============================================================================

// export const createRoleTable = async () => {
//   const query = `
//     CREATE TABLE IF NOT EXISTS roles (
//       id VARCHAR(50) PRIMARY KEY,
//       name VARCHAR(100) NOT NULL,
//       description TEXT,
//       is_system BOOLEAN DEFAULT FALSE,
//       is_deletable BOOLEAN DEFAULT TRUE,
//       is_active BOOLEAN DEFAULT TRUE,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );

//     -- Create index for faster lookups
//     CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
//   `;

//   await pool.query(query);
  
//   // Seed default roles
//   await seedDefaultRoles();
// };

// // ============================================================================
// // SEED DEFAULT ROLES
// // ============================================================================

// export const seedDefaultRoles = async () => {
//   const client = await pool.connect();
  
//   try {
//     await client.query('BEGIN');

//     for (const role of DEFAULT_ROLES) {
//       const checkQuery = 'SELECT id FROM roles WHERE id = $1';
//       const existing = await client.query(checkQuery, [role.id]);

//       if (existing.rows.length === 0) {
//         const insertQuery = `
//           INSERT INTO roles (id, name, description, is_system, is_deletable)
//           VALUES ($1, $2, $3, $4, $5)
//         `;
//         await client.query(insertQuery, [
//           role.id,
//           role.name,
//           role.description,
//           role.is_system,
//           role.is_deletable
//         ]);
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
// // CRUD OPERATIONS
// // ============================================================================

// /**
//  * Get all active roles
//  */
// export const getAllRoles = async (includeInactive = false) => {
//   const query = includeInactive
//     ? 'SELECT * FROM roles ORDER BY is_system DESC, name ASC'
//     : 'SELECT * FROM roles WHERE is_active = TRUE ORDER BY is_system DESC, name ASC';
  
//   const result = await pool.query(query);
//   return result.rows;
// };

// /**
//  * Get role by ID
//  */
// export const getRoleById = async (roleId) => {
//   const query = 'SELECT * FROM roles WHERE id = $1';
//   const result = await pool.query(query, [roleId]);
//   return result.rows[0];
// };

// /**
//  * Create new role
//  */
// export const createRole = async (roleData) => {
//   const { id, name, description, is_deletable = true } = roleData;

//   // Generate ID from name if not provided
//   const roleId = id || name.toLowerCase().replace(/\s+/g, '_');

//   const query = `
//     INSERT INTO roles (id, name, description, is_system, is_deletable)
//     VALUES ($1, $2, $3, FALSE, $4)
//     RETURNING *
//   `;

//   const result = await pool.query(query, [roleId, name, description, is_deletable]);
//   return result.rows[0];
// };

// /**
//  * Update role
//  */
// export const updateRole = async (roleId, roleData) => {
//   const { name, description, is_active } = roleData;

//   // Check if role is system role
//   const role = await getRoleById(roleId);
//   if (!role) {
//     throw new Error('Role not found');
//   }

//   const fields = [];
//   const values = [];
//   let paramCount = 1;

//   if (name !== undefined) {
//     fields.push(`name = $${paramCount++}`);
//     values.push(name);
//   }
//   if (description !== undefined) {
//     fields.push(`description = $${paramCount++}`);
//     values.push(description);
//   }
//   if (is_active !== undefined && !role.is_system) {
//     fields.push(`is_active = $${paramCount++}`);
//     values.push(is_active);
//   }

//   fields.push(`updated_at = CURRENT_TIMESTAMP`);

//   if (fields.length === 1) {
//     return role;
//   }

//   values.push(roleId);

//   const query = `
//     UPDATE roles 
//     SET ${fields.join(', ')}
//     WHERE id = $${paramCount}
//     RETURNING *
//   `;

//   const result = await pool.query(query, values);
//   return result.rows[0];
// };

// /**
//  * Delete role (soft delete for system roles)
//  */
// export const deleteRole = async (roleId) => {
//   const role = await getRoleById(roleId);
  
//   if (!role) {
//     throw new Error('Role not found');
//   }

//   if (!role.is_deletable) {
//     throw new Error('System role cannot be deleted');
//   }

//   // Check if any admin is using this role
//   const checkQuery = 'SELECT COUNT(*) FROM admin WHERE role = $1';
//   const checkResult = await pool.query(checkQuery, [roleId]);
  
//   if (parseInt(checkResult.rows[0].count) > 0) {
//     throw new Error('Role is assigned to users. Reassign users first.');
//   }

//   const deleteQuery = 'DELETE FROM roles WHERE id = $1 RETURNING *';
//   const result = await pool.query(deleteQuery, [roleId]);
//   return result.rows[0];
// };

// /**
//  * Check if role exists
//  */
// export const roleExists = async (roleId) => {
//   const query = 'SELECT EXISTS(SELECT 1 FROM roles WHERE id = $1 AND is_active = TRUE)';
//   const result = await pool.query(query, [roleId]);
//   return result.rows[0].exists;
// };

// export default {
//   createRoleTable,
//   seedDefaultRoles,
//   getAllRoles,
//   getRoleById,
//   createRole,
//   updateRole,
//   deleteRole,
//   roleExists
// };