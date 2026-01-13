import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createAdminMenuTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS admin_menus (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      menu_url VARCHAR(255) NOT NULL,
      order_num INT DEFAULT 0,
      menu_type VARCHAR(100),
      column_num INT DEFAULT 1,
      status VARCHAR(50) DEFAULT 'Active',
      for_country VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  await pool.query(query);
  console.log('admin_menus table created successfully');
};

/* =========================================================
   CREATE MENU ITEM
========================================================= */

export const createAdminMenu = async (menuData) => {
  const { 
    name, menu_url, order_num, menu_type, 
    column_num, status, for_country 
  } = menuData;
  
  const query = `
    INSERT INTO admin_menus 
    (name, menu_url, order_num, menu_type, column_num, status, for_country) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    name, menu_url, order_num || 0, menu_type, 
    column_num || 1, status || 'Active', for_country
  ]);
  
  return result;
};

/* =========================================================
   GET ALL MENUS
========================================================= */

export const getAllAdminMenus = async () => {
  // Ordered by order_num so they appear correctly in UI
  const query = `SELECT * FROM admin_menus ORDER BY order_num ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET MENUS BY TYPE (e.g., sidebar, topbar)
========================================================= */

export const getAdminMenusByType = async (menu_type) => {
  const query = `
    SELECT * FROM admin_menus 
    WHERE menu_type = ? AND status = 'Active' 
    ORDER BY order_num ASC
  `;
  const [rows] = await pool.query(query, [menu_type]);
  return rows;
};

/* =========================================================
   GET MENU BY ID
========================================================= */

export const getAdminMenuById = async (id) => {
  const query = `SELECT * FROM admin_menus WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   UPDATE MENU
========================================================= */

export const updateAdminMenu = async (id, menuData) => {
  const { 
    name, menu_url, order_num, menu_type, 
    column_num, status, for_country 
  } = menuData;
  
  const query = `
    UPDATE admin_menus 
    SET name = ?, menu_url = ?, order_num = ?, menu_type = ?, 
        column_num = ?, status = ?, for_country = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    name, menu_url, order_num, menu_type, 
    column_num, status, for_country, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE MENU
========================================================= */

export const deleteAdminMenu = async (id) => {
  const query = `DELETE FROM admin_menus WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};