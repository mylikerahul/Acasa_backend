import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createCitiesDataTable = async () => {
  // 1. Create Basic Table Structure
  const createQuery = `
    CREATE TABLE IF NOT EXISTS cities_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      country_id INT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status TINYINT(1) DEFAULT 1,
      create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(createQuery);

  // 2. Safe Foreign Key Injection
  try {
    const [check] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities_data' AND CONSTRAINT_NAME = 'fk_cities_data_country'`
    );

    if (check.length === 0) {
      // Check parent table column type
      const [countryCols] = await pool.query(`SHOW COLUMNS FROM countries LIKE 'id'`).catch(() => [[]]);
      
      if (countryCols.length > 0) {
        const typeStr = countryCols[0].Type.toLowerCase();
        const isUnsigned = typeStr.includes('unsigned');
        const defineType = isUnsigned ? 'INT UNSIGNED' : 'INT';

        // Modify child column
        await pool.query(`ALTER TABLE cities_data MODIFY COLUMN country_id ${defineType}`);
        
        // Add Constraint
        await pool.query(`
          ALTER TABLE cities_data
          ADD CONSTRAINT fk_cities_data_country FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL
        `);
        console.log('✅ Foreign Key added to cities_data successfully');
      }
    }
  } catch (error) {
    if (!error.message.includes("Duplicate")) {
      console.warn("⚠️ Warning: Could not add Foreign Key to 'cities_data'.", error.message);
    }
  }
};

/* =========================================================
   CREATE CITY DATA
========================================================= */

export const createCityData = async (data) => {
  const { country_id, name, description, status } = data;
  
  const query = `
    INSERT INTO cities_data (country_id, name, description, status) 
    VALUES (?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    country_id, name, description, status !== undefined ? status : 1
  ]);
  
  return result;
};

/* =========================================================
   GET ALL CITIES DATA
========================================================= */

export const getAllCitiesData = async () => {
  const query = `SELECT * FROM cities_data ORDER BY name ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET BY ID
========================================================= */

export const getCityDataById = async (id) => {
  const query = `SELECT * FROM cities_data WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET BY COUNTRY ID
========================================================= */

export const getCityDataByCountryId = async (country_id) => {
  const query = `SELECT * FROM cities_data WHERE country_id = ? ORDER BY name ASC`;
  const [rows] = await pool.query(query, [country_id]);
  return rows;
};

/* =========================================================
   UPDATE CITY DATA
========================================================= */

export const updateCityData = async (id, data) => {
  const { country_id, name, description, status } = data;
  
  const query = `
    UPDATE cities_data 
    SET country_id = ?, name = ?, description = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    country_id, name, description, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE CITY DATA
========================================================= */

export const deleteCityData = async (id) => {
  const query = `DELETE FROM cities_data WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};