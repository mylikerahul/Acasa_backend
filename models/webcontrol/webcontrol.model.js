import pool from '../../config/db.js';

// Centralized logger for this model
const _logError = (msg, errorDetails = '') => {
  console.error(`[WebControlModel ERROR] ${msg}`);
  if (errorDetails) console.error(`   Details: ${errorDetails}`);
};
// _logInfo is commented out by default for maximal minimalism in models.

// ==================== CREATE TABLE IF NOT EXISTS ====================
export const createWebControlTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webcontrol (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        heading VARCHAR(255),
        imageurl TEXT,
        descriptions TEXT,
        descriptions_other TEXT,
        enable_modules JSON, -- DEFAULT '{}' हटा दिया (MySQL में JSON/TEXT/BLOB कॉलम के लिए DEFAULT नहीं हो सकता)
        seo_title VARCHAR(255),
        seo_keyword TEXT,
        seo_description TEXT,
        status ENUM('active', 'inactive', 'draft') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    // No info log for successful creation, unless you uncomment _logInfo and use it.
  } catch (error) {
    _logError('Error creating webcontrol table', error.message);
    throw error;
  }
};

// ==================== ADD WEB CONTROL ====================
export const addWebControl = async ({
  title, slug, heading, imageurl, descriptions, descriptions_other,
  enable_modules = {}, seo_title, seo_keyword, seo_description, status = 'draft'
}) => {
  try {
    const [rows] = await pool.query(
      `INSERT INTO webcontrol
       (title, slug, heading, imageurl, descriptions, descriptions_other,
        enable_modules, seo_title, seo_keyword, seo_description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, heading, imageurl, descriptions, descriptions_other,
       JSON.stringify(enable_modules), seo_title, seo_keyword, seo_description, status]
    );
    return rows.insertId ? { id: rows.insertId, title, slug } : null;
  } catch (error) {
    _logError('Error adding web control', error.message);
    throw error;
  }
};

// ==================== GET ALL WEB CONTROLS ====================
export const getAllWebControls = async (filters = {}) => {
  const { status, limit = 10, offset = 0 } = filters;
  let query = `SELECT * FROM webcontrol WHERE 1=1`;
  const params = [];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    _logError('Error getting all web controls', error.message);
    throw error;
  }
};

// ==================== GET WEB CONTROL BY SLUG OR ID ====================
export const getWebControl = async (identifier) => {
  let query = `SELECT * FROM webcontrol WHERE id = ? OR slug = ? LIMIT 1`;
  try {
    const [rows] = await pool.query(query, [identifier, identifier]);
    return rows[0];
  } catch (error) {
    _logError('Error getting web control by identifier', error.message);
    throw error;
  }
};

// ==================== UPDATE WEB CONTROL ====================
export const updateWebControl = async (id, {
  title, slug, heading, imageurl, descriptions, descriptions_other,
  enable_modules, seo_title, seo_keyword, seo_description, status
}) => {
  const fields = [];
  const params = [];

  if (title !== undefined) { fields.push('title = ?'); params.push(title); }
  if (slug !== undefined) { fields.push('slug = ?'); params.push(slug); }
  if (heading !== undefined) { fields.push('heading = ?'); params.push(heading); }
  if (imageurl !== undefined) { fields.push('imageurl = ?'); params.push(imageurl); }
  if (descriptions !== undefined) { fields.push('descriptions = ?'); params.push(descriptions); }
  if (descriptions_other !== undefined) { fields.push('descriptions_other = ?'); params.push(descriptions_other); }
  if (enable_modules !== undefined) { fields.push('enable_modules = ?'); params.push(JSON.stringify(enable_modules)); }
  if (seo_title !== undefined) { fields.push('seo_title = ?'); params.push(seo_title); }
  if (seo_keyword !== undefined) { fields.push('seo_keyword = ?'); params.push(seo_keyword); }
  if (seo_description !== undefined) { fields.push('seo_description = ?'); params.push(seo_description); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }

  if (fields.length === 0) {
    return 0; // No changes made
  }

  const query = `UPDATE webcontrol SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);

  try {
    const [result] = await pool.query(query, params);
    return result.affectedRows;
  } catch (error) {
    _logError(`Error updating web control ${id}`, error.message);
    throw error;
  }
};

// ==================== DELETE WEB CONTROL ====================
export const deleteWebControl = async (id) => {
  try {
    const [result] = await pool.query(`DELETE FROM webcontrol WHERE id = ?`, [id]);
    return result.affectedRows;
  } catch (error) {
    _logError(`Error deleting web control ${id}`, error.message);
    throw error;
  }
};

// ==================== DEFAULT EXPORT ====================
export default {
  createWebControlTable,
  addWebControl,
  getAllWebControls,
  getWebControl,
  updateWebControl,
  deleteWebControl
};