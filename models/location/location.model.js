// models/location/location.model.js

import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createLocationTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_locations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      address VARCHAR(500),
      city VARCHAR(100),
      state VARCHAR(100),
      country VARCHAR(100),
      pincode VARCHAR(20),
      location_type VARCHAR(50) DEFAULT 'current',
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_locations_coords ON user_locations(latitude, longitude);
  `;
  await pool.query(query);
};

/* =========================================================
   LOCATION CRUD
========================================================= */

// Save or Update User Location
export const saveUserLocation = async (userId, locationData) => {
  const {
    latitude,
    longitude,
    address,
    city,
    state,
    country,
    pincode,
    location_type = 'current',
    is_primary = true
  } = locationData;

  // If primary, unset other primary locations
  if (is_primary) {
    await pool.query(
      `UPDATE user_locations SET is_primary = false WHERE user_id = $1`,
      [userId]
    );
  }

  // Check if location already exists for this user
  const existingQuery = `
    SELECT id FROM user_locations 
    WHERE user_id = $1 AND location_type = $2
    LIMIT 1;
  `;
  const { rows: existing } = await pool.query(existingQuery, [userId, location_type]);

  if (existing.length > 0) {
    // Update existing location
    const updateQuery = `
      UPDATE user_locations
      SET latitude = $1, longitude = $2, address = $3, city = $4, 
          state = $5, country = $6, pincode = $7, is_primary = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *;
    `;
    const { rows } = await pool.query(updateQuery, [
      latitude, longitude, address, city, state, country, pincode, is_primary, existing[0].id
    ]);
    return rows[0];
  } else {
    // Insert new location
    const insertQuery = `
      INSERT INTO user_locations 
      (user_id, latitude, longitude, address, city, state, country, pincode, location_type, is_primary)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const { rows } = await pool.query(insertQuery, [
      userId, latitude, longitude, address, city, state, country, pincode, location_type, is_primary
    ]);
    return rows[0];
  }
};

// Get User's Primary Location
export const getUserPrimaryLocation = async (userId) => {
  const query = `
    SELECT * FROM user_locations 
    WHERE user_id = $1 AND is_primary = true
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

// Get All User Locations
export const getUserLocations = async (userId) => {
  const query = `
    SELECT * FROM user_locations 
    WHERE user_id = $1
    ORDER BY is_primary DESC, updated_at DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

// Delete User Location
export const deleteUserLocation = async (userId, locationId) => {
  const query = `
    DELETE FROM user_locations 
    WHERE id = $1 AND user_id = $2
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [locationId, userId]);
  return rows[0];
};

// Update user's location in users table too
export const updateUserMainLocation = async (userId, address) => {
  const query = `
    UPDATE users 
    SET location = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, location;
  `;
  const { rows } = await pool.query(query, [address, userId]);
  return rows[0];
};