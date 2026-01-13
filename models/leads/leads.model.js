import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createLeadsTable = async () => {
  // 1. Create Basic Table Structure
  const createQuery = `
    CREATE TABLE IF NOT EXISTS leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip VARCHAR(50),
      property_id INT,
      agent_id INT,
      slug VARCHAR(255),
      title VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      message TEXT,
      attachment VARCHAR(500),
      status VARCHAR(50) DEFAULT 'New',
      heading VARCHAR(255),
      descriptions TEXT,
      sub_title VARCHAR(255),
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(createQuery);

  // 2. Safe Foreign Key Injection
  try {
    const [check] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND CONSTRAINT_NAME = 'fk_leads_property'`
    );

    if (check.length === 0) {
      // Helper to link FK safely
      const addFk = async (colName, refTable, constraintName) => {
        const [refCols] = await pool.query(`SHOW COLUMNS FROM ${refTable} LIKE 'id'`).catch(() => [[]]);
        if (refCols.length > 0) {
          const typeStr = refCols[0].Type.toLowerCase();
          const defineType = typeStr.includes('unsigned') ? 'INT UNSIGNED' : 'INT';

          await pool.query(`ALTER TABLE leads MODIFY COLUMN ${colName} ${defineType}`);
          await pool.query(`
            ALTER TABLE leads
            ADD CONSTRAINT ${constraintName} FOREIGN KEY (${colName}) REFERENCES ${refTable}(id) ON DELETE SET NULL
          `);
        }
      };

      // Link to Properties
      await addFk('property_id', 'properties', 'fk_leads_property');
      
      // Link to Agents (Users)
      await addFk('agent_id', 'users', 'fk_leads_agent');

      console.log('✅ Foreign Keys added to leads successfully');
    }
  } catch (error) {
    if (!error.message.includes("Duplicate")) {
      console.warn("⚠️ Warning: Could not add Foreign Keys to 'leads'.", error.message);
    }
  }
};

/* =========================================================
   CREATE LEAD
========================================================= */

export const createLead = async (data) => {
  const { 
    ip, property_id, agent_id, slug, title, name, email, phone, 
    message, attachment, status, heading, descriptions, 
    sub_title, seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    INSERT INTO leads 
    (ip, property_id, agent_id, slug, title, name, email, phone, 
     message, attachment, status, heading, descriptions, 
     sub_title, seo_title, seo_keywork, seo_description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    ip, property_id, agent_id, slug, title, name, email, phone, 
    message, attachment, status || 'New', heading, descriptions, 
    sub_title, seo_title, seo_keywork, seo_description
  ]);
  
  return result;
};

/* =========================================================
   GET ALL LEADS
========================================================= */

export const getAllLeads = async () => {
  const query = `SELECT * FROM leads ORDER BY created_at DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET LEAD BY ID
========================================================= */

export const getLeadById = async (id) => {
  const query = `SELECT * FROM leads WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET LEADS BY AGENT
========================================================= */

export const getLeadsByAgentId = async (agent_id) => {
  const query = `SELECT * FROM leads WHERE agent_id = ? ORDER BY created_at DESC`;
  const [rows] = await pool.query(query, [agent_id]);
  return rows;
};

/* =========================================================
   UPDATE LEAD
========================================================= */

export const updateLead = async (id, data) => {
  const { 
    property_id, agent_id, slug, title, name, email, phone, 
    message, attachment, status, heading, descriptions, 
    sub_title, seo_title, seo_keywork, seo_description 
  } = data;
  
  const query = `
    UPDATE leads 
    SET property_id=?, agent_id=?, slug=?, title=?, name=?, email=?, phone=?, 
        message=?, attachment=?, status=?, heading=?, descriptions=?, 
        sub_title=?, seo_title=?, seo_keywork=?, seo_description=?
    WHERE id=?
  `;
  
  const [result] = await pool.query(query, [
    property_id, agent_id, slug, title, name, email, phone, 
    message, attachment, status, heading, descriptions, 
    sub_title, seo_title, seo_keywork, seo_description, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE LEAD
========================================================= */

export const deleteLead = async (id) => {
  const query = `DELETE FROM leads WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};