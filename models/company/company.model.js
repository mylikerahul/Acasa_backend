import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createCompanyTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS company (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cuid VARCHAR(100) UNIQUE,
      company_field VARCHAR(100),
      company_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      trade_licence VARCHAR(255),
      referral VARCHAR(100),
      owner_name VARCHAR(100),
      mobile VARCHAR(50),
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('company table created successfully');
};

/* =========================================================
   CREATE COMPANY
========================================================= */

export const createCompany = async (data) => {
  const { 
    cuid, company_field, company_name, email, 
    trade_licence, referral, owner_name, mobile 
  } = data;
  
  const query = `
    INSERT INTO company 
    (cuid, company_field, company_name, email, trade_licence, referral, owner_name, mobile) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    cuid, company_field, company_name, email, 
    trade_licence, referral, owner_name, mobile
  ]);
  
  return result;
};

/* =========================================================
   GET ALL COMPANIES
========================================================= */

export const getAllCompanies = async () => {
  const query = `SELECT * FROM company ORDER BY create_date DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET COMPANY BY ID
========================================================= */

export const getCompanyById = async (id) => {
  const query = `SELECT * FROM company WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET COMPANY BY CUID
========================================================= */

export const getCompanyByCuid = async (cuid) => {
  const query = `SELECT * FROM company WHERE cuid = ?`;
  const [rows] = await pool.query(query, [cuid]);
  return rows[0];
};

/* =========================================================
   UPDATE COMPANY
========================================================= */

export const updateCompany = async (id, data) => {
  const { 
    cuid, company_field, company_name, email, 
    trade_licence, referral, owner_name, mobile 
  } = data;
  
  const query = `
    UPDATE company 
    SET cuid = ?, company_field = ?, company_name = ?, email = ?, 
        trade_licence = ?, referral = ?, owner_name = ?, mobile = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    cuid, company_field, company_name, email, 
    trade_licence, referral, owner_name, mobile, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE COMPANY
========================================================= */

export const deleteCompany = async (id) => {
  const query = `DELETE FROM company WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};