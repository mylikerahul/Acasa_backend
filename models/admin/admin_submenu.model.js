import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createAdminSubmenuTable = async () => {
  // 1. Create Basic Table Structure
  const createQuery = `
    CREATE TABLE IF NOT EXISTS admin_submenu (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_type VARCHAR(100),
      label VARCHAR(255) NOT NULL,
      item_link VARCHAR(500),
      parent INT NOT NULL,
      col_num INT DEFAULT 1,
      item_order INT DEFAULT 0,
      thumbnail VARCHAR(500),
      \`status\` VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  await pool.query(createQuery);

  // 2. Safe Foreign Key Injection
  try {
    // Check if FK already exists
    const [check] = await pool.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'admin_submenu' 
        AND CONSTRAINT_NAME = 'fk_submenu_parent'
    `);

    if (check.length === 0) {
      // Check if parent table exists
      const [tableExists] = await pool.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'admin_menu_items'
      `);

      if (tableExists.length === 0) {
        console.warn("⚠️ Skipping FK: admin_menu_items table does not exist yet");
        return;
      }

      // Check if there are orphan records
      const [orphanCheck] = await pool.query(`
        SELECT COUNT(*) as count 
        FROM admin_submenu s 
        LEFT JOIN admin_menu_items m ON s.parent = m.id 
        WHERE m.id IS NULL
      `);

      if (orphanCheck[0].count > 0) {
        console.warn(`⚠️ Found ${orphanCheck[0].count} orphan records in admin_submenu. Cleaning up...`);
        
        // Option 1: Delete orphan records
        await pool.query(`
          DELETE s FROM admin_submenu s 
          LEFT JOIN admin_menu_items m ON s.parent = m.id 
          WHERE m.id IS NULL
        `);
      }

      // Get parent column type
      const [parentCols] = await pool.query(`SHOW COLUMNS FROM admin_menu_items LIKE 'id'`);
      
      if (parentCols.length > 0) {
        const typeStr = parentCols[0].Type.toLowerCase();
        const isUnsigned = typeStr.includes('unsigned');
        const defineType = isUnsigned ? 'INT UNSIGNED' : 'INT';

        // Modify child column to match exactly
        await pool.query(`ALTER TABLE admin_submenu MODIFY COLUMN parent ${defineType} NOT NULL`);
        
        // Add Constraint
        await pool.query(`
          ALTER TABLE admin_submenu
          ADD CONSTRAINT fk_submenu_parent 
          FOREIGN KEY (parent) REFERENCES admin_menu_items(id) 
          ON DELETE CASCADE
        `);
        
        console.log('✅ Foreign Key added to admin_submenu successfully');
      }
    }
  } catch (error) {
    if (!error.message.includes("Duplicate")) {
      console.warn("⚠️ FK Warning (admin_submenu):", error.message);
    }
  }
};

/* =========================================================
   CREATE SUBMENU ITEM
========================================================= */

export const createSubmenu = async (data) => {
  const { 
    item_type, label, item_link, parent, 
    col_num, item_order, thumbnail, status 
  } = data;
  
  const query = `
    INSERT INTO admin_submenu 
    (item_type, label, item_link, parent, col_num, item_order, thumbnail, \`status\`) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.query(query, [
    item_type, label, item_link, parent, 
    col_num || 1, item_order || 0, thumbnail, status || 'Active'
  ]);
  
  return result;
};

/* =========================================================
   GET ALL SUBMENUS
========================================================= */

export const getAllSubmenus = async () => {
  const query = `SELECT * FROM admin_submenu ORDER BY parent ASC, item_order ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET SUBMENUS BY PARENT ID
========================================================= */

export const getSubmenusByParentId = async (parentId) => {
  const query = `
    SELECT * FROM admin_submenu 
    WHERE parent = ? 
    ORDER BY item_order ASC
  `;
  const [rows] = await pool.query(query, [parentId]);
  return rows;
};

/* =========================================================
   GET SUBMENU BY ID
========================================================= */

export const getSubmenuById = async (id) => {
  const query = `SELECT * FROM admin_submenu WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   UPDATE SUBMENU
========================================================= */

export const updateSubmenu = async (id, data) => {
  const { 
    item_type, label, item_link, parent, 
    col_num, item_order, thumbnail, status 
  } = data;
  
  const query = `
    UPDATE admin_submenu 
    SET item_type = ?, label = ?, item_link = ?, parent = ?, 
        col_num = ?, item_order = ?, thumbnail = ?, \`status\` = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.query(query, [
    item_type, label, item_link, parent, 
    col_num, item_order, thumbnail, status, id
  ]);
  
  return result;
};

/* =========================================================
   DELETE SUBMENU
========================================================= */

export const deleteSubmenu = async (id) => {
  const query = `DELETE FROM admin_submenu WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  createAdminSubmenuTable,
  createSubmenu,
  getAllSubmenus,
  getSubmenusByParentId,
  getSubmenuById,
  updateSubmenu,
  deleteSubmenu
};