// models/user/user.model.js

import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usertype VARCHAR(191) DEFAULT 'user',
      cuid VARCHAR(255) DEFAULT NULL,
      treatment VARCHAR(10) DEFAULT NULL,
      department VARCHAR(255) DEFAULT NULL,
      length_of_service VARCHAR(255) DEFAULT NULL,
      full_name VARCHAR(255) DEFAULT NULL,
      name VARCHAR(100) DEFAULT NULL,
      email VARCHAR(191) UNIQUE NOT NULL,
      other_email VARCHAR(255) DEFAULT NULL,
      password VARCHAR(255) DEFAULT NULL,
      provider_id VARCHAR(255) DEFAULT NULL,
      provider VARCHAR(255) DEFAULT 'local',
      phone VARCHAR(191) DEFAULT NULL,
      about TEXT,
      mobile_phone VARCHAR(18) DEFAULT NULL,
      salutation VARCHAR(255) DEFAULT NULL,
      photo VARCHAR(255) DEFAULT NULL,
      fax VARCHAR(50) DEFAULT NULL,
      country INT(11) DEFAULT 0,
      city VARCHAR(100) DEFAULT NULL,
      facebook VARCHAR(191) DEFAULT NULL,
      twitter VARCHAR(191) DEFAULT NULL,
      gplus VARCHAR(191) DEFAULT NULL,
      linkedin VARCHAR(191) DEFAULT NULL,
      instagram VARCHAR(100) DEFAULT NULL,
      website VARCHAR(100) DEFAULT NULL,
      public_permision INT(1) DEFAULT 1,
      category VARCHAR(100) DEFAULT NULL,
      image_icon VARCHAR(191) DEFAULT NULL,
      seo_title VARCHAR(255) DEFAULT NULL,
      seo_keywork VARCHAR(255) DEFAULT NULL,
      seo_description TEXT,
      confirmation_code VARCHAR(191) DEFAULT NULL,
      remember_token VARCHAR(100) DEFAULT NULL,
      status INT(1) DEFAULT 1,
      first_login VARCHAR(1) DEFAULT '0',
      nationality VARCHAR(100) DEFAULT NULL,
      marital_status VARCHAR(100) DEFAULT NULL,
      languages VARCHAR(255) DEFAULT NULL,
      contact_type VARCHAR(255) DEFAULT NULL,
      dob VARCHAR(100) DEFAULT NULL,
      first_name VARCHAR(255) DEFAULT NULL,
      last_name VARCHAR(255) DEFAULT NULL,
      gender VARCHAR(50) DEFAULT NULL,
      reset_token VARCHAR(255) DEFAULT NULL,
      reset_token_expiry DATETIME DEFAULT NULL,
      last_force_logout DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_provider (provider_id, provider),
      INDEX idx_usertype (usertype),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    const [result] = await pool.query(query);
    console.log('✅ Users table ready');
    return result;
  } catch (error) {
    console.error('❌ Table creation error:', error);
    throw error;
  }
};

/* =========================================================
   AUTO-FIX TABLE
========================================================= */

export const fixUsersTable = async () => {
  const fixes = [
    `ALTER TABLE users MODIFY COLUMN nationality VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN marital_status VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN languages VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN contact_type VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN dob VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN first_name VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN last_name VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN gender VARCHAR(50) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN city VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN full_name VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN name VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN cuid VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN treatment VARCHAR(10) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN department VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN length_of_service VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN other_email VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN mobile_phone VARCHAR(18) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN salutation VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN photo VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN fax VARCHAR(50) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN facebook VARCHAR(191) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN twitter VARCHAR(191) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN gplus VARCHAR(191) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN linkedin VARCHAR(191) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN instagram VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN website VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN category VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN image_icon VARCHAR(191) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN seo_title VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN seo_keywork VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN confirmation_code VARCHAR(191) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN remember_token VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN reset_token VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN reset_token_expiry DATETIME DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN last_force_logout DATETIME DEFAULT NULL`,
    `ALTER TABLE users MODIFY COLUMN provider_id VARCHAR(255) DEFAULT NULL`,
  ];

  console.log('🔧 Auto-fixing users table...');

  for (const query of fixes) {
    try {
      await pool.query(query);
    } catch (err) {
      // Ignore errors - field might not exist or already fixed
    }
  }

  console.log('✅ Table auto-fixed');
};

/* =========================================================
   CONSTANTS
========================================================= */

export const USER_TYPES = {
  USER: 'user',
  ADMIN: 'Admin'
};

const PUBLIC_SELECT_FIELDS = [
  'id', 'usertype', 'full_name', 'name', 'first_name', 'last_name',
  'email', 'phone', 'about', 'mobile_phone', 'salutation',
  'photo', 'image_icon', 'country', 'city', 
  'facebook', 'twitter', 'linkedin', 'instagram', 'website',
  'category', 'status', 'public_permision', 'nationality', 
  'languages', 'provider', 'created_at'
];

const ADMIN_SELECT_FIELDS = [
  ...PUBLIC_SELECT_FIELDS,
  'cuid', 'treatment', 'department', 'length_of_service', 'other_email',
  'fax', 'marital_status', 'contact_type', 'dob', 'gender',
  'provider_id', 'updated_at', 'first_login'
];

/* =========================================================
   HELPERS
========================================================= */

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!hashedPassword) return false;
  
  const isHashed = hashedPassword.startsWith('$2a$') || 
                   hashedPassword.startsWith('$2b$') || 
                   hashedPassword.startsWith('$2y$');
  
  if (!isHashed) return plainPassword === hashedPassword;
  return bcrypt.compare(plainPassword, hashedPassword);
};

const isEmpty = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
};

/* =========================================================
   CREATE USER
========================================================= */

export const createUser = async (data) => {
  try {
    // 🔥 STEP 1: Get ALL columns from the users table
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `);
    
    const userData = {};
    
    // Name handling
    if (data.full_name && data.full_name.trim()) {
      userData.full_name = data.full_name.trim();
      userData.name = data.name?.trim() || data.full_name.trim();
    } else if (data.name && data.name.trim()) {
      userData.name = data.name.trim();
      userData.full_name = data.full_name?.trim() || data.name.trim();
    }
    
    // Email - REQUIRED
    if (!data.email || !data.email.trim()) {
      throw new Error('Email is required');
    }
    userData.email = data.email.trim().toLowerCase();
    
    // Password
    if (data.password && data.password.trim() && data.provider !== 'google') {
      userData.password = await hashPassword(data.password);
    }
    
    // Defaults - ALWAYS include these
    userData.usertype = data.usertype?.trim() || 'user';
    userData.provider = data.provider?.trim() || 'local';
    userData.status = data.status !== undefined ? parseInt(data.status) : 1;
    userData.public_permision = data.public_permision !== undefined ? parseInt(data.public_permision) : 1;
    userData.first_login = data.first_login?.trim() || '0';
    userData.country = data.country !== undefined ? parseInt(data.country) || 0 : 0;
    
    if (data.provider_id) {
      userData.provider_id = data.provider_id.toString();
    }
    
    // 🔥 STEP 2: Auto-fill ALL columns that are NOT NULL and don't have defaults
    const skipColumns = ['id', 'created_at', 'updated_at']; // Auto-generated fields
    
    for (const col of columns) {
      const colName = col.COLUMN_NAME;
      
      // Skip auto-generated and already set fields
      if (skipColumns.includes(colName) || userData[colName] !== undefined) {
        continue;
      }
      
      // If column is NOT NULL and has no default, set empty string
      if (col.IS_NULLABLE === 'NO' && col.COLUMN_DEFAULT === null) {
        userData[colName] = data[colName] || '';
      } 
      // Optional fields - only add if provided
      else if (data[colName] !== undefined && data[colName] !== null && data[colName] !== '') {
        if (typeof data[colName] === 'string') {
          const trimmed = data[colName].trim();
          if (trimmed !== '') {
            userData[colName] = trimmed;
          }
        } else {
          userData[colName] = data[colName];
        }
      }
    }
    
    // Build query
    const fields = Object.keys(userData);
    const values = Object.values(userData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO users (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())
    `;
    
    console.log('✅ Creating user:', userData.email);
    console.log('📋 Fields being inserted:', fields.length);
    
    const [result] = await pool.query(query, values);
    return getUserById(result.insertId, true);
    
  } catch (error) {
    console.error('❌ Create user error:', error);
    throw error;
  }
};

export const createGoogleUser = async (data) => {
  const userData = {
    full_name: data.full_name?.trim() || data.name?.trim() || 'Google User',
    name: data.name?.trim() || data.full_name?.trim() || 'Google User',
    email: data.email.trim().toLowerCase(),
    provider_id: data.provider_id.toString(),
    provider: 'google',
    usertype: data.usertype || 'user',
    status: 1,
    first_login: '0',
    public_permision: 1,
    country: 0
  };
  
  if (data.image_icon) userData.image_icon = data.image_icon.trim();
  if (data.first_name) userData.first_name = data.first_name.trim();
  if (data.last_name) userData.last_name = data.last_name.trim();
  
  const fields = Object.keys(userData);
  const values = Object.values(userData);
  const placeholders = fields.map(() => '?').join(', ');
  
  const query = `
    INSERT INTO users (${fields.join(', ')}, created_at, updated_at)
    VALUES (${placeholders}, NOW(), NOW())
  `;
  
  console.log('✅ Creating Google user:', userData.email);
  
  try {
    const [result] = await pool.query(query, values);
    return getUserById(result.insertId, true);
  } catch (dbError) {
    if (dbError.code === 'ER_NO_DEFAULT_FOR_FIELD') {
      await fixUsersTable();
      const [result] = await pool.query(query, values);
      return getUserById(result.insertId, true);
    }
    throw dbError;
  }
};

export const createAdmin = async (data) => {
  return createUser({ 
    ...data, 
    usertype: USER_TYPES.ADMIN,
    public_permision: 0 
  });
};

/* =========================================================
   READ
========================================================= */

export const getUserById = async (id, isAdminContext = false) => {
  const selectFields = isAdminContext ? ADMIN_SELECT_FIELDS : PUBLIC_SELECT_FIELDS;
  const query = `SELECT ${selectFields.join(', ')} FROM users WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

export const getUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = ?`;
  const [rows] = await pool.query(query, [email.toLowerCase()]);
  return rows[0] || null;
};

export const getUserWithPassword = async (email) => {
  const query = `
    SELECT id, usertype, full_name, name, email, password, 
           status, provider, provider_id, image_icon
    FROM users WHERE email = ?
  `;
  const [rows] = await pool.query(query, [email.toLowerCase()]);
  return rows[0] || null;
};

export const getUserByProviderIdAndProvider = async (providerId, provider) => {
  const query = `SELECT * FROM users WHERE provider_id = ? AND provider = ?`;
  const [rows] = await pool.query(query, [providerId.toString(), provider]);
  return rows[0] || null;
};

export const getUsers = async (filters = {}, pagination = {}, isAdminContext = false) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const offset = (page - 1) * limit;

  let selectFields = isAdminContext ? ADMIN_SELECT_FIELDS : PUBLIC_SELECT_FIELDS;
  let whereConditions = [];
  const params = [];

  if (filters.usertype) {
    if (filters.usertype.toLowerCase() === 'admin') {
      whereConditions.push('(usertype = ? OR usertype = ?)');
      params.push('Admin', 'admin');
    } else {
      whereConditions.push('usertype = ?');
      params.push(filters.usertype);
    }
  }

  if (filters.status !== undefined) {
    whereConditions.push('status = ?');
    params.push(filters.status);
  } else if (!isAdminContext) {
    whereConditions.push('status = 1');
  }

  if (!isAdminContext) {
    whereConditions.push('public_permision = 1');
  }

  if (filters.search) {
    whereConditions.push(`(full_name LIKE ? OR name LIKE ? OR email LIKE ?)`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const orderBy = filters.orderBy || 'created_at';
  const order = (filters.order || 'DESC').toUpperCase();

  const query = `
    SELECT ${selectFields.join(', ')}
    FROM users ${whereClause}
    ORDER BY ${orderBy} ${order}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);
  const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
  const [countResult] = await pool.query(countQuery, params);

  return {
    users: rows,
    total: countResult[0].total,
    page,
    limit,
    totalPages: Math.ceil(countResult[0].total / limit)
  };
};

/* =========================================================
   UPDATE
========================================================= */

export const updateUser = async (id, data) => {
  try {
    const updateFields = {};
    
    const allowedFields = [
      'usertype', 'full_name', 'name', 'first_name', 'last_name',
      'phone', 'about', 'mobile_phone', 'salutation', 'photo', 'fax',
      'country', 'city', 'facebook', 'twitter', 'linkedin', 'instagram',
      'website', 'public_permision', 'category', 'image_icon',
      'status', 'nationality', 'marital_status', 'languages', 
      'contact_type', 'dob', 'gender'
    ];
    
    for (const field of allowedFields) {
      const value = data[field];
      if (isEmpty(value)) continue;
      
      if (field === 'country') {
        updateFields[field] = parseInt(value) || 0;
      } else if (field === 'status' || field === 'public_permision') {
        updateFields[field] = value === 1 || value === '1' ? 1 : 0;
      } else {
        updateFields[field] = typeof value === 'string' ? value.trim() : value;
      }
    }
    
    if (data.password && data.password.trim()) {
      updateFields.password = await hashPassword(data.password);
    }
    
    const fields = Object.keys(updateFields);
    if (fields.length === 0) return getUserById(id, true);
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = [...Object.values(updateFields), id];
    
    const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`;
    await pool.query(query, values);
    return getUserById(id, true);
    
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  }
};

export const updateUserPassword = async (id, newPassword) => {
  const hashedPassword = await hashPassword(newPassword);
  const query = `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`;
  const [result] = await pool.query(query, [hashedPassword, id]);
  return result.affectedRows > 0;
};

export const updateUserStatus = async (id, status) => {
  const query = `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`;
  const [result] = await pool.query(query, [status, id]);
  return result.affectedRows > 0;
};

/* =========================================================
   DELETE
========================================================= */

export const deleteUser = async (id) => {
  const query = `DELETE FROM users WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result.affectedRows > 0;
};

/* =========================================================
   PASSWORD RESET
========================================================= */

export const setResetToken = async (email, token) => {
  const expiry = new Date(Date.now() + 3600000);
  const query = `
    UPDATE users
    SET reset_token = ?, reset_token_expiry = ?, updated_at = NOW()
    WHERE email = ?
  `;
  const [result] = await pool.query(query, [token, expiry, email.toLowerCase()]);
  return result.affectedRows > 0;
};

export const getUserByResetToken = async (token) => {
  const query = `SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()`;
  const [rows] = await pool.query(query, [token]);
  return rows[0] || null;
};

export const clearResetToken = async (id) => {
  const query = `UPDATE users SET reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = ?`;
  await pool.query(query, [id]);
};

/* =========================================================
   STATS
========================================================= */

export const getUserStats = async () => {
  const query = `
    SELECT usertype, COUNT(*) as total,
           SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
           SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive
    FROM users GROUP BY usertype
  `;
  const [rows] = await pool.query(query);
  return rows;
};

export const getDashboardStats = async () => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE usertype = 'user') as totalUsers,
      (SELECT COUNT(*) FROM users WHERE usertype IN ('Admin', 'admin')) as totalAdmins,
      (SELECT COUNT(*) FROM users WHERE status = 1) as activeUsers,
      (SELECT COUNT(*) FROM users WHERE status = 0) as inactiveUsers,
      (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) as todayRegistrations,
      (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as weeklyRegistrations
  `;
  const [rows] = await pool.query(query);
  return rows[0];
};

export const searchUsers = async (searchTerm, usertype = null, pagination = { limit: 100, page: 1 }) => {
  return getUsers({ search: searchTerm, usertype }, pagination, true);
};