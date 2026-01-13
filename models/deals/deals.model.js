import pool from '../../config/db.js';

// ==================== TABLE CREATION ====================

export const createDealsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS deals (
      id INT PRIMARY KEY AUTO_INCREMENT,
      closing_ids VARCHAR(255),
      listing VARCHAR(255),
      buyers VARCHAR(255),
      sellers VARCHAR(255),
      sales_price DECIMAL(15, 2),
      target_closing DATE,
      closing DATE,
      closing_status VARCHAR(100) DEFAULT 'Pending',
      unknown VARCHAR(255),
      aml VARCHAR(100),
      contract_generating_user VARCHAR(255),
      documentation_check_in_process BOOLEAN DEFAULT FALSE,
      documentation_check_approved BOOLEAN DEFAULT FALSE,
      contact_details_verification_in_process BOOLEAN DEFAULT FALSE,
      contact_details_verified BOOLEAN DEFAULT FALSE,
      contact_details_not_verified BOOLEAN DEFAULT FALSE,
      kyc_completed BOOLEAN DEFAULT FALSE,
      am_kyc_not_completed BOOLEAN DEFAULT FALSE,
      client_type VARCHAR(100),
      purchase_as VARCHAR(100),
      case_with_ami_consultants BOOLEAN DEFAULT FALSE,
      birth DATE,
      age INT,
      residence VARCHAR(255),
      passport VARCHAR(100),
      severity VARCHAR(50),
      representing VARCHAR(100),
      probability DECIMAL(5, 2),
      developer VARCHAR(255),
      original_price DECIMAL(15, 2),
      tenant VARCHAR(255),
      landlord VARCHAR(255),
      party_commission DECIMAL(15, 2),
      agency_contact VARCHAR(255),
      party_name VARCHAR(255),
      closing_broker VARCHAR(255),
      third_broker_split_amount DECIMAL(15, 2),
      second_broker VARCHAR(255),
      second_broker_split_amount DECIMAL(15, 2),
      fourth_broker_split_amount DECIMAL(15, 2),
      fourth_broker VARCHAR(255),
      deposit_date DATE,
      money_amount DECIMAL(15, 2),
      agreement_date DATE,
      created_by VARCHAR(255),
      closing_name VARCHAR(255),
      winning_inquiry VARCHAR(255),
      lead_source VARCHAR(255),
      winning_inquiry_status VARCHAR(100),
      buyer_nationality VARCHAR(100),
      buyer_second_nationality VARCHAR(100),
      transfer_fee DECIMAL(15, 2),
      seller_nationality VARCHAR(100),
      seller_second_nationality VARCHAR(100),
      listing_type VARCHAR(100),
      listing_city VARCHAR(255),
      commission DECIMAL(15, 2),
      listing_community VARCHAR(255),
      listing_property_address TEXT,
      furnished BOOLEAN DEFAULT FALSE,
      closing_date DATE,
      listing_unit_number VARCHAR(100),
      documentation TEXT,
      transaction_type VARCHAR(100),
      freehold BOOLEAN DEFAULT FALSE,
      title_deed VARCHAR(255),
      status_on_transfer VARCHAR(100),
      conveyancing_fee DECIMAL(15, 2),
      representation VARCHAR(100),
      security_requested BOOLEAN DEFAULT FALSE,
      success_probability DECIMAL(5, 2),
      success_probability_amount DECIMAL(15, 2),
      partial_payment DECIMAL(15, 2),
      full_payment DECIMAL(15, 2),
      accounted_date DATE,
      passport_issued_city VARCHAR(255),
      seller VARCHAR(255),
      documentation_check_not_approved BOOLEAN DEFAULT FALSE,
      sold_as VARCHAR(100),
      due_to_developer DECIMAL(15, 2),
      amount DECIMAL(15, 2),
      split_amount DECIMAL(15, 2),
      third_broker VARCHAR(255),
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      sub_title VARCHAR(255),
      descriptions TEXT,
      seo_title VARCHAR(255),
      seo_keyword VARCHAR(255),
      seo_description TEXT,
      closing_checklist TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_closing_status (closing_status),
      INDEX idx_listing_city (listing_city),
      INDEX idx_developer (developer),
      INDEX idx_closing_ids (closing_ids)
    )
  `;

  try {
    await pool.query(query);
    return true;
  } catch (error) {
    console.error('Error creating deals table:', error);
    throw error;
  }
};

// ==================== CHECK TABLE EXISTS ====================

export const checkTableExists = async () => {
  try {
    const [rows] = await pool.query(`SHOW TABLES LIKE 'deals'`);
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking table:', error);
    return false;
  }
};

// ==================== GET TABLE COLUMNS ====================

export const getTableColumns = async () => {
  try {
    const [rows] = await pool.query(`SHOW COLUMNS FROM deals`);
    return rows.map(row => row.Field);
  } catch (error) {
    console.error('Error getting columns:', error);
    return [];
  }
};

// ==================== GET DEAL BY ID ====================

export const getDealById = async (id) => {
  try {
    const query = `SELECT * FROM deals WHERE id = ?`;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting deal by ID:', error);
    throw error;
  }
};

// ==================== GET DEAL BY CLOSING ID ====================

export const getDealByClosingId = async (closingId) => {
  try {
    const query = `SELECT * FROM deals WHERE closing_ids = ?`;
    const [rows] = await pool.query(query, [closingId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting deal by closing ID:', error);
    throw error;
  }
};

// ==================== GET ALL DEALS ====================

export const getAllDeals = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    status,
    city,
    developer,
    search,
    sortBy = 'id',
    sortOrder = 'desc'
  } = options;

  const offset = (page - 1) * limit;
  const params = [];
  const countParams = [];
  
  // Build WHERE clause
  let whereClause = 'WHERE 1=1';

  if (status && status !== 'all') {
    whereClause += ` AND closing_status = ?`;
    params.push(status);
    countParams.push(status);
  }

  if (city && city !== 'all') {
    whereClause += ` AND listing_city = ?`;
    params.push(city);
    countParams.push(city);
  }

  if (developer && developer !== 'all') {
    whereClause += ` AND developer = ?`;
    params.push(developer);
    countParams.push(developer);
  }

  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    whereClause += ` AND (
      closing_ids LIKE ? OR
      closing_name LIKE ? OR
      buyers LIKE ? OR
      sellers LIKE ? OR
      listing LIKE ? OR
      developer LIKE ? OR
      listing_city LIKE ?
    )`;
    const searchParams = Array(7).fill(searchPattern);
    params.push(...searchParams);
    countParams.push(...searchParams);
  }

  // Validate sort column to prevent SQL injection
  const allowedSortColumns = ['id', 'closing_ids', 'closing_name', 'sales_price', 'commission', 'closing_date', 'closing_status', 'listing_city'];
  const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'id';
  const safeOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  try {
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM deals ${whereClause}`;
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT * FROM deals 
      ${whereClause}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.query(dataQuery, params);

    return {
      data: rows,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasMore: offset + rows.length < total
    };
  } catch (error) {
    console.error('Error getting all deals:', error);
    throw error;
  }
};

// ==================== CREATE DEAL ====================

export const createDeal = async (dealData) => {
  try {
    // Filter out undefined/null values and invalid columns
    const columns = await getTableColumns();
    const validData = {};
    
    for (const [key, value] of Object.entries(dealData)) {
      if (columns.includes(key) && value !== undefined && value !== null && value !== '') {
        validData[key] = value;
      }
    }

    if (Object.keys(validData).length === 0) {
      throw new Error('No valid data provided');
    }

    const columnNames = Object.keys(validData).join(', ');
    const placeholders = Object.keys(validData).map(() => '?').join(', ');
    const values = Object.values(validData);

    const query = `INSERT INTO deals (${columnNames}) VALUES (${placeholders})`;
    const [result] = await pool.query(query, values);

    return {
      id: result.insertId,
      ...validData
    };
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};

// ==================== UPDATE DEAL ====================

export const updateDeal = async (id, dealData) => {
  try {
    // Filter out undefined/null values
    const columns = await getTableColumns();
    const validData = {};
    
    for (const [key, value] of Object.entries(dealData)) {
      if (columns.includes(key) && key !== 'id' && key !== 'created_at') {
        validData[key] = value;
      }
    }

    if (Object.keys(validData).length === 0) {
      throw new Error('No valid data provided for update');
    }

    const updates = Object.keys(validData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(validData), id];

    const query = `UPDATE deals SET ${updates} WHERE id = ?`;
    const [result] = await pool.query(query, values);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating deal:', error);
    throw error;
  }
};

// ==================== UPDATE DEAL SECTION ====================

export const updateDealSection = async (id, sectionData) => {
  try {
    const columns = await getTableColumns();
    const validData = {};
    
    for (const [key, value] of Object.entries(sectionData)) {
      if (columns.includes(key) && key !== 'id' && key !== 'created_at') {
        validData[key] = value;
      }
    }

    if (Object.keys(validData).length === 0) {
      return false;
    }

    const updates = Object.keys(validData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(validData), id];

    const query = `UPDATE deals SET ${updates} WHERE id = ?`;
    const [result] = await pool.query(query, values);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating deal section:', error);
    throw error;
  }
};

// ==================== DELETE DEAL ====================

export const deleteDeal = async (id) => {
  try {
    const query = `DELETE FROM deals WHERE id = ?`;
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
};

// ==================== BULK DELETE DEALS ====================

export const bulkDeleteDeals = async (ids) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('No IDs provided for bulk delete');
    }

    // Sanitize IDs
    const sanitizedIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (sanitizedIds.length === 0) {
      throw new Error('No valid IDs provided');
    }

    const placeholders = sanitizedIds.map(() => '?').join(', ');
    const query = `DELETE FROM deals WHERE id IN (${placeholders})`;
    const [result] = await pool.query(query, sanitizedIds);
    
    return {
      deleted: result.affectedRows,
      requested: sanitizedIds.length
    };
  } catch (error) {
    console.error('Error bulk deleting deals:', error);
    throw error;
  }
};

// ==================== UPDATE DEAL STATUS ====================

export const updateDealStatus = async (id, status) => {
  try {
    const validStatuses = ['Pending', 'In Progress', 'Closed', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const query = `UPDATE deals SET closing_status = ? WHERE id = ?`;
    const [result] = await pool.query(query, [status, id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating deal status:', error);
    throw error;
  }
};

// ==================== GET DEAL STATS ====================

export const getDealStats = async () => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_deals,
        COALESCE(SUM(sales_price), 0) as total_sales,
        COALESCE(SUM(commission), 0) as total_commission,
        COALESCE(AVG(sales_price), 0) as avg_sales_price,
        COUNT(CASE WHEN closing_status = 'Closed' THEN 1 END) as closed_deals,
        COUNT(CASE WHEN closing_status = 'Pending' THEN 1 END) as pending_deals,
        COUNT(CASE WHEN closing_status = 'In Progress' THEN 1 END) as in_progress_deals,
        COUNT(CASE WHEN closing_status = 'Cancelled' THEN 1 END) as cancelled_deals
      FROM deals
    `;
    const [rows] = await pool.query(query);
    
    return {
      total_deals: rows[0].total_deals || 0,
      total_sales: parseFloat(rows[0].total_sales) || 0,
      total_commission: parseFloat(rows[0].total_commission) || 0,
      avg_sales_price: parseFloat(rows[0].avg_sales_price) || 0,
      closed_deals: rows[0].closed_deals || 0,
      pending_deals: rows[0].pending_deals || 0,
      in_progress_deals: rows[0].in_progress_deals || 0,
      cancelled_deals: rows[0].cancelled_deals || 0
    };
  } catch (error) {
    console.error('Error getting deal stats:', error);
    throw error;
  }
};

// ==================== SEARCH DEALS ====================

export const searchDeals = async (searchTerm, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;
  
  try {
    if (!searchTerm || !searchTerm.trim()) {
      return { data: [], total: 0 };
    }

    const searchPattern = `%${searchTerm.trim()}%`;

    const countQuery = `
      SELECT COUNT(*) as total FROM deals 
      WHERE 
        closing_ids LIKE ? OR
        listing LIKE ? OR
        buyers LIKE ? OR
        sellers LIKE ? OR
        closing_name LIKE ? OR
        developer LIKE ? OR
        listing_city LIKE ?
    `;
    
    const searchParams = Array(7).fill(searchPattern);
    const [countResult] = await pool.query(countQuery, searchParams);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT * FROM deals 
      WHERE 
        closing_ids LIKE ? OR
        listing LIKE ? OR
        buyers LIKE ? OR
        sellers LIKE ? OR
        closing_name LIKE ? OR
        developer LIKE ? OR
        listing_city LIKE ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...searchParams, parseInt(limit), parseInt(offset)];
    const [rows] = await pool.query(dataQuery, dataParams);

    return {
      data: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: offset + rows.length < total
    };
  } catch (error) {
    console.error('Error searching deals:', error);
    throw error;
  }
};

// ==================== GET RECENT DEALS ====================

export const getRecentDeals = async (limit = 5) => {
  try {
    const query = `
      SELECT id, closing_ids, closing_name, buyers, sellers, sales_price, 
             closing_status, closing_date, commission, listing_city
      FROM deals 
      ORDER BY id DESC 
      LIMIT ?
    `;
    const [rows] = await pool.query(query, [parseInt(limit)]);
    return rows;
  } catch (error) {
    console.error('Error getting recent deals:', error);
    throw error;
  }
};

// ==================== GET DEALS BY CLOSING STATUS ====================

export const getDealsByClosingStatus = async (status, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  try {
    const countQuery = `SELECT COUNT(*) as total FROM deals WHERE closing_status = ?`;
    const [countResult] = await pool.query(countQuery, [status]);
    const total = countResult[0].total;

    const query = `
      SELECT * FROM deals 
      WHERE closing_status = ? 
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [status, parseInt(limit), parseInt(offset)]);
    
    return {
      data: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: offset + rows.length < total
    };
  } catch (error) {
    console.error('Error getting deals by status:', error);
    throw error;
  }
};

// ==================== GET DEALS BY MONTH ====================

export const getDealsByMonth = async (year, month) => {
  try {
    const query = `
      SELECT * FROM deals 
      WHERE YEAR(closing_date) = ? AND MONTH(closing_date) = ?
      ORDER BY closing_date DESC
    `;
    const [rows] = await pool.query(query, [parseInt(year), parseInt(month)]);
    return rows;
  } catch (error) {
    console.error('Error getting deals by month:', error);
    throw error;
  }
};

// ==================== GET DEALS BY DATE RANGE ====================

export const getDealsByDateRange = async (startDate, endDate) => {
  try {
    const query = `
      SELECT * FROM deals 
      WHERE closing_date BETWEEN ? AND ?
      ORDER BY closing_date DESC
    `;
    const [rows] = await pool.query(query, [startDate, endDate]);
    return rows;
  } catch (error) {
    console.error('Error getting deals by date range:', error);
    throw error;
  }
};

// ==================== GET CITIES LIST ====================

export const getCitiesList = async () => {
  try {
    const query = `
      SELECT DISTINCT listing_city 
      FROM deals 
      WHERE listing_city IS NOT NULL AND listing_city != ''
      ORDER BY listing_city ASC
    `;
    const [rows] = await pool.query(query);
    return rows.map(row => row.listing_city);
  } catch (error) {
    console.error('Error getting cities list:', error);
    throw error;
  }
};

// ==================== GET DEVELOPERS LIST ====================

export const getDevelopersList = async () => {
  try {
    const query = `
      SELECT DISTINCT developer 
      FROM deals 
      WHERE developer IS NOT NULL AND developer != ''
      ORDER BY developer ASC
    `;
    const [rows] = await pool.query(query);
    return rows.map(row => row.developer);
  } catch (error) {
    console.error('Error getting developers list:', error);
    throw error;
  }
};

// ==================== EXPORT DEALS ====================

export const exportDeals = async (filters = {}) => {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.status && filters.status !== 'all') {
      whereClause += ` AND closing_status = ?`;
      params.push(filters.status);
    }

    if (filters.city && filters.city !== 'all') {
      whereClause += ` AND listing_city = ?`;
      params.push(filters.city);
    }

    if (filters.startDate && filters.endDate) {
      whereClause += ` AND closing_date BETWEEN ? AND ?`;
      params.push(filters.startDate, filters.endDate);
    }

    const query = `
      SELECT 
        id, closing_ids, closing_name, closing_status,
        buyers, sellers, sales_price, commission,
        listing_city, developer, closing_date,
        target_closing, created_by
      FROM deals 
      ${whereClause}
      ORDER BY id DESC
    `;
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error exporting deals:', error);
    throw error;
  }
};

// ==================== INITIALIZE TABLE ====================

export const initializeDealsTable = async () => {
  try {
    const exists = await checkTableExists();
    if (!exists) {
      await createDealsTable();
    } else {
    }
    return true;
  } catch (error) {
    console.error('Error initializing deals table:', error);
    throw error;
  }
};

// ==================== EXPORT DEFAULT ====================

export default {
  createDealsTable,
  checkTableExists,
  getTableColumns,
  getDealById,
  getDealByClosingId,
  getAllDeals,
  createDeal,
  updateDeal,
  updateDealSection,
  deleteDeal,
  bulkDeleteDeals,
  updateDealStatus,
  getDealStats,
  searchDeals,
  getRecentDeals,
  getDealsByClosingStatus,
  getDealsByMonth,
  getDealsByDateRange,
  getCitiesList,
  getDevelopersList,
  exportDeals,
  initializeDealsTable
};