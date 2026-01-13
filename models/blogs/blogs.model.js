import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createBlogsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS blogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      sub_title VARCHAR(255),
      writer VARCHAR(100),
      publish_date DATE,
      category VARCHAR(100),
      imageurl VARCHAR(500),
      descriptions TEXT,
      status VARCHAR(50) DEFAULT 'Draft',
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('blogs table created successfully');
};

/* =========================================================
   CREATE BLOG
========================================================= */

export const createBlog = async (data) => {
  const { 
    title, slug, sub_title, writer, publish_date, 
    category, imageurl, descriptions, status, 
    seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    INSERT INTO blogs 
    (title, slug, sub_title, writer, publish_date, category, 
     imageurl, descriptions, status, seo_title, seo_keywork, seo_description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    title, slug, sub_title, writer, publish_date, 
    category, imageurl, descriptions, status || 'Draft', 
    seo_title, seo_keywork, seo_description
  ]);
  
  return result;
};

/* =========================================================
   GET ALL BLOGS
========================================================= */

export const getAllBlogs = async () => {
  // Ordered by publish_date newest first
  const query = `SELECT * FROM blogs ORDER BY publish_date DESC, created_at DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET BLOG BY ID
========================================================= */

export const getBlogById = async (id) => {
  const query = `SELECT * FROM blogs WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET BLOG BY SLUG
========================================================= */

export const getBlogBySlug = async (slug) => {
  const query = `SELECT * FROM blogs WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   UPDATE BLOG
========================================================= */

export const updateBlog = async (id, data) => {
  const { 
    title, slug, sub_title, writer, publish_date, 
    category, imageurl, descriptions, status, 
    seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    UPDATE blogs 
    SET title = ?, slug = ?, sub_title = ?, writer = ?, publish_date = ?, 
        category = ?, imageurl = ?, descriptions = ?, status = ?, 
        seo_title = ?, seo_keywork = ?, seo_description = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    title, slug, sub_title, writer, publish_date, 
    category, imageurl, descriptions, status, 
    seo_title, seo_keywork, seo_description, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE BLOG
========================================================= */

export const deleteBlog = async (id) => {
  const query = `DELETE FROM blogs WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};