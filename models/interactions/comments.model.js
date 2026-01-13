import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createCommentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      p_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      send_by INT,
      replyed_by INT,
      send_date TIMESTAMP,
      replyed_date TIMESTAMP NULL,
      comment TEXT,
      status TINYINT(1) DEFAULT 0,
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (send_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (replyed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('comments table created successfully');
};

/* =========================================================
   CREATE COMMENT
========================================================= */

export const createComment = async (data) => {
  const { 
    p_id, type, send_by, replyed_by, 
    send_date, replyed_date, comment, status 
  } = data;
  
  const query = `
    INSERT INTO comments 
    (p_id, type, send_by, replyed_by, send_date, replyed_date, comment, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    p_id, type, send_by, replyed_by, 
    send_date || new Date(), replyed_date, comment, status || 0
  ]);
  
  return result;
};

/* =========================================================
   GET ALL COMMENTS
========================================================= */

export const getAllComments = async () => {
  const query = `SELECT * FROM comments ORDER BY create_date DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET COMMENTS BY PARENT (Entity ID & Type)
========================================================= */

export const getCommentsByEntity = async (p_id, type) => {
  const query = `
    SELECT c.*, u.first_name, u.last_name, u.email 
    FROM comments c
    LEFT JOIN users u ON c.send_by = u.id
    WHERE c.p_id = ? AND c.type = ? 
    ORDER BY c.create_date ASC
  `;
  const [rows] = await pool.query(query, [p_id, type]);
  return rows;
};

/* =========================================================
   GET COMMENT BY ID
========================================================= */

export const getCommentById = async (id) => {
  const query = `SELECT * FROM comments WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   UPDATE COMMENT
========================================================= */

export const updateComment = async (id, data) => {
  const { 
    p_id, type, send_by, replyed_by, 
    send_date, replyed_date, comment, status 
  } = data;
  
  const query = `
    UPDATE comments 
    SET p_id = ?, type = ?, send_by = ?, replyed_by = ?, 
        send_date = ?, replyed_date = ?, comment = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    p_id, type, send_by, replyed_by, 
    send_date, replyed_date, comment, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE COMMENT
========================================================= */

export const deleteComment = async (id) => {
  const query = `DELETE FROM comments WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};