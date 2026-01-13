// backend/models/contactUs/contactUs.model.js
import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createContactUsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS contact_us (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      cuid VARCHAR(100) UNIQUE,
      property_id INT(10) UNSIGNED,
      agent_id INT(10) UNSIGNED,
      individualid INT(10) UNSIGNED,
      compnayid INT(10) UNSIGNED,
      developerid INT(10) UNSIGNED,
      connected_agent VARCHAR(255),
      connected_agency VARCHAR(255),
      connected_employee VARCHAR(255),
      sharing_with TEXT,
      item_type VARCHAR(100),
      sub_item_type VARCHAR(100),
      type VARCHAR(100),
      represent_type VARCHAR(100),
      source VARCHAR(100),
      name VARCHAR(255),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      surname VARCHAR(100),
      salutaion VARCHAR(50),
      drip_marketing TINYINT(1) DEFAULT 0,
      designation VARCHAR(255),
      company VARCHAR(255),
      nationality VARCHAR(100),
      whats_app VARCHAR(50),
      facebook VARCHAR(255),
      insta VARCHAR(255),
      linkedin VARCHAR(255),
      brn_number VARCHAR(100),
      mortgage TINYINT(1) DEFAULT 0,
      landline VARCHAR(50),
      profile TEXT,
      priority INT(1) DEFAULT 0,
      contact_type VARCHAR(100),
      agent_activity TEXT,
      admin_activity TEXT,
      email VARCHAR(255) UNIQUE,
      email_status VARCHAR(50),
      phone VARCHAR(50) UNIQUE,
      cell_status VARCHAR(50),
      verified TINYINT(1) DEFAULT 0,
      property_type VARCHAR(100),
      website VARCHAR(255),
      message TEXT,
      resume VARCHAR(255),
      job_role VARCHAR(255),
      third_party_client_name VARCHAR(255),
      third_party_client_commission DECIMAL(10,2),
      third_party_client_email VARCHAR(255),
      third_party_client_mobile VARCHAR(50),
      status TINYINT(1) DEFAULT 1,
      contact_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      lead_status VARCHAR(50) DEFAULT 'New',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_activity_logged TEXT,
      last_activity_date_time TIMESTAMP,
      
      INDEX idx_cuid (cuid),
      INDEX idx_email (email),
      INDEX idx_phone (phone),
      INDEX idx_status (status),
      INDEX idx_lead_status (lead_status),
      INDEX idx_source (source),
      INDEX idx_contact_type (contact_type),
      INDEX idx_property_id (property_id),
      INDEX idx_agent_id (agent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  try {
    await pool.query(query);
    console.log('Contact Us table checked/created successfully.');
  } catch (error) {
    console.error('Error creating contact_us table:', error);
    throw error;
  }
};

/* =========================================================
   HELPER/VALIDATION FUNCTIONS
========================================================= */

/**
 * Check if a CUID already exists
 * @param {string} cuid
 * @param {number} excludeId - ID to exclude from check (for updates)
 * @returns {boolean}
 */
export const checkCuidExists = async (cuid, excludeId = null) => {
  if (!cuid) return false;
  let query = `SELECT COUNT(*) as count FROM contact_us WHERE cuid = ?`;
  const params = [cuid];
  
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
  
  let query = `SELECT COUNT(*) as count FROM contact_us WHERE email = ?`;
  const params = [email];
  
  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Check if phone number already exists
 * @param {string} phone
 * @param {number} excludeId
 * @returns {boolean}
 */
export const checkPhoneExists = async (phone, excludeId = null) => {
  if (!phone) return false;
  
  let query = `SELECT COUNT(*) as count FROM contact_us WHERE phone = ?`;
  const params = [phone];
  
  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/* =========================================================
   PUBLIC CONTACT US OPERATIONS
========================================================= */

/**
 * Fetches contact inquiries based on filters and pagination (active only)
 * @param {object} filters - { search, source, type, property_type, orderBy, order }
 * @param {object} pagination - { page, limit }
 * @returns {object} - { inquiries, total, page, limit, totalPages }
 */
export const getAllContactUs = async (filters = {}, pagination = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  const params = [];

  // Default to active inquiries
  whereConditions.push('status = 1');

  // Search filter
  if (filters.search) {
    whereConditions.push(`(
      name LIKE ? OR
      first_name LIKE ? OR
      last_name LIKE ? OR
      email LIKE ? OR
      phone LIKE ? OR
      company LIKE ? OR
      message LIKE ?
    )`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Specific filters
  if (filters.source) {
    whereConditions.push('source = ?');
    params.push(filters.source);
  }
  if (filters.type) {
    whereConditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.property_type) {
    whereConditions.push('property_type = ?');
    params.push(filters.property_type);
  }
  if (filters.contact_type) {
    whereConditions.push('contact_type = ?');
    params.push(filters.contact_type);
  }
  if (filters.lead_status) {
    whereConditions.push('lead_status = ?');
    params.push(filters.lead_status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Order By
  const orderBy = filters.orderBy || 'created_at';
  const order = (filters.order || 'DESC').toUpperCase();
  const validOrderBys = ['id', 'name', 'created_at', 'source', 'lead_status', 'priority'];
  const finalOrderBy = validOrderBys.includes(orderBy) ? orderBy : 'created_at';
  const validOrders = ['ASC', 'DESC'];
  const finalOrder = validOrders.includes(order) ? order : 'DESC';

  const selectFields = [
    'id', 'cuid', 'property_id', 'agent_id', 'name', 'first_name', 'last_name',
    'email', 'phone', 'message', 'source', 'type', 'contact_type', 'lead_status',
    'status', 'created_at', 'updated_at'
  ]; // Limited fields for public view

  const query = `
    SELECT ${selectFields.join(', ')}
    FROM contact_us
    ${whereClause}
    ORDER BY ${finalOrderBy} ${finalOrder}
    LIMIT ? OFFSET ?;
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  // Total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM contact_us ${whereClause};`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  return {
    inquiries: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Fetches a single contact inquiry by ID
 * @param {number} id
 * @returns {object|null} - Contact inquiry object or null
 */
export const getContactUsById = async (id) => {
  const query = `SELECT * FROM contact_us WHERE id = ? AND status = 1;`; // Public: only active
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

/* =========================================================
   ADMIN CRUD OPERATIONS
========================================================= */

/**
 * Create a new contact inquiry
 * @param {object} contactData
 * @returns {object} - Created inquiry with ID
 */
export const createContactUs = async (contactData) => {
  const {
    cuid, property_id, agent_id, individualid, compnayid, developerid,
    connected_agent, connected_agency, connected_employee, sharing_with,
    item_type, sub_item_type, type, represent_type, source, name,
    first_name, last_name, surname, salutaion, drip_marketing = 0,
    designation, company, nationality, whats_app, facebook, insta,
    linkedin, brn_number, mortgage = 0, landline, profile, priority = 0,
    contact_type, agent_activity, admin_activity, email, email_status,
    phone, cell_status, verified = 0, property_type, website, message,
    resume, job_role, third_party_client_name, third_party_client_commission,
    third_party_client_email, third_party_client_mobile,
    status = 1, contact_date, lead_status = 'New',
    last_activity_logged, last_activity_date_time
  } = contactData;

  // Validate required fields (at least name or (first_name + last_name) or email or phone)
  if (!name && !(first_name && last_name) && !email && !phone) {
    throw new Error('At least a name, first name/last name, email, or phone is required.');
  }

  // Check CUID exists
  if (cuid && await checkCuidExists(cuid)) {
    throw new Error('This CUID already exists.');
  }
  // Check email exists
  if (email && await checkEmailExists(email)) {
    throw new Error('This email is already registered.');
  }
  // Check phone exists
  if (phone && await checkPhoneExists(phone)) {
    throw new Error('This phone number is already registered.');
  }

  const query = `
    INSERT INTO contact_us (
      cuid, property_id, agent_id, individualid, compnayid, developerid,
      connected_agent, connected_agency, connected_employee, sharing_with,
      item_type, sub_item_type, type, represent_type, source, name,
      first_name, last_name, surname, salutaion, drip_marketing,
      designation, company, nationality, whats_app, facebook, insta,
      linkedin, brn_number, mortgage, landline, profile, priority,
      contact_type, agent_activity, admin_activity, email, email_status,
      phone, cell_status, verified, property_type, website, message,
      resume, job_role, third_party_client_name, third_party_client_commission,
      third_party_client_email, third_party_client_mobile,
      status, contact_date, lead_status, last_activity_logged, last_activity_date_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const params = [
    cuid || null, property_id || null, agent_id || null, individualid || null, compnayid || null, developerid || null,
    connected_agent || null, connected_agency || null, connected_employee || null, sharing_with || null,
    item_type || null, sub_item_type || null, type || null, represent_type || null, source || null, name || null,
    first_name || null, last_name || null, surname || null, salutaion || null, drip_marketing,
    designation || null, company || null, nationality || null, whats_app || null, facebook || null, insta || null,
    linkedin || null, brn_number || null, mortgage, landline || null, profile || null, priority,
    contact_type || null, agent_activity || null, admin_activity || null, email || null, email_status || null,
    phone || null, cell_status || null, verified, property_type || null, website || null, message || null,
    resume || null, job_role || null, third_party_client_name || null, third_party_client_commission || null,
    third_party_client_email || null, third_party_client_mobile || null,
    status, contact_date || null, lead_status,
    last_activity_logged || null, last_activity_date_time || null
  ];

  try {
    const [result] = await pool.query(query, params);
    return {
      id: result.insertId,
      ...contactData
    };
  } catch (error) {
    console.error('Error creating contact inquiry:', error);
    throw error;
  }
};

/**
 * Update an existing contact inquiry
 * @param {number} id
 * @param {object} updateData
 * @returns {object} - Updated inquiry
 */
export const updateContactUs = async (id, updateData) => {
  const existingInquiry = await getContactUsByIdAdmin(id); // Use admin get to check existence regardless of status
  if (!existingInquiry) {
    throw new Error('Contact inquiry not found');
  }

  // Check unique constraints if values are being updated and are different from existing
  if (updateData.cuid && updateData.cuid !== existingInquiry.cuid) {
    if (await checkCuidExists(updateData.cuid, id)) {
      throw new Error('This CUID already exists.');
    }
  }
  if (updateData.email && updateData.email !== existingInquiry.email) {
    if (await checkEmailExists(updateData.email, id)) {
      throw new Error('This email is already registered.');
    }
  }
  if (updateData.phone && updateData.phone !== existingInquiry.phone) {
    if (await checkPhoneExists(updateData.phone, id)) {
      throw new Error('This phone number is already registered.');
    }
  }

  const allowedFields = [
    'cuid', 'property_id', 'agent_id', 'individualid', 'compnayid', 'developerid',
    'connected_agent', 'connected_agency', 'connected_employee', 'sharing_with',
    'item_type', 'sub_item_type', 'type', 'represent_type', 'source', 'name',
    'first_name', 'last_name', 'surname', 'salutaion', 'drip_marketing',
    'designation', 'company', 'nationality', 'whats_app', 'facebook', 'insta',
    'linkedin', 'brn_number', 'mortgage', 'landline', 'profile', 'priority',
    'contact_type', 'agent_activity', 'admin_activity', 'email', 'email_status',
    'phone', 'cell_status', 'verified', 'property_type', 'website', 'message',
    'resume', 'job_role', 'third_party_client_name', 'third_party_client_commission',
    'third_party_client_email', 'third_party_client_mobile',
    'status', 'contact_date', 'lead_status', 'last_activity_logged', 'last_activity_date_time'
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

  params.push(id); // Add ID for WHERE clause

  const query = `
    UPDATE contact_us
    SET ${updates.join(', ')}
    WHERE id = ?;
  `;

  try {
    await pool.query(query, params);
    return await getContactUsByIdAdmin(id); // Return the updated record
  } catch (error) {
    console.error('Error updating contact inquiry:', error);
    throw error;
  }
};

/**
 * Delete a contact inquiry (soft delete - set status to 0)
 * @param {number} id
 * @returns {boolean}
 */
export const deleteContactUs = async (id) => {
  const inquiry = await getContactUsByIdAdmin(id);
  if (!inquiry) {
    throw new Error('Contact inquiry not found');
  }

  const query = `UPDATE contact_us SET status = 0 WHERE id = ?;`;
  
  try {
    await pool.query(query, [id]);
    return true;
  } catch (error) {
    console.error('Error soft-deleting contact inquiry:', error);
    throw error;
  }
};

/**
 * Permanently delete a contact inquiry (hard delete)
 * @param {number} id
 * @returns {boolean}
 */
export const permanentDeleteContactUs = async (id) => {
  const inquiry = await getContactUsByIdAdmin(id);
  if (!inquiry) {
    throw new Error('Contact inquiry not found');
  }

  const query = `DELETE FROM contact_us WHERE id = ?;`;
  
  try {
    await pool.query(query, [id]);
    return true;
  } catch (error) {
    console.error('Error permanently deleting contact inquiry:', error);
    throw error;
  }
};

/**
 * Get contact inquiry by ID (admin access - all statuses)
 * @param {number} id
 * @returns {object|null}
 */
export const getContactUsByIdAdmin = async (id) => {
  const query = `SELECT * FROM contact_us WHERE id = ?;`;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

/**
 * Get all contact inquiries for admin (includes inactive)
 * @param {object} filters - { status, search, source, type, lead_status, contact_type, orderBy, order }
 * @param {object} pagination - { page, limit }
 * @returns {object}
 */
export const getAllContactUsAdmin = async (filters = {}, pagination = {}) => {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  const params = [];

  // Admin can see all statuses unless a specific status is filtered
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
      phone LIKE ? OR
      company LIKE ? OR
      message LIKE ? OR
      cuid LIKE ?
    )`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Specific filters for admin
  if (filters.source) {
    whereConditions.push('source = ?');
    params.push(filters.source);
  }
  if (filters.type) {
    whereConditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.lead_status) {
    whereConditions.push('lead_status = ?');
    params.push(filters.lead_status);
  }
  if (filters.contact_type) {
    whereConditions.push('contact_type = ?');
    params.push(filters.contact_type);
  }
  if (filters.property_type) {
    whereConditions.push('property_type = ?');
    params.push(filters.property_type);
  }
  if (filters.agent_id) {
    whereConditions.push('agent_id = ?');
    params.push(filters.agent_id);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Order By
  const orderBy = filters.orderBy || 'created_at';
  const order = (filters.order || 'DESC').toUpperCase();
  const validOrderBys = ['id', 'name', 'created_at', 'updated_at', 'source', 'lead_status', 'status', 'priority'];
  const finalOrderBy = validOrderBys.includes(orderBy) ? orderBy : 'created_at';
  const validOrders = ['ASC', 'DESC'];
  const finalOrder = validOrders.includes(order) ? order : 'DESC';

  const query = `
    SELECT *
    FROM contact_us
    ${whereClause}
    ORDER BY ${finalOrderBy} ${finalOrder}
    LIMIT ? OFFSET ?;
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);

  // Total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM contact_us ${whereClause};`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  return {
    inquiries: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Bulk update contact inquiry status
 * @param {array} ids - Array of inquiry IDs
 * @param {number} status - New status (0 or 1)
 * @returns {boolean}
 */
export const bulkUpdateStatus = async (ids, status) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Invalid IDs array');
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE contact_us SET status = ? WHERE id IN (${placeholders});`;
  
  try {
    await pool.query(query, [status, ...ids]);
    return true;
  } catch (error) {
    console.error('Error bulk updating status:', error);
    throw error;
  }
};

/**
 * Bulk update contact inquiry lead status
 * @param {array} ids - Array of inquiry IDs
 * @param {string} leadStatus - New lead status
 * @returns {boolean}
 */
export const bulkUpdateLeadStatus = async (ids, leadStatus) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Invalid IDs array');
  }
  // Optional: Add validation for valid leadStatus values
  const validLeadStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
  if (!validLeadStatuses.includes(leadStatus)) {
      throw new Error('Invalid lead status provided.');
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE contact_us SET lead_status = ? WHERE id IN (${placeholders});`;
  
  try {
    await pool.query(query, [leadStatus, ...ids]);
    return true;
  } catch (error) {
    console.error('Error bulk updating lead status:', error);
    throw error;
  }
};

/**
 * Get contact inquiry statistics
 * @returns {object}
 */
export const getContactUsStats = async () => {
  const query = `
    SELECT 
      COUNT(*) as total_inquiries,
      SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_inquiries,
      SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive_inquiries,
      SUM(CASE WHEN lead_status = 'New' THEN 1 ELSE 0 END) as new_leads,
      SUM(CASE WHEN lead_status = 'Contacted' THEN 1 ELSE 0 END) as contacted_leads,
      SUM(CASE WHEN lead_status = 'Qualified' THEN 1 ELSE 0 END) as qualified_leads,
      SUM(CASE WHEN lead_status = 'Won' THEN 1 ELSE 0 END) as won_leads,
      SUM(CASE WHEN lead_status = 'Lost' THEN 1 ELSE 0 END) as lost_leads,
      COUNT(DISTINCT source) as total_sources,
      COUNT(DISTINCT contact_type) as total_contact_types
    FROM contact_us;
  `;
  
  const [rows] = await pool.query(query);
  return rows[0];
};

/**
 * Get contact inquiries by source
 * @param {string} source
 * @returns {array}
 */
export const getContactUsBySource = async (source) => {
  const query = `SELECT * FROM contact_us WHERE source = ? AND status = 1 ORDER BY created_at DESC;`;
  const [rows] = await pool.query(query, [source]);
  return rows;
};

/**
 * Get contact inquiries by type (e.g., 'buyer', 'seller')
 * @param {string} type
 * @returns {array}
 */
export const getContactUsByType = async (type) => {
  const query = `SELECT * FROM contact_us WHERE type = ? AND status = 1 ORDER BY created_at DESC;`;
  const [rows] = await pool.query(query, [type]);
  return rows;
};

/* =========================================================
   EXPORT ALL FUNCTIONS
========================================================= */

export default {
  createContactUsTable,
  getAllContactUs,
  getContactUsById,
  checkCuidExists,
  checkEmailExists,
  checkPhoneExists,
  createContactUs,
  updateContactUs,
  deleteContactUs,
  permanentDeleteContactUs,
  getContactUsByIdAdmin,
  getAllContactUsAdmin,
  bulkUpdateStatus,
  bulkUpdateLeadStatus,
  getContactUsStats,
  getContactUsBySource,
  getContactUsByType
};
