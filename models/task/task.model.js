import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createTasksTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      Commission VARCHAR(255),
      assign VARCHAR(100),
      date DATE,
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      descriptions TEXT,
      heading VARCHAR(255),
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('tasks table created/verified successfully');
};

/* =========================================================
   CREATE TASK
========================================================= */

export const createTask = async (data) => {
  const { 
    Commission, assign, date, title, slug,
    descriptions, heading, seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    INSERT INTO tasks 
    (Commission, assign, date, title, slug, descriptions, 
     heading, seo_title, seo_keywork, seo_description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    Commission || null,
    assign || null,
    date || null,
    title || null,
    slug || null,
    descriptions || null,
    heading || null,
    seo_title || null,
    seo_keywork || null,
    seo_description || null
  ]);
  
  return result;
};

/* =========================================================
   GET ALL TASKS
========================================================= */

export const getAllTasks = async () => {
  const query = `SELECT * FROM tasks ORDER BY id DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET TASK BY ID
========================================================= */

export const getTaskById = async (id) => {
  const query = `SELECT * FROM tasks WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET TASK BY SLUG
========================================================= */

export const getTaskBySlug = async (slug) => {
  const query = `SELECT * FROM tasks WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   UPDATE TASK
========================================================= */

export const updateTask = async (id, data) => {
  const { 
    Commission, assign, date, title, slug,
    descriptions, heading, seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    UPDATE tasks 
    SET Commission = ?, assign = ?, date = ?, title = ?, slug = ?,
        descriptions = ?, heading = ?, seo_title = ?, seo_keywork = ?, seo_description = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    Commission || null,
    assign || null,
    date || null,
    title || null,
    slug || null,
    descriptions || null,
    heading || null,
    seo_title || null,
    seo_keywork || null,
    seo_description || null,
    id
  ]);
  
  return result;
};

/* =========================================================
   DELETE TASK
========================================================= */

export const deleteTask = async (id) => {
  const query = `DELETE FROM tasks WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   SEARCH TASKS
========================================================= */

export const searchTasks = async (searchTerm) => {
  const query = `
    SELECT * FROM tasks 
    WHERE title LIKE ? 
       OR heading LIKE ? 
       OR assign LIKE ?
       OR Commission LIKE ?
       OR descriptions LIKE ?
    ORDER BY id DESC
  `;
  const searchPattern = `%${searchTerm}%`;
  const [rows] = await pool.query(query, [
    searchPattern, searchPattern, searchPattern, searchPattern, searchPattern
  ]);
  return rows;
};

/* =========================================================
   GET TASKS BY ASSIGNEE
========================================================= */

export const getTasksByAssignee = async (assignee) => {
  const query = `SELECT * FROM tasks WHERE assign = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [assignee]);
  return rows;
};

/* =========================================================
   GET TASKS BY DATE RANGE
========================================================= */

export const getTasksByDateRange = async (startDate, endDate) => {
  const query = `SELECT * FROM tasks WHERE date BETWEEN ? AND ? ORDER BY date DESC`;
  const [rows] = await pool.query(query, [startDate, endDate]);
  return rows;
};

/* =========================================================
   GET RECENT TASKS
========================================================= */

export const getRecentTasks = async (limit = 5) => {
  const query = `SELECT * FROM tasks ORDER BY id DESC LIMIT ?`;
  const [rows] = await pool.query(query, [parseInt(limit)]);
  return rows;
};