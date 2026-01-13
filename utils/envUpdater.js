// utils/envUpdater.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ============================================================================
 * ENV FILE UPDATER UTILITY
 * ============================================================================
 */

// Mapping of setting keys to ENV variable names
const SETTING_TO_ENV_MAP = {
  google_map_key: 'GOOGLE_MAP_KEY',
  recaptcha_key: 'RECAPTCHA_SITE_KEY',
  recaptcha_secret: 'RECAPTCHA_SECRET_KEY',
  stripe_key: 'STRIPE_PUBLISHABLE_KEY',
  stripe_secret: 'STRIPE_SECRET_KEY',
  paypal_email: 'PAYPAL_EMAIL',
  paypal_client_id: 'PAYPAL_CLIENT_ID',
  paypal_secret: 'PAYPAL_SECRET'
};

/**
 * Get .env file path
 */
const getEnvPath = () => {
  return path.resolve(__dirname, '..', '.env');
};

/**
 * Read .env file content
 */
export const readEnvFile = () => {
  const envPath = getEnvPath();
  
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  const envVars = {};

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = trimmedLine.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
};

/**
 * Update single ENV variable
 */
export const updateEnvVariable = (settingKey, value) => {
  const envKey = SETTING_TO_ENV_MAP[settingKey];
  
  if (!envKey) {
    console.log(`No ENV mapping for setting: ${settingKey}`);
    return false;
  }

  const envPath = getEnvPath();
  
  try {
    let content = '';
    
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }

    const lines = content.split('\n');
    let found = false;
    const newLines = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith(`${envKey}=`)) {
        newLines.push(`${envKey}=${value}`);
        found = true;
      } else {
        newLines.push(line);
      }
    }

    // If not found, add new line
    if (!found) {
      newLines.push(`${envKey}=${value}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n'));
    
    // Update process.env
    process.env[envKey] = value;
    
    console.log(`Updated ENV: ${envKey}`);
    return true;
  } catch (error) {
    console.error(`Error updating ENV ${envKey}:`, error);
    return false;
  }
};

/**
 * Update multiple ENV variables
 */
export const updateMultipleEnvVariables = (settings) => {
  const results = {};
  
  for (const [key, value] of Object.entries(settings)) {
    if (SETTING_TO_ENV_MAP[key]) {
      results[key] = updateEnvVariable(key, value);
    }
  }
  
  return results;
};

/**
 * Get ENV value by setting key
 */
export const getEnvValue = (settingKey) => {
  const envKey = SETTING_TO_ENV_MAP[settingKey];
  
  if (!envKey) {
    return null;
  }
  
  return process.env[envKey] || null;
};

/**
 * Sync settings with ENV (on app start)
 */
export const syncSettingsWithEnv = async (getSettingsFromDB) => {
  try {
    const dbSettings = await getSettingsFromDB();
    
    for (const [key, envKey] of Object.entries(SETTING_TO_ENV_MAP)) {
      if (dbSettings[key] && dbSettings[key] !== process.env[envKey]) {
        process.env[envKey] = dbSettings[key];
      }
    }
    
    console.log('Settings synced with ENV');
  } catch (error) {
    console.error('Error syncing settings with ENV:', error);
  }
};

export default {
  readEnvFile,
  updateEnvVariable,
  updateMultipleEnvVariables,
  getEnvValue,
  syncSettingsWithEnv,
  SETTING_TO_ENV_MAP
};