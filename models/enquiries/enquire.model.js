import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createEnquireTable = async () => {
  // 1. Create Basic Table
  const createQuery = `
    CREATE TABLE IF NOT EXISTS enquire (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contact_id INT,
      property_id INT,
      project_item_id INT,
      item_type VARCHAR(100),
      type VARCHAR(100),
      source VARCHAR(100),
      agent_id INT,
      country INT, 
      priority VARCHAR(50),
      quality VARCHAR(50),
      contact_type VARCHAR(50),
      agent_activity TEXT,
      admin_activity TEXT,
      listing_type VARCHAR(50),
      exclusive_status VARCHAR(50),
      construction_status VARCHAR(50),
      state_id INT,
      community_id INT,
      sub_community_id INT,
      project_id INT,
      building VARCHAR(255),
      price_min DECIMAL(15,2),
      price_max DECIMAL(15,2),
      bedroom_min INT,
      bedroom_max INT,
      contact_source VARCHAR(255),
      lead_source VARCHAR(255),
      property_image VARCHAR(500),
      message TEXT,
      resume VARCHAR(500),
      drip_marketing TINYINT(1) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'New',
      contact_date DATE,
      lead_status VARCHAR(50),
      lost_status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(createQuery);

  // 2. Safe Foreign Key Injection
  try {
    const [check] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enquire' AND CONSTRAINT_NAME = 'fk_enq_property'`
    );

    if (check.length === 0) {
      const addFk = async (colName, refTable, constraintName) => {
        const [refCols] = await pool.query(`SHOW COLUMNS FROM ${refTable} LIKE 'id'`).catch(() => [[]]);
        if (refCols.length > 0) {
          const typeStr = refCols[0].Type.toLowerCase();
          const defineType = typeStr.includes('unsigned') ? 'INT UNSIGNED' : 'INT';
          
          await pool.query(`ALTER TABLE enquire MODIFY COLUMN ${colName} ${defineType}`);
          await pool.query(`
            ALTER TABLE enquire
            ADD CONSTRAINT ${constraintName} FOREIGN KEY (${colName}) REFERENCES ${refTable}(id) ON DELETE SET NULL
          `);
        }
      };

      // Add FKs
      await addFk('property_id', 'properties', 'fk_enq_property');
      await addFk('agent_id', 'users', 'fk_enq_agent');
      await addFk('project_id', 'projects', 'fk_enq_project');
      await addFk('country', 'countries', 'fk_enq_country');
      await addFk('state_id', 'states', 'fk_enq_state');
      await addFk('community_id', 'community', 'fk_enq_community');
      
      console.log('✅ Foreign Keys added to enquire successfully');
    }
  } catch (error) {
    if (!error.message.includes("Duplicate")) {
      console.warn("⚠️ Warning: Could not add Foreign Keys to 'enquire'.", error.message);
    }
  }
};

/* =========================================================
   CREATE ENQUIRY
========================================================= */

export const createEnquire = async (data) => {
  const {
    contact_id, property_id, project_item_id, item_type, type, source, agent_id,
    country, priority, quality, contact_type, agent_activity, admin_activity,
    listing_type, exclusive_status, construction_status, state_id, community_id,
    sub_community_id, project_id, building, price_min, price_max, bedroom_min,
    bedroom_max, contact_source, lead_source, property_image, message, resume,
    drip_marketing, status, contact_date, lead_status, lost_status
  } = data;

  const query = `
    INSERT INTO enquire 
    (contact_id, property_id, project_item_id, item_type, type, source, agent_id,
     country, priority, quality, contact_type, agent_activity, admin_activity,
     listing_type, exclusive_status, construction_status, state_id, community_id,
     sub_community_id, project_id, building, price_min, price_max, bedroom_min,
     bedroom_max, contact_source, lead_source, property_image, message, resume,
     drip_marketing, status, contact_date, lead_status, lost_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    contact_id, property_id, project_item_id, item_type, type, source, agent_id,
    country, priority, quality, contact_type, agent_activity, admin_activity,
    listing_type, exclusive_status, construction_status, state_id, community_id,
    sub_community_id, project_id, building, price_min, price_max, bedroom_min,
    bedroom_max, contact_source, lead_source, property_image, message, resume,
    drip_marketing || 0, status || 'New', contact_date, lead_status, lost_status
  ]);

  return result;
};

/* =========================================================
   GET ALL ENQUIRIES
========================================================= */

export const getAllEnquiries = async () => {
  const query = `SELECT * FROM enquire ORDER BY created_at DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET BY ID
========================================================= */

export const getEnquireById = async (id) => {
  const query = `SELECT * FROM enquire WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET BY AGENT
========================================================= */

export const getEnquiriesByAgentId = async (agent_id) => {
  const query = `SELECT * FROM enquire WHERE agent_id = ? ORDER BY created_at DESC`;
  const [rows] = await pool.query(query, [agent_id]);
  return rows;
};

/* =========================================================
   UPDATE ENQUIRY
========================================================= */

export const updateEnquire = async (id, data) => {
  // Destructure all fields
  const values = [
    data.contact_id, data.property_id, data.project_item_id, data.item_type, data.type, 
    data.source, data.agent_id, data.country, data.priority, data.quality, 
    data.contact_type, data.agent_activity, data.admin_activity, data.listing_type, 
    data.exclusive_status, data.construction_status, data.state_id, data.community_id, 
    data.sub_community_id, data.project_id, data.building, data.price_min, data.price_max, 
    data.bedroom_min, data.bedroom_max, data.contact_source, data.lead_source, 
    data.property_image, data.message, data.resume, data.drip_marketing, data.status, 
    data.contact_date, data.lead_status, data.lost_status, 
    id // Last param for WHERE clause
  ];

  const query = `
    UPDATE enquire SET
      contact_id=?, property_id=?, project_item_id=?, item_type=?, type=?, source=?, agent_id=?,
      country=?, priority=?, quality=?, contact_type=?, agent_activity=?, admin_activity=?,
      listing_type=?, exclusive_status=?, construction_status=?, state_id=?, community_id=?,
      sub_community_id=?, project_id=?, building=?, price_min=?, price_max=?, bedroom_min=?,
      bedroom_max=?, contact_source=?, lead_source=?, property_image=?, message=?, resume=?,
      drip_marketing=?, status=?, contact_date=?, lead_status=?, lost_status=?
    WHERE id=?
  `;

  const [result] = await pool.query(query, values);
  return result;
};

/* =========================================================
   DELETE ENQUIRY
========================================================= */

export const deleteEnquire = async (id) => {
  const query = `DELETE FROM enquire WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};