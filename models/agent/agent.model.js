// backend/models/agent/agent.model.js
import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createAgentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS agents (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(50),
      slug VARCHAR(255) UNIQUE,
      sub_title VARCHAR(255),
      cuid VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      nationality VARCHAR(100),
      orn_number VARCHAR(100),
      orn VARCHAR(100),
      brn VARCHAR(100),
      mobile VARCHAR(50),
      designation VARCHAR(255),
      languages TEXT,
      aos TEXT,
      company VARCHAR(255),
      email VARCHAR(255),
      descriptions TEXT,
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(255),
      seo_description TEXT,
      status INT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_slug (slug),
      INDEX idx_status (status),
      INDEX idx_email (email),
      INDEX idx_company (company)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await pool.query(query);
    console.log('Agent table checked/created successfully.');
  } catch (error) {
    console.error('Error creating agent table:', error);
    throw error;
  }
};

/* =========================================================
   PUBLIC AGENT OPERATIONS
========================================================= */

/**
 * Fetches agents based on filters and pagination
 * @param {object} filters - { status, search, orderBy, order, company, nationality }
 * @param {object} pagination - { page, limit }
 * @returns {object} - { agents, total, page, limit, totalPages }
 */
export const getAllAgents = async (filters = {}, pagination = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  const params = [];

  // Status filter - default to active only
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
      first_name LIKE ? OR
      last_name LIKE ? OR
      email LIKE ? OR
      company LIKE ? OR
      designation LIKE ? OR
      orn_number LIKE ?
    )`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Company filter
  if (filters.company) {
    whereConditions.push('company = ?');
    params.push(filters.company);
  }

  // Nationality filter
  if (filters.nationality) {
    whereConditions.push('nationality = ?');
    params.push(filters.nationality);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Order By
  const orderBy = filters.orderBy || 'name';
  const order = (filters.order || 'ASC').toUpperCase();
  const validOrderBys = ['id', 'name', 'created_at', 'company', 'designation'];
  const finalOrderBy = validOrderBys.includes(orderBy) ? orderBy : 'name';
  const validOrders = ['ASC', 'DESC'];
  const finalOrder = validOrders.includes(order) ? order : 'ASC';

  const selectFields = [
    'id', 'title', 'slug', 'sub_title', 'cuid', 'name', 'first_name', 'last_name',
    'nationality', 'orn_number', 'orn', 'brn', 'mobile', 'designation', 'languages',
    'aos', 'company', 'email', 'descriptions', 'seo_title', 'seo_keywork',
    'seo_description', 'status', 'created_at', 'updated_at'
  ];

  const query = `
    SELECT ${selectFields.join(', ')}
    FROM agents
    ${whereClause}
    ORDER BY ${finalOrderBy} ${finalOrder}
    LIMIT ? OFFSET ?;
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  // Total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM agents ${whereClause};`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  return {
    agents: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Fetches a single agent by ID or slug
 * @param {string|number} slugOrId
 * @returns {object|null} - Agent object or null
 */
export const getAgentByIdOrSlug = async (slugOrId) => {
  let query;
  let param;

  if (!isNaN(slugOrId) && !isNaN(parseFloat(slugOrId))) {
    query = `SELECT * FROM agents WHERE id = ? AND status = 1;`;
    param = slugOrId;
  } else {
    query = `SELECT * FROM agents WHERE slug = ? AND status = 1;`;
    param = slugOrId;
  }

  const [rows] = await pool.query(query, [param]);
  return rows[0] || null;
};

/**
 * Get agent by ID (admin access - all statuses)
 * @param {number} id
 * @returns {object|null}
 */
export const getAgentById = async (id) => {
  const query = `SELECT * FROM agents WHERE id = ?;`;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

/**
 * Check if a slug already exists
 * @param {string} slug
 * @param {number} excludeId - ID to exclude from check (for updates)
 * @returns {boolean}
 */
export const checkSlugExists = async (slug, excludeId = null) => {
  let query = `SELECT COUNT(*) as count FROM agents WHERE slug = ?`;
  const params = [slug];
  
  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Check if email already exists
 * @param {string} email
 * @param {number} excludeId
 * @returns {boolean}
 */
export const checkEmailExists = async (email, excludeId = null) => {
  if (!email) return false;
  
  let query = `SELECT COUNT(*) as count FROM agents WHERE email = ?`;
  const params = [email];
  
  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Check if ORN number already exists
 * @param {string} ornNumber
 * @param {number} excludeId
 * @returns {boolean}
 */
export const checkOrnExists = async (ornNumber, excludeId = null) => {
  if (!ornNumber) return false;
  
  let query = `SELECT COUNT(*) as count FROM agents WHERE orn_number = ?`;
  const params = [ornNumber];
  
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
 * Create a new agent
 * @param {object} agentData
 * @returns {object} - Created agent with ID
 */
export const createAgent = async (agentData) => {
  const {
    title,
    slug,
    sub_title,
    cuid,
    name,
    first_name,
    last_name,
    nationality,
    orn_number,
    orn,
    brn,
    mobile,
    designation,
    languages,
    aos,
    company,
    email,
    descriptions,
    seo_title,
    seo_keywork,
    seo_description,
    status = 1
  } = agentData;

  // Validate required fields
  if (!name || !name.trim()) {
    throw new Error('Agent name is required');
  }

  // Check if slug already exists
  if (slug && await checkSlugExists(slug)) {
    throw new Error('This slug already exists');
  }

  // Check if email already exists
  if (email && await checkEmailExists(email)) {
    throw new Error('This email is already registered');
  }

  // Check if ORN number already exists
  if (orn_number && await checkOrnExists(orn_number)) {
    throw new Error('This ORN number is already registered');
  }

  const query = `
    INSERT INTO agents (
      title, slug, sub_title, cuid, name, first_name, last_name, nationality,
      orn_number, orn, brn, mobile, designation, languages, aos, company,
      email, descriptions, seo_title, seo_keywork, seo_description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const params = [
    title || null,
    slug || null,
    sub_title || null,
    cuid || null,
    name.trim(),
    first_name || null,
    last_name || null,
    nationality || null,
    orn_number || null,
    orn || null,
    brn || null,
    mobile || null,
    designation || null,
    languages || null,
    aos || null,
    company || null,
    email || null,
    descriptions || null,
    seo_title || null,
    seo_keywork || null,
    seo_description || null,
    status
  ];

  try {
    const [result] = await pool.query(query, params);
    return {
      id: result.insertId,
      ...agentData
    };
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
};

/**
 * Update an existing agent
 * @param {number} id
 * @param {object} updateData
 * @returns {object} - Updated agent
 */
export const updateAgent = async (id, updateData) => {
  // Check if agent exists
  const existingAgent = await getAgentById(id);
  if (!existingAgent) {
    throw new Error('Agent not found');
  }

  // Check if slug is being updated and if it already exists
  if (updateData.slug && updateData.slug !== existingAgent.slug) {
    if (await checkSlugExists(updateData.slug, id)) {
      throw new Error('This slug already exists');
    }
  }

  // Check if email is being updated and if it already exists
  if (updateData.email && updateData.email !== existingAgent.email) {
    if (await checkEmailExists(updateData.email, id)) {
      throw new Error('This email is already registered');
    }
  }

  // Check if ORN number is being updated and if it already exists
  if (updateData.orn_number && updateData.orn_number !== existingAgent.orn_number) {
    if (await checkOrnExists(updateData.orn_number, id)) {
      throw new Error('This ORN number is already registered');
    }
  }

  const allowedFields = [
    'title', 'slug', 'sub_title', 'cuid', 'name', 'first_name', 'last_name',
    'nationality', 'orn_number', 'orn', 'brn', 'mobile', 'designation',
    'languages', 'aos', 'company', 'email', 'descriptions', 'seo_title',
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
    UPDATE agents
    SET ${updates.join(', ')}
    WHERE id = ?;
  `;

  try {
    await pool.query(query, params);
    return await getAgentById(id);
  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
};

/**
 * Delete an agent (soft delete - set status to 0)
 * @param {number} id
 * @returns {boolean}
 */
export const deleteAgent = async (id) => {
  const agent = await getAgentById(id);
  if (!agent) {
    throw new Error('Agent not found');
  }

  const query = `UPDATE agents SET status = 0 WHERE id = ?;`;
  
  try {
    await pool.query(query, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting agent:', error);
    throw error;
  }
};

/**
 * Permanently delete an agent (hard delete)
 * @param {number} id
 * @returns {boolean}
 */
export const permanentDeleteAgent = async (id) => {
  const agent = await getAgentById(id);
  if (!agent) {
    throw new Error('Agent not found');
  }

  const query = `DELETE FROM agents WHERE id = ?;`;
  
  try {
    await pool.query(query, [id]);
    return true;
  } catch (error) {
    console.error('Error permanently deleting agent:', error);
    throw error;
  }
};

/**
 * Get all agents for admin (includes inactive)
 * @param {object} filters
 * @param {object} pagination
 * @returns {object}
 */
export const getAllAgentsAdmin = async (filters = {}, pagination = {}) => {
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
      first_name LIKE ? OR
      last_name LIKE ? OR
      email LIKE ? OR
      company LIKE ? OR
      mobile LIKE ? OR
      orn_number LIKE ?
    )`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Company filter
  if (filters.company) {
    whereConditions.push('company = ?');
    params.push(filters.company);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Order By
  const orderBy = filters.orderBy || 'created_at';
  const order = (filters.order || 'DESC').toUpperCase();
  const validOrderBys = ['id', 'name', 'created_at', 'updated_at', 'company', 'status'];
  const finalOrderBy = validOrderBys.includes(orderBy) ? orderBy : 'created_at';
  const validOrders = ['ASC', 'DESC'];
  const finalOrder = validOrders.includes(order) ? order : 'DESC';

  const query = `
    SELECT *
    FROM agents
    ${whereClause}
    ORDER BY ${finalOrderBy} ${finalOrder}
    LIMIT ? OFFSET ?;
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  // Total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM agents ${whereClause};`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  return {
    agents: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Bulk update agent status
 * @param {array} ids - Array of agent IDs
 * @param {number} status - New status (0 or 1)
 * @returns {boolean}
 */
export const bulkUpdateStatus = async (ids, status) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Invalid IDs array');
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE agents SET status = ? WHERE id IN (${placeholders});`;
  
  try {
    await pool.query(query, [status, ...ids]);
    return true;
  } catch (error) {
    console.error('Error bulk updating status:', error);
    throw error;
  }
};

/**
 * Get agent statistics
 * @returns {object}
 */
export const getAgentStats = async () => {
  const query = `
    SELECT 
      COUNT(*) as total_agents,
      SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_agents,
      SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive_agents,
      COUNT(DISTINCT company) as total_companies,
      COUNT(DISTINCT nationality) as total_nationalities
    FROM agents;
  `;
  
  const [rows] = await pool.query(query);
  return rows[0];
};

/**
 * Get agents by company
 * @param {string} company
 * @returns {array}
 */
export const getAgentsByCompany = async (company) => {
  const query = `SELECT * FROM agents WHERE company = ? AND status = 1 ORDER BY name ASC;`;
  const [rows] = await pool.query(query, [company]);
  return rows;
};

/**
 * Get agents by nationality
 * @param {string} nationality
 * @returns {array}
 */
export const getAgentsByNationality = async (nationality) => {
  const query = `SELECT * FROM agents WHERE nationality = ? AND status = 1 ORDER BY name ASC;`;
  const [rows] = await pool.query(query, [nationality]);
  return rows;
};

/* =========================================================
   EXPORT ALL FUNCTIONS
========================================================= */

export default {
  createAgentTable,
  getAllAgents,
  getAgentByIdOrSlug,
  getAgentById,
  checkSlugExists,
  checkEmailExists,
  checkOrnExists,
  createAgent,
  updateAgent,
  deleteAgent,
  permanentDeleteAgent,
  getAllAgentsAdmin,
  bulkUpdateStatus,
  getAgentStats,
  getAgentsByCompany,
  getAgentsByNationality
};