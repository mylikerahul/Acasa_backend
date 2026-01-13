import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createCommunityTable = async () => {
  // 1. Create Basic Table Structure
  const createQuery = `
    CREATE TABLE IF NOT EXISTS community (
      id INT AUTO_INCREMENT PRIMARY KEY,
      community_id VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      country_id INT,
      state_id INT,
      city_id INT,
      slug VARCHAR(255) NOT NULL UNIQUE,
      latitude VARCHAR(100),
      longitude VARCHAR(100),
      img VARCHAR(500),
      school_img VARCHAR(500),
      hotel_img VARCHAR(500),
      hospital_img VARCHAR(500),
      train_img VARCHAR(500),
      bus_img VARCHAR(500),
      description TEXT,
      top_community TEXT,
      top_projects TEXT,
      featured_project TEXT,
      related_blog TEXT,
      properties TEXT,
      similar_location TEXT,
      sales_diretor VARCHAR(255),
      seo_slug VARCHAR(255),
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
      featured TINYINT(1) DEFAULT 0,
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
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'community' AND CONSTRAINT_NAME = 'fk_community_city'`
    );

    if (check.length === 0) {
      // Helper to check and add FK
      const addFk = async (colName, refTable, constraintName) => {
        const [refCols] = await pool.query(`SHOW COLUMNS FROM ${refTable} LIKE 'id'`).catch(() => [[]]);
        if (refCols.length > 0) {
          const type = refCols[0].Type.toLowerCase().includes('unsigned') ? 'INT UNSIGNED' : 'INT';
          await pool.query(`ALTER TABLE community MODIFY COLUMN ${colName} ${type}`);
          await pool.query(`ALTER TABLE community ADD CONSTRAINT ${constraintName} FOREIGN KEY (${colName}) REFERENCES ${refTable}(id) ON DELETE SET NULL`);
        }
      };

      await addFk('country_id', 'countries', 'fk_community_country');
      await addFk('state_id', 'states', 'fk_community_state');
      await addFk('city_id', 'cities', 'fk_community_city');
      
      console.log('✅ Foreign Keys added to community successfully');
    }
  } catch (error) {
    if (!error.message.includes("Duplicate")) {
      console.warn("⚠️ Warning: Could not add Foreign Keys to 'community'.", error.message);
    }
  }
};

/* =========================================================
   CREATE COMMUNITY
========================================================= */

export const createCommunity = async (data) => {
  const { 
    community_id, name, country_id, state_id, city_id, slug, latitude, longitude,
    img, school_img, hotel_img, hospital_img, train_img, bus_img,
    description, top_community, top_projects, featured_project, related_blog,
    properties, similar_location, sales_diretor, seo_slug, seo_title,
    seo_keywork, seo_description, featured, status
  } = data;
  
  const query = `
    INSERT INTO community 
    (community_id, name, country_id, state_id, city_id, slug, latitude, longitude,
     img, school_img, hotel_img, hospital_img, train_img, bus_img,
     description, top_community, top_projects, featured_project, related_blog,
     properties, similar_location, sales_diretor, seo_slug, seo_title,
     seo_keywork, seo_description, featured, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    community_id, name, country_id, state_id, city_id, slug, latitude, longitude,
    img, school_img, hotel_img, hospital_img, train_img, bus_img,
    description, top_community, top_projects, featured_project, related_blog,
    properties, similar_location, sales_diretor, seo_slug, seo_title,
    seo_keywork, seo_description, featured || 0, status !== undefined ? status : 1
  ]);
  
  return result;
};

/* =========================================================
   GET ALL COMMUNITIES
========================================================= */

export const getAllCommunities = async () => {
  const query = `SELECT * FROM community ORDER BY name ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET BY ID
========================================================= */

export const getCommunityById = async (id) => {
  const query = `SELECT * FROM community WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET BY SLUG
========================================================= */

export const getCommunityBySlug = async (slug) => {
  const query = `SELECT * FROM community WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

/* =========================================================
   UPDATE COMMUNITY
========================================================= */

export const updateCommunity = async (id, data) => {
  const { 
    community_id, name, country_id, state_id, city_id, slug, latitude, longitude,
    img, school_img, hotel_img, hospital_img, train_img, bus_img,
    description, top_community, top_projects, featured_project, related_blog,
    properties, similar_location, sales_diretor, seo_slug, seo_title,
    seo_keywork, seo_description, featured, status
  } = data;
  
  const query = `
    UPDATE community 
    SET community_id=?, name=?, country_id=?, state_id=?, city_id=?, slug=?, latitude=?, longitude=?,
        img=?, school_img=?, hotel_img=?, hospital_img=?, train_img=?, bus_img=?,
        description=?, top_community=?, top_projects=?, featured_project=?, related_blog=?,
        properties=?, similar_location=?, sales_diretor=?, seo_slug=?, seo_title=?,
        seo_keywork=?, seo_description=?, featured=?, status=?
    WHERE id=?
  `;
  
  const [result] = await pool.query(query, [
    community_id, name, country_id, state_id, city_id, slug, latitude, longitude,
    img, school_img, hotel_img, hospital_img, train_img, bus_img,
    description, top_community, top_projects, featured_project, related_blog,
    properties, similar_location, sales_diretor, seo_slug, seo_title,
    seo_keywork, seo_description, featured, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE COMMUNITY
========================================================= */

export const deleteCommunity = async (id) => {
  const query = `DELETE FROM community WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};