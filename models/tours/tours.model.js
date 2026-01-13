import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createTourTable = async () => {
  // 1. Create Table (Standard INT initially)
  const createQuery = `
    CREATE TABLE IF NOT EXISTS tours (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_name VARCHAR(255),
      refrence VARCHAR(255),
      location VARCHAR(255),
      property_id INT, 
      agent_id INT,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100),
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      contact_type VARCHAR(50),
      time TIMESTAMP,
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'Pending'
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(createQuery);

  // 2. Safe Foreign Key Injection
  try {
    const [check] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tours' AND CONSTRAINT_NAME = 'fk_tours_properties'`
    );

    if (check.length === 0) {
      // --- FIX FOR properties.id ---
      const [propCols] = await pool.query(`SHOW COLUMNS FROM properties LIKE 'id'`);
      if (propCols.length > 0) {
        const typeStr = propCols[0].Type.toLowerCase();
        // If parent is unsigned, child MUST be unsigned
        const isUnsigned = typeStr.includes('unsigned'); 
        const defineType = isUnsigned ? 'INT UNSIGNED' : 'INT';

        await pool.query(`ALTER TABLE tours MODIFY COLUMN property_id ${defineType}`);
        await pool.query(`
          ALTER TABLE tours
          ADD CONSTRAINT fk_tours_properties FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
        `);
      }

      // --- FIX FOR users.id ---
      const [userCols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'id'`);
      if (userCols.length > 0) {
        const typeStr = userCols[0].Type.toLowerCase();
        const isUnsigned = typeStr.includes('unsigned');
        const defineType = isUnsigned ? 'INT UNSIGNED' : 'INT';

        await pool.query(`ALTER TABLE tours MODIFY COLUMN agent_id ${defineType}`);
        await pool.query(`
          ALTER TABLE tours
          ADD CONSTRAINT fk_tours_users FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
        `);
      }
      console.log('✅ Foreign Keys added to tours successfully');
    }
  } catch (error) {
    // Only warn if it's not a "Duplicate" error (which means we are safe)
    if (!error.message.includes("Duplicate")) {
      console.warn("⚠️ Warning: Could not add Foreign Keys to 'tours'.", error.message);
    }
  }
};

/* =========================================================
   CREATE TOUR
========================================================= */
export const createTour = async (tourData) => {
  const { 
    project_name, refrence, location, property_id, agent_id,
    first_name, last_name, email, phone, contact_type, time, status 
  } = tourData;
  
  const query = `
    INSERT INTO tours 
    (project_name, refrence, location, property_id, agent_id, 
     first_name, last_name, email, phone, contact_type, time, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    project_name, refrence, location, property_id, agent_id,
    first_name, last_name, email, phone, contact_type, time, status || 'Pending'
  ]);
  
  return result;
};

// ... (Rest of functions: getAllTours, getTourById, etc. remain unchanged)
export const getAllTours = async () => {
  const query = `SELECT * FROM tours ORDER BY create_date DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

export const getTourById = async (id) => {
  const query = `SELECT * FROM tours WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

export const getToursByAgentId = async (agent_id) => {
  const query = `SELECT * FROM tours WHERE agent_id = ? ORDER BY time DESC`;
  const [rows] = await pool.query(query, [agent_id]);
  return rows;
};

export const updateTour = async (id, tourData) => {
  const { 
    project_name, refrence, location, property_id, agent_id,
    first_name, last_name, email, phone, contact_type, time, status 
  } = tourData;
  
  const query = `
    UPDATE tours 
    SET project_name = ?, refrence = ?, location = ?, property_id = ?, agent_id = ?,
        first_name = ?, last_name = ?, email = ?, phone = ?, contact_type = ?, 
        time = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    project_name, refrence, location, property_id, agent_id,
    first_name, last_name, email, phone, contact_type, time, status, id
  ]);
  
  return result;
};

export const deleteTour = async (id) => {
  const query = `DELETE FROM tours WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};