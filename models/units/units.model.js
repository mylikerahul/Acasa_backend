import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createUnitTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS units (
      id INT AUTO_INCREMENT PRIMARY KEY,
      module_id INT NOT NULL,
      module_type VARCHAR(100) NOT NULL, 
      listing_ids VARCHAR(255),
      title VARCHAR(255),
      price DECIMAL(15, 2),
      bedroom VARCHAR(50),
      size VARCHAR(100),
      type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Available',
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  await pool.query(query);
  console.log('units table created successfully');
};

/* =========================================================
   CREATE UNIT
========================================================= */

export const createUnit = async (unitData) => {
  const { 
    module_id, module_type, listing_ids, 
    title, price, bedroom, size, type, status 
  } = unitData;
  
  const query = `
    INSERT INTO units 
    (module_id, module_type, listing_ids, title, price, bedroom, size, type, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    module_id, module_type, listing_ids, 
    title, price, bedroom, size, type, status
  ]);
  
  return result;
};

/* =========================================================
   GET ALL UNITS
========================================================= */

export const getAllUnits = async () => {
  const query = `SELECT * FROM units ORDER BY create_date DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET UNIT BY ID
========================================================= */

export const getUnitById = async (id) => {
  const query = `SELECT * FROM units WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET UNITS BY MODULE (e.g., specific Project or Property)
========================================================= */

export const getUnitsByModule = async (module_id, module_type) => {
  const query = `
    SELECT * FROM units 
    WHERE module_id = ? AND module_type = ? 
    ORDER BY price ASC
  `;
  const [rows] = await pool.query(query, [module_id, module_type]);
  return rows;
};

/* =========================================================
   UPDATE UNIT
========================================================= */

export const updateUnit = async (id, unitData) => {
  const { 
    module_id, module_type, listing_ids, 
    title, price, bedroom, size, type, status 
  } = unitData;
  
  const query = `
    UPDATE units 
    SET module_id = ?, module_type = ?, listing_ids = ?, 
        title = ?, price = ?, bedroom = ?, size = ?, type = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    module_id, module_type, listing_ids, 
    title, price, bedroom, size, type, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE UNIT
========================================================= */

export const deleteUnit = async (id) => {
  const query = `DELETE FROM units WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};