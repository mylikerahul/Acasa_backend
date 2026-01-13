import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createNoticesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      headings VARCHAR(255),
      description TEXT,
      assign VARCHAR(100),
      date DATE,
      slug VARCHAR(255) NOT NULL UNIQUE,
      descriptions TEXT,
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('notices table created successfully');
};

/* =========================================================
   CREATE NOTICE
========================================================= */

export const createNotice = async (data) => {
  const { 
    title, headings, description, assign, date,
    slug, descriptions, seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    INSERT INTO notices 
    (title, headings, description, assign, date, slug, 
     descriptions, seo_title, seo_keywork, seo_description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    title, headings, description, assign, date,
    slug, descriptions, seo_title, seo_keywork, seo_description
  ]);
  
  return result;
};

/* =========================================================
   GET ALL NOTICES - FIXED ORDER BY
========================================================= */

export const getAllNotices = async () => {
  // ✅ Changed: Sirf id se order karo (ya date se)
  const query = `SELECT * FROM notices ORDER BY id DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET NOTICE BY ID
========================================================= */

export const getNoticeById = async (id) => {
  const query = `SELECT * FROM notices WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET NOTICE BY SLUG
========================================================= */

export const getNoticeBySlug = async (slug) => {
  const query = `SELECT * FROM notices WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   UPDATE NOTICE
========================================================= */

export const updateNotice = async (id, data) => {
  const { 
    title, headings, description, assign, date,
    slug, descriptions, seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    UPDATE notices 
    SET title = ?, headings = ?, description = ?, assign = ?, date = ?,
        slug = ?, descriptions = ?, seo_title = ?, seo_keywork = ?, seo_description = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    title, headings, description, assign, date,
    slug, descriptions, seo_title, seo_keywork, seo_description, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE NOTICE
========================================================= */

export const deleteNotice = async (id) => {
  const query = `DELETE FROM notices WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   GET NOTICES BY DATE RANGE
========================================================= */

export const getNoticesByDateRange = async (startDate, endDate) => {
  const query = `SELECT * FROM notices WHERE date BETWEEN ? AND ? ORDER BY date DESC`;
  const [rows] = await pool.query(query, [startDate, endDate]);
  return rows;
};

/* =========================================================
   GET NOTICES BY ASSIGNEE
========================================================= */

export const getNoticesByAssignee = async (assign) => {
  const query = `SELECT * FROM notices WHERE assign = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [assign]);
  return rows;
};