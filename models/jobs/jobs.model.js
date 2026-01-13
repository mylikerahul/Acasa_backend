import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createJobsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255),
      title VARCHAR(255),
      description TEXT,
      sub_title VARCHAR(255),
      sub_description TEXT,
      about_team TEXT,
      about_company TEXT,
      job_title VARCHAR(255),
      city_name VARCHAR(100),
      responsibilities TEXT,
      type VARCHAR(100),
      link VARCHAR(500),
      facilities JSON,
      social JSON,
      seo_title VARCHAR(255),
      seo_description TEXT,
      seo_keyword VARCHAR(500),
      status VARCHAR(50) DEFAULT 'active',
      slug VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_slug (slug),
      INDEX idx_status (status),
      INDEX idx_type (type),
      INDEX idx_city (city_name)
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('jobs table created/verified successfully');
};

/* =========================================================
   CREATE JOB
========================================================= */

export const createJob = async (data) => {
  const { 
    full_name, title, description, sub_title, sub_description,
    about_team, about_company, job_title, city_name, responsibilities,
    type, link, facilities, social, seo_title, seo_description,
    seo_keyword, status, slug
  } = data;
  
  const query = `
    INSERT INTO jobs 
    (full_name, title, description, sub_title, sub_description,
     about_team, about_company, job_title, city_name, responsibilities,
     type, link, facilities, social, seo_title, seo_description,
     seo_keyword, status, slug) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    full_name || null,
    title || null,
    description || null,
    sub_title || null,
    sub_description || null,
    about_team || null,
    about_company || null,
    job_title || null,
    city_name || null,
    responsibilities || null,
    type || null,
    link || null,
    facilities ? JSON.stringify(facilities) : null,
    social ? JSON.stringify(social) : null,
    seo_title || null,
    seo_description || null,
    seo_keyword || null,
    status || 'active',
    slug || null
  ]);
  
  return result;
};

/* =========================================================
   GET ALL JOBS
========================================================= */

export const getAllJobs = async () => {
  const query = `SELECT * FROM jobs ORDER BY id DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ACTIVE JOBS
========================================================= */

export const getActiveJobs = async () => {
  const query = `SELECT * FROM jobs WHERE status = 'active' ORDER BY id DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET JOB BY ID
========================================================= */

export const getJobById = async (id) => {
  const query = `SELECT * FROM jobs WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET JOB BY SLUG
========================================================= */

export const getJobBySlug = async (slug) => {
  const query = `SELECT * FROM jobs WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   GET JOBS BY STATUS
========================================================= */

export const getJobsByStatus = async (status) => {
  const query = `SELECT * FROM jobs WHERE status = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [status]);
  return rows;
};

/* =========================================================
   GET JOBS BY TYPE
========================================================= */

export const getJobsByType = async (type) => {
  const query = `SELECT * FROM jobs WHERE type = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [type]);
  return rows;
};

/* =========================================================
   GET JOBS BY CITY
========================================================= */

export const getJobsByCity = async (cityName) => {
  const query = `SELECT * FROM jobs WHERE city_name = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [cityName]);
  return rows;
};

/* =========================================================
   GET JOBS BY JOB TITLE
========================================================= */

export const getJobsByJobTitle = async (jobTitle) => {
  const query = `SELECT * FROM jobs WHERE job_title LIKE ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [`%${jobTitle}%`]);
  return rows;
};

/* =========================================================
   UPDATE JOB
========================================================= */

export const updateJob = async (id, data) => {
  const { 
    full_name, title, description, sub_title, sub_description,
    about_team, about_company, job_title, city_name, responsibilities,
    type, link, facilities, social, seo_title, seo_description,
    seo_keyword, status, slug
  } = data;
  
  const query = `
    UPDATE jobs 
    SET full_name = ?, title = ?, description = ?, sub_title = ?, 
        sub_description = ?, about_team = ?, about_company = ?, 
        job_title = ?, city_name = ?, responsibilities = ?, type = ?, 
        link = ?, facilities = ?, social = ?, seo_title = ?, 
        seo_description = ?, seo_keyword = ?, status = ?, slug = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    full_name || null,
    title || null,
    description || null,
    sub_title || null,
    sub_description || null,
    about_team || null,
    about_company || null,
    job_title || null,
    city_name || null,
    responsibilities || null,
    type || null,
    link || null,
    facilities ? JSON.stringify(facilities) : null,
    social ? JSON.stringify(social) : null,
    seo_title || null,
    seo_description || null,
    seo_keyword || null,
    status || 'active',
    slug || null,
    id
  ]);
  
  return result;
};

/* =========================================================
   UPDATE JOB STATUS
========================================================= */

export const updateJobStatus = async (id, status) => {
  const query = `UPDATE jobs SET status = ? WHERE id = ?`;
  const [result] = await pool.query(query, [status, id]);
  return result;
};

/* =========================================================
   TOGGLE JOB STATUS
========================================================= */

export const toggleJobStatus = async (id) => {
  const query = `
    UPDATE jobs 
    SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END 
    WHERE id = ?
  `;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   DELETE JOB
========================================================= */

export const deleteJob = async (id) => {
  const query = `DELETE FROM jobs WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   SEARCH JOBS
========================================================= */

export const searchJobs = async (searchTerm) => {
  const query = `
    SELECT * FROM jobs 
    WHERE title LIKE ? 
       OR description LIKE ? 
       OR job_title LIKE ?
       OR city_name LIKE ?
       OR type LIKE ?
       OR full_name LIKE ?
       OR about_company LIKE ?
    ORDER BY id DESC
  `;
  const searchPattern = `%${searchTerm}%`;
  const [rows] = await pool.query(query, [
    searchPattern, searchPattern, searchPattern, 
    searchPattern, searchPattern, searchPattern, searchPattern
  ]);
  return rows;
};

/* =========================================================
   SEARCH ACTIVE JOBS
========================================================= */

export const searchActiveJobs = async (searchTerm) => {
  const query = `
    SELECT * FROM jobs 
    WHERE status = 'active' AND (
      title LIKE ? 
      OR description LIKE ? 
      OR job_title LIKE ?
      OR city_name LIKE ?
      OR type LIKE ?
    )
    ORDER BY id DESC
  `;
  const searchPattern = `%${searchTerm}%`;
  const [rows] = await pool.query(query, [
    searchPattern, searchPattern, searchPattern, 
    searchPattern, searchPattern
  ]);
  return rows;
};

/* =========================================================
   GET RECENT JOBS
========================================================= */

export const getRecentJobs = async (limit = 10) => {
  const query = `SELECT * FROM jobs WHERE status = 'active' ORDER BY id DESC LIMIT ?`;
  const [rows] = await pool.query(query, [parseInt(limit)]);
  return rows;
};

/* =========================================================
   GET JOBS WITH PAGINATION
========================================================= */

export const getJobsWithPagination = async (page = 1, limit = 10, status = null) => {
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM jobs`;
  let countQuery = `SELECT COUNT(*) as total FROM jobs`;
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
   GET JOB STATS
========================================================= */

export const getJobStats = async () => {
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_month
    FROM jobs
  `;
  const [rows] = await pool.query(query);
  return rows[0];
};

/* =========================================================
   GET JOBS COUNT BY TYPE
========================================================= */

export const getJobsCountByType = async () => {
  const query = `
    SELECT type, COUNT(*) as count 
    FROM jobs 
    WHERE type IS NOT NULL
    GROUP BY type 
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET JOBS COUNT BY CITY
========================================================= */

export const getJobsCountByCity = async () => {
  const query = `
    SELECT city_name, COUNT(*) as count 
    FROM jobs 
    WHERE city_name IS NOT NULL
    GROUP BY city_name 
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ALL CITIES
========================================================= */

export const getAllCities = async () => {
  const query = `
    SELECT DISTINCT city_name 
    FROM jobs 
    WHERE city_name IS NOT NULL AND city_name != ''
    ORDER BY city_name ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ALL JOB TYPES
========================================================= */

export const getAllJobTypes = async () => {
  const query = `
    SELECT DISTINCT type 
    FROM jobs 
    WHERE type IS NOT NULL AND type != ''
    ORDER BY type ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   CHECK SLUG EXISTS
========================================================= */

export const checkSlugExists = async (slug, excludeId = null) => {
  let query = `SELECT id FROM jobs WHERE slug = ?`;
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
   GET JOBS BY DATE RANGE
========================================================= */

export const getJobsByDateRange = async (startDate, endDate) => {
  const query = `
    SELECT * FROM jobs 
    WHERE DATE(created_at) BETWEEN ? AND ? 
    ORDER BY created_at DESC
  `;
  const [rows] = await pool.query(query, [startDate, endDate]);
  return rows;
};

/* =========================================================
   FILTER JOBS
========================================================= */

export const filterJobs = async (filters) => {
  const { type, city_name, status, search } = filters;
  
  let query = `SELECT * FROM jobs WHERE 1=1`;
  const params = [];
  
  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }
  
  if (city_name) {
    query += ` AND city_name = ?`;
    params.push(city_name);
  }
  
  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }
  
  if (search) {
    query += ` AND (title LIKE ? OR job_title LIKE ? OR description LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  query += ` ORDER BY id DESC`;
  
  const [rows] = await pool.query(query, params);
  return rows;
};

/* =========================================================
   BULK UPDATE STATUS
========================================================= */

export const bulkUpdateStatus = async (ids, status) => {
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE jobs SET status = ? WHERE id IN (${placeholders})`;
  const [result] = await pool.query(query, [status, ...ids]);
  return result;
};

/* =========================================================
   BULK DELETE JOBS
========================================================= */

export const bulkDeleteJobs = async (ids) => {
  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM jobs WHERE id IN (${placeholders})`;
  const [result] = await pool.query(query, ids);
  return result;
};

/* =========================================================
   CLEAR ALL JOBS
========================================================= */

export const clearAllJobs = async () => {
  const query = `TRUNCATE TABLE jobs`;
  const [result] = await pool.query(query);
  return result;
};