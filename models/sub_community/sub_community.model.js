import pool from '../../config/db.js';

const TABLE_NAME = 'sub_community';

// ==================== TABLE MANAGEMENT ====================
export const createSubCommunityTable = async () => {
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
          city_id INT NULL,
          community_id INT NULL,
          direction VARCHAR(255) NULL,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          img TEXT NULL,
          latitude DECIMAL(10, 8) NULL,
          longitude DECIMAL(11, 8) NULL,
          description TEXT NULL,
          top_community TINYINT(1) DEFAULT 0,
          top_projects TEXT NULL,
          featured_project TEXT NULL,
          related_blog TEXT NULL,
          properties TEXT NULL,
          similar_location TEXT NULL,
          sales_director VARCHAR(255) NULL,
          seo_slug VARCHAR(255) NULL,
          seo_title VARCHAR(255) NULL,
          seo_keyword VARCHAR(255) NULL,
          seo_description TEXT NULL,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_slug (slug),
          INDEX idx_community_id (community_id),
          INDEX idx_city_id (city_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      await connection.query(createTableQuery);
      console.log('✅ SubCommunity table created successfully');
    } else {
      // Table exists - fix columns
      console.log('📦 SubCommunity table exists, fixing column types...');
      await fixTableColumns(connection);
    }
    
    return { success: true, message: 'Table ready' };
  } catch (error) {
    console.error('Error with sub_community table:', error.message);
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
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN city_id INT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN community_id INT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN direction VARCHAR(255) NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN img TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN latitude DECIMAL(10, 8) NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN longitude DECIMAL(11, 8) NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN description TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN top_community TINYINT(1) DEFAULT 0`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN top_projects TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN featured_project TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN related_blog TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN properties TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN similar_location TEXT NULL`,
    `ALTER TABLE ${TABLE_NAME} MODIFY COLUMN seo_slug VARCHAR(255) NULL`,
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

  // Handle column name typos
  const columnFixes = [
    { 
      check: `SHOW COLUMNS FROM ${TABLE_NAME} LIKE 'seo_keywork'`,
      fix: `ALTER TABLE ${TABLE_NAME} CHANGE COLUMN seo_keywork seo_keyword VARCHAR(255) NULL`
    },
    { 
      check: `SHOW COLUMNS FROM ${TABLE_NAME} LIKE 'sales_diretor'`,
      fix: `ALTER TABLE ${TABLE_NAME} CHANGE COLUMN sales_diretor sales_director VARCHAR(255) NULL`
    },
  ];

  for (const { check, fix } of columnFixes) {
    try {
      const [cols] = await connection.query(check);
      if (cols.length > 0) {
        await connection.query(fix);
        console.log('✅ Fixed column typo');
      }
    } catch (e) {
      // Ignore
    }
  }

  // Ensure columns exist with correct names
  const columnsToAdd = [
    { name: 'seo_keyword', type: 'VARCHAR(255) NULL' },
    { name: 'sales_director', type: 'VARCHAR(255) NULL' },
    { name: 'direction', type: 'VARCHAR(255) NULL' },
    { name: 'community_id', type: 'INT NULL' },
  ];

  for (const col of columnsToAdd) {
    try {
      const [exists] = await connection.query(`SHOW COLUMNS FROM ${TABLE_NAME} LIKE '${col.name}'`);
      if (exists.length === 0) {
        await connection.query(`ALTER TABLE ${TABLE_NAME} ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added column: ${col.name}`);
      }
    } catch (e) {
      // Ignore
    }
  }

  // Add indexes if they don't exist
  const indexes = [
    { name: 'idx_community_id', column: 'community_id' },
    { name: 'idx_city_id', column: 'city_id' },
    { name: 'idx_status', column: 'status' },
  ];

  for (const idx of indexes) {
    try {
      await connection.query(`CREATE INDEX ${idx.name} ON ${TABLE_NAME} (${idx.column})`);
    } catch (e) {
      // Index might already exist
    }
  }

  console.log('✅ SubCommunity table columns fixed');
};

// Get column info from database
const getColumnInfo = async (connection) => {
  try {
    const [columns] = await connection.query(`SHOW COLUMNS FROM ${TABLE_NAME}`);
    const info = {};
    columns.forEach(col => {
      info[col.Field] = {
        type: col.Type.toLowerCase(),
        nullable: col.Null === 'YES',
        default: col.Default
      };
    });
    return info;
  } catch (error) {
    return {};
  }
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

export const checkDuplicateSubCommunity = async (name, communityId = null, excludeId = null) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let query = `SELECT id, name FROM ${TABLE_NAME} WHERE LOWER(name) = LOWER(?)`;
    const params = [name];

    if (communityId) {
      query += ' AND community_id = ?';
      params.push(communityId);
    }

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await connection.query(query, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error checking duplicate sub-community:', error);
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
    sales_director: row.sales_director || row.sales_diretor || null,
    top_community: row.top_community === 1 || row.top_community === true || row.top_community === '1',
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
export const createSubCommunity = async (subCommunityData) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Fix table columns first
    await fixTableColumns(connection);
    
    await connection.beginTransaction();

    // Check for duplicate
    const duplicate = await checkDuplicateSubCommunity(
      subCommunityData.name, 
      subCommunityData.community_id
    );
    if (duplicate) {
      throw new Error(`Sub-Community "${subCommunityData.name}" already exists in this community`);
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(subCommunityData.name);

    // Get column info
    const existingColumns = await getTableColumns(connection);
    
    console.log('📦 Existing columns:', existingColumns);

    // Determine correct column names for typo fields
    const seoKeywordCol = existingColumns.includes('seo_keyword') ? 'seo_keyword' : 
                          existingColumns.includes('seo_keywork') ? 'seo_keywork' : null;
    
    const salesDirectorCol = existingColumns.includes('sales_director') ? 'sales_director' :
                             existingColumns.includes('sales_diretor') ? 'sales_diretor' : null;

    // Convert status value based on column type
    const statusValue = await convertStatusForDB(connection, subCommunityData.status || 'active');
    console.log('📦 Status value for DB:', statusValue);

    // Build insert data - only include columns that exist
    const insertData = {};
    
    // Required fields
    if (existingColumns.includes('name')) insertData.name = subCommunityData.name;
    if (existingColumns.includes('slug')) insertData.slug = slug;
    if (existingColumns.includes('status')) insertData.status = statusValue;
    
    // Optional fields mapping
    const optionalMappings = {
      country_id: subCommunityData.country_id || null,
      state_id: subCommunityData.state_id || null,
      city_id: subCommunityData.city_id || null,
      community_id: subCommunityData.community_id || null,
      direction: subCommunityData.direction || null,
      img: subCommunityData.img || null,
      latitude: subCommunityData.latitude || null,
      longitude: subCommunityData.longitude || null,
      description: subCommunityData.description || null,
      top_community: toBoolean(subCommunityData.top_community) ? 1 : 0,
      top_projects: subCommunityData.top_projects || null,
      featured_project: subCommunityData.featured_project || null,
      related_blog: subCommunityData.related_blog || null,
      properties: subCommunityData.properties || null,
      similar_location: subCommunityData.similar_location || null,
      seo_slug: subCommunityData.seo_slug || slug,
      seo_title: subCommunityData.seo_title || subCommunityData.name,
      seo_description: subCommunityData.seo_description || null,
    };

    // Add optional fields if column exists
    for (const [key, value] of Object.entries(optionalMappings)) {
      if (existingColumns.includes(key)) {
        insertData[key] = value;
      }
    }

    // Handle seo_keyword with correct column name
    if (seoKeywordCol) {
      insertData[seoKeywordCol] = subCommunityData.seo_keyword || null;
    }

    // Handle sales_director with correct column name
    if (salesDirectorCol) {
      insertData[salesDirectorCol] = subCommunityData.sales_director || null;
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

    // Fetch and return created sub-community
    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [result.insertId]
    );

    console.log('✅ SubCommunity created with ID:', result.insertId);
    return normalizeResponse(rows[0]);

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error creating sub-community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== READ ====================
export const getAllSubCommunities = async (page = 1, limit = 10, filters = {}) => {
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

    if (filters.community_id) {
      whereConditions.push(`community_id = ?`);
      queryParams.push(parseInt(filters.community_id));
    }

    if (filters.city_id) {
      whereConditions.push(`city_id = ?`);
      queryParams.push(parseInt(filters.city_id));
    }

    if (filters.country_id) {
      whereConditions.push(`country_id = ?`);
      queryParams.push(parseInt(filters.country_id));
    }

    if (filters.top_community !== undefined) {
      whereConditions.push(`top_community = ?`);
      queryParams.push(filters.top_community ? 1 : 0);
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
    console.error('Error fetching sub-communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getAllSubCommunitiesNoPagination = async (filters = {}) => {
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

    if (filters.community_id) {
      whereConditions.push(`community_id = ?`);
      queryParams.push(parseInt(filters.community_id));
    }

    if (filters.top_community !== undefined) {
      whereConditions.push(`top_community = ?`);
      queryParams.push(filters.top_community ? 1 : 0);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY name ASC`;
    const [rows] = await connection.query(query, queryParams);

    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching all sub-communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getSubCommunityById = async (id) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`;
    const [rows] = await connection.query(query, [id]);
    
    return normalizeResponse(rows[0]);
  } catch (error) {
    console.error('Error fetching sub-community by ID:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getSubCommunityBySlug = async (slug) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE slug = ?`;
    const [rows] = await connection.query(query, [slug]);
    
    return normalizeResponse(rows[0]);
  } catch (error) {
    console.error('Error fetching sub-community by slug:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getSubCommunitiesByCommunity = async (communityId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE community_id = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [communityId]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching sub-communities by community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getSubCommunitiesByCity = async (cityId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE city_id = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [cityId]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching sub-communities by city:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getSubCommunitiesByCountry = async (countryId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE country_id = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [countryId]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching sub-communities by country:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== UPDATE ====================
export const updateSubCommunity = async (id, updateData) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Fix table columns first
    await fixTableColumns(connection);
    
    await connection.beginTransaction();

    // Check if exists
    const existing = await getSubCommunityById(id);
    if (!existing) {
      throw new Error('Sub-Community not found');
    }

    // Check for duplicate name
    if (updateData.name && updateData.name !== existing.name) {
      const duplicate = await checkDuplicateSubCommunity(
        updateData.name, 
        updateData.community_id || existing.community_id,
        id
      );
      if (duplicate) {
        throw new Error(`Sub-Community "${updateData.name}" already exists in this community`);
      }
      updateData.slug = await generateUniqueSlug(updateData.name, id);
    }

    // Get existing columns
    const existingColumns = await getTableColumns(connection);
    
    // Determine correct column names
    const seoKeywordCol = existingColumns.includes('seo_keyword') ? 'seo_keyword' : 
                          existingColumns.includes('seo_keywork') ? 'seo_keywork' : null;
    const salesDirectorCol = existingColumns.includes('sales_director') ? 'sales_director' : 
                             existingColumns.includes('sales_diretor') ? 'sales_diretor' : null;

    // Map of input fields to actual column names
    const fieldMapping = {
      'seo_keyword': seoKeywordCol,
      'seo_keywork': seoKeywordCol,
      'sales_director': salesDirectorCol,
      'sales_diretor': salesDirectorCol,
    };

    const allowedFields = [
      'name', 'country_id', 'state_id', 'city_id', 'community_id', 'direction',
      'slug', 'img', 'latitude', 'longitude', 'description', 'top_community',
      'top_projects', 'featured_project', 'related_blog', 'properties',
      'similar_location', 'seo_slug', 'seo_title', 'seo_description', 'status'
    ];

    // Add dynamic column names
    if (seoKeywordCol) allowedFields.push(seoKeywordCol);
    if (salesDirectorCol) allowedFields.push(salesDirectorCol);

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
      
      // Handle boolean conversion
      if (actualKey === 'top_community') {
        processedValue = toBoolean(value) ? 1 : 0;
      }
      
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
    console.error('Error updating sub-community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const updateSubCommunityMedia = async (id, mediaPath) => {
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
    console.error('Error updating sub-community media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const deleteSubCommunityMedia = async (id) => {
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
    console.error('Error deleting sub-community media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== DELETE ====================
export const deleteSubCommunity = async (id) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error('Sub-Community not found');
    }

    await connection.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    await connection.commit();

    return normalizeResponse(existing[0]);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting sub-community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const bulkDeleteSubCommunities = async (ids) => {
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
    console.error('Error bulk deleting sub-communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== STATUS ====================
export const updateSubCommunityStatus = async (id, status) => {
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
      throw new Error('Sub-Community not found');
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
    console.error('Error updating sub-community status:', error);
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

export const getSubCommunitiesByStatus = async (status) => {
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
    console.error('Error fetching sub-communities by status:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== SEARCH & FILTER ====================
export const searchSubCommunities = async (searchTerm, limit = 10) => {
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
    console.error('Error searching sub-communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const filterSubCommunities = async (filters) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let whereConditions = [];
    let queryParams = [];

    const statusIsInt = await isStatusInt(connection);

    if (filters.community_id) {
      whereConditions.push(`community_id = ?`);
      queryParams.push(parseInt(filters.community_id));
    }

    if (filters.city_id) {
      whereConditions.push(`city_id = ?`);
      queryParams.push(parseInt(filters.city_id));
    }

    if (filters.country_id) {
      whereConditions.push(`country_id = ?`);
      queryParams.push(parseInt(filters.country_id));
    }

    if (filters.status) {
      whereConditions.push(`status = ?`);
      if (statusIsInt) {
        queryParams.push(filters.status === 'active' ? 1 : 0);
      } else {
        queryParams.push(filters.status);
      }
    }

    if (filters.top_community !== undefined) {
      whereConditions.push(`top_community = ?`);
      queryParams.push(filters.top_community ? 1 : 0);
    }

    if (filters.direction) {
      whereConditions.push(`direction = ?`);
      queryParams.push(filters.direction);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY name ASC`;
    const [rows] = await connection.query(query, queryParams);

    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error filtering sub-communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== STATS ====================
export const getSubCommunityStats = async () => {
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
          SUM(CASE WHEN top_community = 1 THEN 1 ELSE 0 END) as top_communities,
          COUNT(DISTINCT community_id) as unique_communities
        FROM ${TABLE_NAME}
      `;
    } else {
      statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN top_community = 1 THEN 1 ELSE 0 END) as top_communities,
          COUNT(DISTINCT community_id) as unique_communities
        FROM ${TABLE_NAME}
      `;
    }

    const [rows] = await connection.query(statsQuery);
    return {
      total: parseInt(rows[0].total) || 0,
      active: parseInt(rows[0].active) || 0,
      inactive: parseInt(rows[0].inactive) || 0,
      top_communities: parseInt(rows[0].top_communities) || 0,
      unique_communities: parseInt(rows[0].unique_communities) || 0
    };
  } catch (error) {
    console.error('Error fetching sub-community stats:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== UTILITIES ====================
export const getRecentSubCommunities = async (limit = 5) => {
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
    console.error('Error fetching recent sub-communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getSubCommunitiesForDropdown = async (communityId = null) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const statusIsInt = await isStatusInt(connection);
    const activeStatus = statusIsInt ? 1 : 'active';
    
    let query = `
      SELECT id, name, slug, community_id, city_id, country_id FROM ${TABLE_NAME} 
      WHERE status = ?
    `;
    const params = [activeStatus];

    if (communityId) {
      query += ' AND community_id = ?';
      params.push(parseInt(communityId));
    }

    query += ' ORDER BY name ASC';
    
    const [rows] = await connection.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching sub-communities for dropdown:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getActiveSubCommunities = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const statusIsInt = await isStatusInt(connection);
    const activeStatus = statusIsInt ? 1 : 'active';
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE status = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [activeStatus]);
    
    return rows.map(normalizeResponse);
  } catch (error) {
    console.error('Error fetching active sub-communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getSubCommunitiesWithMedia = async () => {
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
    console.error('Error fetching sub-communities with media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getSubCommunityByCoordinates = async (latitude, longitude, radius = 5) => {
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
    console.error('Error fetching sub-communities by coordinates:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Get sub-communities with parent community info
export const getSubCommunitiesWithCommunity = async (page = 1, limit = 10, filters = {}) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    const statusIsInt = await isStatusInt(connection);

    if (filters.status) {
      whereConditions.push(`sc.status = ?`);
      if (statusIsInt) {
        queryParams.push(filters.status === 'active' ? 1 : 0);
      } else {
        queryParams.push(filters.status);
      }
    }

    if (filters.community_id) {
      whereConditions.push(`sc.community_id = ?`);
      queryParams.push(parseInt(filters.community_id));
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ${TABLE_NAME} sc ${whereClause}`;
    const [countResult] = await connection.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);

    // Get data with community join
    const dataQuery = `
      SELECT 
        sc.*,
        c.name as community_name,
        c.slug as community_slug
      FROM ${TABLE_NAME} sc
      LEFT JOIN community c ON sc.community_id = c.id
      ${whereClause}
      ORDER BY sc.id DESC
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
    console.error('Error fetching sub-communities with community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== EXPORT ====================
export default {
  createSubCommunityTable,
  generateSlug,
  slugExists,
  generateUniqueSlug,
  checkDuplicateSubCommunity,
  createSubCommunity,
  getAllSubCommunities,
  getAllSubCommunitiesNoPagination,
  getSubCommunityById,
  getSubCommunityBySlug,
  getSubCommunitiesByCommunity,
  getSubCommunitiesByCity,
  getSubCommunitiesByCountry,
  updateSubCommunity,
  updateSubCommunityMedia,
  deleteSubCommunityMedia,
  deleteSubCommunity,
  bulkDeleteSubCommunities,
  updateSubCommunityStatus,
  bulkUpdateStatus,
  getSubCommunitiesByStatus,
  searchSubCommunities,
  filterSubCommunities,
  getSubCommunityStats,
  getRecentSubCommunities,
  getSubCommunitiesForDropdown,
  getActiveSubCommunities,
  getSubCommunitiesWithMedia,
  getSubCommunityByCoordinates,
  getSubCommunitiesWithCommunity
};