import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createBlocksTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS blocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      country VARCHAR(100),
      heading VARCHAR(255),
      imageurl VARCHAR(500),
      descriptions TEXT,
      url VARCHAR(500),
      own_video_url VARCHAR(500),
      \`order\` INT DEFAULT 0,
      status TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('blocks table created successfully');
};

/* =========================================================
   CREATE BLOCK
========================================================= */

export const createBlock = async (data) => {
  const { 
    title, slug, country, heading, imageurl, 
    descriptions, url, own_video_url, order, status 
  } = data;
  
  const query = `
    INSERT INTO blocks 
    (title, slug, country, heading, imageurl, descriptions, 
     url, own_video_url, \`order\`, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    title, slug, country, heading, imageurl, 
    descriptions, url, own_video_url, order || 0, status
  ]);
  
  return result;
};

/* =========================================================
   GET ALL BLOCKS
========================================================= */

export const getAllBlocks = async () => {
  const query = `SELECT * FROM blocks ORDER BY \`order\` ASC, created_at DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET BLOCK BY ID
========================================================= */

export const getBlockById = async (id) => {
  const query = `SELECT * FROM blocks WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET BLOCK BY SLUG
========================================================= */

export const getBlockBySlug = async (slug) => {
  const query = `SELECT * FROM blocks WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   UPDATE BLOCK
========================================================= */

export const updateBlock = async (id, data) => {
  const { 
    title, slug, country, heading, imageurl, 
    descriptions, url, own_video_url, order, status 
  } = data;
  
  const query = `
    UPDATE blocks 
    SET title = ?, slug = ?, country = ?, heading = ?, imageurl = ?, 
        descriptions = ?, url = ?, own_video_url = ?, \`order\` = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    title, slug, country, heading, imageurl, 
    descriptions, url, own_video_url, order, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE BLOCK
========================================================= */

export const deleteBlock = async (id) => {
  const query = `DELETE FROM blocks WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};