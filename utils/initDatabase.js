// utils/initDatabase.js

import { createUserTable, fixUsersTable } from '../models/user/user.model.js';

export const initializeDatabase = async () => {
  console.log('');
  console.log('🔄 Initializing database...');
  console.log('========================================');
  
  try {
    // Create table if not exists
    await createUserTable();
    
    // Auto-fix all nullable fields
    const result = await fixUsersTable();
    
    console.log('========================================');
    console.log('✅ Database initialization complete');
    console.log(`   Fixed: ${result.fixed} fields`);
    console.log(`   Skipped: ${result.failed} fields`);
    console.log('========================================');
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('⚠️  Server will continue, but some features may not work');
    console.log('');
    return false;
  }
};

// Run on import (for immediate execution)
// Comment this out if you want to call it manually from server.js
// initializeDatabase();