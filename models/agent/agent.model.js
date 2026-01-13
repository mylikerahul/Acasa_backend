import pool from '../../config/db.js';

/* =========================================================
   AUTO-FIX HELPER (Internal Use)
========================================================= */
const fixMissingColumn = async (columnName) => {
  try {
    console.log(`🛠️ Attempting to add/fix column: '${columnName}'...`);
    await pool.query(`ALTER TABLE agents ADD COLUMN ${columnName} VARCHAR(255) DEFAULT NULL`);
    console.log(`✅ FIXED: Column '${columnName}' added.`);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') console.log(`⚠️ Note: ${error.message}`);
  }
};

/* =========================================================
   TABLE SETUP & TYPE CORRECTION
========================================================= */
export const createAgentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS agents (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(50),
      slug VARCHAR(255) UNIQUE,
      sub_title VARCHAR(255),
      cuid VARCHAR(100),
      image VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      nationality VARCHAR(100),
      orn_number VARCHAR(100),
      orn VARCHAR(100),
      brn VARCHAR(100),
      mobile VARCHAR(50),
      designation VARCHAR(255),
      languages TEXT,
      aos TEXT,
      company VARCHAR(255),
      email VARCHAR(255),
      descriptions TEXT,
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(255),
      seo_description TEXT,
      status INT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(query);

  // =========================================================
  // 🚨 CRITICAL FIXES (Run every restart to ensure schema is correct)
  // =========================================================
  try {
    // 1. Fix 'descriptions' type (Change from INT to TEXT)
    await pool.query("ALTER TABLE agents MODIFY COLUMN descriptions TEXT");
    // 2. Fix 'aos' type (Change from INT to TEXT)
    await pool.query("ALTER TABLE agents MODIFY COLUMN aos TEXT");
    // 3. Fix 'languages' type
    await pool.query("ALTER TABLE agents MODIFY COLUMN languages TEXT");
    
    console.log("✅ Database Schema Synced: Text columns verified.");
  } catch (error) {
    console.log("⚠️ Schema Check:", error.message);
  }
};

/* =========================================================
   CREATE AGENT
========================================================= */
export const createAgent = async (data) => {
  const cleanData = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== 'null') {
      cleanData[key] = data[key];
    }
  });

  const fields = Object.keys(cleanData).join(', ');
  const placeholders = Object.keys(cleanData).map(() => '?').join(', ');
  const values = Object.values(cleanData);

  const query = `INSERT INTO agents (${fields}) VALUES (${placeholders})`;

  try {
    const [result] = await pool.query(query, values);
    return result;
  } catch (error) {
    // Auto-create missing image column if generic error
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      if (error.message.includes("'image'")) await fixMissingColumn('image');
      if (error.message.includes("'designation'")) await fixMissingColumn('designation');
      // Retry
      const [retry] = await pool.query(query, values);
      return retry;
    }
    throw error;
  }
};

/* =========================================================
   GET ALL AGENTS
========================================================= */
export const getAllAgents = async () => {
  const query = `SELECT * FROM agents ORDER BY created_at DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET AGENT BY ID
========================================================= */
export const getAgentById = async (id) => {
  const query = `SELECT * FROM agents WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET AGENT BY SLUG
========================================================= */
export const getAgentBySlug = async (slug) => {
  const query = `SELECT * FROM agents WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   SEARCH AGENTS
========================================================= */
export const searchAgents = async (searchTerm) => {
  const term = `%${searchTerm}%`;
  const query = `
    SELECT * FROM agents 
    WHERE name LIKE ? OR email LIKE ? OR mobile LIKE ?
    ORDER BY created_at DESC
  `;
  const [rows] = await pool.query(query, [term, term, term]);
  return rows;
};

/* =========================================================
   UPDATE AGENT
========================================================= */
export const updateAgent = async (id, data) => {
  const cleanData = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== 'null') {
      cleanData[key] = data[key];
    }
  });

  const fields = Object.keys(cleanData).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(cleanData), id];

  const query = `UPDATE agents SET ${fields} WHERE id = ?`;
  
  try {
    const [result] = await pool.query(query, values);
    return result;
  } catch (error) {
     // Fix missing column on Update too
     if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes("'image'")) {
        await fixMissingColumn('image');
        const [retryResult] = await pool.query(query, values);
        return retryResult;
     }
     throw error;
  }
};

/* =========================================================
   DELETE AGENT
========================================================= */
export const deleteAgent = async (id) => {
  const query = `UPDATE agents SET status = 0 WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};