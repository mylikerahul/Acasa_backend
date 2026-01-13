import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createCommercialAmenitiesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS commercial_amenities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('commercial_amenities table created successfully');
};

/* =========================================================
   CREATE AMENITY
========================================================= */

export const createAmenity = async (data) => {
  const { name } = data;
  
  const query = `INSERT INTO commercial_amenities (name) VALUES (?)`;
  
  const [result] = await pool.query(query, [name]);
  return result;
};

/* =========================================================
   GET ALL AMENITIES
========================================================= */

export const getAllAmenities = async () => {
  const query = `SELECT * FROM commercial_amenities ORDER BY name ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET AMENITY BY ID
========================================================= */

export const getAmenityById = async (id) => {
  const query = `SELECT * FROM commercial_amenities WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET AMENITY BY NAME
========================================================= */

export const getAmenityByName = async (name) => {
  const query = `SELECT * FROM commercial_amenities WHERE name = ?`;
  const [rows] = await pool.query(query, [name]);
  return rows[0];
};

/* =========================================================
   UPDATE AMENITY
========================================================= */

export const updateAmenity = async (id, data) => {
  const { name } = data;
  
  const query = `UPDATE commercial_amenities SET name = ? WHERE id = ?`;
  
  const [result] = await pool.query(query, [name, id]);
  return result;
};

/* =========================================================
   DELETE AMENITY
========================================================= */

export const deleteAmenity = async (id) => {
  const query = `DELETE FROM commercial_amenities WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};