import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createUserDocumentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      project_id INT,
      doc_type VARCHAR(100) NOT NULL,
      id_number VARCHAR(100),
      expiry_date DATE,
      attachment VARCHAR(500),
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `;
  
  await pool.query(query);
  console.log('users_documents table created successfully');
};

/* =========================================================
   CREATE DOCUMENT
========================================================= */

export const createUserDocument = async (documentData) => {
  const { user_id, project_id, doc_type, id_number, expiry_date, attachment } = documentData;
  
  const query = `
    INSERT INTO users_documents 
    (user_id, project_id, doc_type, id_number, expiry_date, attachment) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [user_id, project_id, doc_type, id_number, expiry_date, attachment]);
  return result;
};

/* =========================================================
   GET ALL DOCUMENTS
========================================================= */

export const getAllUserDocuments = async () => {
  const query = `SELECT * FROM users_documents ORDER BY create_date DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET DOCUMENT BY ID
========================================================= */

export const getUserDocumentById = async (id) => {
  const query = `SELECT * FROM users_documents WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET DOCUMENTS BY USER ID
========================================================= */

export const getDocumentsByUserId = async (user_id) => {
  const query = `SELECT * FROM users_documents WHERE user_id = ? ORDER BY create_date DESC`;
  const [rows] = await pool.query(query, [user_id]);
  return rows;
};

/* =========================================================
   GET DOCUMENTS BY PROJECT ID
========================================================= */

export const getDocumentsByProjectId = async (project_id) => {
  const query = `SELECT * FROM users_documents WHERE project_id = ? ORDER BY create_date DESC`;
  const [rows] = await pool.query(query, [project_id]);
  return rows;
};

/* =========================================================
   UPDATE DOCUMENT
========================================================= */

export const updateUserDocument = async (id, documentData) => {
  const { user_id, project_id, doc_type, id_number, expiry_date, attachment } = documentData;
  
  const query = `
    UPDATE users_documents 
    SET user_id = ?, project_id = ?, doc_type = ?, id_number = ?, expiry_date = ?, attachment = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [user_id, project_id, doc_type, id_number, expiry_date, attachment, id]);
  return result;
};

/* =========================================================
   DELETE DOCUMENT
========================================================= */

export const deleteUserDocument = async (id) => {
  const query = `DELETE FROM users_documents WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   DELETE DOCUMENTS BY USER ID
========================================================= */

export const deleteDocumentsByUserId = async (user_id) => {
  const query = `DELETE FROM users_documents WHERE user_id = ?`;
  const [result] = await pool.query(query, [user_id]);
  return result;
};