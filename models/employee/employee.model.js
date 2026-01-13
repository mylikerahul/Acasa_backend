import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION - EMPLOYEE
========================================================= */

export const createEmployeeTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS employee (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cuid VARCHAR(255) NOT NULL UNIQUE,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      mobile VARCHAR(20) NOT NULL UNIQUE,
      orn_number VARCHAR(100) UNIQUE,
      status VARCHAR(50) DEFAULT 'Active',
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(255),
      languages VARCHAR(255), 
      heading VARCHAR(255),
      descriptions TEXT,
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  try {
    await pool.query(query);
    console.log('employee table created successfully');
  } catch (error) {
    console.error('Error creating employee table:', error);
    throw error;
  }
};

/* =========================================================
   CREATE EMPLOYEE
========================================================= */

export const createEmployee = async (data) => {
  const { 
    cuid, first_name, last_name, email, mobile, orn_number, 
    status, slug, title, languages, heading, descriptions, 
    seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    INSERT INTO employee 
    (cuid, first_name, last_name, email, mobile, orn_number, 
     status, slug, title, languages, heading, descriptions, 
     seo_title, seo_keywork, seo_description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  try {
    const [result] = await pool.query(query, [
      cuid, first_name, last_name, email, mobile, orn_number, 
      status || 'Active', slug, title, languages, heading, descriptions, 
      seo_title, seo_keywork, seo_description
    ]);
    return result;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

/* =========================================================
   GET ALL employee
========================================================= */

export const getAllemployee = async () => {
  // Ordered by last name, then first name for logical sorting
  const query = `SELECT * FROM employee ORDER BY last_name ASC, first_name ASC`;
  try {
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching all employee:', error);
    throw error;
  }
};

/* =========================================================
   GET EMPLOYEE BY ID
========================================================= */

export const getEmployeeById = async (id) => {
  const query = `SELECT * FROM employee WHERE id = ?`;
  try {
    const [rows] = await pool.query(query, [id]);
    return rows[0]; // Return the first matching row, or undefined
  } catch (error) {
    console.error(`Error fetching employee by ID (${id}):`, error);
    throw error;
  }
};

/* =========================================================
   GET EMPLOYEE BY CUID
========================================================= */

export const getEmployeeByCuid = async (cuid) => {
  const query = `SELECT * FROM employee WHERE cuid = ?`;
  try {
    const [rows] = await pool.query(query, [cuid]);
    return rows[0]; // Return the first matching row, or undefined
  } catch (error) {
    console.error(`Error fetching employee by CUID (${cuid}):`, error);
    throw error;
  }
};

/* =========================================================
   GET EMPLOYEE BY SLUG
========================================================= */

export const getEmployeeBySlug = async (slug) => {
  const query = `SELECT * FROM employee WHERE slug = ?`;
  try {
    const [rows] = await pool.query(query, [slug]);
    return rows[0]; // Return the first matching row, or undefined
  } catch (error) {
    console.error(`Error fetching employee by slug (${slug}):`, error);
    throw error;
  }
};

/* =========================================================
   UPDATE EMPLOYEE
========================================================= */

export const updateEmployee = async (id, data) => {
  const { 
    cuid, first_name, last_name, email, mobile, orn_number, 
    status, slug, title, languages, heading, descriptions, 
    seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    UPDATE employee 
    SET cuid = ?, first_name = ?, last_name = ?, email = ?, mobile = ?, orn_number = ?, 
        status = ?, slug = ?, title = ?, languages = ?, heading = ?, descriptions = ?, 
        seo_title = ?, seo_keywork = ?, seo_description = ?
    WHERE id = ?
  `;
  
  try {
    const [result] = await pool.query(query, [
      cuid, first_name, last_name, email, mobile, orn_number, 
      status, slug, title, languages, heading, descriptions, 
      seo_title, seo_keywork, seo_description, id
    ]);
    return result;
  } catch (error) {
    console.error(`Error updating employee with ID (${id}):`, error);
    throw error;
  }
};

/* =========================================================
   DELETE EMPLOYEE
========================================================= */

export const deleteEmployee = async (id) => {
  const query = `DELETE FROM employee WHERE id = ?`;
  try {
    const [result] = await pool.query(query, [id]);
    return result;
  } catch (error) {
    console.error(`Error deleting employee with ID (${id}):`, error);
    throw error;
  }
};