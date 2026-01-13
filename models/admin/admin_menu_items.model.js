import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createAdminMenuItemTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS admin_menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      label VARCHAR(255) NOT NULL,
      link VARCHAR(500),
      parent INT DEFAULT 0,
      sort INT DEFAULT 0,
      class VARCHAR(100),
      menu INT NOT NULL,
      depth INT DEFAULT 0,
      property_type VARCHAR(100),
      property_zone VARCHAR(100),
      price VARCHAR(100),
      title VARCHAR(255),
      bedrooms VARCHAR(50),
      block VARCHAR(100),
      location VARCHAR(255),
      image_icon VARCHAR(500),
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (menu) REFERENCES admin_menus(id) ON DELETE CASCADE
    )
  `;
  
  await pool.query(query);
  console.log('admin_menu_items table created successfully');
};

/* =========================================================
   CREATE MENU ITEM
========================================================= */

export const createAdminMenuItem = async (itemData) => {
  const { 
    label, link, parent, sort, class_name, menu, depth,
    property_type, property_zone, price, title, bedrooms, 
    block, location, image_icon, status 
  } = itemData;
  
  // Note: mapped 'class' to 'class_name' in destructuring to avoid keyword conflict in JS, 
  // but DB column remains 'class'
  
  const query = `
    INSERT INTO admin_menu_items 
    (label, link, parent, sort, class, menu, depth,
     property_type, property_zone, price, title, bedrooms, 
     block, location, image_icon, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    label, link, parent || 0, sort || 0, class_name, menu, depth || 0,
    property_type, property_zone, price, title, bedrooms, 
    block, location, image_icon, status || 'Active'
  ]);
  
  return result;
};

/* =========================================================
   GET ALL MENU ITEMS
========================================================= */

export const getAllAdminMenuItems = async () => {
  const query = `SELECT * FROM admin_menu_items ORDER BY menu ASC, sort ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET ITEMS BY MENU ID
========================================================= */

export const getItemsByMenuId = async (menuId) => {
  const query = `
    SELECT * FROM admin_menu_items 
    WHERE menu = ? 
    ORDER BY sort ASC
  `;
  const [rows] = await pool.query(query, [menuId]);
  return rows;
};

/* =========================================================
   GET ITEMS BY PARENT ID
========================================================= */

export const getItemsByParentId = async (parentId) => {
  const query = `SELECT * FROM admin_menu_items WHERE parent = ? ORDER BY sort ASC`;
  const [rows] = await pool.query(query, [parentId]);
  return rows;
};

/* =========================================================
   GET MENU ITEM BY ID
========================================================= */

export const getAdminMenuItemById = async (id) => {
  const query = `SELECT * FROM admin_menu_items WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   UPDATE MENU ITEM
========================================================= */

export const updateAdminMenuItem = async (id, itemData) => {
  const { 
    label, link, parent, sort, class_name, menu, depth,
    property_type, property_zone, price, title, bedrooms, 
    block, location, image_icon, status 
  } = itemData;
  
  const query = `
    UPDATE admin_menu_items 
    SET label = ?, link = ?, parent = ?, sort = ?, class = ?, menu = ?, depth = ?,
        property_type = ?, property_zone = ?, price = ?, title = ?, bedrooms = ?, 
        block = ?, location = ?, image_icon = ?, status = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    label, link, parent, sort, class_name, menu, depth,
    property_type, property_zone, price, title, bedrooms, 
    block, location, image_icon, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE MENU ITEM
========================================================= */

export const deleteAdminMenuItem = async (id) => {
  const query = `DELETE FROM admin_menu_items WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};