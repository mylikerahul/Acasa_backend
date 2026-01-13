import pool from '../../config/db.js';

// ==================== CONSTANTS ====================
const TABLE_NAME = 'community'; // ✅ Match your existing table name

// ==================== TABLE CREATION ====================
export const createCommunityTable = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INT PRIMARY KEY AUTO_INCREMENT,
        community_id VARCHAR(100) UNIQUE,
        name VARCHAR(255) NOT NULL,
        country_id INT,
        state_id INT,
        city_id INT,
        slug VARCHAR(255) UNIQUE NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        img TEXT,
        school_img TEXT,
        hotel_img TEXT,
        hospital_img TEXT,
        train_img TEXT,
        bus_img TEXT,
        description TEXT,
        top_community BOOLEAN DEFAULT false,
        top_projects TEXT,
        featured_project TEXT,
        related_blog TEXT,
        properties TEXT,
        similar_location TEXT,
        sales_diretor VARCHAR(255),
        seo_slug VARCHAR(255),
        seo_title VARCHAR(255),
        seo_keywork VARCHAR(255),
        seo_description TEXT,
        featured BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(createTableQuery);
    
    console.log('✅ Community table created successfully');
  } catch (error) {
    console.error('❌ Error creating community table:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== SLUG GENERATION ====================
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

// ==================== DUPLICATE CHECK ====================
export const checkDuplicateCommunity = async (name, excludeId = null) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let query = `SELECT id, name FROM ${TABLE_NAME} WHERE LOWER(name) = LOWER(?)`;
    const params = [name];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await connection.query(query, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error checking duplicate community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== CREATE ====================
export const createCommunity = async (communityData) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check for duplicates
    const duplicate = await checkDuplicateCommunity(communityData.name);
    if (duplicate) {
      throw new Error(`Community "${communityData.name}" already exists`);
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(communityData.name);

    // Generate unique community_id
    const communityId = `${Date.now()}`;

    const insertQuery = `
      INSERT INTO ${TABLE_NAME} (
        community_id, name, country_id, state_id, city_id, slug,
        latitude, longitude, img, school_img, hotel_img, hospital_img,
        train_img, bus_img, description, top_community, top_projects,
        featured_project, related_blog, properties, similar_location,
        sales_diretor, seo_slug, seo_title, seo_keywork, seo_description,
        featured, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      communityId,
      communityData.name,
      communityData.country_id || null,
      communityData.state_id || null,
      communityData.city_id || null,
      slug,
      communityData.latitude || null,
      communityData.longitude || null,
      communityData.img || null,
      communityData.school_img || null,
      communityData.hotel_img || null,
      communityData.hospital_img || null,
      communityData.train_img || null,
      communityData.bus_img || null,
      communityData.description || null,
      communityData.top_community || false,
      communityData.top_projects || null,
      communityData.featured_project || null,
      communityData.related_blog || null,
      communityData.properties || null,
      communityData.similar_location || null,
      communityData.sales_diretor || null,  // ✅ Match existing column name
      communityData.seo_slug || slug,
      communityData.seo_title || communityData.name,
      communityData.seo_keywork || null,    // ✅ Match existing column name (typo in DB)
      communityData.seo_description || null,
      communityData.featured || false,
      communityData.status || 'active'
    ];

    const [result] = await connection.query(insertQuery, values);
    await connection.commit();

    // Fetch and return the created community
    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [result.insertId]
    );

    return rows[0];
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== READ ====================
export const getAllCommunities = async (page = 1, limit = 10, filters = {}) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Apply filters
    if (filters.status) {
      whereConditions.push(`status = ?`);
      queryParams.push(filters.status);
    }

    if (filters.city_id) {
      whereConditions.push(`city_id = ?`);
      queryParams.push(filters.city_id);
    }

    if (filters.country_id) {
      whereConditions.push(`country_id = ?`);
      queryParams.push(filters.country_id);
    }

    if (filters.featured !== undefined) {
      whereConditions.push(`featured = ?`);
      queryParams.push(filters.featured ? 1 : 0);
    }

    if (filters.search) {
      whereConditions.push(`(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)`);
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Count total
    const countQuery = `SELECT COUNT(*) as count FROM ${TABLE_NAME} ${whereClause}`;
    const [countResult] = await connection.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${TABLE_NAME} 
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await connection.query(dataQuery, [...queryParams, limit, offset]);

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getAllCommunitiesNoPagination = async (filters = {}) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let whereConditions = [];
    let queryParams = [];

    if (filters.status) {
      whereConditions.push(`status = ?`);
      queryParams.push(filters.status);
    }

    if (filters.featured !== undefined) {
      whereConditions.push(`featured = ?`);
      queryParams.push(filters.featured ? 1 : 0);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY name ASC`;
    const [rows] = await connection.query(query, queryParams);

    return rows;
  } catch (error) {
    console.error('Error fetching all communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCommunityById = async (id) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`;
    const [rows] = await connection.query(query, [id]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching community by ID:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCommunityBySlug = async (slug) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE slug = ?`;
    const [rows] = await connection.query(query, [slug]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching community by slug:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCommunitiesByCity = async (cityId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE city_id = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [cityId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching communities by city:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCommunitiesByCountry = async (countryId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE country_id = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [countryId]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching communities by country:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== UPDATE ====================
export const updateCommunity = async (id, updateData) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if community exists
    const existing = await getCommunityById(id);
    if (!existing) {
      throw new Error('Community not found');
    }

    // Check for duplicate name (excluding current)
    if (updateData.name && updateData.name !== existing.name) {
      const duplicate = await checkDuplicateCommunity(updateData.name, id);
      if (duplicate) {
        throw new Error(`Community "${updateData.name}" already exists`);
      }
    }

    // Generate new slug if name changed
    let slug = existing.slug;
    if (updateData.name && updateData.name !== existing.name) {
      slug = await generateUniqueSlug(updateData.name, id);
      updateData.slug = slug;
    }

    // Build update query dynamically
    const allowedFields = [
      'name', 'country_id', 'state_id', 'city_id', 'slug', 'latitude', 'longitude',
      'img', 'school_img', 'hotel_img', 'hospital_img', 'train_img', 'bus_img',
      'description', 'top_community', 'top_projects', 'featured_project',
      'related_blog', 'properties', 'similar_location', 'sales_diretor',
      'seo_slug', 'seo_title', 'seo_keywork', 'seo_description', 'featured', 'status'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    
    const query = `
      UPDATE ${TABLE_NAME} 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.query(query, values);
    await connection.commit();

    // Return updated community
    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );

    return rows[0];
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const updateCommunityMedia = async (id, mediaField, mediaPath) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const validFields = ['img', 'school_img', 'hotel_img', 'hospital_img', 'train_img', 'bus_img'];

    if (!validFields.includes(mediaField)) {
      throw new Error('Invalid media field');
    }

    const query = `
      UPDATE ${TABLE_NAME} 
      SET ${mediaField} = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.query(query, [mediaPath, id]);
    
    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    return rows[0];
  } catch (error) {
    console.error('Error updating community media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const deleteCommunityMedia = async (id, mediaField) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const validFields = ['img', 'school_img', 'hotel_img', 'hospital_img', 'train_img', 'bus_img'];

    if (!validFields.includes(mediaField)) {
      throw new Error('Invalid media field');
    }

    const query = `
      UPDATE ${TABLE_NAME} 
      SET ${mediaField} = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.query(query, [id]);
    
    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    return rows[0];
  } catch (error) {
    console.error('Error deleting community media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== DELETE ====================
export const deleteCommunity = async (id) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get community before delete
    const [existing] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error('Community not found');
    }

    await connection.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    await connection.commit();

    return existing[0];
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting community:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const bulkDeleteCommunities = async (ids) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM ${TABLE_NAME} WHERE id IN (${placeholders})`;
    
    const [result] = await connection.query(query, ids);
    await connection.commit();

    return { deletedCount: result.affectedRows };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error bulk deleting communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== STATUS ====================
export const updateCommunityStatus = async (id, status) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be "active" or "inactive"');
    }

    // Check if exists
    const [existing] = await connection.query(
      `SELECT id FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    if (existing.length === 0) {
      throw new Error('Community not found');
    }

    await connection.query(
      `UPDATE ${TABLE_NAME} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, id]
    );

    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );

    return rows[0];
  } catch (error) {
    console.error('Error updating community status:', error);
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

    const placeholders = ids.map(() => '?').join(',');
    const query = `
      UPDATE ${TABLE_NAME} 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    await connection.query(query, [status, ...ids]);

    const [rows] = await connection.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id IN (${placeholders})`,
      ids
    );

    return rows;
  } catch (error) {
    console.error('Error bulk updating status:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCommunitiesByStatus = async (status) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE status = ? ORDER BY name ASC`;
    const [rows] = await connection.query(query, [status]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching communities by status:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== SEARCH & FILTER ====================
export const searchCommunities = async (searchTerm, limit = 10) => {
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
    const [rows] = await connection.query(query, [searchPattern, searchPattern, limit]);
    
    return rows;
  } catch (error) {
    console.error('Error searching communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const filterCommunities = async (filters) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let whereConditions = [];
    let queryParams = [];

    if (filters.city_id) {
      whereConditions.push(`city_id = ?`);
      queryParams.push(filters.city_id);
    }

    if (filters.country_id) {
      whereConditions.push(`country_id = ?`);
      queryParams.push(filters.country_id);
    }

    if (filters.status) {
      whereConditions.push(`status = ?`);
      queryParams.push(filters.status);
    }

    if (filters.featured !== undefined) {
      whereConditions.push(`featured = ?`);
      queryParams.push(filters.featured ? 1 : 0);
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

    return rows;
  } catch (error) {
    console.error('Error filtering communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== STATS ====================
export const getCommunityStats = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured,
        SUM(CASE WHEN top_community = 1 THEN 1 ELSE 0 END) as top_communities
      FROM ${TABLE_NAME}
    `;

    const [rows] = await connection.query(statsQuery);
    return rows[0];
  } catch (error) {
    console.error('Error fetching community stats:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== UTILITIES ====================
export const getRecentCommunities = async (limit = 5) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT * FROM ${TABLE_NAME} 
      WHERE status = 'active'
      ORDER BY id DESC 
      LIMIT ?
    `;
    
    const [rows] = await connection.query(query, [limit]);
    return rows;
  } catch (error) {
    console.error('Error fetching recent communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCommunitiesForDropdown = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT id, name, slug FROM ${TABLE_NAME} 
      WHERE status = 'active'
      ORDER BY name ASC
    `;
    
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching communities for dropdown:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getActiveCommunities = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `SELECT * FROM ${TABLE_NAME} WHERE status = 'active' ORDER BY name ASC`;
    const [rows] = await connection.query(query);
    
    return rows;
  } catch (error) {
    console.error('Error fetching active communities:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export const getCommunitiesWithMedia = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const query = `
      SELECT * FROM ${TABLE_NAME} 
      WHERE img IS NOT NULL 
      ORDER BY id DESC
    `;
    
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching communities with media:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ==================== EXPORT DEFAULT ====================
export default {
  createCommunityTable,
  generateSlug,
  slugExists,
  generateUniqueSlug,
  checkDuplicateCommunity,
  createCommunity,
  getAllCommunities,
  getAllCommunitiesNoPagination,
  getCommunityById,
  getCommunityBySlug,
  getCommunitiesByCity,
  getCommunitiesByCountry,
  updateCommunity,
  updateCommunityMedia,
  deleteCommunityMedia,
  deleteCommunity,
  bulkDeleteCommunities,
  updateCommunityStatus,
  bulkUpdateStatus,
  getCommunitiesByStatus,
  searchCommunities,
  filterCommunities,
  getCommunityStats,
  getRecentCommunities,
  getCommunitiesForDropdown,
  getActiveCommunities,
  getCommunitiesWithMedia
};