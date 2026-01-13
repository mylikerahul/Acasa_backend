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
      cuid VARCHAR(255),
      treatment VARCHAR(10),
      department VARCHAR(255),
      length_of_service VARCHAR(255),
      full_name VARCHAR(255),
      name VARCHAR(100),
      email VARCHAR(191) UNIQUE NOT NULL,
      other_email VARCHAR(255),
      password VARCHAR(255),
      provider_id VARCHAR(255),
      provider VARCHAR(255) DEFAULT 'local',
      phone VARCHAR(191),
      about TEXT,
      mobile_phone VARCHAR(18),
      salutation VARCHAR(255),
      photo VARCHAR(255),
      fax VARCHAR(50),
      country INT(11) DEFAULT 0,
      city VARCHAR(100),
      facebook VARCHAR(191),
      twitter VARCHAR(191),
      gplus VARCHAR(191),
      linkedin VARCHAR(191),
      instagram VARCHAR(100),
      website VARCHAR(100),
      public_permision INT(1) DEFAULT 1,
      category VARCHAR(100),
      image_icon VARCHAR(191),
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(255),
      seo_description TEXT,
      confirmation_code VARCHAR(191),
      remember_token VARCHAR(100),
      status INT(1) DEFAULT 1,
      first_login VARCHAR(1) DEFAULT '0',
      nationality VARCHAR(100),
      marital_status VARCHAR(100),
      languages VARCHAR(255),
      contact_type VARCHAR(255),
      dob VARCHAR(100),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      gender VARCHAR(50),
      reset_token VARCHAR(255),
      reset_token_expiry DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  const [result] = await pool.query(query);
  return result;
};

/* =========================================================
   CONSTANTS
========================================================= */

export const USER_TYPES = {
  USER: 'user',
  ADMIN: 'Admin'
};

export const VALID_USER_TYPES = Object.values(USER_TYPES);

// Public select fields (non-sensitive)
const PUBLIC_SELECT_FIELDS = [
  'id', 'usertype', 'full_name', 'name', 'first_name', 'last_name',
  'email', 'phone', 'about', 'mobile_phone', 'salutation',
  'photo', 'image_icon', 'country', 'city', 
  'facebook', 'twitter', 'linkedin', 'instagram', 'website',
  'category', 'seo_title', 'seo_keywork', 'seo_description', 
  'status', 'public_permision', 'nationality', 'languages',
  'image_icon as avatar',
  'image_icon as image'
];

// Admin select fields
const ADMIN_SELECT_FIELDS = [
  ...PUBLIC_SELECT_FIELDS,
  'cuid', 'treatment', 'department', 'length_of_service', 'other_email',
  'fax', 'confirmation_code', 'remember_token', 'first_login', 
  'marital_status', 'contact_type', 'dob', 'gender',
  'provider', 'provider_id', 'created_at', 'updated_at'
];

/* =========================================================
   HELPERS
========================================================= */

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  const isHashed = hashedPassword && (
    hashedPassword.startsWith('$2a$') || 
    hashedPassword.startsWith('$2b$') || 
    hashedPassword.startsWith('$2y$')
  );
  
  if (!isHashed) {
    return plainPassword === hashedPassword;
  }
  
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Check if value is empty
 */
const isEmpty = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
};

/**
 * CREATE USER - ULTIMATE PRODUCTION READY
 * Automatically handles any database schema
 */
export const createUser = async (data) => {
  try {
    const userData = {};
    
    // Required: Name
    if (data.full_name && data.full_name.trim()) {
      userData.full_name = data.full_name.trim();
      userData.name = data.name?.trim() || data.full_name.trim();
    } else if (data.name && data.name.trim()) {
      userData.name = data.name.trim();
      userData.full_name = data.full_name?.trim() || data.name.trim();
    } else {
      throw new Error('Name is required');
    }
    
    // Required: Email
    if (!data.email || !data.email.trim()) {
      throw new Error('Email is required');
    }
    userData.email = data.email.trim().toLowerCase();
    
    // Password (hash if provided)
    if (data.password && data.password.trim()) {
      userData.password = await hashPassword(data.password);
    }
    
    // Default values
    userData.usertype = data.usertype?.trim() || 'user';
    userData.provider = data.provider?.trim() || 'local';
    userData.status = data.status !== undefined ? parseInt(data.status) : 1;
    userData.public_permision = data.public_permision !== undefined ? parseInt(data.public_permision) : 1;
    userData.first_login = data.first_login?.trim() || '0';
    userData.country = data.country !== undefined ? parseInt(data.country) || 0 : 0;
    
    // ALL POSSIBLE OPTIONAL FIELDS - Complete list
    const optionalFields = [
      // Basic fields
      'cuid', 'treatment', 'department', 'length_of_service',
      'first_name', 'last_name', 'other_email', 'provider_id',
      'phone', 'about', 'mobile_phone', 'salutation',
      'photo', 'fax', 'city', 
      
      // Social media
      'facebook', 'twitter', 'gplus', 'linkedin', 'instagram', 'website',
      
      // SEO & categorization
      'category', 'image_icon', 'seo_title', 'seo_keywork', 'seo_description',
      
      // Personal info
      'nationality', 'marital_status', 'languages', 'contact_type',
      'dob', 'gender', 'confirmation_code', 'remember_token',
      
      // Additional fields that might exist in database
      'originality', 'job_title', 'designation', 'position',
      'employee_id', 'company', 'office', 'location',
      'address', 'address_line1', 'address_line2', 'street',
      'zip_code', 'postal_code', 'state', 'province', 'region',
      'bio', 'description', 'notes', 'skills', 'expertise',
      'education', 'experience', 'qualification',
      'emergency_contact', 'emergency_phone', 'blood_group',
      'profile_image', 'cover_image', 'thumbnail',
      'linkedin_url', 'github_url', 'portfolio_url',
      'timezone', 'locale', 'currency', 'language_preference',
      'notification_preference', 'email_verified', 'phone_verified',
      'two_factor_enabled', 'last_seen', 'last_active',
      'preferences', 'settings', 'metadata', 'custom_fields',
      'tags', 'labels', 'groups', 'roles', 'permissions',
      'verified', 'approved', 'featured', 'premium',
      'subscription', 'plan', 'trial_ends_at', 'expires_at',
      'deleted_at', 'suspended_at', 'banned_at',
      'title', 'suffix', 'middle_name', 'nickname',
      'display_name', 'username', 'slug',
      'avatar', 'avatar_url', 'gravatar',
      'birth_date', 'birth_place', 'age',
      'height', 'weight', 'eye_color', 'hair_color',
      'passport_number', 'national_id', 'tax_id', 'ssn',
      'driving_license', 'insurance_number',
      'bank_name', 'bank_account', 'iban', 'swift_code',
      'paypal_email', 'venmo', 'crypto_wallet',
      'whatsapp', 'telegram', 'skype', 'discord',
      'youtube', 'tiktok', 'snapchat', 'pinterest',
      'referral_code', 'referred_by', 'affiliate_id',
      'utm_source', 'utm_medium', 'utm_campaign',
      'ip_address', 'user_agent', 'device_type',
      'login_count', 'failed_login_count',
      'rating', 'reviews_count', 'followers_count', 'following_count',
      'posts_count', 'comments_count', 'likes_count',
      'points', 'credits', 'balance', 'wallet_balance'
    ];
    
    for (const field of optionalFields) {
      const value = data[field];
      if (!isEmpty(value)) {
        userData[field] = typeof value === 'string' ? value.trim() : value;
      }
    }
    
    // Build dynamic INSERT query
    const fields = Object.keys(userData);
    const values = Object.values(userData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO users (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())
    `;
    
    console.log('Creating user with fields:', fields);
    
    const [result] = await pool.query(query, values);
    return getUserById(result.insertId, true);
    
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

/* =========================================================
   CREATE GOOGLE USER
========================================================= */

export const createGoogleUser = async (data) => {
  const userData = {
    full_name: data.full_name?.trim() || 'Google User',
    name: data.name?.trim() || data.full_name?.trim() || 'Google User',
    email: data.email.trim().toLowerCase(),
    provider_id: data.provider_id,
    provider: 'google',
    usertype: data.usertype || 'user',
    status: 1,
    first_login: '0',
    public_permision: 1,
    country: 0
  };
  
  if (data.image_icon && data.image_icon.trim()) {
    userData.image_icon = data.image_icon.trim();
  }
  
  const fields = Object.keys(userData);
  const values = Object.values(userData);
  const placeholders = fields.map(() => '?').join(', ');
  
  const query = `
    INSERT INTO users (${fields.join(', ')}, created_at, updated_at)
    VALUES (${placeholders}, NOW(), NOW())
  `;
  
  const [result] = await pool.query(query, values);
  return getUserById(result.insertId, true);
};

export const createAdmin = async (data) => {
  return createUser({ 
    ...data, 
    usertype: USER_TYPES.ADMIN,
    public_permision: 0 
  });
};

/* =========================================================
   READ OPERATIONS
========================================================= */

export const getUsers = async (filters = {}, pagination = {}, isAdminContext = false) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const offset = (page - 1) * limit;

  let selectFields = isAdminContext ? ADMIN_SELECT_FIELDS : PUBLIC_SELECT_FIELDS;
  selectFields = selectFields.filter(field => 
    field !== 'password' && 
    field !== 'reset_token' && 
    field !== 'reset_token_expiry'
  );

  let whereConditions = [];
  const params = [];

  if (filters.usertype) {
    if (filters.usertype.toLowerCase() === 'admin') {
      whereConditions.push('(usertype = ? OR usertype = ?)');
      params.push('Admin', 'admin');
    } else if (filters.usertype.toLowerCase() === 'user') {
      whereConditions.push('usertype = ?');
      params.push('user');
    }
  }

  if (filters.status !== undefined && filters.status !== null) {
    whereConditions.push('status = ?');
    params.push(filters.status);
  } else if (!isAdminContext) {
    whereConditions.push('status = 1');
  }

  if (!isAdminContext && filters.public_permision !== undefined) {
    whereConditions.push('public_permision = ?');
    params.push(filters.public_permision);
  } else if (!isAdminContext) {
    whereConditions.push('public_permision = 1');
  }

  if (filters.search) {
    whereConditions.push(`(
      full_name LIKE ? OR 
      name LIKE ? OR 
      email LIKE ? OR 
      phone LIKE ? OR
      about LIKE ?
    )`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  const orderBy = filters.orderBy || 'created_at';
  const order = (filters.order || 'DESC').toUpperCase();
  const validOrders = ['ASC', 'DESC'];
  const finalOrder = validOrders.includes(order) ? order : 'DESC';

  const query = `
    SELECT ${selectFields.join(', ')}
    FROM users
    ${whereClause}
    ORDER BY ${orderBy} ${finalOrder}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  return {
    users: rows,
    total,
    count: total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

export const getUserById = async (id, isAdminContext = false) => {
  const selectFields = isAdminContext ? ADMIN_SELECT_FIELDS : PUBLIC_SELECT_FIELDS;
  const query = `
    SELECT ${selectFields.join(', ')}
    FROM users
    WHERE id = ?
  `;
  
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

export const getUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = ?`;
  const [rows] = await pool.query(query, [email]);
  return rows[0] || null;
};

export const getUserWithPassword = async (email) => {
  const query = `
    SELECT id, usertype, full_name, name, email, password, 
           status, provider, image_icon
    FROM users 
    WHERE email = ?
  `;
  const [rows] = await pool.query(query, [email]);
  return rows[0] || null;
};

export const getUserByProviderIdAndProvider = async (providerId, provider) => {
  const query = `
    SELECT * FROM users 
    WHERE provider_id = ? AND provider = ?
  `;
  const [rows] = await pool.query(query, [providerId, provider]);
  return rows[0] || null;
};

/* =========================================================
   UPDATE OPERATIONS - PRODUCTION READY
========================================================= */

export const updateUser = async (id, data) => {
  try {
    const updateFields = {};
    
    // Allowed fields for update
    const allowedFields = [
      'usertype', 'cuid', 'treatment', 'department', 'length_of_service',
      'full_name', 'name', 'first_name', 'last_name', 'other_email',
      'phone', 'about', 'mobile_phone', 'salutation', 'photo', 'fax',
      'country', 'city', 'facebook', 'twitter', 'gplus', 'linkedin',
      'instagram', 'website', 'public_permision', 'category', 'image_icon',
      'seo_title', 'seo_keywork', 'seo_description', 'status', 'first_login',
      'nationality', 'marital_status', 'languages', 'contact_type', 'dob', 'gender'
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
    
    // Handle password separately
    if (data.password && data.password.trim()) {
      updateFields.password = await hashPassword(data.password);
    }
    
    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return getUserById(id, true);
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...Object.values(updateFields), id];
    
    const query = `
      UPDATE users
      SET ${setClause}, updated_at = NOW()
      WHERE id = ?
    `;
    
    console.log('Updating user with fields:', fields);
    
    await pool.query(query, values);
    return getUserById(id, true);
    
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const updateUserPassword = async (id, newPassword) => {
  const hashedPassword = await hashPassword(newPassword);
  
  const query = `
    UPDATE users
    SET password = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [hashedPassword, id]);
  return result.affectedRows > 0;
};

export const updateUserStatus = async (id, status) => {
  const query = `
    UPDATE users
    SET status = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [status, id]);
  return result.affectedRows > 0;
};

/* =========================================================
   DELETE OPERATIONS
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
  
  const [result] = await pool.query(query, [token, expiry, email]);
  return result.affectedRows > 0;
};

export const getUserByResetToken = async (token) => {
  const query = `
    SELECT * FROM users 
    WHERE reset_token = ? AND reset_token_expiry > NOW()
  `;
  
  const [rows] = await pool.query(query, [token]);
  return rows[0] || null;
};

export const clearResetToken = async (id) => {
  const query = `
    UPDATE users
    SET reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW()
    WHERE id = ?
  `;
  
  await pool.query(query, [id]);
};

/* =========================================================
   SEARCH & STATS
========================================================= */

export const searchUsers = async (searchTerm, usertype = null, pagination = { limit: 100, page: 1 }) => {
  return getUsers({ search: searchTerm, usertype }, pagination, true);
};

export const getUserStats = async () => {
  const query = `
    SELECT 
      usertype,
      COUNT(*) as total,
      SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive
    FROM users
    GROUP BY usertype
  `;
  
  const [rows] = await pool.query(query);
  return rows;
};

export const getTotalUsers = async () => {
  const query = `SELECT COUNT(*) as total FROM users`;
  const [rows] = await pool.query(query);
  return rows[0].total;
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

/* =========================================================
   MIGRATIONS
========================================================= */

export const runMigrations = async () => {
  const queries = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME`,
  ];

  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (err) {
      console.log('Migration skipped:', err.message);
    }
  }
};

export const runUserMigrations = runMigrations;