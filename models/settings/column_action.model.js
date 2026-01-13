import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createColumnActionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS column_action (
      id INT AUTO_INCREMENT PRIMARY KEY,
      module_name VARCHAR(255) NOT NULL,
      lable VARCHAR(255) NOT NULL,
      status TINYINT(1) DEFAULT 1,
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('column_action table created successfully');
};

/* =========================================================
   CREATE ACTION
========================================================= */

export const createColumnAction = async (data) => {
  const { module_name, lable, status } = data;
  
  const query = `
    INSERT INTO column_action (module_name, lable, status) 
    VALUES (?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    module_name, lable, status !== undefined ? status : 1
  ]);
  
  return result;
};

/* =========================================================
   GET ALL ACTIONS
========================================================= */

export const getAllColumnActions = async () => {
  const query = `SELECT * FROM column_action ORDER BY module_name ASC, id ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ACTIONS BY MODULE
========================================================= */

export const getColumnActionsByModule = async (module_name) => {
  const query = `SELECT * FROM column_action WHERE module_name = ?`;
  const [rows] = await pool.query(query, [module_name]);
  return rows;
};

/* =========================================================
   GET BY ID
========================================================= */

export const getColumnActionById = async (id) => {
  const query = `SELECT * FROM column_action WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   UPDATE ACTION
========================================================= */

export const updateColumnAction = async (id, data) => {
  const { module_name, lable, status } = data;
  
  const query = `
    UPDATE column_action 
    SET module_name = ?, lable = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    module_name, lable, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE ACTION
========================================================= */

export const deleteColumnAction = async (id) => {
  const query = `DELETE FROM column_action WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};