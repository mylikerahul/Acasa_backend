import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createAgencyTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS agency (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cuid VARCHAR(100) UNIQUE,
      owner_name VARCHAR(100) NOT NULL,
      office_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      orn VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Active',
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('agency table created successfully');
};

/* =========================================================
   CREATE AGENCY
========================================================= */

export const createAgency = async (agencyData) => {
  const { 
    cuid, owner_name, office_name, 
    email, phone, orn, status 
  } = agencyData;
  
  const query = `
    INSERT INTO agency 
    (cuid, owner_name, office_name, email, phone, orn, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    cuid, owner_name, office_name, 
    email, phone, orn, status || 'Active'
  ]);
  
  return result;
};

/* =========================================================
   GET ALL AGENCIES
========================================================= */

export const getAllAgencies = async () => {
  const query = `SELECT * FROM agency ORDER BY create_date DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET AGENCY BY ID
========================================================= */

export const getAgencyById = async (id) => {
  const query = `SELECT * FROM agency WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET AGENCY BY CUID
========================================================= */

export const getAgencyByCuid = async (cuid) => {
  const query = `SELECT * FROM agency WHERE cuid = ?`;
  const [rows] = await pool.query(query, [cuid]);
  return rows[0];
};

/* =========================================================
   UPDATE AGENCY
========================================================= */

export const updateAgency = async (id, agencyData) => {
  const { 
    cuid, owner_name, office_name, 
    email, phone, orn, status 
  } = agencyData;
  
  const query = `
    UPDATE agency 
    SET cuid = ?, owner_name = ?, office_name = ?, 
        email = ?, phone = ?, orn = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    cuid, owner_name, office_name, 
    email, phone, orn, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE AGENCY
========================================================= */

export const deleteAgency = async (id) => {
  const query = `DELETE FROM agency WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};