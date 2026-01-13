import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createAppliedJobsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS applyed_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      message TEXT,
      resume VARCHAR(500),
      current_last_employer VARCHAR(255),
      current_job_title VARCHAR(255),
      employment_status VARCHAR(100),
      term TINYINT(1) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Pending',
      apply_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('applyed_jobs table created successfully');
};

/* =========================================================
   CREATE APPLICATION
========================================================= */

export const createApplication = async (data) => {
  const { 
    first_name, last_name, email, phone, message, 
    resume, current_last_employer, current_job_title, 
    employment_status, term, status 
  } = data;
  
  const query = `
    INSERT INTO applyed_jobs 
    (first_name, last_name, email, phone, message, 
     resume, current_last_employer, current_job_title, 
     employment_status, term, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    first_name, last_name, email, phone, message, 
    resume, current_last_employer, current_job_title, 
    employment_status, term || 0, status || 'Pending'
  ]);
  
  return result;
};

/* =========================================================
   GET ALL APPLICATIONS
========================================================= */

export const getAllApplications = async () => {
  const query = `SELECT * FROM applyed_jobs ORDER BY apply_date DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET APPLICATION BY ID
========================================================= */

export const getApplicationById = async (id) => {
  const query = `SELECT * FROM applyed_jobs WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   UPDATE APPLICATION
========================================================= */

export const updateApplication = async (id, data) => {
  const { 
    first_name, last_name, email, phone, message, 
    resume, current_last_employer, current_job_title, 
    employment_status, term, status 
  } = data;
  
  const query = `
    UPDATE applyed_jobs 
    SET first_name = ?, last_name = ?, email = ?, phone = ?, message = ?, 
        resume = ?, current_last_employer = ?, current_job_title = ?, 
        employment_status = ?, term = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    first_name, last_name, email, phone, message, 
    resume, current_last_employer, current_job_title, 
    employment_status, term, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE APPLICATION
========================================================= */

export const deleteApplication = async (id) => {
  const query = `DELETE FROM applyed_jobs WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};