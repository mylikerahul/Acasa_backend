import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createCommunityDataTable = async () => {
  // 1. Create Basic Table Structure
  const createQuery = `
    CREATE TABLE IF NOT EXISTS community_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      city_id INT,
      state_id INT,
      name VARCHAR(255) NOT NULL,
      status TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(createQuery);

  // 2. Safe Foreign Key Injection
  try {
    const [check] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'community_data' AND CONSTRAINT_NAME = 'fk_comm_data_city'`
    );

    if (check.length === 0) {
      // Helper function to add FK safely
      const addFk = async (colName, refTable, constraintName) => {
        const [refCols] = await pool.query(`SHOW COLUMNS FROM ${refTable} LIKE 'id'`).catch(() => [[]]);
        
        if (refCols.length > 0) {
          const typeStr = refCols[0].Type.toLowerCase();
          const defineType = typeStr.includes('unsigned') ? 'INT UNSIGNED' : 'INT';

          // Modify child column
          await pool.query(`ALTER TABLE community_data MODIFY COLUMN ${colName} ${defineType}`);
          
          // Add Constraint
          await pool.query(`
            ALTER TABLE community_data
            ADD CONSTRAINT ${constraintName} FOREIGN KEY (${colName}) REFERENCES ${refTable}(id) ON DELETE SET NULL
          `);
          console.log(`✅ Foreign Key ${constraintName} added to community_data`);
        }
      };

      // Add FK for City
      await addFk('city_id', 'cities', 'fk_comm_data_city');
      
      // Add FK for State
      await addFk('state_id', 'states', 'fk_comm_data_state');
    }
  } catch (error) {
    if (!error.message.includes("Duplicate")) {
      console.warn("⚠️ Warning: Could not add Foreign Keys to 'community_data'.", error.message);
    }
  }
};

/* =========================================================
   CREATE COMMUNITY DATA
========================================================= */

export const createCommunityData = async (data) => {
  const { city_id, state_id, name, status } = data;
  
  const query = `
    INSERT INTO community_data (city_id, state_id, name, status) 
    VALUES (?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    city_id, state_id, name, status !== undefined ? status : 1
  ]);
  
  return result;
};

/* =========================================================
   GET ALL
========================================================= */

export const getAllCommunityData = async () => {
  const query = `SELECT * FROM community_data ORDER BY name ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET BY ID
========================================================= */

export const getCommunityDataById = async (id) => {
  const query = `SELECT * FROM community_data WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET BY CITY ID
========================================================= */

export const getCommunityDataByCityId = async (city_id) => {
  const query = `SELECT * FROM community_data WHERE city_id = ? ORDER BY name ASC`;
  const [rows] = await pool.query(query, [city_id]);
  return rows;
};

/* =========================================================
   UPDATE
========================================================= */

export const updateCommunityData = async (id, data) => {
  const { city_id, state_id, name, status } = data;
  
  const query = `
    UPDATE community_data 
    SET city_id = ?, state_id = ?, name = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    city_id, state_id, name, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE
========================================================= */

export const deleteCommunityData = async (id) => {
  const query = `DELETE FROM community_data WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};