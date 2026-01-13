import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createRecentActivityTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS recent_activity (
      id INT AUTO_INCREMENT PRIMARY KEY,
      activity_type VARCHAR(100),
      activity_title VARCHAR(255),
      activity_description TEXT,
      user_name VARCHAR(100),
      user_id INT,
      module VARCHAR(100),
      module_id INT,
      action VARCHAR(50),
      ip_address VARCHAR(50),
      user_agent TEXT,
      metadata JSON,
      status VARCHAR(50) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('recent_activity table created/verified successfully');
};

/* =========================================================
   CREATE ACTIVITY
========================================================= */

export const createActivity = async (data) => {
  const { 
    activity_type, activity_title, activity_description,
    user_name, user_id, module, module_id, action,
    ip_address, user_agent, metadata, status
  } = data;
  
  const query = `
    INSERT INTO recent_activity 
    (activity_type, activity_title, activity_description, user_name, 
     user_id, module, module_id, action, ip_address, user_agent, metadata, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    activity_type || null,
    activity_title || null,
    activity_description || null,
    user_name || null,
    user_id || null,
    module || null,
    module_id || null,
    action || null,
    ip_address || null,
    user_agent || null,
    metadata ? JSON.stringify(metadata) : null,
    status || 'completed'
  ]);
  
  return result;
};

/* =========================================================
   GET ALL ACTIVITIES
========================================================= */

export const getAllActivities = async () => {
  const query = `SELECT * FROM recent_activity ORDER BY id DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ACTIVITY BY ID
========================================================= */

export const getActivityById = async (id) => {
  const query = `SELECT * FROM recent_activity WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET ACTIVITIES BY USER ID
========================================================= */

export const getActivitiesByUserId = async (userId) => {
  const query = `SELECT * FROM recent_activity WHERE user_id = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [userId]);
  return rows;
};

/* =========================================================
   GET ACTIVITIES BY USER NAME
========================================================= */

export const getActivitiesByUserName = async (userName) => {
  const query = `SELECT * FROM recent_activity WHERE user_name = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [userName]);
  return rows;
};

/* =========================================================
   GET ACTIVITIES BY MODULE
========================================================= */

export const getActivitiesByModule = async (module) => {
  const query = `SELECT * FROM recent_activity WHERE module = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [module]);
  return rows;
};

/* =========================================================
   GET ACTIVITIES BY ACTION
========================================================= */

export const getActivitiesByAction = async (action) => {
  const query = `SELECT * FROM recent_activity WHERE action = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [action]);
  return rows;
};

/* =========================================================
   GET ACTIVITIES BY TYPE
========================================================= */

export const getActivitiesByType = async (activityType) => {
  const query = `SELECT * FROM recent_activity WHERE activity_type = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [activityType]);
  return rows;
};

/* =========================================================
   UPDATE ACTIVITY
========================================================= */

export const updateActivity = async (id, data) => {
  const { 
    activity_type, activity_title, activity_description,
    user_name, user_id, module, module_id, action,
    ip_address, user_agent, metadata, status
  } = data;
  
  const query = `
    UPDATE recent_activity 
    SET activity_type = ?, activity_title = ?, activity_description = ?,
        user_name = ?, user_id = ?, module = ?, module_id = ?, action = ?,
        ip_address = ?, user_agent = ?, metadata = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    activity_type || null,
    activity_title || null,
    activity_description || null,
    user_name || null,
    user_id || null,
    module || null,
    module_id || null,
    action || null,
    ip_address || null,
    user_agent || null,
    metadata ? JSON.stringify(metadata) : null,
    status || 'completed',
    id
  ]);
  
  return result;
};

/* =========================================================
   DELETE ACTIVITY
========================================================= */

export const deleteActivity = async (id) => {
  const query = `DELETE FROM recent_activity WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   DELETE OLD ACTIVITIES (Cleanup)
========================================================= */

export const deleteOldActivities = async (days = 30) => {
  const query = `DELETE FROM recent_activity WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`;
  const [result] = await pool.query(query, [days]);
  return result;
};

/* =========================================================
   SEARCH ACTIVITIES
========================================================= */

export const searchActivities = async (searchTerm) => {
  const query = `
    SELECT * FROM recent_activity 
    WHERE activity_title LIKE ? 
       OR activity_description LIKE ? 
       OR user_name LIKE ?
       OR module LIKE ?
       OR action LIKE ?
    ORDER BY id DESC
  `;
  const searchPattern = `%${searchTerm}%`;
  const [rows] = await pool.query(query, [
    searchPattern, searchPattern, searchPattern, searchPattern, searchPattern
  ]);
  return rows;
};

/* =========================================================
   GET ACTIVITIES BY DATE RANGE
========================================================= */

export const getActivitiesByDateRange = async (startDate, endDate) => {
  const query = `SELECT * FROM recent_activity WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC`;
  const [rows] = await pool.query(query, [startDate, endDate]);
  return rows;
};

/* =========================================================
   GET RECENT ACTIVITIES (with limit)
========================================================= */

export const getRecentActivities = async (limit = 10) => {
  const query = `SELECT * FROM recent_activity ORDER BY id DESC LIMIT ?`;
  const [rows] = await pool.query(query, [parseInt(limit)]);
  return rows;
};

/* =========================================================
   GET ACTIVITY STATS
========================================================= */

export const getActivityStats = async () => {
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_month
    FROM recent_activity
  `;
  const [rows] = await pool.query(query);
  return rows[0];
};

/* =========================================================
   GET ACTIVITY COUNT BY MODULE
========================================================= */

export const getActivityCountByModule = async () => {
  const query = `
    SELECT module, COUNT(*) as count 
    FROM recent_activity 
    WHERE module IS NOT NULL
    GROUP BY module 
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ACTIVITY COUNT BY ACTION
========================================================= */

export const getActivityCountByAction = async () => {
  const query = `
    SELECT action, COUNT(*) as count 
    FROM recent_activity 
    WHERE action IS NOT NULL
    GROUP BY action 
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   CLEAR ALL ACTIVITIES
========================================================= */

export const clearAllActivities = async () => {
  const query = `TRUNCATE TABLE recent_activity`;
  const [result] = await pool.query(query);
  return result;
};