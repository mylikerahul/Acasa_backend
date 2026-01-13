import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createTransactionTable = async () => {
  // 1. Create Table (Basic structure)
  const createQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_id INT,
      user_id INT,
      email VARCHAR(255) NOT NULL,
      gateway VARCHAR(100) NOT NULL,
      payment_amount DECIMAL(15, 2) NOT NULL,
      payment_id VARCHAR(255) NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;
  
  await pool.query(createQuery);

  // 2. Smart Foreign Key Linking
  try {
    const [check] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND CONSTRAINT_NAME = 'fk_transactions_properties'`
    );

    if (check.length === 0) {
      const [propCols] = await pool.query(`SHOW COLUMNS FROM properties LIKE 'id'`);
      const [userCols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'id'`);

      if (propCols.length > 0) {
        const propIdType = propCols[0].Type;
        await pool.query(`ALTER TABLE transactions MODIFY COLUMN property_id ${propIdType}`);
        await pool.query(`
          ALTER TABLE transactions
          ADD CONSTRAINT fk_transactions_properties FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
        `);
      }

      if (userCols.length > 0) {
        const userIdType = userCols[0].Type;
        await pool.query(`ALTER TABLE transactions MODIFY COLUMN user_id ${userIdType}`);
        await pool.query(`
          ALTER TABLE transactions
          ADD CONSTRAINT fk_transactions_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        `);
      }
      console.log('✅ Foreign Keys added to transactions successfully');
    }
  } catch (error) {
    console.warn("⚠️ Warning: Could not add Foreign Keys to 'transactions'.", error.message);
  }
};

/* =========================================================
   CREATE TRANSACTION
========================================================= */
export const createTransaction = async (transactionData) => {
  const { 
    property_id, user_id, email, 
    gateway, payment_amount, payment_id, date 
  } = transactionData;
  
  const transactionDate = date || new Date();

  const query = `
    INSERT INTO transactions 
    (property_id, user_id, email, gateway, payment_amount, payment_id, date) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    property_id, user_id, email, 
    gateway, payment_amount, payment_id, transactionDate
  ]);
  
  return result;
};

/* =========================================================
   GET ALL TRANSACTIONS
========================================================= */
export const getAllTransactions = async () => {
  const query = `SELECT * FROM transactions ORDER BY date DESC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET TRANSACTION BY ID
========================================================= */
export const getTransactionById = async (id) => {
  const query = `SELECT * FROM transactions WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET TRANSACTIONS BY USER ID
========================================================= */
export const getTransactionsByUserId = async (user_id) => {
  const query = `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`;
  const [rows] = await pool.query(query, [user_id]);
  return rows;
};

/* =========================================================
   GET TRANSACTIONS BY PROPERTY ID
========================================================= */
export const getTransactionsByPropertyId = async (property_id) => {
  const query = `SELECT * FROM transactions WHERE property_id = ? ORDER BY date DESC`;
  const [rows] = await pool.query(query, [property_id]);
  return rows;
};

/* =========================================================
   UPDATE TRANSACTION
========================================================= */
export const updateTransaction = async (id, transactionData) => {
  const { 
    property_id, user_id, email, 
    gateway, payment_amount, payment_id, date 
  } = transactionData;
  
  const query = `
    UPDATE transactions 
    SET property_id = ?, user_id = ?, email = ?, 
        gateway = ?, payment_amount = ?, payment_id = ?, date = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    property_id, user_id, email, 
    gateway, payment_amount, payment_id, date, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE TRANSACTION
========================================================= */
export const deleteTransaction = async (id) => {
  const query = `DELETE FROM transactions WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};