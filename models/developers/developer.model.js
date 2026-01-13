// backend/models/developer/developer.model.js
import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createDeveloperTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS developers (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      year_established YEAR,
      country VARCHAR(100),
      website VARCHAR(255),
      responsible_agent VARCHAR(255),
      ceo_name VARCHAR(255),
      email VARCHAR(255),
      mobile VARCHAR(50),
      address TEXT,
      image VARCHAR(500),
      total_project INT(11) DEFAULT 0,
      total_project_withus INT(11) DEFAULT 0,
      total_url VARCHAR(255),
      informations TEXT,
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(255),
      seo_description TEXT,
      status INT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_status (status),
      INDEX idx_total_url (total_url),
      UNIQUE KEY unique_total_url (total_url)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await pool.query(query);
    console.log('Developer table checked/created successfully.');
  } catch (error) {
    console.error('Error creating developer table:', error);
    throw error;
  }
};

/* =========================================================
   PUBLIC DEVELOPER OPERATIONS
========================================================= */

/**
 * Fetches developers based on filters and pagination
 * @param {object} filters - { status, search, orderBy, order }
 * @param {object} pagination - { page, limit }
 * @returns {object} - { developers, total, page, limit, totalPages }
 */
export const getAllDevelopers = async (filters = {}, pagination = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  const params = [];

  // Status filter
  if (filters.status !== undefined && filters.status !== null) {
    whereConditions.push('status = ?');
    params.push(filters.status);
  } else {
    whereConditions.push('status = 1');
  }

  // Search filter
  if (filters.search) {
    whereConditions.push(`(
      name LIKE ? OR
      website LIKE ? OR
      informations LIKE ? OR
      country LIKE ?
    )`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Country filter
  if (filters.country) {
    whereConditions.push('country = ?');
    params.push(filters.country);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Order By
  const orderBy = filters.orderBy || 'name';
  const order = (filters.order || 'ASC').toUpperCase();
  const validOrderBys = ['id', 'name', 'created_at', 'total_project', 'year_established'];
  const finalOrderBy = validOrderBys.includes(orderBy) ? orderBy : 'name';
  const validOrders = ['ASC', 'DESC'];
  const finalOrder = validOrders.includes(order) ? order : 'ASC';

  const selectFields = [
    'id', 'name', 'year_established', 'country', 'website', 'email', 'mobile',
    'address', 'image', 'total_project', 'total_project_withus', 'total_url',
    'informations', 'seo_title', 'seo_keywork', 'seo_description', 'status',
    'created_at', 'updated_at'
  ];

  const query = `
    SELECT ${selectFields.join(', ')}
    FROM developers
    ${whereClause}
    ORDER BY ${finalOrderBy} ${finalOrder}
    LIMIT ? OFFSET ?;
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  // Total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM developers ${whereClause};`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  return {
    developers: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Fetches a single developer by ID or slug
 * @param {string|number} slugOrId
 * @returns {object|null} - Developer object or null
 */
export const getDeveloperByIdOrSlug = async (slugOrId) => {
  let query;
  let param;

  if (!isNaN(slugOrId) && !isNaN(parseFloat(slugOrId))) {
    query = `SELECT * FROM developers WHERE id = ? AND status = 1;`;
    param = slugOrId;
  } else {
    query = `SELECT * FROM developers WHERE total_url = ? AND status = 1;`;
    param = slugOrId;
  }

  const [rows] = await pool.query(query, [param]);
  return rows[0] || null;
};

/**
 * Get developer by ID (admin access - all statuses)
 * @param {number} id
 * @returns {object|null}
 */
export const getDeveloperById = async (id) => {
  const query = `SELECT * FROM developers WHERE id = ?;`;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

/**
 * Check if a slug/total_url already exists
 * @param {string} slug
 * @param {number} excludeId - ID to exclude from check (for updates)
 * @returns {boolean}
 */
export const checkSlugExists = async (slug, excludeId = null) => {
  let query = `SELECT COUNT(*) as count FROM developers WHERE total_url = ?`;
  const params = [slug];
  
  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/* =========================================================
   ADMIN CRUD OPERATIONS
========================================================= */

/**
 * Create a new developer
 * @param {object} developerData
 * @returns {object} - Created developer with ID
 */
export const createDeveloper = async (developerData) => {
  const {
    name,
    year_established,
    country,
    website,
    responsible_agent,
    ceo_name,
    email,
    mobile,
    address,
    image,
    total_project = 0,
    total_project_withus = 0,
    total_url,
    informations,
    seo_title,
    seo_keywork,
    seo_description,
    status = 1
  } = developerData;

  // Validate required fields
  if (!name) {
    throw new Error('Developer name is required');
  }

  // Check if slug already exists
  if (total_url && await checkSlugExists(total_url)) {
    throw new Error('This slug/URL already exists');
  }

  const query = `
    INSERT INTO developers (
      name, year_established, country, website, responsible_agent, ceo_name,
      email, mobile, address, image, total_project, total_project_withus,
      total_url, informations, seo_title, seo_keywork, seo_description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const params = [
    name,
    year_established || null,
    country || null,
    website || null,
    responsible_agent || null,
    ceo_name || null,
    email || null,
    mobile || null,
    address || null,
    image || null,
    total_project,
    total_project_withus,
    total_url || null,
    informations || null,
    seo_title || null,
    seo_keywork || null,
    seo_description || null,
    status
  ];

  try {
    const [result] = await pool.query(query, params);
    return {
      id: result.insertId,
      ...developerData
    };
  } catch (error) {
    console.error('Error creating developer:', error);
    throw error;
  }
};

/**
 * Update an existing developer
 * @param {number} id
 * @param {object} updateData
 * @returns {object} - Updated developer
 */
export const updateDeveloper = async (id, updateData) => {
  // Check if developer exists
  const existingDeveloper = await getDeveloperById(id);
  if (!existingDeveloper) {
    throw new Error('Developer not found');
  }

  // Check if slug is being updated and if it already exists
  if (updateData.total_url && updateData.total_url !== existingDeveloper.total_url) {
    if (await checkSlugExists(updateData.total_url, id)) {
      throw new Error('This slug/URL already exists');
    }
  }

  const allowedFields = [
    'name', 'year_established', 'country', 'website', 'responsible_agent',
    'ceo_name', 'email', 'mobile', 'address', 'image', 'total_project',
    'total_project_withus', 'total_url', 'informations', 'seo_title',
    'seo_keywork', 'seo_description', 'status'
  ];

  const updates = [];
  const params = [];

  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      params.push(updateData[key]);
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  params.push(id);

  const query = `
    UPDATE developers
    SET ${updates.join(', ')}
    WHERE id = ?;
  `;

  try {
    await pool.query(query, params);
    return await getDeveloperById(id);
  } catch (error) {
    console.error('Error updating developer:', error);
    throw error;
  }
};

/**
 * Delete a developer (soft delete - set status to 0)
 * @param {number} id
 * @returns {boolean}
 */
export const deleteDeveloper = async (id) => {
  const developer = await getDeveloperById(id);
  if (!developer) {
    throw new Error('Developer not found');
  }

  const query = `UPDATE developers SET status = 0 WHERE id = ?;`;
  
  try {
    await pool.query(query, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting developer:', error);
    throw error;
  }
};

/**
 * Permanently delete a developer (hard delete)
 * @param {number} id
 * @returns {boolean}
 */
export const permanentDeleteDeveloper = async (id) => {
  const developer = await getDeveloperById(id);
  if (!developer) {
    throw new Error('Developer not found');
  }

  const query = `DELETE FROM developers WHERE id = ?;`;
  
  try {
    await pool.query(query, [id]);
    return true;
  } catch (error) {
    console.error('Error permanently deleting developer:', error);
    throw error;
  }
};

/**
 * Get all developers for admin (includes inactive)
 * @param {object} filters
 * @param {object} pagination
 * @returns {object}
 */
export const getAllDevelopersAdmin = async (filters = {}, pagination = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  const params = [];

  // Admin can see all statuses
  if (filters.status !== undefined && filters.status !== null) {
    whereConditions.push('status = ?');
    params.push(filters.status);
  }

  // Search filter
  if (filters.search) {
    whereConditions.push(`(
      name LIKE ? OR
      website LIKE ? OR
      informations LIKE ? OR
      email LIKE ? OR
      country LIKE ?
    )`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Order By
  const orderBy = filters.orderBy || 'created_at';
  const order = (filters.order || 'DESC').toUpperCase();
  const validOrderBys = ['id', 'name', 'created_at', 'updated_at', 'total_project', 'status'];
  const finalOrderBy = validOrderBys.includes(orderBy) ? orderBy : 'created_at';
  const validOrders = ['ASC', 'DESC'];
  const finalOrder = validOrders.includes(order) ? order : 'DESC';

  const query = `
    SELECT *
    FROM developers
    ${whereClause}
    ORDER BY ${finalOrderBy} ${finalOrder}
    LIMIT ? OFFSET ?;
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  // Total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM developers ${whereClause};`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  return {
    developers: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Bulk update developer status
 * @param {array} ids - Array of developer IDs
 * @param {number} status - New status (0 or 1)
 * @returns {boolean}
 */
export const bulkUpdateStatus = async (ids, status) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Invalid IDs array');
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE developers SET status = ? WHERE id IN (${placeholders});`;
  
  try {
    await pool.query(query, [status, ...ids]);
    return true;
  } catch (error) {
    console.error('Error bulk updating status:', error);
    throw error;
  }
};

/**
 * Get developer statistics
 * @returns {object}
 */
export const getDeveloperStats = async () => {
  const query = `
    SELECT 
      COUNT(*) as total_developers,
      SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_developers,
      SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive_developers,
      SUM(total_project) as total_all_projects,
      SUM(total_project_withus) as total_projects_withus,
      AVG(total_project) as avg_projects_per_developer
    FROM developers;
  `;
  
  const [rows] = await pool.query(query);
  return rows[0];
};

/* =========================================================
   EXPORT ALL FUNCTIONS
========================================================= */

export default {
  createDeveloperTable,
  getAllDevelopers,
  getDeveloperByIdOrSlug,
  getDeveloperById,
  checkSlugExists,
  createDeveloper,
  updateDeveloper,
  deleteDeveloper,
  permanentDeleteDeveloper,
  getAllDevelopersAdmin,
  bulkUpdateStatus,
  getDeveloperStats
};