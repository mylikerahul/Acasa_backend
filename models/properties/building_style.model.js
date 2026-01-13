import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createBuildingStyleTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS building_style (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('building_style table created successfully');
};

/* =========================================================
   CREATE STYLE
========================================================= */

export const createBuildingStyle = async (data) => {
  const { name } = data;
  
  const query = `INSERT INTO building_style (name) VALUES (?)`;
  
  const [result] = await pool.query(query, [name]);
  return result;
};

/* =========================================================
   GET ALL STYLES
========================================================= */

export const getAllBuildingStyles = async () => {
  const query = `SELECT * FROM building_style ORDER BY name ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET STYLE BY ID
========================================================= */

export const getBuildingStyleById = async (id) => {
  const query = `SELECT * FROM building_style WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET STYLE BY NAME
========================================================= */

export const getBuildingStyleByName = async (name) => {
  const query = `SELECT * FROM building_style WHERE name = ?`;
  const [rows] = await pool.query(query, [name]);
  return rows[0];
};

/* =========================================================
   UPDATE STYLE
========================================================= */

export const updateBuildingStyle = async (id, data) => {
  const { name } = data;
  
  const query = `UPDATE building_style SET name = ? WHERE id = ?`;
  
  const [result] = await pool.query(query, [name, id]);
  return result;
};

/* =========================================================
   DELETE STYLE
========================================================= */

export const deleteBuildingStyle = async (id) => {
  const query = `DELETE FROM building_style WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};