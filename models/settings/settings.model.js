// // models/admin/Settings/Settings.model.js

// /**
//  * ============================================================================
//  * SETTINGS MODEL - COMPLETE SETTINGS MANAGEMENT
//  * ============================================================================
//  */

// import pool from '../../../config/db.js';
// import { SETTING_CATEGORIES, DEFAULT_SETTINGS, ENV_SETTINGS } from '../../../config/settings.config.js';
// import { updateEnvVariable, updateMultipleEnvVariables } from '../../../utils/envUpdater.js';

// // ============================================================================
// // TABLE CREATION
// // ============================================================================

// export const createSettingsTable = async () => {
//   const query = `
//     -- Main settings table
//     CREATE TABLE IF NOT EXISTS settings (
//       id SERIAL PRIMARY KEY,
//       category VARCHAR(50) NOT NULL,
//       setting_key VARCHAR(100) NOT NULL,
//       setting_value TEXT,
//       setting_type VARCHAR(20) DEFAULT 'text',
//       is_public BOOLEAN DEFAULT FALSE,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       UNIQUE(category, setting_key)
//     );

//     -- Create indexes
//     CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
//     CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(setting_key);
//     CREATE INDEX IF NOT EXISTS idx_settings_public ON settings(is_public);

//     -- Settings history/audit table
//     CREATE TABLE IF NOT EXISTS settings_history (
//       id SERIAL PRIMARY KEY,
//       setting_id INTEGER REFERENCES settings(id) ON DELETE CASCADE,
//       category VARCHAR(50) NOT NULL,
//       setting_key VARCHAR(100) NOT NULL,
//       old_value TEXT,
//       new_value TEXT,
//       changed_by INTEGER,
//       changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );

//     CREATE INDEX IF NOT EXISTS idx_settings_history_setting ON settings_history(setting_id);
//   `;

//   await pool.query(query);
  
//   // Initialize default settings
//   await initializeDefaultSettings();
// };

// // ============================================================================
// // INITIALIZE DEFAULT SETTINGS
// // ============================================================================

// export const initializeDefaultSettings = async () => {
//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     for (const [category, settings] of Object.entries(DEFAULT_SETTINGS)) {
//       for (const [key, value] of Object.entries(settings)) {
//         const checkQuery = `
//           SELECT id FROM settings 
//           WHERE category = $1 AND setting_key = $2
//         `;
//         const existing = await client.query(checkQuery, [category, key]);

//         if (existing.rows.length === 0) {
//           // Determine setting type
//           let settingType = 'text';
//           if (typeof value === 'boolean') settingType = 'boolean';
//           else if (typeof value === 'number') settingType = 'number';

//           // Determine if public (accessible without auth)
//           const isPublic = ['general', 'social', 'footer', 'contact', 'about'].includes(category);

//           const insertQuery = `
//             INSERT INTO settings (category, setting_key, setting_value, setting_type, is_public)
//             VALUES ($1, $2, $3, $4, $5)
//           `;
          
//           const stringValue = typeof value === 'boolean' ? value.toString() : String(value);
//           await client.query(insertQuery, [category, key, stringValue, settingType, isPublic]);
//         }
//       }
//     }

//     await client.query('COMMIT');
//     console.log('Default settings initialized');
//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('Error initializing default settings:', error);
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// // ============================================================================
// // GET SETTINGS
// // ============================================================================

// /**
//  * Get all settings
//  */
// export const getAllSettings = async () => {
//   const query = `
//     SELECT category, setting_key, setting_value, setting_type
//     FROM settings
//     ORDER BY category, setting_key
//   `;

//   const result = await pool.query(query);

//   // Structure as { category: { key: value } }
//   const structured = {};

//   result.rows.forEach(row => {
//     if (!structured[row.category]) {
//       structured[row.category] = {};
//     }
    
//     // Convert value based on type
//     let value = row.setting_value;
//     if (row.setting_type === 'boolean') {
//       value = row.setting_value === 'true';
//     } else if (row.setting_type === 'number') {
//       value = Number(row.setting_value);
//     }
    
//     structured[row.category][row.setting_key] = value;
//   });

//   return structured;
// };

// /**
//  * Get settings by category
//  */
// export const getSettingsByCategory = async (category) => {
//   if (!Object.values(SETTING_CATEGORIES).includes(category)) {
//     throw new Error(`Invalid category: ${category}`);
//   }

//   const query = `
//     SELECT setting_key, setting_value, setting_type
//     FROM settings
//     WHERE category = $1
//     ORDER BY setting_key
//   `;

//   const result = await pool.query(query, [category]);

//   const settings = {};

//   result.rows.forEach(row => {
//     let value = row.setting_value;
//     if (row.setting_type === 'boolean') {
//       value = row.setting_value === 'true';
//     } else if (row.setting_type === 'number') {
//       value = Number(row.setting_value);
//     }
//     settings[row.setting_key] = value;
//   });

//   return settings;
// };

// /**
//  * Get single setting
//  */
// export const getSetting = async (category, key) => {
//   const query = `
//     SELECT setting_value, setting_type
//     FROM settings
//     WHERE category = $1 AND setting_key = $2
//   `;

//   const result = await pool.query(query, [category, key]);

//   if (result.rows.length === 0) {
//     return null;
//   }

//   const row = result.rows[0];
//   let value = row.setting_value;
  
//   if (row.setting_type === 'boolean') {
//     value = row.setting_value === 'true';
//   } else if (row.setting_type === 'number') {
//     value = Number(row.setting_value);
//   }

//   return value;
// };

// /**
//  * Get public settings only (for frontend without auth)
//  */
// export const getPublicSettings = async () => {
//   const query = `
//     SELECT category, setting_key, setting_value, setting_type
//     FROM settings
//     WHERE is_public = TRUE
//     ORDER BY category, setting_key
//   `;

//   const result = await pool.query(query);

//   const structured = {};

//   result.rows.forEach(row => {
//     if (!structured[row.category]) {
//       structured[row.category] = {};
//     }
    
//     let value = row.setting_value;
//     if (row.setting_type === 'boolean') {
//       value = row.setting_value === 'true';
//     } else if (row.setting_type === 'number') {
//       value = Number(row.setting_value);
//     }
    
//     structured[row.category][row.setting_key] = value;
//   });

//   return structured;
// };

// // ============================================================================
// // UPDATE SETTINGS
// // ============================================================================

// /**
//  * Update single setting
//  */
// export const updateSetting = async (category, key, value, adminId = null) => {
//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     // Get current value for history
//     const currentQuery = `
//       SELECT id, setting_value FROM settings
//       WHERE category = $1 AND setting_key = $2
//     `;
//     const current = await client.query(currentQuery, [category, key]);

//     if (current.rows.length === 0) {
//       throw new Error(`Setting not found: ${category}.${key}`);
//     }

//     const settingId = current.rows[0].id;
//     const oldValue = current.rows[0].setting_value;
//     const stringValue = typeof value === 'boolean' ? value.toString() : String(value);

//     // Update setting
//     const updateQuery = `
//       UPDATE settings
//       SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
//       WHERE category = $2 AND setting_key = $3
//       RETURNING *
//     `;
//     const result = await client.query(updateQuery, [stringValue, category, key]);

//     // Save to history
//     const historyQuery = `
//       INSERT INTO settings_history (setting_id, category, setting_key, old_value, new_value, changed_by)
//       VALUES ($1, $2, $3, $4, $5, $6)
//     `;
//     await client.query(historyQuery, [settingId, category, key, oldValue, stringValue, adminId]);

//     // Update .env if applicable
//     if (ENV_SETTINGS.includes(key)) {
//       updateEnvVariable(key, stringValue);
//     }

//     await client.query('COMMIT');

//     return result.rows[0];
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// /**
//  * Update multiple settings in a category
//  */
// export const updateCategorySettings = async (category, settings, adminId = null) => {
//   if (!Object.values(SETTING_CATEGORIES).includes(category)) {
//     throw new Error(`Invalid category: ${category}`);
//   }

//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     const updatedSettings = [];
//     const envUpdates = {};

//     for (const [key, value] of Object.entries(settings)) {
//       // Get current value
//       const currentQuery = `
//         SELECT id, setting_value FROM settings
//         WHERE category = $1 AND setting_key = $2
//       `;
//       const current = await client.query(currentQuery, [category, key]);

//       if (current.rows.length === 0) {
//         // Insert new setting if doesn't exist
//         let settingType = 'text';
//         if (typeof value === 'boolean') settingType = 'boolean';
//         else if (typeof value === 'number') settingType = 'number';

//         const stringValue = typeof value === 'boolean' ? value.toString() : String(value);

//         const insertQuery = `
//           INSERT INTO settings (category, setting_key, setting_value, setting_type)
//           VALUES ($1, $2, $3, $4)
//           RETURNING *
//         `;
//         const inserted = await client.query(insertQuery, [category, key, stringValue, settingType]);
//         updatedSettings.push(inserted.rows[0]);
//       } else {
//         const settingId = current.rows[0].id;
//         const oldValue = current.rows[0].setting_value;
//         const stringValue = typeof value === 'boolean' ? value.toString() : String(value);

//         // Update setting
//         const updateQuery = `
//           UPDATE settings
//           SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
//           WHERE category = $2 AND setting_key = $3
//           RETURNING *
//         `;
//         const result = await client.query(updateQuery, [stringValue, category, key]);
//         updatedSettings.push(result.rows[0]);

//         // Save to history
//         const historyQuery = `
//           INSERT INTO settings_history (setting_id, category, setting_key, old_value, new_value, changed_by)
//           VALUES ($1, $2, $3, $4, $5, $6)
//         `;
//         await client.query(historyQuery, [settingId, category, key, oldValue, stringValue, adminId]);

//         // Collect ENV updates
//         if (ENV_SETTINGS.includes(key)) {
//           envUpdates[key] = stringValue;
//         }
//       }
//     }

//     // Update .env file
//     if (Object.keys(envUpdates).length > 0) {
//       updateMultipleEnvVariables(envUpdates);
//     }

//     await client.query('COMMIT');

//     return updatedSettings;
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// /**
//  * Update all settings at once
//  */
// export const updateAllSettings = async (allSettings, adminId = null) => {
//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     const envUpdates = {};

//     for (const [category, settings] of Object.entries(allSettings)) {
//       if (!Object.values(SETTING_CATEGORIES).includes(category)) {
//         continue;
//       }

//       for (const [key, value] of Object.entries(settings)) {
//         const currentQuery = `
//           SELECT id, setting_value FROM settings
//           WHERE category = $1 AND setting_key = $2
//         `;
//         const current = await client.query(currentQuery, [category, key]);

//         const stringValue = typeof value === 'boolean' ? value.toString() : String(value);

//         if (current.rows.length === 0) {
//           let settingType = 'text';
//           if (typeof value === 'boolean') settingType = 'boolean';
//           else if (typeof value === 'number') settingType = 'number';

//           const insertQuery = `
//             INSERT INTO settings (category, setting_key, setting_value, setting_type)
//             VALUES ($1, $2, $3, $4)
//           `;
//           await client.query(insertQuery, [category, key, stringValue, settingType]);
//         } else {
//           const settingId = current.rows[0].id;
//           const oldValue = current.rows[0].setting_value;

//           const updateQuery = `
//             UPDATE settings
//             SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
//             WHERE category = $2 AND setting_key = $3
//           `;
//           await client.query(updateQuery, [stringValue, category, key]);

//           // History
//           const historyQuery = `
//             INSERT INTO settings_history (setting_id, category, setting_key, old_value, new_value, changed_by)
//             VALUES ($1, $2, $3, $4, $5, $6)
//           `;
//           await client.query(historyQuery, [settingId, category, key, oldValue, stringValue, adminId]);
//         }

//         // Collect ENV updates
//         if (ENV_SETTINGS.includes(key)) {
//           envUpdates[key] = stringValue;
//         }
//       }
//     }

//     // Update .env
//     if (Object.keys(envUpdates).length > 0) {
//       updateMultipleEnvVariables(envUpdates);
//     }

//     await client.query('COMMIT');

//     return await getAllSettings();
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// };

// // ============================================================================
// // RESET SETTINGS
// // ============================================================================

// /**
//  * Reset category to defaults
//  */
// export const resetCategoryToDefaults = async (category, adminId = null) => {
//   if (!DEFAULT_SETTINGS[category]) {
//     throw new Error(`Invalid category: ${category}`);
//   }

//   return await updateCategorySettings(category, DEFAULT_SETTINGS[category], adminId);
// };

// /**
//  * Reset all settings to defaults
//  */
// export const resetAllToDefaults = async (adminId = null) => {
//   return await updateAllSettings(DEFAULT_SETTINGS, adminId);
// };

// // ============================================================================
// // SETTINGS HISTORY
// // ============================================================================

// /**
//  * Get settings change history
//  */
// export const getSettingsHistory = async (limit = 50, offset = 0) => {
//   const query = `
//     SELECT 
//       sh.*,
//       a.name as admin_name
//     FROM settings_history sh
//     LEFT JOIN admin a ON sh.changed_by = a.id
//     ORDER BY sh.changed_at DESC
//     LIMIT $1 OFFSET $2
//   `;

//   const result = await pool.query(query, [limit, offset]);
//   return result.rows;
// };

// /**
//  * Get history for specific setting
//  */
// export const getSettingHistory = async (category, key, limit = 20) => {
//   const query = `
//     SELECT 
//       sh.*,
//       a.name as admin_name
//     FROM settings_history sh
//     LEFT JOIN admin a ON sh.changed_by = a.id
//     WHERE sh.category = $1 AND sh.setting_key = $2
//     ORDER BY sh.changed_at DESC
//     LIMIT $3
//   `;

//   const result = await pool.query(query, [category, key, limit]);
//   return result.rows;
// };

// // ============================================================================
// // FILE UPLOAD HELPERS
// // ============================================================================

// /**
//  * Update logo
//  */
// export const updateLogo = async (logoPath, adminId = null) => {
//   return await updateSetting('general', 'logo', logoPath, adminId);
// };

// /**
//  * Update favicon
//  */
// export const updateFavicon = async (faviconPath, adminId = null) => {
//   return await updateSetting('general', 'favicon', faviconPath, adminId);
// };

// /**
//  * Update title background image
//  */
// export const updateTitleBgImage = async (imagePath, adminId = null) => {
//   return await updateSetting('layout', 'title_bg_image', imagePath, adminId);
// };

// // ============================================================================
// // UTILITY FUNCTIONS
// // ============================================================================

// /**
//  * Get available categories
//  */
// export const getCategories = () => {
//   return Object.values(SETTING_CATEGORIES);
// };

// /**
//  * Check if maintenance mode is enabled
//  */
// export const isMaintenanceMode = async () => {
//   const value = await getSetting('other', 'maintenance_mode');
//   return value === true;
// };

// /**
//  * Check if user registration is enabled
//  */
// export const isRegistrationEnabled = async () => {
//   const value = await getSetting('other', 'user_registration');
//   return value === true;
// };

// /**
//  * Check if email verification is required
//  */
// export const isEmailVerificationRequired = async () => {
//   const value = await getSetting('other', 'email_verification');
//   return value === true;
// };

// export default {
//   createSettingsTable,
//   initializeDefaultSettings,
//   getAllSettings,
//   getSettingsByCategory,
//   getSetting,
//   getPublicSettings,
//   updateSetting,
//   updateCategorySettings,
//   updateAllSettings,
//   resetCategoryToDefaults,
//   resetAllToDefaults,
//   getSettingsHistory,
//   getSettingHistory,
//   updateLogo,
//   updateFavicon,
//   updateTitleBgImage,
//   getCategories,
//   isMaintenanceMode,
//   isRegistrationEnabled,
//   isEmailVerificationRequired
// };