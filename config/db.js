/**
 * @fileoverview Production-Ready Database Configuration Module
 * @description Handles MySQL connection pool with automatic reconnection,
 *              health checks, retry logic, and graceful shutdown.
 *
 * @author Rahul Sharma
 * @contact
 *   - GitHub: https://github.com/irahulsharmax
 *   - LinkedIn: https://linkedin.com/in/irahulsharmax
 *   - Twitter: https://twitter.com/irahulsharmax
 *   - Instagram: https://instagram.com/irahulsharmax
 *
 * @version 2.0.0
 * @license MIT
 * @module Database
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// --- CHANGE 1: Suppress dotenv's own console output ---
dotenv.config({ silent: true });

/**
 * Database connection state
 * @type {Object}
 */
const connectionState = {
  isConnected: false,
  lastHealthCheck: null,
  failedAttempts: 0,
  isShuttingDown: false
};

/**
 * Configuration constants
 */
const CONFIG = {
  MAX_RETRY_ATTEMPTS: 5,
  RETRY_DELAY: 3000, // 3 seconds
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  QUERY_TIMEOUT: 30000, // 30 seconds
  SHUTDOWN_TIMEOUT: 10000, // 10 seconds
  // --- CHANGE 2: Default Log Level based on environment ---
  DEFAULT_LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
};

// --- CHANGE 3: Log levels mapping for comparison ---
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3 // If you add debug logs later
};

// --- CHANGE 4: Determine current log level from env or default ---
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] || LOG_LEVELS[CONFIG.DEFAULT_LOG_LEVEL];

/**
 * Logger utility for consistent console output
 * @namespace
 */
const logger = {
  // --- CHANGE 5: Logger methods now check currentLogLevel ---
  error: (msg) => { if (currentLogLevel >= LOG_LEVELS.error) console.error(`[DB][ERROR][${new Date().toISOString()}] ${msg}`); },
  warn: (msg) => { if (currentLogLevel >= LOG_LEVELS.warn) console.warn(`[DB][WARN][${new Date().toISOString()}] ${msg}`); },
  info: (msg) => { if (currentLogLevel >= LOG_LEVELS.info) console.log(`[DB][INFO][${new Date().toISOString()}] ${msg}`); },
  // success logs are treated as info level, so they respect LOG_LEVEL=info
  success: (msg) => { if (currentLogLevel >= LOG_LEVELS.info) console.log(`[DB][OK][${new Date().toISOString()}] ${msg}`); }
};

/**
 * Validates required environment variables
 * @throws {Error} If required variables are missing
 */
const validateEnvironment = () => {
  const required = ['DB_HOST', 'DB_USERNAME', 'DB_DATABASE'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error('Database configuration incomplete');
  }
};

/**
 * Generates database configuration for MySQL with production optimizations
 *
 * @function getDatabaseConfig
 * @returns {Object} Database configuration object
 */
const getDatabaseConfig = () => {
  validateEnvironment();

  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_DATABASE;

  const isProduction = process.env.NODE_ENV === 'production';

  logger.info(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  logger.info(`Connecting to: ${host}:${port}/${database}`);

  return {
    host,
    port,
    user,
    password,
    database,

    // Pool Settings - Optimized for production
    connectionLimit: isProduction ? 20 : 10,
    queueLimit: 0, // Unlimited queue

    // Timeout Settings
    connectTimeout: 30000, // 30 seconds
    acquireTimeout: 30000, // 30 seconds to acquire connection
    waitForConnections: true,

    // Keep connections alive
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10 seconds

    // Timezone handling
    timezone: '+00:00',

    // Character Set - UTF8MB4 for full Unicode support
    charset: 'utf8mb4',

    // Date handling - Keep as strings to avoid timezone issues
    dateStrings: [
      'DATE',
      'DATETIME'
    ],

    // Additional production settings
    multipleStatements: false, // Security: Prevent SQL injection
    namedPlaceholders: false,
    typeCast: true,

    // SSL Configuration for production
    ...(isProduction && process.env.DB_SSL_CA ? {
      ssl: {
        ca: process.env.DB_SSL_CA,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      }
    } : {})
  };
};

/**
 * MySQL connection pool instance
 * @type {Pool}
 */
let pool;

/**
 * Health check interval ID
 * @type {NodeJS.Timeout}
 */
let healthCheckInterval;

/**
 * Initialize database pool with error handling
 */
const initializePool = () => {
  try {
    pool = mysql.createPool(getDatabaseConfig());

    // Pool error handler
    pool.on('error', (err) => {
      logger.error(`Pool error: ${err.message}`);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        logger.warn('Database connection was lost. Reconnecting...');
      }
    });

    // --- CHANGE 6: Removed verbose connection acquire/release logs ---
    // pool.on('acquire', (connection) => {
    //   if (process.env.NODE_ENV === 'development') {
    //     logger.info(`Connection ${connection.threadId} acquired`);
    //   }
    // });
    // pool.on('release', (connection) => {
    //   if (process.env.NODE_ENV === 'development') {
    //     logger.info(`Connection ${connection.threadId} released`);
    //   }
    // });

    logger.success('MySQL pool created successfully');
  } catch (error) {
    logger.error(`Failed to create pool: ${error.message}`);
    throw error;
  }
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Tests database connection with retry logic
 *
 * @async
 * @function testConnection
 * @param {number} attempt - Current attempt number
 * @returns {Promise<boolean>} True if connection successful
 */
export const testConnection = async (attempt = 1) => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Test query with timeout
    const [rows] = await Promise.race([
      connection.query('SELECT NOW() as time, DATABASE() as db, VERSION() as version'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection test timeout')), CONFIG.QUERY_TIMEOUT)
      )
    ]);

    logger.success(`Connected to database: ${rows[0].db}`);
    logger.success(`MySQL version: ${rows[0].version}`);
    logger.success(`Server time: ${rows[0].time}`);

    connectionState.isConnected = true;
    connectionState.lastHealthCheck = new Date();
    connectionState.failedAttempts = 0;

    return true;
  } catch (error) {
    connectionState.isConnected = false;
    connectionState.failedAttempts++;

    logger.error(`Connection test failed (Attempt ${attempt}/${CONFIG.MAX_RETRY_ATTEMPTS}): ${error.message}`);

    // Detailed error messages
    switch (error.code) {
      case 'ECONNREFUSED':
        logger.error('Connection refused - Check if MySQL server is running');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        logger.error('Access denied - Verify DB_USERNAME and DB_PASSWORD');
        break;
      case 'ER_BAD_DB_ERROR':
        logger.error('Database does not exist - Check DB_DATABASE');
        break;
      case 'ETIMEDOUT':
        logger.error('Connection timed out - Check DB_HOST and DB_PORT');
        break;
      case 'ENOTFOUND':
        logger.error('Host not found - Check DB_HOST');
        break;
      case 'PROTOCOL_CONNECTION_LOST':
        logger.error('Connection lost - Server might have restarted');
        break;
      default:
        logger.error(`Error code: ${error.code || 'UNKNOWN'}`);
    }

    // Retry logic
    if (attempt < CONFIG.MAX_RETRY_ATTEMPTS) {
      logger.warn(`Retrying in ${CONFIG.RETRY_DELAY / 1000} seconds...`);
      await sleep(CONFIG.RETRY_DELAY);
      return testConnection(attempt + 1);
    }

    logger.error('Max retry attempts reached. Database connection failed.');
    return false;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        logger.error(`Error releasing connection: ${releaseError.message}`);
      }
    }
  }
};

/**
 * Execute a query with error handling and logging
 *
 * @async
 * @function query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} [rows, fields]
 * @throws {Error} If query fails
 */
export const query = async (sql, params = []) => {
  if (connectionState.isShuttingDown) {
    throw new Error('Database is shutting down');
  }

  // --- CHANGE 7: Only warn if DB is not connected, but allow connection attempt ---
  if (!connectionState.isConnected) {
    logger.warn('Database not connected, attempting to reconnect...');
    // testConnection() will try to reconnect, no need to await it directly here
    // The query will naturally fail and retry if connection not re-established.
  }

  const start = Date.now();
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows, fields] = await Promise.race([
      connection.execute(sql, params),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), CONFIG.QUERY_TIMEOUT)
      )
    ]);

    const duration = Date.now() - start;

    // Log slow queries (performance warning)
    if (duration > 1000) {
      logger.warn(`Slow query detected (${duration}ms): ${sql.substring(0, 100)}...`);
    }

    // --- CHANGE 8: Removed verbose successful query logs ---
    // if (process.env.NODE_ENV === 'development') {
    //   logger.info(`Query executed (${duration}ms): ${sql.substring(0, 80)}...`);
    // }

    return [rows, fields];
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Query failed after ${duration}ms: ${error.message}`);
    logger.error(`SQL: ${sql.substring(0, 100)}...`);

    // Handle specific errors
    if (error.code === 'ER_DUP_ENTRY') {
      logger.error('Duplicate entry error');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      logger.error('Table does not exist');
    }

    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        logger.error(`Error releasing connection: ${releaseError.message}`);
      }
    }
  }
};

/**
 * Get a connection for transactions
 *
 * @async
 * @function getConnection
 * @returns {Promise<Connection>} Database connection
 * @throws {Error} If connection cannot be acquired
 */
export const getConnection = async () => {
  if (connectionState.isShuttingDown) {
    throw new Error('Database is shutting down');
  }

  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    logger.error(`Failed to get connection: ${error.message}`);
    throw error;
  }
};

/**
 * Execute a transaction with automatic rollback on error
 *
 * @async
 * @function transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<any>} Transaction result
 * @throws {Error} If transaction fails
 */
export const transaction = async (callback) => {
  if (connectionState.isShuttingDown) {
    throw new Error('Database is shutting down');
  }

  const connection = await getConnection();
  const start = Date.now();

  try {
    await connection.beginTransaction();
    // --- CHANGE 9: Removed verbose transaction start/commit logs ---
    // logger.info('Transaction started');

    const result = await callback(connection);

    await connection.commit();
    const duration = Date.now() - start;
    // logger.success(`Transaction committed successfully (${duration}ms)`);

    return result;
  } catch (error) {
    await connection.rollback();
    const duration = Date.now() - start;
    logger.error(`Transaction rolled back after ${duration}ms: ${error.message}`);
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        logger.error(`Error releasing transaction connection: ${releaseError.message}`);
      }
    }
  }
};

/**
 * Get connection status
 * @returns {boolean}
 */
export const getConnectionStatus = () => connectionState.isConnected;

/**
 * Get detailed pool statistics
 * @returns {Object} Pool statistics
 */
export const getPoolStats = () => {
  try {
    // Check if pool is initialized before accessing its properties
    if (!pool || !pool.pool) {
      return {
        error: 'Pool not initialized',
        isConnected: connectionState.isConnected
      };
    }
    const poolInfo = pool.pool;
    return {
      totalConnections: poolInfo._allConnections?.length || 0,
      freeConnections: poolInfo._freeConnections?.length || 0,
      pendingRequests: poolInfo._connectionQueue?.length || 0,
      isConnected: connectionState.isConnected,
      lastHealthCheck: connectionState.lastHealthCheck,
      failedAttempts: connectionState.failedAttempts,
      isShuttingDown: connectionState.isShuttingDown
    };
  } catch (error) {
    logger.error(`Error getting pool stats: ${error.message}`);
    return {
      error: error.message,
      isConnected: connectionState.isConnected
    };
  }
};

/**
 * Perform health check on the database connection
 * @async
 * @returns {Promise<boolean>}
 */
const performHealthCheck = async () => {
  try {
    // --- CHANGE 10: Removed verbose periodic health check log ---
    // if (process.env.NODE_ENV === 'development') {
    //   logger.info('Performing health check...');
    // }
    const [rows] = await query('SELECT 1 as health'); // query method handles logging for failures
    if (rows && rows[0] && rows[0].health === 1) {
      connectionState.lastHealthCheck = new Date();
      connectionState.isConnected = true;
      return true;
    }
    return false;
  } catch (error) {
    // query method already logs the error, so no need for redundant log here unless different message is desired
    connectionState.isConnected = false;
    return false;
  }
};

/**
 * Start periodic health checks
 */
export const startHealthCheck = () => {
  if (healthCheckInterval) {
    logger.warn('Health check already running');
    return;
  }

  logger.info(`Starting health checks every ${CONFIG.HEALTH_CHECK_INTERVAL / 1000}s`);

  healthCheckInterval = setInterval(async () => {
    await performHealthCheck();
  }, CONFIG.HEALTH_CHECK_INTERVAL);
};

/**
 * Stop health checks
 */
export const stopHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Health checks stopped');
  }
};

/**
 * Close the pool gracefully with timeout
 *
 * @async
 * @function closePool
 * @returns {Promise<void>}
 */
export const closePool = async () => {
  if (connectionState.isShuttingDown) {
    logger.warn('Pool is already shutting down');
    return;
  }

  connectionState.isShuttingDown = true;
  stopHealthCheck();

  try {
    logger.info('Closing database pool...');

    // Close pool with timeout
    await Promise.race([
      pool.end(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Pool close timeout')), CONFIG.SHUTDOWN_TIMEOUT)
      )
    ]);

    connectionState.isConnected = false;
    logger.success('Pool closed gracefully');
  } catch (error) {
    logger.error(`Error closing pool: ${error.message}`);

    // Force close if graceful shutdown fails
    try {
      await pool.end();
      logger.warn('Pool force-closed after timeout');
    } catch (forceError) {
      logger.error(`Force close failed: ${forceError.message}`);
    }

    throw error;
  }
};

/**
 * Initialize database and setup graceful shutdown
 * @async
 * @returns {Promise<boolean>} Success status
 */
export const initializeDatabase = async () => {
  try {
    logger.info('Initializing database connection...');

    // Initialize pool
    initializePool();

    // Test connection
    const connected = await testConnection();

    if (!connected) {
      throw new Error('Failed to establish database connection');
    }

    // Start health checks in production
    if (process.env.NODE_ENV === 'production') {
      startHealthCheck();
    }

    // Setup graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, closing database connections...`);
      try {
        await closePool();
        process.exit(0);
      } catch (error) {
        logger.error(`Error during graceful shutdown: ${error.message}`);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error(`Uncaught Exception: ${error.message}`);
      await closePool();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
      await closePool();
      process.exit(1);
    });

    logger.success('Database initialized successfully');
    return true;
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    return false;
  }
};

// Initialize pool on module load
initializePool();

export default pool;