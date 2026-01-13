import pool from '../../config/db.js';

const TABLE_NAME = 'cities';

// ==================== TABLE MANAGEMENT ====================
export const createCitiesTable = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Check if table exists
    const [tables] = await connection.query(
      `SHOW TABLES LIKE '${TABLE_NAME}'`
    );
    
    if (tables.length === 0) {
      // Create new table with proper structure
      const createTableQuery = `
        CREATE TABLE ${TABLE_NAME} (
          id INT PRIMARY KEY AUTO_INCREMENT,
          country_id INT NULL,
          state_id INT NULL,
          city_data_id VARCHAR(100) NULL,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          latitude DECIMAL(10, 8) NULL,
          longitude DECIMAL(11, 8) NULL,
          img TEXT NULL,
          description TEXT NULL,
          seo_title VARCHAR(255) NULL,
          seo_keyword VARCHAR(255) NULL,
          seo_description TEXT NULL,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_slug (slug),
          INDEX idx_country_id (country_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      await connection.query(createTableQuery);
      console.log('✅ Cities table created successfully');
    } else {
      // Table exists - fix columns
      console.log('📦 Cities table exists, fixing column types...');
      await fixTableColumns(connection);
    }
    
    return { success: true, message: 'Table ready' };
  } catch (error) {
    console.error('Error with cities table:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Fix existing table columns
const fixTableColumns = async (connection) => {
  // First, fix the status column type from INT to VARCHAR if needed
  try {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${TABLE_NAME} LIKE 'status'`);
    
    if (columns.length > 0) {
      const columnType = columns[0].Type.toLowerCase();
      console.log('📦 Current status column type:', columnType);
      
      if (columnType.includes('int')) {
        console.log('🔄 Converting status column from INT to VARCHAR...');
        
        // Update existing values: 1 -> 'active', 0 -> 'inactive'
        await connection.query(`
          UPDATE ${TABLE_NAME} 
          SET status = CASE 
            WHEN status = 1 THEN 'active'
            WHEN status = 0 THEN 'inactive'
            ELSE 'active'
          END
        `).catch(() => {});
        
        // Change column type
        await connection.query(`
          ALTER TABLE ${TABLE_NAME} 
          MODIFY COLUMN status VARCHAR(20) DEFAULT 'active'
        `);
        
        console.log('✅ Status column converted to VARCHAR');
      }
    }
  } catch (e) {
    console.log('⚠️ Could not fix status column:', e.message);
  }

  // Fix all columns to allow NULL
  const alterQueries = [
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN country_id INT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN state_id INT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN city_data_id VARCHAR(100) NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN latitude DECIMAL(10, 8) NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN longitude DECIMAL(11, 8) NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN img TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN description TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN seo_title VARCHAR(255) NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN seo_description TEXT NULL`,
  ];

  for (const query of alterQueries) {
    try {
      await connection.query(query);
    } catch (e) {
      // Ignore errors
    }
  }

  // Handle column name typos (seo_keywork -> seo_keyword)
  const columnFixes = [
    { 
      check: `SHOW COLUMNS FROM ${TABLE_NAME} LIKE 'seo_keywork'`,
      fix: `ALTER TABLE ${TABLE_NAME} CHANGE COLUMN seo_keywork seo_keyword VARCHAR(255) NULL`
    },
  ];

  for (const { check, fix } of columnFixes) {
    try {
      const [cols] = await connection.query(check);
      if (cols.length > 0) {
        await connection.query(fix);
        console.log('✅ Fixed column typo: seo_keywork -> seo_keyword');
      }
    } catch (e) {
      // Ignore
    }
  }

  // Ensure seo_keyword column exists
  try {
    const [exists] = await connection.query(`SHOW COLUMNS FROM ${TABLE_NAME} LIKE 'seo_keyword'`);
    if (exists.length === 0) {
      await connection.query(`ALTER TABLE ${TABLE_NAME} ADD COLUMN seo_keyword VARCHAR(255) NULL`);
      console.log('✅ Added column: seo_keyword');
    }
  } catch (e) {
    // Ignore
  }

  // Add indexes if they don't exist
  const indexes = [
    { name: 'idx_country_id', column: 'country_id' },
    { name: 'idx_status', column: 'status' },
  ];

  for (const idx of indexes) {
    try {
      await connection.query(`CREATE INDEX ${idx.name} ON ${TABLE_NAME} (${idx.column})`);
    } catch (e) {
      // Index might already exist
    }
  }

  console.log('✅ Cities table columns fixed');
};

// Get column names
const getTableColumns = async (connection) => {
  try {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${TABLE_NAME}`);
    return columns.map(col => col.Field);
  } catch (error) {
    return [];
  }
};

// Check if status column is INT type
const isStatusInt = async (connection) => {
  try {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${TABLE_NAME} LIKE 'status'`);
    if (columns.length > 0) {
      return columns[0].Type.toLowerCase().includes('int');
    }
    return false;
  } catch (error) {
    return false;
  }
};

// ==================== HELPER FUNCTIONS ====================
export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 255);
};

export const slugExists = async (slug, excludeId = null) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let query = `SELECT id FROM ${TABLE_NAME} WHERE slug = ?`;
    const params = [slug];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await connection.query(query, params);
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking slug:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const generateUniqueSlug = async (name, excludeId = null) => {
  let slug = generateSlug(name);
  let counter = 1;

  while (await slugExists(slug, excludeId)) {
    slug = `${generateSlug(name)}-${counter}`;
    counter++;
  }

  return slug;
};

export const checkDuplicateCity = async (name, countryId = null, excludeId = null) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let query = `SELECT id, name FROM ${TABLE_NAME} WHERE LOWER(name) = LOWER(?)`;
    const params = [name];

    if (countryId) {
      query += ' AND country_id = ?';
      params.push(countryId);
    }

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await connection.query(query, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error checking duplicate city:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Normalize response data
const normalizeResponse = (row) => {
  if (!row) return null;
  
  // Handle status - could be int or string
  let status = row.status;
  if (status === 1 || status === '1') status = 'active';
  else if (status === 0 || status === '0') status = 'inactive';
  else if (typeof status === 'string') status = status.toLowerCase();
  else status = 'active';
  
  return {
    ...row,
    seo_keyword: row.seo_keyword || row.seo_keywork || null,
    status: status
  };
};

// Convert to boolean
const toBoolean = (value) => {
  return value === true || value === 'true' || value === 1 || value === '1';
};

// Convert status for database (handles both INT and VARCHAR columns)
const convertStatusForDB = async (connection, status) => {
  const statusIsInt = await isStatusInt(connection);
  
  if (statusIsInt) {
    if (status === 'active' || status === 1 || status === '1' || status === true) {
      return 1;
    }
    return 0;
  } else {
    if (status === 1 || status === '1' || status === true || status === 'active') {
      return 'active';
    }
    return 'inactive';
  }
};

// ==================== CREATE ====================
export const createCity = async (cityData) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Fix table columns first
    await fixTableColumns(connection);
    
    await connection.beginTransaction();

    // Check for duplicate
    const duplicate = await checkDuplicateCity(cityData.name, cityData.country_id);
    if (duplicate) {
      throw new Error(`City "${cityData.name}" already exists`);
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(cityData.name);

    // Get column info
    const existingColumns = await getTableColumns(connection);
    
    console.log('📦 Existing columns:', existingColumns);

    // Determine correct column name for seo_keyword
    const seoKeywordCol = existingColumns.includes('seo_keyword') ? 'seo_keyword' : 
                          existingColumns.includes('seo_keywork') ? 'seo_keywork' : null;

    // Convert status value based on column type
    const statusValue = await convertStatusForDB(connection, cityData.status || 'active');
    console.log('📦 Status value for DB:', statusValue);

    // Build insert data - only include columns that exist
    const insertData = {};
    
    // Required fields
    if (existingColumns.includes('name')) insertData.name = cityData.name;
    if (existingColumns.includes('slug')) insertData.slug = slug;
    if (existingColumns.includes('status')) insertData.status = statusValue;
    
    // Optional fields mapping
    const optionalMappings = {
      country_id: cityData.country_id || null,
      state_id: cityData.state_id || null,
      city_data_id: cityData.city_data_id || null,
      img: cityData.img || null,
      latitude: cityData.latitude || null,
      longitude: cityData.longitude || null,
      description: cityData.description || null,
      seo_title: cityData.seo_title || cityData.name,
      seo_description: cityData.seo_description || null,
    };

    // Add optional fields if column exists
    for (const [key, value] of Object.entries(optionalMappings)) {
      if (existingColumns.includes(key)) {
        insertData[key] = value;
      }
    }

    // Handle seo_keyword with correct column name
    if (seoKeywordCol) {
      insertData[seoKeywordCol] = cityData.seo_keyword || null;
    }

    // Build and execute query
    const columns = Object.keys(insertData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(insertData);

    const insertQuery = `INSERT INTO ${TABLE_NAME} (${columns.join(', ')}) VALUES (${placeholders})`;

    console.log('📤 Insert Query:', insertQuery);
    console.log('📤 Values:', values);

    const [result] = await connection.query(insertQuery, values);
    await connection.commit();

    // Fetch and return created city
    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [result.insertId]
    );

    console.log('✅ City created with ID:', result.insertId);
    return normalizeResponse(rows[0]);

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error creating city:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== READ ====================
export const getAllCities = async (page = 1, limit = 10, filters = {}) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    const statusIsInt = await isStatusInt(connection);

    if (filters.status) {
      whereConditions.push(`status = ?`);
      if (statusIsInt) {
        queryParams.push(filters.status === 'active' ? 1 : 0);
      } else {
        queryParams.push(filters.status);
      }
    }

    if (filters.country_id) {
      whereConditions.push(`country_id = ?`);
      queryParams.push(parseInt(filters.country_id));
    }

    if (filters.state_id) {
      whereConditions.push(`state_id = ?`);
      queryParams.push(parseInt(filters.state_id));
    }

    if (filters.search) {
      whereConditions.push(`(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)`);
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ${TABLE_NAME} ${whereClause}`;
    const [countResult] = await connection.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);

    // Get data
    const dataQuery = `
      SELECT * FROM ${TABLE_NAME} 
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await connection.query(dataQuery, [...queryParams, parseInt(limit), parseInt(offset)]);

    return {
      data: rows.map(normalizeResponse),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getAllCitiesNoPagination = async (filters = {}) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let whereConditions = [];
    let queryParams = [];

    const statusIsInt = await isStatusInt(connection);

    if (filters.status) {
      whereConditions.push(`status = ?`);
      if (statusIsInt) {
        queryParams.push(filters.status === 'active' ? 1 : 0);
      } else {
        queryParams.push(filters.status);
      }
    }

    if (filters.country_id) {
      whereConditions.push(`country_id = ?`);
      queryParams.push(parseInt(filters.country_id));
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY name ASC`;
    const [rows] = await connection.query(query, queryParams);

    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching all cities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCityById = async (id) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`;
    const [rows] = await connection.query(query, [id]);
    
    return normalizeResponse(rows[0]);
  } catch (error) {
    console.error('Error fetching city by ID:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCityBySlug = async (slug) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE slug = ?`;
    const [rows] = await connection.query(query, [slug]);
    
    return normalizeResponse(rows[0]);
  } catch (error) {
    console.error('Error fetching city by slug:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCitiesByCountry = async (countryId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE country_id = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [countryId]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching cities by country:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCitiesByState = async (stateId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE state_id = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [stateId]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching cities by state:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== UPDATE ====================
export const updateCity = async (id, updateData) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Fix table columns first
    await fixTableColumns(connection);
    
    await connection.beginTransaction();

    // Check if exists
    const existing = await getCityById(id);
    if (!existing) {
      throw new Error('City not found');
    }

    // Check for duplicate name
    if (updateData.name && updateData.name !== existing.name) {
      const duplicate = await checkDuplicateCity(
        updateData.name, 
        updateData.country_id || existing.country_id,
        id
      );
      if (duplicate) {
        throw new Error(`City "${updateData.name}" already exists`);
      }
      updateData.slug = await generateUniqueSlug(updateData.name, id);
    }

    // Get existing columns
    const existingColumns = await getTableColumns(connection);
    
    // Determine correct column names
    const seoKeywordCol = existingColumns.includes('seo_keyword') ? 'seo_keyword' : 
                          existingColumns.includes('seo_keywork') ? 'seo_keywork' : null;

    // Map of input fields to actual column names
    const fieldMapping = {
      'seo_keyword': seoKeywordCol,
      'seo_keywork': seoKeywordCol,
    };

    const allowedFields = [
      'name', 'country_id', 'state_id', 'city_data_id', 'slug', 
      'img', 'latitude', 'longitude', 'description',
      'seo_title', 'seo_description', 'status'
    ];

    // Add dynamic column names
    if (seoKeywordCol) allowedFields.push(seoKeywordCol);

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      // Get actual column name
      let actualKey = fieldMapping[key] || key;
      
      // Skip if column doesn't exist or not allowed
      if (!allowedFields.includes(actualKey) || !existingColumns.includes(actualKey)) {
        continue;
      }

      if (value === undefined) continue;

      let processedValue = value;
      
      // Handle status conversion
      if (actualKey === 'status') {
        processedValue = await convertStatusForDB(connection, value);
      }
      
      updateFields.push(`${actualKey} = ?`);
      values.push(processedValue);
    }

    if (updateFields.length === 0) {
      await connection.rollback();
      return existing;
    }

    values.push(id);
    
    const query = `
      UPDATE ${TABLE_NAME} 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    console.log('📤 Update Query:', query);
    console.log('📤 Values:', values);

    await connection.query(query, values);
    await connection.commit();

    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );

    return normalizeResponse(rows[0]);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating city:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const updateCityMedia = async (id, mediaPath) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      UPDATE ${TABLE_NAME} 
      SET img = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.query(query, [mediaPath, id]);
    
    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    return normalizeResponse(rows[0]);
  } catch (error) {
    console.error('Error updating city media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const deleteCityMedia = async (id) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      UPDATE ${TABLE_NAME} 
      SET img = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.query(query, [id]);
    
    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    return normalizeResponse(rows[0]);
  } catch (error) {
    console.error('Error deleting city media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== DELETE ====================
export const deleteCity = async (id) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error('City not found');
    }

    await connection.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    await connection.commit();

    return normalizeResponse(existing[0]);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting city:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const bulkDeleteCities = async (ids) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (!ids || ids.length === 0) {
      throw new Error('No IDs provided');
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM ${TABLE_NAME} WHERE id IN (${placeholders})`;
    
    const [result] = await connection.query(query, ids);
    await connection.commit();

    return { deletedCount: result.affectedRows };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error bulk deleting cities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== STATUS ====================
export const updateCityStatus = async (id, status) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be "active" or "inactive"');
    }

    const [existing] = await connection.query(
      `SELECT id FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    if (existing.length === 0) {
      throw new Error('City not found');
    }

    const statusValue = await convertStatusForDB(connection, status);

    await connection.query(
      `UPDATE ${TABLE_NAME} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [statusValue, id]
    );

    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );

    return normalizeResponse(rows[0]);
  } catch (error) {
    console.error('Error updating city status:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const bulkUpdateStatus = async (ids, status) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const statusValue = await convertStatusForDB(connection, status);

    const placeholders = ids.map(() => '?').join(',');
    const query = `
      UPDATE ${TABLE_NAME} 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    await connection.query(query, [statusValue, ...ids]);

    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id IN (${placeholders})`,
      ids
    );

    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error bulk updating status:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCitiesByStatus = async (status) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const statusIsInt = await isStatusInt(connection);
    let statusValue = status;
    if (statusIsInt) {
      statusValue = status === 'active' ? 1 : 0;
    }
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE status = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [statusValue]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching cities by status:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== SEARCH & FILTER ====================
export const searchCities = async (searchTerm, limit = 10) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT * FROM ${TABLE_NAME} 
      WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ?
      ORDER BY name ASC 
      LIMIT ?
    `;

    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    const [rows] = await connection.query(query, [searchPattern, searchPattern, parseInt(limit)]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const filterCities = async (filters) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let whereConditions = [];
    let queryParams = [];

    const statusIsInt = await isStatusInt(connection);

    if (filters.country_id) {
      whereConditions.push(`country_id = ?`);
      queryParams.push(parseInt(filters.country_id));
    }

    if (filters.state_id) {
      whereConditions.push(`state_id = ?`);
      queryParams.push(parseInt(filters.state_id));
    }

    if (filters.status) {
      whereConditions.push(`status = ?`);
      if (statusIsInt) {
        queryParams.push(filters.status === 'active' ? 1 : 0);
      } else {
        queryParams.push(filters.status);
      }
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY name ASC`;
    const [rows] = await connection.query(query, queryParams);

    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error filtering cities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== STATS ====================
export const getCityStats = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const statusIsInt = await isStatusInt(connection);
    
    let statsQuery;
    if (statusIsInt) {
      statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive,
          COUNT(DISTINCT country_id) as unique_countries
        FROM ${TABLE_NAME}
      `;
    } else {
      statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
          COUNT(DISTINCT country_id) as unique_countries
        FROM ${TABLE_NAME}
      `;
    }

    const [rows] = await connection.query(statsQuery);
    return {
      total: parseInt(rows[0].total) || 0,
      active: parseInt(rows[0].active) || 0,
      inactive: parseInt(rows[0].inactive) || 0,
      unique_countries: parseInt(rows[0].unique_countries) || 0
    };
  } catch (error) {
    console.error('Error fetching city stats:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== UTILITIES ====================
export const getRecentCities = async (limit = 5) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const statusIsInt = await isStatusInt(connection);
    const activeStatus = statusIsInt ? 1 : 'active';
    
    const query = `
      SELECT * FROM ${TABLE_NAME} 
      WHERE status = ?
      ORDER BY id DESC 
      LIMIT ?
    `;
    
    const [rows] = await connection.query(query, [activeStatus, parseInt(limit)]);
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching recent cities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCitiesForDropdown = async (countryId = null) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const statusIsInt = await isStatusInt(connection);
    const activeStatus = statusIsInt ? 1 : 'active';
    
    let query = `
      SELECT id, name, slug, country_id FROM ${TABLE_NAME} 
      WHERE status = ?
    `;
    const params = [activeStatus];

    if (countryId) {
      query += ' AND country_id = ?';
      params.push(parseInt(countryId));
    }

    query += ' ORDER BY name ASC';
    
    const [rows] = await connection.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching cities for dropdown:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getActiveCities = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const statusIsInt = await isStatusInt(connection);
    const activeStatus = statusIsInt ? 1 : 'active';
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE status = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [activeStatus]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching active cities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCitiesWithMedia = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT * FROM ${TABLE_NAME} 
      WHERE img IS NOT NULL 
      ORDER BY id DESC
    `;
    
    const [rows] = await connection.query(query);
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching cities with media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCityByCoordinates = async (latitude, longitude, radius = 5) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT *, 
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance
      FROM ${TABLE_NAME}
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      HAVING distance < ?
      ORDER BY distance ASC
    `;
    
    const [rows] = await connection.query(query, [latitude, longitude, latitude, radius]);
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching cities by coordinates:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== EXPORT ====================
export default {
  createCitiesTable,
  generateSlug,
  slugExists,
  generateUniqueSlug,
  checkDuplicateCity,
  createCity,
  getAllCities,
  getAllCitiesNoPagination,
  getCityById,
  getCityBySlug,
  getCitiesByCountry,
  getCitiesByState,
  updateCity,
  updateCityMedia,
  deleteCityMedia,
  deleteCity,
  bulkDeleteCities,
  updateCityStatus,
  bulkUpdateStatus,
  getCitiesByStatus,
  searchCities,
  filterCities,
  getCityStats,
  getRecentCities,
  getCitiesForDropdown,
  getActiveCities,
  getCitiesWithMedia,
  getCityByCoordinates
};