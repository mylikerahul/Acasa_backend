import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createUserPermissionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_type VARCHAR(50) NOT NULL UNIQUE,
      
      property_create TINYINT(1) DEFAULT 0,
      property_update TINYINT(1) DEFAULT 0,
      property_read TINYINT(1) DEFAULT 0,
      property_delete TINYINT(1) DEFAULT 0,

      project_create TINYINT(1) DEFAULT 0,
      project_update TINYINT(1) DEFAULT 0,
      project_read TINYINT(1) DEFAULT 0,
      project_delete TINYINT(1) DEFAULT 0,

      enquiry_create TINYINT(1) DEFAULT 0,
      enquiry_update TINYINT(1) DEFAULT 0,
      enquiry_read TINYINT(1) DEFAULT 0,
      enquiry_delete TINYINT(1) DEFAULT 0,

      activity_create TINYINT(1) DEFAULT 0,
      activity_update TINYINT(1) DEFAULT 0,
      activity_read TINYINT(1) DEFAULT 0,
      activity_delete TINYINT(1) DEFAULT 0,

      transaction_create TINYINT(1) DEFAULT 0,
      transaction_update TINYINT(1) DEFAULT 0,
      transaction_read TINYINT(1) DEFAULT 0,
      transaction_delete TINYINT(1) DEFAULT 0,

      content_create TINYINT(1) DEFAULT 0,
      content_update TINYINT(1) DEFAULT 0,
      content_read TINYINT(1) DEFAULT 0,
      content_delete TINYINT(1) DEFAULT 0,

      reporting_create TINYINT(1) DEFAULT 0,
      reporting_update TINYINT(1) DEFAULT 0,
      reporting_read TINYINT(1) DEFAULT 0,
      reporting_delete TINYINT(1) DEFAULT 0,

      hr_create TINYINT(1) DEFAULT 0,
      hr_update TINYINT(1) DEFAULT 0,
      hr_read TINYINT(1) DEFAULT 0,
      hr_delete TINYINT(1) DEFAULT 0,

      location_create TINYINT(1) DEFAULT 0,
      location_update TINYINT(1) DEFAULT 0,
      location_read TINYINT(1) DEFAULT 0,
      location_delete TINYINT(1) DEFAULT 0,

      user_create TINYINT(1) DEFAULT 0,
      user_update TINYINT(1) DEFAULT 0,
      user_read TINYINT(1) DEFAULT 0,
      user_delete TINYINT(1) DEFAULT 0,

      testimonial_create TINYINT(1) DEFAULT 0,
      testimonial_update TINYINT(1) DEFAULT 0,
      testimonial_read TINYINT(1) DEFAULT 0,
      testimonial_delete TINYINT(1) DEFAULT 0,

      control_create TINYINT(1) DEFAULT 0,
      control_update TINYINT(1) DEFAULT 0,
      control_read TINYINT(1) DEFAULT 0,
      control_delete TINYINT(1) DEFAULT 0,

      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  await pool.query(query);
  console.log('user_permissions table created successfully');
};

/* =========================================================
   CREATE PERMISSION SET
========================================================= */

export const createPermission = async (data) => {
  // Extract values, default to 0 if undefined
  const values = [
    data.user_type,
    data.property_create || 0, data.property_update || 0, data.property_read || 0, data.property_delete || 0,
    data.project_create || 0, data.project_update || 0, data.project_read || 0, data.project_delete || 0,
    data.enquiry_create || 0, data.enquiry_update || 0, data.enquiry_read || 0, data.enquiry_delete || 0,
    data.activity_create || 0, data.activity_update || 0, data.activity_read || 0, data.activity_delete || 0,
    data.transaction_create || 0, data.transaction_update || 0, data.transaction_read || 0, data.transaction_delete || 0,
    data.content_create || 0, data.content_update || 0, data.content_read || 0, data.content_delete || 0,
    data.reporting_create || 0, data.reporting_update || 0, data.reporting_read || 0, data.reporting_delete || 0,
    data.hr_create || 0, data.hr_update || 0, data.hr_read || 0, data.hr_delete || 0,
    data.location_create || 0, data.location_update || 0, data.location_read || 0, data.location_delete || 0,
    data.user_create || 0, data.user_update || 0, data.user_read || 0, data.user_delete || 0,
    data.testimonial_create || 0, data.testimonial_update || 0, data.testimonial_read || 0, data.testimonial_delete || 0,
    data.control_create || 0, data.control_update || 0, data.control_read || 0, data.control_delete || 0
  ];

  const query = `
    INSERT INTO user_permissions (
      user_type,
      property_create, property_update, property_read, property_delete,
      project_create, project_update, project_read, project_delete,
      enquiry_create, enquiry_update, enquiry_read, enquiry_delete,
      activity_create, activity_update, activity_read, activity_delete,
      transaction_create, transaction_update, transaction_read, transaction_delete,
      content_create, content_update, content_read, content_delete,
      reporting_create, reporting_update, reporting_read, reporting_delete,
      hr_create, hr_update, hr_read, hr_delete,
      location_create, location_update, location_read, location_delete,
      user_create, user_update, user_read, user_delete,
      testimonial_create, testimonial_update, testimonial_read, testimonial_delete,
      control_create, control_update, control_read, control_delete
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `;
  
  const [result] = await pool.query(query, values);
  return result;
};

/* =========================================================
   GET ALL PERMISSIONS
========================================================= */

export const getAllPermissions = async () => {
  const query = `SELECT * FROM user_permissions ORDER BY id ASC`;
  const [rows] = await pool.query(query);
  return rows;
};

/* =========================================================
   GET PERMISSION BY ID
========================================================= */

export const getPermissionById = async (id) => {
  const query = `SELECT * FROM user_permissions WHERE id = ?`;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

/* =========================================================
   GET PERMISSION BY USER TYPE
========================================================= */

export const getPermissionByUserType = async (user_type) => {
  const query = `SELECT * FROM user_permissions WHERE user_type = ?`;
  const [rows] = await pool.query(query, [user_type]);
  return rows[0];
};

/* =========================================================
   UPDATE PERMISSION
========================================================= */

export const updatePermission = async (id, data) => {
  // We use a dynamic SET clause here because updating 48 fields manually is verbose.
  // However, sticking to the requested style, here is the explicit query.
  
  const query = `
    UPDATE user_permissions SET 
      user_type = ?,
      property_create = ?, property_update = ?, property_read = ?, property_delete = ?,
      project_create = ?, project_update = ?, project_read = ?, project_delete = ?,
      enquiry_create = ?, enquiry_update = ?, enquiry_read = ?, enquiry_delete = ?,
      activity_create = ?, activity_update = ?, activity_read = ?, activity_delete = ?,
      transaction_create = ?, transaction_update = ?, transaction_read = ?, transaction_delete = ?,
      content_create = ?, content_update = ?, content_read = ?, content_delete = ?,
      reporting_create = ?, reporting_update = ?, reporting_read = ?, reporting_delete = ?,
      hr_create = ?, hr_update = ?, hr_read = ?, hr_delete = ?,
      location_create = ?, location_update = ?, location_read = ?, location_delete = ?,
      user_create = ?, user_update = ?, user_read = ?, user_delete = ?,
      testimonial_create = ?, testimonial_update = ?, testimonial_read = ?, testimonial_delete = ?,
      control_create = ?, control_update = ?, control_read = ?, control_delete = ?
    WHERE id = ?
  `;

  const values = [
    data.user_type,
    data.property_create, data.property_update, data.property_read, data.property_delete,
    data.project_create, data.project_update, data.project_read, data.project_delete,
    data.enquiry_create, data.enquiry_update, data.enquiry_read, data.enquiry_delete,
    data.activity_create, data.activity_update, data.activity_read, data.activity_delete,
    data.transaction_create, data.transaction_update, data.transaction_read, data.transaction_delete,
    data.content_create, data.content_update, data.content_read, data.content_delete,
    data.reporting_create, data.reporting_update, data.reporting_read, data.reporting_delete,
    data.hr_create, data.hr_update, data.hr_read, data.hr_delete,
    data.location_create, data.location_update, data.location_read, data.location_delete,
    data.user_create, data.user_update, data.user_read, data.user_delete,
    data.testimonial_create, data.testimonial_update, data.testimonial_read, data.testimonial_delete,
    data.control_create, data.control_update, data.control_read, data.control_delete,
    id
  ];
  
  const [result] = await pool.query(query, values);
  return result;
};

/* =========================================================
   DELETE PERMISSION
========================================================= */

export const deletePermission = async (id) => {
  const query = `DELETE FROM user_permissions WHERE id = ?`;
  const [result] = await pool.query(query, [id]);
  return result;
};