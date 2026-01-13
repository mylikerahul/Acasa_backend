import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createAreasTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS areas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(255),
      developer VARCHAR(255),
      Created VARCHAR(255), 
      Upload VARCHAR(500),
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      sub_title VARCHAR(255),
      descriptions TEXT,
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('areas table created successfully');
};

/* =========================================================
   CREATE AREA
========================================================= */

export const createArea = async (areaData) => {
  const { 
    name, city, developer, Created, Upload, 
    title, slug, sub_title, descriptions, 
    seo_title, seo_keywork, seo_description 
  } = areaData;
  
  const query = `
    INSERT INTO areas 
    (name, city, developer, Created, Upload, title, slug, 
     sub_title, descriptions, seo_title, seo_keywork, seo_description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    name, city, developer, Created, Upload, 
    title, slug, sub_title, descriptions, 
    seo_title, seo_keywork, seo_description
  ]);
  
  return result;
};

/* =========================================================
   GET ALL AREAS
========================================================= */

export const getAllAreas = async () => {
  const query = `SELECT * FROM areas ORDER BY name ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET AREA BY ID
========================================================= */

export const getAreaById = async (id) => {
  const query = `SELECT * FROM areas WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET AREA BY SLUG
========================================================= */

export const getAreaBySlug = async (slug) => {
  const query = `SELECT * FROM areas WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   UPDATE AREA
========================================================= */

export const updateArea = async (id, areaData) => {
  const { 
    name, city, developer, Created, Upload, 
    title, slug, sub_title, descriptions, 
    seo_title, seo_keywork, seo_description 
  } = areaData;
  
  const query = `
    UPDATE areas 
    SET name = ?, city = ?, developer = ?, Created = ?, Upload = ?, 
        title = ?, slug = ?, sub_title = ?, descriptions = ?, 
        seo_title = ?, seo_keywork = ?, seo_description = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    name, city, developer, Created, Upload, 
    title, slug, sub_title, descriptions, 
    seo_title, seo_keywork, seo_description, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE AREA
========================================================= */

export const deleteArea = async (id) => {
  const query = `DELETE FROM areas WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};