// models/admin/Lifestyle/Lifestyle.model.js

import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createLifestyleTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS lifestyle (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      country_id INT, -- Assuming this is a foreign key to a countries table, handled as INT
      developer_id INT, -- Assuming this is a foreign key to a developers table, handled as INT
      subtitle TEXT,
      description TEXT,
      image VARCHAR(500), -- URL for the image
      seo_title VARCHAR(60),
      seo_description VARCHAR(160),
      seo_focus_keyword VARCHAR(100),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_slug (slug),
      INDEX idx_status (status),
      INDEX idx_name (name),
      INDEX idx_title (title)
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('lifestyle table created/verified successfully');
};

/* =========================================================
   CREATE LIFESTYLE ENTRY
========================================================= */

export const createLifestyle = async (data) => {
  const { 
    slug, name, title, country_id, developer_id, subtitle, 
    description, image, seo_title, seo_description, 
    seo_focus_keyword, status
  } = data;
  
  const query = `
    INSERT INTO lifestyle 
    (slug, name, title, country_id, developer_id, subtitle, 
     description, image, seo_title, seo_description, 
     seo_focus_keyword, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    slug,
    name,
    title,
    country_id || null,
    developer_id || null,
    subtitle || null,
    description || null,
    image || null,
    seo_title || null,
    seo_description || null,
    seo_focus_keyword || null,
    status || 'active'
  ]);
  
  return result;
};

/* =========================================================
   GET ALL LIFESTYLE ENTRIES
========================================================= */

export const getAllLifestyles = async () => {
  const query = `SELECT * FROM lifestyle ORDER BY id DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ACTIVE LIFESTYLE ENTRIES
========================================================= */

export const getActiveLifestyles = async () => {
  const query = `SELECT * FROM lifestyle WHERE status = 'active' ORDER BY id DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET LIFESTYLE ENTRY BY ID
========================================================= */

export const getLifestyleById = async (id) => {
  const query = `SELECT * FROM lifestyle WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET LIFESTYLE ENTRY BY SLUG
========================================================= */

export const getLifestyleBySlug = async (slug) => {
  const query = `SELECT * FROM lifestyle WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   GET LIFESTYLE ENTRIES BY STATUS
========================================================= */

export const getLifestylesByStatus = async (status) => {
  const query = `SELECT * FROM lifestyle WHERE status = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [status]);
  return rows;
};

/* =========================================================
   UPDATE LIFESTYLE ENTRY
========================================================= */

export const updateLifestyle = async (id, data) => {
  const { 
    slug, name, title, country_id, developer_id, subtitle, 
    description, image, seo_title, seo_description, 
    seo_focus_keyword, status
  } = data;
  
  const query = `
    UPDATE lifestyle 
    SET slug = ?, name = ?, title = ?, country_id = ?, developer_id = ?, subtitle = ?, 
        description = ?, image = ?, seo_title = ?, seo_description = ?, 
        seo_focus_keyword = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    slug,
    name,
    title,
    country_id || null,
    developer_id || null,
    subtitle || null,
    description || null,
    image || null,
    seo_title || null,
    seo_description || null,
    seo_focus_keyword || null,
    status || 'active',
    id
  ]);
  
  return result;
};

/* =========================================================
   UPDATE LIFESTYLE STATUS
========================================================= */

export const updateLifestyleStatus = async (id, status) => {
  const query = `UPDATE lifestyle SET status = ? WHERE id = ?`;
  const [result] = await pool.query(query, [status, id]);
  return result;
};

/* =========================================================
   TOGGLE LIFESTYLE STATUS
========================================================= */

export const toggleLifestyleStatus = async (id) => {
  const query = `
    UPDATE lifestyle 
    SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END 
    WHERE id = ?
  `;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   DELETE LIFESTYLE ENTRY
========================================================= */

export const deleteLifestyle = async (id) => {
  const query = `DELETE FROM lifestyle WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   SEARCH LIFESTYLE ENTRIES
========================================================= */

export const searchLifestyles = async (searchTerm) => {
  const query = `
    SELECT * FROM lifestyle 
    WHERE name LIKE ? 
       OR title LIKE ? 
       OR subtitle LIKE ?
       OR description LIKE ?
    ORDER BY id DESC
  `;
  const searchPattern = `%${searchTerm}%`;
  const [rows] = await pool.query(query, [
    searchPattern, searchPattern, searchPattern, searchPattern
  ]);
  return rows;
};

/* =========================================================
   GET LIFESTYLE ENTRIES WITH PAGINATION
========================================================= */

export const getLifestylesWithPagination = async (page = 1, limit = 10, status = null) => {
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM lifestyle`;
  let countQuery = `SELECT COUNT(*) as total FROM lifestyle`;
  const params = [];
  
  if (status) {
    query += ` WHERE status = ?`;
    countQuery += ` WHERE status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  
  const [rows] = await pool.query(query, [...params, parseInt(limit), offset]);
  const [countResult] = await pool.query(countQuery, params);
  
  return {
    data: rows,
    total: countResult[0].total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(countResult[0].total / limit)
  };
};

/* =========================================================
   GET LIFESTYLE STATS
========================================================= */

export const getLifestyleStats = async () => {
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_month
    FROM lifestyle
  `;
  const [rows] = await pool.query(query);
  return rows[0];
};

/* =========================================================
   CHECK SLUG EXISTS
========================================================= */

export const checkSlugExists = async (slug, excludeId = null) => {
  let query = `SELECT id FROM lifestyle WHERE slug = ?`;
  const params = [slug];
  
  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

/* =========================================================
   GENERATE UNIQUE SLUG
========================================================= */

export const generateUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (await checkSlugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

/* =========================================================
   BULK UPDATE STATUS
========================================================= */

export const bulkUpdateStatus = async (ids, status) => {
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE lifestyle SET status = ? WHERE id IN (${placeholders})`;
  const [result] = await pool.query(query, [status, ...ids]);
  return result;
};

/* =========================================================
   BULK DELETE LIFESTYLE ENTRIES
========================================================= */

export const bulkDeleteLifestyles = async (ids) => {
  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM lifestyle WHERE id IN (${placeholders})`;
  const [result] = await pool.query(query, ids);
  return result;
};

/* =========================================================
   CLEAR ALL LIFESTYLE ENTRIES
========================================================= */

export const clearAllLifestyles = async () => {
  const query = `TRUNCATE TABLE lifestyle`;
  const [result] = await pool.query(query);
  return result;
};