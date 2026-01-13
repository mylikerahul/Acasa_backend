import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createCitiesTable = async () => {
  // 1. Create Basic Table structure
  const createQuery = `
    CREATE TABLE IF NOT EXISTS cities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      country_id INT,
      state_id INT,
      city_data_id VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      latitude VARCHAR(100),
      longitude VARCHAR(100),
      img VARCHAR(500),
      description TEXT,
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
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
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities' AND CONSTRAINT_NAME = 'fk_cities_country'`
    );

    if (check.length === 0) {
      // Logic to match Parent ID types (assuming 'countries' and 'states' tables exist)
      const [countryCols] = await pool.query(`SHOW COLUMNS FROM countries LIKE 'id'`).catch(() => [[]]);
      const [stateCols] = await pool.query(`SHOW COLUMNS FROM states LIKE 'id'`).catch(() => [[]]);

      if (countryCols.length > 0) {
        const type = countryCols[0].Type.toLowerCase().includes('unsigned') ? 'INT UNSIGNED' : 'INT';
        await pool.query(`ALTER TABLE cities MODIFY COLUMN country_id ${type}`);
        await pool.query(`ALTER TABLE cities ADD CONSTRAINT fk_cities_country FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL`);
      }

      if (stateCols.length > 0) {
        const type = stateCols[0].Type.toLowerCase().includes('unsigned') ? 'INT UNSIGNED' : 'INT';
        await pool.query(`ALTER TABLE cities MODIFY COLUMN state_id ${type}`);
        await pool.query(`ALTER TABLE cities ADD CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL`);
      }
      console.log('✅ Foreign Keys added to cities successfully');
    }
  } catch (error) {
    console.warn("⚠️ Warning: Could not add Foreign Keys to 'cities'.", error.message);
  }
};

/* =========================================================
   CRUD OPERATIONS
========================================================= */

export const createCity = async (data) => {
  const { 
    country_id, state_id, city_data_id, name, slug, 
    latitude, longitude, img, description, 
    seo_title, seo_keywork, seo_description, status 
  } = data;
  
  const query = `
    INSERT INTO cities 
    (country_id, state_id, city_data_id, name, slug, latitude, longitude, img, description, seo_title, seo_keywork, seo_description, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    country_id, state_id, city_data_id, name, slug, 
    latitude, longitude, img, description, 
    seo_title, seo_keywork, seo_description, status ?? 1
  ]);
  return result;
};

export const getAllCities = async () => {
  const query = `SELECT * FROM cities ORDER BY name ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

export const getCityById = async (id) => {
  const query = `SELECT * FROM cities WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

export const getCityBySlug = async (slug) => {
  const query = `SELECT * FROM cities WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

export const updateCity = async (id, data) => {
  const { 
    country_id, state_id, city_data_id, name, slug, 
    latitude, longitude, img, description, 
    seo_title, seo_keywork, seo_description, status 
  } = data;
  
  const query = `
    UPDATE cities 
    SET country_id = ?, state_id = ?, city_data_id = ?, name = ?, slug = ?, 
        latitude = ?, longitude = ?, img = ?, description = ?, 
        seo_title = ?, seo_keywork = ?, seo_description = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    country_id, state_id, city_data_id, name, slug, 
    latitude, longitude, img, description, 
    seo_title, seo_keywork, seo_description, status, id
  ]);
  return result;
};

export const deleteCity = async (id) => {
  const query = `DELETE FROM cities WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};