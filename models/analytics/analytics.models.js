import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createAnalyticsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS analytics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(100),
      event_name VARCHAR(255),
      category VARCHAR(100),
      user_id INT,
      user_name VARCHAR(100),
      session_id VARCHAR(255),
      page_url VARCHAR(500),
      page_title VARCHAR(255),
      referrer VARCHAR(500),
      device_type VARCHAR(50),
      browser VARCHAR(100),
      os VARCHAR(100),
      screen_resolution VARCHAR(50),
      country VARCHAR(100),
      city VARCHAR(100),
      ip_address VARCHAR(50),
      duration INT,
      metadata JSON,
      status VARCHAR(50) DEFAULT 'recorded',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_event_type (event_type),
      INDEX idx_user_id (user_id),
      INDEX idx_session_id (session_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('analytics table created/verified successfully');
};

/* =========================================================
   CREATE ANALYTICS EVENT
========================================================= */

export const createAnalyticsEvent = async (data) => {
  const { 
    event_type, event_name, category, user_id, user_name,
    session_id, page_url, page_title, referrer,
    device_type, browser, os, screen_resolution,
    country, city, ip_address, duration, metadata, status
  } = data;
  
  const query = `
    INSERT INTO analytics 
    (event_type, event_name, category, user_id, user_name, session_id,
     page_url, page_title, referrer, device_type, browser, os,
     screen_resolution, country, city, ip_address, duration, metadata, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    event_type || null,
    event_name || null,
    category || null,
    user_id || null,
    user_name || null,
    session_id || null,
    page_url || null,
    page_title || null,
    referrer || null,
    device_type || null,
    browser || null,
    os || null,
    screen_resolution || null,
    country || null,
    city || null,
    ip_address || null,
    duration || null,
    metadata ? JSON.stringify(metadata) : null,
    status || 'recorded'
  ]);
  
  return result;
};

/* =========================================================
   GET ALL ANALYTICS
========================================================= */

export const getAllAnalytics = async () => {
  const query = `SELECT * FROM analytics ORDER BY id DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ANALYTICS BY ID
========================================================= */

export const getAnalyticsById = async (id) => {
  const query = `SELECT * FROM analytics WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET ANALYTICS BY USER ID
========================================================= */

export const getAnalyticsByUserId = async (userId) => {
  const query = `SELECT * FROM analytics WHERE user_id = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [userId]);
  return rows;
};

/* =========================================================
   GET ANALYTICS BY SESSION ID
========================================================= */

export const getAnalyticsBySessionId = async (sessionId) => {
  const query = `SELECT * FROM analytics WHERE session_id = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [sessionId]);
  return rows;
};

/* =========================================================
   GET ANALYTICS BY EVENT TYPE
========================================================= */

export const getAnalyticsByEventType = async (eventType) => {
  const query = `SELECT * FROM analytics WHERE event_type = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [eventType]);
  return rows;
};

/* =========================================================
   GET ANALYTICS BY CATEGORY
========================================================= */

export const getAnalyticsByCategory = async (category) => {
  const query = `SELECT * FROM analytics WHERE category = ? ORDER BY id DESC`;
  const [rows] = await pool.query(query, [category]);
  return rows;
};

/* =========================================================
   UPDATE ANALYTICS EVENT
========================================================= */

export const updateAnalyticsEvent = async (id, data) => {
  const { 
    event_type, event_name, category, user_id, user_name,
    session_id, page_url, page_title, referrer,
    device_type, browser, os, screen_resolution,
    country, city, ip_address, duration, metadata, status
  } = data;
  
  const query = `
    UPDATE analytics 
    SET event_type = ?, event_name = ?, category = ?, user_id = ?, user_name = ?,
        session_id = ?, page_url = ?, page_title = ?, referrer = ?,
        device_type = ?, browser = ?, os = ?, screen_resolution = ?,
        country = ?, city = ?, ip_address = ?, duration = ?, metadata = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    event_type || null,
    event_name || null,
    category || null,
    user_id || null,
    user_name || null,
    session_id || null,
    page_url || null,
    page_title || null,
    referrer || null,
    device_type || null,
    browser || null,
    os || null,
    screen_resolution || null,
    country || null,
    city || null,
    ip_address || null,
    duration || null,
    metadata ? JSON.stringify(metadata) : null,
    status || 'recorded',
    id
  ]);
  
  return result;
};

/* =========================================================
   DELETE ANALYTICS EVENT
========================================================= */

export const deleteAnalyticsEvent = async (id) => {
  const query = `DELETE FROM analytics WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   DELETE OLD ANALYTICS (Cleanup)
========================================================= */

export const deleteOldAnalytics = async (days = 90) => {
  const query = `DELETE FROM analytics WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`;
  const [result] = await pool.query(query, [days]);
  return result;
};

/* =========================================================
   SEARCH ANALYTICS
========================================================= */

export const searchAnalytics = async (searchTerm) => {
  const query = `
    SELECT * FROM analytics 
    WHERE event_name LIKE ? 
       OR page_url LIKE ? 
       OR page_title LIKE ?
       OR user_name LIKE ?
    ORDER BY id DESC
  `;
  const searchPattern = `%${searchTerm}%`;
  const [rows] = await pool.query(query, [
    searchPattern, searchPattern, searchPattern, searchPattern
  ]);
  return rows;
};

/* =========================================================
   GET ANALYTICS BY DATE RANGE
========================================================= */

export const getAnalyticsByDateRange = async (startDate, endDate) => {
  const query = `SELECT * FROM analytics WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC`;
  const [rows] = await pool.query(query, [startDate, endDate]);
  return rows;
};

/* =========================================================
   GET RECENT ANALYTICS
========================================================= */

export const getRecentAnalytics = async (limit = 20) => {
  const query = `SELECT * FROM analytics ORDER BY id DESC LIMIT ?`;
  const [rows] = await pool.query(query, [parseInt(limit)]);
  return rows;
};

/* =========================================================
   GET ANALYTICS STATS
========================================================= */

export const getAnalyticsStats = async () => {
  const query = `
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_events,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as week_events,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as month_events,
      AVG(duration) as avg_duration
    FROM analytics
  `;
  const [rows] = await pool.query(query);
  return rows[0];
};

/* =========================================================
   GET EVENT COUNT BY TYPE
========================================================= */

export const getEventCountByType = async () => {
  const query = `
    SELECT event_type, COUNT(*) as count 
    FROM analytics 
    WHERE event_type IS NOT NULL
    GROUP BY event_type 
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET EVENT COUNT BY CATEGORY
========================================================= */

export const getEventCountByCategory = async () => {
  const query = `
    SELECT category, COUNT(*) as count 
    FROM analytics 
    WHERE category IS NOT NULL
    GROUP BY category 
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET POPULAR PAGES
========================================================= */

export const getPopularPages = async (limit = 10) => {
  const query = `
    SELECT page_url, page_title, COUNT(*) as views
    FROM analytics 
    WHERE page_url IS NOT NULL
    GROUP BY page_url, page_title
    ORDER BY views DESC
    LIMIT ?
  `;
  const [rows] = await pool.query(query, [parseInt(limit)]);
  return rows;
};

/* =========================================================
   GET DEVICE STATISTICS
========================================================= */

export const getDeviceStats = async () => {
  const query = `
    SELECT 
      device_type,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics), 2) as percentage
    FROM analytics 
    WHERE device_type IS NOT NULL
    GROUP BY device_type
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET BROWSER STATISTICS
========================================================= */

export const getBrowserStats = async () => {
  const query = `
    SELECT 
      browser,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics), 2) as percentage
    FROM analytics 
    WHERE browser IS NOT NULL
    GROUP BY browser
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET COUNTRY STATISTICS
========================================================= */

export const getCountryStats = async () => {
  const query = `
    SELECT 
      country,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics), 2) as percentage
    FROM analytics 
    WHERE country IS NOT NULL
    GROUP BY country
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET HOURLY DISTRIBUTION
========================================================= */

export const getHourlyDistribution = async () => {
  const query = `
    SELECT 
      HOUR(created_at) as hour,
      COUNT(*) as count
    FROM analytics 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY HOUR(created_at)
    ORDER BY hour
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET DAILY DISTRIBUTION (Last 30 days)
========================================================= */

export const getDailyDistribution = async () => {
  const query = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM analytics 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   CLEAR ALL ANALYTICS
========================================================= */

export const clearAllAnalytics = async () => {
  const query = `TRUNCATE TABLE analytics`;
  const [result] = await pool.query(query);
  return result;
};