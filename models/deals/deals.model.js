import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION & AUTO-FIX (ID & COLUMNS)
========================================================= */

export const createDealsTable = async () => {
  // 1. Basic Table Creation
  const query = `
    CREATE TABLE IF NOT EXISTS deals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      Closing_IDs VARCHAR(100),
      Listing VARCHAR(255),
      Buyers VARCHAR(255),
      Sellers VARCHAR(255),
      Sales_Price DECIMAL(15, 2),
      Target_Closing DATE,
      Closing DATE,
      Closing_Status VARCHAR(100),
      unknown VARCHAR(255),
      AML VARCHAR(100),
      Contract_Generating_User VARCHAR(255),
      Documentation_Check_In_Process VARCHAR(50),
      Documentation_Check_Approved VARCHAR(50),
      Contact_Details_Verification_In_Process VARCHAR(50),
      Contact_Details_Verified VARCHAR(50),
      Contact_Details_Not_Verified VARCHAR(50),
      KYC_Completed VARCHAR(50),
      AM_KYC_Not_Completed VARCHAR(50),
      Client_Type VARCHAR(100),
      Purchase_as VARCHAR(100),
      Case_with_AMI_Consultants VARCHAR(50),
      Brith DATE,
      Age INT,
      Residence VARCHAR(255),
      Passport VARCHAR(100),
      Severity VARCHAR(100),
      Representing VARCHAR(255),
      Probabiltiy VARCHAR(100),
      Developer VARCHAR(255),
      Original_Price DECIMAL(15, 2),
      Tenanat VARCHAR(255),
      Landlord VARCHAR(255),
      Party_Commision DECIMAL(15, 2),
      Agency_Contact VARCHAR(255),
      Party_Name VARCHAR(255),
      Closing_Broker VARCHAR(255),
      Third_broker_split_amount DECIMAL(15, 2),
      Second_Broker VARCHAR(255),
      Second_broker_split_amount DECIMAL(15, 2),
      Fourth_broker_split_amount DECIMAL(15, 2),
      Fourth_broker VARCHAR(255),
      Deposit_Date DATE,
      Money_Amount DECIMAL(15, 2),
      Agreement_Date DATE,
      Created_By VARCHAR(255),
      closing_name VARCHAR(255),
      wining_inquiry VARCHAR(255),
      lead_source VARCHAR(255),
      wining_inquiry_status VARCHAR(100),
      buyer_nationality VARCHAR(100),
      buyer_second_nationality VARCHAR(100),
      transfer_fee DECIMAL(15, 2),
      seller_nationality VARCHAR(100),
      seller_second_nationality VARCHAR(100),
      listing_type VARCHAR(100),
      listing_city VARCHAR(100),
      commission DECIMAL(15, 2),
      listing_community VARCHAR(255),
      listing_property_address TEXT,
      furnished VARCHAR(50),
      closing_date DATE,
      listng_unit_number VARCHAR(100),
      documentation VARCHAR(255),
      transaction_type VARCHAR(100),
      freehold VARCHAR(50),
      title_dead VARCHAR(255),
      status_on_transfer VARCHAR(100),
      conveyancing_fee DECIMAL(15, 2),
      representation VARCHAR(255),
      security_requested VARCHAR(50),
      success_probability VARCHAR(100),
      success_probability_amount DECIMAL(15, 2),
      partial_payment DECIMAL(15, 2),
      full_payment DECIMAL(15, 2),
      accounted_date DATE,
      passport_issued_city VARCHAR(255),
      seller VARCHAR(255),
      Documentation_Check_Not_Approved VARCHAR(50),
      Sold_As VARCHAR(100),
      Due_to_Developer DECIMAL(15, 2),
      Amount DECIMAL(15, 2),
      split_amount DECIMAL(15, 2),
      Third_Broker VARCHAR(255),
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      sub_title VARCHAR(255),
      descriptions TEXT,
      seo_title VARCHAR(255),
      seo_keywork VARCHAR(500),
      seo_description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      closing_checklist TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(query);
  console.log('Deals table setup initiated...');

  // =========================================================
  // CRITICAL FIX: FORCE ID TO AUTO_INCREMENT
  // =========================================================
  try {
    // Ye query ID column ko modify karke AUTO_INCREMENT bana degi
    await pool.query("ALTER TABLE deals MODIFY COLUMN id INT AUTO_INCREMENT");
    console.log("SUCCESS: 'id' column fixed to AUTO_INCREMENT.");
  } catch (error) {
    console.log("Checking ID Auto-Increment: ", error.message);
  }

  // 2. AUTO-FIX: created_at column
  try {
    await pool.query("ALTER TABLE deals ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    console.log("FIXED: 'created_at' column added.");
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') console.log("Warning created_at:", error.message);
  }

  // 3. AUTO-FIX: updated_at column
  try {
    await pool.query("ALTER TABLE deals ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    console.log("FIXED: 'updated_at' column added.");
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') console.log("Warning updated_at:", error.message);
  }
};

// ... baaki poora code same rahega ...
export const createDeal = async (data) => {
  const fields = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);
  
  const query = `INSERT INTO deals (${fields}) VALUES (${placeholders})`;
  const [result] = await pool.query(query, values);
  return result;
};

export const getAllDeals = async () => {
  const query = `SELECT * FROM deals ORDER BY created_at DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

export const getDealById = async (id) => {
  const query = `SELECT * FROM deals WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

export const getDealBySlug = async (slug) => {
  const query = `SELECT * FROM deals WHERE slug = ?`;
  const [rows] = await pool.query(query, [slug]);
  return rows[0];
};

export const getDealsByStatus = async (status) => {
  const query = `SELECT * FROM deals WHERE Closing_Status = ? ORDER BY created_at DESC`;
  const [rows] = await pool.query(query, [status]);
  return rows;
};

export const getDealsByBroker = async (brokerName) => {
  const query = `
    SELECT * FROM deals 
    WHERE Closing_Broker = ? OR Second_Broker = ? OR Third_Broker = ? OR Fourth_broker = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await pool.query(query, [brokerName, brokerName, brokerName, brokerName]);
  return rows;
};

export const updateDeal = async (id, data) => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];
  const query = `UPDATE deals SET ${fields} WHERE id = ?`;
  const [result] = await pool.query(query, values);
  return result;
};

export const deleteDeal = async (id) => {
  const query = `DELETE FROM deals WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

export const getDealsByDateRange = async (startDate, endDate) => {
  const query = `SELECT * FROM deals WHERE closing_date BETWEEN ? AND ? ORDER BY closing_date DESC`;
  const [rows] = await pool.query(query, [startDate, endDate]);
  return rows;
};

export const getDealsStatistics = async () => {
  const query = `
    SELECT 
      COUNT(*) as total_deals, SUM(Sales_Price) as total_sales, SUM(commission) as total_commission,
      AVG(Sales_Price) as average_sale_price, Closing_Status, COUNT(*) as status_count
    FROM deals GROUP BY Closing_Status
  `;
  const [rows] = await pool.query(query);
  return rows;
};