import pool from '../../config/db.js';

// ==================== ERROR LOGGER ONLY ====================
const _logError = (functionName, error) => {
  console.error(`[CtaegoryModel] ${functionName}:`, error.message);
};

// ==================== HELPER: GENERATE SLUG ====================
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ==================== CREATE TABLE ====================
export const createCtaegoryTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ctaegory (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_slug (slug),
        INDEX idx_category_name (category_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (error) {
    _logError('createCtaegoryTable', error);
    throw error;
  }
};

// ==================== CREATE ====================
export const createCtaegory = async (data) => {
  try {
    const { category_name, slug } = data;
    const finalSlug = slug || generateSlug(category_name);

    // Check duplicate slug
    const [existing] = await pool.query(
      'SELECT id FROM ctaegory WHERE slug = ?',
      [finalSlug]
    );

    if (existing.length > 0) {
      return { success: false, message: 'Ctaegory with this slug already exists' };
    }

    const [result] = await pool.query(
      'INSERT INTO ctaegory (category_name, slug) VALUES (?, ?)',
      [category_name, finalSlug]
    );

    return { success: true, id: result.insertId, slug: finalSlug };
  } catch (error) {
    _logError('createCtaegory', error);
    throw error;
  }
};

// ==================== GET ALL ====================
export const getAllCtaegories = async (filters = {}) => {
  try {
    let query = 'SELECT * FROM ctaegory WHERE 1=1';
    const params = [];

    // Search by name
    if (filters.search) {
      query += ' AND category_name LIKE ?';
      params.push(`%${filters.search}%`);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    if (filters.page && filters.limit) {
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const offset = (page - 1) * limit;

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM ctaegory'
      );

      const [rows] = await pool.query(query, params);

      return {
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(countResult[0].total / limit),
          totalRecords: countResult[0].total,
          limit
        }
      };
    }

    const [rows] = await pool.query(query, params);
    return { success: true, data: rows };
  } catch (error) {
    _logError('getAllCtaegories', error);
    throw error;
  }
};

// ==================== GET BY ID ====================
export const getCtaegoryById = async (id) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ctaegory WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return { success: false, message: 'Ctaegory not found' };
    }

    return { success: true, data: rows[0] };
  } catch (error) {
    _logError('getCtaegoryById', error);
    throw error;
  }
};

// ==================== GET BY SLUG ====================
export const getCtaegoryBySlug = async (slug) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ctaegory WHERE slug = ?',
      [slug]
    );

    if (rows.length === 0) {
      return { success: false, message: 'Ctaegory not found' };
    }

    return { success: true, data: rows[0] };
  } catch (error) {
    _logError('getCtaegoryBySlug', error);
    throw error;
  }
};

// ==================== UPDATE ====================
export const updateCtaegory = async (id, updateData) => {
  try {
    // Check if exists
    const [existing] = await pool.query(
      'SELECT * FROM ctaegory WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return { success: false, message: 'Ctaegory not found' };
    }

    // Generate slug if name changed
    if (updateData.category_name && !updateData.slug) {
      updateData.slug = generateSlug(updateData.category_name);
    }

    // Check slug conflict
    if (updateData.slug) {
      const [slugExists] = await pool.query(
        'SELECT id FROM ctaegory WHERE slug = ? AND id != ?',
        [updateData.slug, id]
      );

      if (slugExists.length > 0) {
        return { success: false, message: 'Ctaegory with this slug already exists' };
      }
    }

    // Remove protected fields
    delete updateData.id;
    delete updateData.created_at;

    if (Object.keys(updateData).length === 0) {
      return { success: false, message: 'No fields to update' };
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const [result] = await pool.query(
      `UPDATE ctaegory SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );

    if (result.affectedRows === 0) {
      return { success: false, message: 'Failed to update ctaegory' };
    }

    return { success: true, message: 'Ctaegory updated successfully' };
  } catch (error) {
    _logError('updateCtaegory', error);
    throw error;
  }
};

// ==================== DELETE ====================
export const deleteCtaegory = async (id) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM ctaegory WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return { success: false, message: 'Ctaegory not found' };
    }

    return { success: true, message: 'Ctaegory deleted successfully' };
  } catch (error) {
    _logError('deleteCtaegory', error);
    throw error;
  }
};

// ==================== CHECK EXISTS ====================
export const ctaegoryExists = async (identifier, type = 'id') => {
  try {
    const column = type === 'slug' ? 'slug' : 'id';
    const [rows] = await pool.query(
      `SELECT id FROM ctaegory WHERE ${column} = ?`,
      [identifier]
    );

    return { success: true, exists: rows.length > 0 };
  } catch (error) {
    _logError('ctaegoryExists', error);
    throw error;
  }
};

// ==================== BULK CREATE ====================
export const bulkCreateCtaegories = async (ctaegoriesArray) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const insertedIds = [];
    for (const ctaegory of ctaegoriesArray) {
      const result = await createCtaegory(ctaegory);
      if (result.success) {
        insertedIds.push(result.id);
      }
    }

    await connection.commit();
    return { success: true, ids: insertedIds, count: insertedIds.length };
  } catch (error) {
    await connection.rollback();
    _logError('bulkCreateCtaegories', error);
    throw error;
  } finally {
    connection.release();
  }
};

// ==================== GET COUNT ====================
export const getCtaegoryCount = async () => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as total FROM ctaegory'
    );

    return { success: true, count: result[0].total };
  } catch (error) {
    _logError('getCtaegoryCount', error);
    throw error;
  }
};

// ==================== DEFAULT EXPORT ====================
export default {
  createCtaegoryTable,
  createCtaegory,
  getAllCtaegories,
  getCtaegoryById,
  getCtaegoryBySlug,
  updateCtaegory,
  deleteCtaegory,
  ctaegoryExists,
  bulkCreateCtaegories,
  getCtaegoryCount
};