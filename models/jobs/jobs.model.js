// models/jobs/jobs.model.js

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
      views INT DEFAULT 0,
      applications INT DEFAULT 0,
      salary_min DECIMAL(12,2),
      salary_max DECIMAL(12,2),
      salary_currency VARCHAR(10) DEFAULT 'AED',
      experience_min INT DEFAULT 0,
      experience_max INT DEFAULT 0,
      featured TINYINT(1) DEFAULT 0,
      urgent TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_slug (slug),
      INDEX idx_status (status),
      INDEX idx_type (type),
      INDEX idx_city (city_name),
      INDEX idx_featured (featured),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await pool.query(query);
  console.log('Jobs table created/verified successfully');
};

/* =========================================================
   DYNAMIC GET JOBS WITH ADVANCED FILTERS
========================================================= */

export const getJobsDynamic = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    type = '',
    city = '',
    featured = '',
    urgent = '',
    salaryMin = '',
    salaryMax = '',
    experienceMin = '',
    experienceMax = '',
    sortBy = 'created_at',
    sortOrder = 'DESC',
    dateFrom = '',
    dateTo = '',
    ids = []
  } = options;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];

  // Search across multiple fields
  if (search && search.trim()) {
    conditions.push(`(
      title LIKE ? OR 
      job_title LIKE ? OR 
      description LIKE ? OR 
      city_name LIKE ? OR 
      full_name LIKE ? OR
      about_company LIKE ?
    )`);
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Status filter
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  // Type filter
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  // City filter
  if (city) {
    conditions.push('city_name = ?');
    params.push(city);
  }

  // Featured filter
  if (featured !== '') {
    conditions.push('featured = ?');
    params.push(parseInt(featured));
  }

  // Urgent filter
  if (urgent !== '') {
    conditions.push('urgent = ?');
    params.push(parseInt(urgent));
  }

  // Salary range
  if (salaryMin) {
    conditions.push('salary_min >= ?');
    params.push(parseFloat(salaryMin));
  }
  if (salaryMax) {
    conditions.push('salary_max <= ?');
    params.push(parseFloat(salaryMax));
  }

  // Experience range
  if (experienceMin) {
    conditions.push('experience_min >= ?');
    params.push(parseInt(experienceMin));
  }
  if (experienceMax) {
    conditions.push('experience_max <= ?');
    params.push(parseInt(experienceMax));
  }

  // Date range
  if (dateFrom) {
    conditions.push('DATE(created_at) >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('DATE(created_at) <= ?');
    params.push(dateTo);
  }

  // Specific IDs
  if (ids && ids.length > 0) {
    conditions.push(`id IN (${ids.map(() => '?').join(',')})`);
    params.push(...ids);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Validate sort fields to prevent SQL injection
  const allowedSortFields = ['id', 'title', 'job_title', 'city_name', 'type', 'status', 'views', 'applications', 'salary_min', 'created_at', 'updated_at', 'featured'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Main query
  const query = `
    SELECT * FROM jobs 
    ${whereClause}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `;

  // Count query
  const countQuery = `SELECT COUNT(*) as total FROM jobs ${whereClause}`;

  const [rows] = await pool.query(query, [...params, parseInt(limit), offset]);
  const [countResult] = await pool.query(countQuery, params);

  return {
    data: rows,
    total: countResult[0].total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
    hasNext: parseInt(page) * parseInt(limit) < countResult[0].total,
    hasPrev: parseInt(page) > 1
  };
};

/* =========================================================
   CREATE JOB
========================================================= */

export const createJob = async (data) => {
  const fields = [];
  const placeholders = [];
  const values = [];

  const allowedFields = [
    'full_name', 'title', 'description', 'sub_title', 'sub_description',
    'about_team', 'about_company', 'job_title', 'city_name', 'responsibilities',
    'type', 'link', 'facilities', 'social', 'seo_title', 'seo_description',
    'seo_keyword', 'status', 'slug', 'salary_min', 'salary_max', 'salary_currency',
    'experience_min', 'experience_max', 'featured', 'urgent', 'views', 'applications'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(field);
      placeholders.push('?');
      
      // Handle JSON fields
      if (['facilities', 'social'].includes(field) && typeof data[field] === 'object') {
        values.push(JSON.stringify(data[field]));
      } else {
        values.push(data[field]);
      }
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields provided');
  }

  const query = `INSERT INTO jobs (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
  const [result] = await pool.query(query, values);
  
  return { insertId: result.insertId, ...data };
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
   UPDATE JOB - DYNAMIC
========================================================= */

export const updateJob = async (id, data) => {
  const updates = [];
  const values = [];

  const allowedFields = [
    'full_name', 'title', 'description', 'sub_title', 'sub_description',
    'about_team', 'about_company', 'job_title', 'city_name', 'responsibilities',
    'type', 'link', 'facilities', 'social', 'seo_title', 'seo_description',
    'seo_keyword', 'status', 'slug', 'salary_min', 'salary_max', 'salary_currency',
    'experience_min', 'experience_max', 'featured', 'urgent', 'views', 'applications'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      
      if (['facilities', 'social'].includes(field) && typeof data[field] === 'object') {
        values.push(JSON.stringify(data[field]));
      } else {
        values.push(data[field]);
      }
    }
  }

  if (updates.length === 0) {
    return { affectedRows: 0 };
  }

  values.push(id);
  const query = `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`;
  const [result] = await pool.query(query, values);
  
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
   TOGGLE FEATURED
========================================================= */

export const toggleFeatured = async (id) => {
  const query = `UPDATE jobs SET featured = NOT featured WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   INCREMENT VIEWS
========================================================= */

export const incrementViews = async (id) => {
  const query = `UPDATE jobs SET views = views + 1 WHERE id = ?`;
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
   BULK UPDATE STATUS
========================================================= */

export const bulkUpdateStatus = async (ids, status) => {
  if (!ids || ids.length === 0) return { affectedRows: 0 };
  
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE jobs SET status = ? WHERE id IN (${placeholders})`;
  const [result] = await pool.query(query, [status, ...ids]);
  return result;
};

/* =========================================================
   BULK UPDATE FEATURED
========================================================= */

export const bulkUpdateFeatured = async (ids, featured) => {
  if (!ids || ids.length === 0) return { affectedRows: 0 };
  
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE jobs SET featured = ? WHERE id IN (${placeholders})`;
  const [result] = await pool.query(query, [featured ? 1 : 0, ...ids]);
  return result;
};

/* =========================================================
   BULK DELETE JOBS
========================================================= */

export const bulkDeleteJobs = async (ids) => {
  if (!ids || ids.length === 0) return { affectedRows: 0 };
  
  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM jobs WHERE id IN (${placeholders})`;
  const [result] = await pool.query(query, ids);
  return result;
};

/* =========================================================
   GET JOB STATS - COMPREHENSIVE
========================================================= */

export const getJobStats = async () => {
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
      COUNT(CASE WHEN featured = 1 THEN 1 END) as featured,
      COUNT(CASE WHEN urgent = 1 THEN 1 END) as urgent,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as this_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as this_month,
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(applications), 0) as total_applications
    FROM jobs
  `;
  const [rows] = await pool.query(query);
  return rows[0];
};

/* =========================================================
   GET FILTER OPTIONS (for dynamic dropdowns)
========================================================= */

export const getFilterOptions = async () => {
  const [types] = await pool.query(`
    SELECT DISTINCT type as value, type as label, COUNT(*) as count 
    FROM jobs WHERE type IS NOT NULL AND type != '' 
    GROUP BY type ORDER BY count DESC
  `);

  const [cities] = await pool.query(`
    SELECT DISTINCT city_name as value, city_name as label, COUNT(*) as count 
    FROM jobs WHERE city_name IS NOT NULL AND city_name != '' 
    GROUP BY city_name ORDER BY count DESC
  `);

  const [statuses] = await pool.query(`
    SELECT status as value, status as label, COUNT(*) as count 
    FROM jobs 
    GROUP BY status ORDER BY count DESC
  `);

  return {
    types,
    cities,
    statuses,
    featured: [
      { value: '1', label: 'Featured', count: 0 },
      { value: '0', label: 'Not Featured', count: 0 }
    ],
    urgent: [
      { value: '1', label: 'Urgent', count: 0 },
      { value: '0', label: 'Not Urgent', count: 0 }
    ]
  };
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
  let slug = baseSlug.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  let counter = 1;
  let finalSlug = slug;
  
  while (await checkSlugExists(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return finalSlug;
};

/* =========================================================
   GET ACTIVE JOBS (Public)
========================================================= */

export const getActiveJobs = async (options = {}) => {
  return getJobsDynamic({ ...options, status: 'active' });
};

/* =========================================================
   GET RECENT JOBS
========================================================= */

export const getRecentJobs = async (limit = 10) => {
  const query = `SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT ?`;
  const [rows] = await pool.query(query, [parseInt(limit)]);
  return rows;
};

/* =========================================================
   SEARCH JOBS
========================================================= */

export const searchJobs = async (searchTerm, options = {}) => {
  return getJobsDynamic({ ...options, search: searchTerm });
};

/* =========================================================
   DUPLICATE JOB
========================================================= */

export const duplicateJob = async (id) => {
  const job = await getJobById(id);
  if (!job) return null;

  // Remove id and generate new slug
  const { id: _, slug, created_at, updated_at, views, applications, ...jobData } = job;
  const newSlug = await generateUniqueSlug(slug || job.title || 'job');

  return createJob({
    ...jobData,
    title: `${jobData.title} (Copy)`,
    slug: newSlug,
    status: 'inactive',
    views: 0,
    applications: 0
  });
};