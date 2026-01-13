import pool from '../../config/db.js';

// ==================== TABLE CREATION + MIGRATION ====================
export const createSubscribeTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS subscribers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createTableQuery);

  // Migration safety
  await pool.query(`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`);
  await pool.query(`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP;`);
};

// ==================== CREATE SUBSCRIBER ====================
export const createSubscriber = async (email) => {
  const query = `
    INSERT INTO subscribers (email)
    VALUES ($1)
    ON CONFLICT (email) 
    DO UPDATE SET is_active = true, unsubscribed_at = NULL, updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const result = await pool.query(query, [email.toLowerCase().trim()]);
  return result.rows[0];
};

// ==================== GET ALL SUBSCRIBERS ====================
export const getAllSubscribers = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  
  let query = `SELECT * FROM subscribers WHERE 1=1`;
  let countQuery = `SELECT COUNT(*) FROM subscribers WHERE 1=1`;
  const params = [];
  const countParams = [];

  if (search) {
    params.push(`%${search}%`);
    countParams.push(`%${search}%`);
    query += ` AND email ILIKE $${params.length}`;
    countQuery += ` AND email ILIKE $${countParams.length}`;
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  const countResult = await pool.query(countQuery, countParams);

  return {
    subscribers: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
  };
};

// ==================== GET SUBSCRIBER BY ID ====================
export const getSubscriberById = async (id) => {
  const query = `SELECT * FROM subscribers WHERE id = $1;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// ==================== GET SUBSCRIBER BY EMAIL ====================
export const getSubscriberByEmail = async (email) => {
  const query = `SELECT * FROM subscribers WHERE email = $1;`;
  const result = await pool.query(query, [email.toLowerCase().trim()]);
  return result.rows[0];
};

// ==================== UPDATE SUBSCRIBER STATUS ====================
export const updateSubscriberStatus = async (id, is_active) => {
  const query = `
    UPDATE subscribers 
    SET is_active = $1, 
        unsubscribed_at = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;
  const unsubscribedAt = is_active ? null : new Date();
  const result = await pool.query(query, [is_active, unsubscribedAt, id]);
  return result.rows[0];
};

// ==================== DELETE SUBSCRIBER ====================
export const deleteSubscriber = async (id) => {
  const query = `DELETE FROM subscribers WHERE id = $1 RETURNING *;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// ==================== UNSUBSCRIBE BY EMAIL ====================
export const unsubscribeByEmail = async (email) => {
  const query = `
    UPDATE subscribers 
    SET is_active = false, 
        unsubscribed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [email.toLowerCase().trim()]);
  return result.rows[0];
};

// ==================== GET ACTIVE SUBSCRIBERS COUNT ====================
export const getActiveSubscribersCount = async () => {
  const query = `SELECT COUNT(*) FROM subscribers WHERE is_active = true;`;
  const result = await pool.query(query);
  return parseInt(result.rows[0].count);
};