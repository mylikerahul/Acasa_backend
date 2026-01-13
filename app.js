/**
 * @fileoverview Express Server Configuration & Startup Module
 * @description Main entry point for ServEase Backend API.
 *
 * @author Rahul Sharma
 * @version 1.0.0
 * @license MIT
 */

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import local modules
import pool from './config/db.js'; // Ensure this uses the LOG_LEVEL setup
import { initializeModels } from './config/initModels.js'; // Ensure this uses the LOG_LEVEL setup
import { initializeRoutes } from './config/initRoutes.js'; // Ensure this uses the LOG_LEVEL setup
import attachDB from './middleware/attachDB.js';
import errorMiddleware from './middleware/error.js';

// --- CHANGE 1: Load environment variables silently ---
dotenv.config({ silent: true });

// ============================================
// Centralized Logger for app.js
// ============================================
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const DEFAULT_APP_LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'warn' : 'info';
const currentAppLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] || LOG_LEVELS[DEFAULT_APP_LOG_LEVEL];

const appLogger = {
  error: (msg, ...args) => { if (currentAppLogLevel >= LOG_LEVELS.error) console.error(`[SERVER][ERROR] ${msg}`, ...args); },
  warn: (msg, ...args) => { if (currentAppLogLevel >= LOG_LEVELS.warn) console.warn(`[SERVER][WARN] ${msg}`, ...args); },
  info: (msg, ...args) => { if (currentAppLogLevel >= LOG_LEVELS.info) console.log(`[SERVER][INFO] ${msg}`, ...args); },
  success: (msg, ...args) => { if (currentAppLogLevel >= LOG_LEVELS.info) console.log(`[SERVER][OK] ${msg}`, ...args); }
};

// ============================================
// Constants & Configuration
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = createServer(app);

const PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Base URL for API
const BASE_URL = process.env.RENDER_EXTERNAL_URL
  || process.env.BASE_URL
  || `http://localhost:${PORT}`;

// --- CHANGE 2: Removed redundant config logs here as db.js already logs relevant env/conn info ---
// appLogger.info(`Environment: ${NODE_ENV}`); // This is handled by db.js now
// appLogger.info(`Base URL: ${BASE_URL}`); // This can be part of final server start logs


// ============================================
// CORS Configuration
// ============================================

/**
 * Allowed origins for CORS
 */
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    origins.push(...additionalOrigins);
  }

  return origins;
};

const ALLOWED_ORIGINS = getAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) { // Allow requests with no origin (like mobile apps or curl requests)
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // --- CHANGE 3: Only log CORS warnings if not production or if LOG_LEVEL allows ---
    if (!IS_PRODUCTION && currentAppLogLevel >= LOG_LEVELS.warn) { // For development, allow local IPs if not explicitly in ALLOWED_ORIGINS
        if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+$/.test(origin)) {
            appLogger.warn(`Allowing origin in dev: ${origin}`);
            return callback(null, true);
        }
    }

    appLogger.warn(`Blocked origin: ${origin}`); // Changed from console.warn to appLogger.warn
    callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cookie',
  ],
  exposedHeaders: ['Content-Disposition', 'Set-Cookie'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

// ============================================
// Security Configuration
// ============================================
const helmetOptions = {
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: IS_PRODUCTION ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  } : false,
};

// ============================================
// Swagger Configuration
// ============================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ServEase API',
      version: '1.0.0',
      description: 'ServEase Backend API Documentation',
    },
    servers: [
      {
        url: BASE_URL,
        description: IS_PRODUCTION ? 'Production Server' : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    path.resolve(__dirname, './routes/*.js'), // Absolute path for Swagger to find routes
    path.resolve(__dirname, './controllers/*.js') // Absolute path for Swagger to find controllers
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ============================================
// Middleware Setup
// ============================================

// Security
app.use(helmet(helmetOptions));

// CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Compression
app.use(compression());

// Logging (morgan)
// --- CHANGE 4: Conditionally apply morgan based on LOG_LEVEL ---
if (currentAppLogLevel >= LOG_LEVELS.info) { // Only log HTTP requests if LOG_LEVEL is 'info' or 'debug'
  if (IS_PRODUCTION) {
    app.use(morgan('combined'));
  } else {
    app.use(morgan('dev'));
  }
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database middleware
app.use(attachDB);

// Trust proxy
app.set('trust proxy', 1);

// ============================================
// Routes
// ============================================

/** Root endpoint */
app.get('/', (req, res) => {
  res.json({
    message: 'ServEase Backend API',
    version: '1.0.0',
    documentation: `${BASE_URL}/api-docs`,
    health: `${BASE_URL}/health`,
  });
});

/** Health check endpoint */
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    service: 'ServEase API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  };

  try {
    const startTime = Date.now();
    await pool.query('SELECT 1'); // Use pool.query directly for health check
    healthCheck.database = {
      status: 'connected',
      responseTime: `${Date.now() - startTime}ms`,
    };

    res.status(200).json(healthCheck);
  } catch (err) {
    healthCheck.status = 'ERROR';
    healthCheck.database = {
      status: 'disconnected',
      error: err.message,
    };
    appLogger.error('Health check database error:', err.message); // Log error for health check
    res.status(503).json(healthCheck);
  }
});

/** API Documentation */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

/** Initialize API routes */
// --- CHANGE 5: Pass silent flag to initializeRoutes ---
initializeRoutes(app, { silent: !currentAppLogLevel >= LOG_LEVELS.info }); // True if currentAppLogLevel < info

/** 404 handler */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

/** Error middleware */
app.use(errorMiddleware);

// ============================================
// Graceful Shutdown
// ============================================

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  appLogger.warn(`${signal} received, starting graceful shutdown...`); // Changed to appLogger.warn

  server.close(async () => {
    appLogger.info('HTTP server closed'); // Changed to appLogger.info

    try {
      // --- CHANGE 6: Use pool.end() from your db.js (which should be pool.closePool()) ---
      // pool.end() is the mysql2/promise pool method, but your db.js wraps it in closePool
      await pool.closePool(); // Assuming your db.js exports a method closePool
      appLogger.info('Database connections closed');
      appLogger.success('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      appLogger.error('Error during shutdown:', err.message); // Changed to appLogger.error
      process.exit(1);
    }
  });

  setTimeout(() => {
    appLogger.error('Forced shutdown after timeout'); // Changed to appLogger.error
    process.exit(1);
  }, 30000);
};

// Shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Error handlers
process.on('uncaughtException', (err) => {
  appLogger.error('Uncaught Exception:', err); // Changed to appLogger.error
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  appLogger.error('Unhandled Rejection at:', promise, 'reason:', reason); // Changed to appLogger.error
});

// ============================================
// Server Startup
// ============================================

/**
 * Initializes and starts the server
 */
const startServer = async () => {
  try {
    appLogger.info('Starting ServEase Backend...'); // Changed to appLogger.info

    // Initialize database models
    appLogger.info('Initializing database models...'); // Changed to appLogger.info
    // --- CHANGE 7: Pass silent flag to initializeModels ---
    await initializeModels({ silent: !currentAppLogLevel >= LOG_LEVELS.info });

    // Test database connection
    appLogger.info('Testing database connection...'); // Changed to appLogger.info
    // --- CHANGE 8: Use pool.query (if it logs already) or your testConnection function ---
    // If pool.query() from db.js is already configured for minimal logging, this is fine.
    // Otherwise, better to use the testConnection from db.js
    // await pool.testConnection(); // Uncomment if you want to use the explicit testConnection
    await pool.query('SELECT 1'); // This will also test connection.
    appLogger.success('Database connected successfully'); // Changed to appLogger.success

    // Start server
    server.listen(PORT, HOST, () => {
      appLogger.info('========================================');
      appLogger.info('ServEase Backend Started');
      appLogger.info('========================================');
      appLogger.info(`Environment : ${NODE_ENV}`);
      appLogger.info(`Server      : ${BASE_URL}`);
      appLogger.info(`Port        : ${PORT}`);
      appLogger.info(`API Docs    : ${BASE_URL}/api-docs`);
      appLogger.info(`Health      : ${BASE_URL}/health`);
      appLogger.info('========================================');
    });

    // Server error handler
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        appLogger.error(`Error: Port ${PORT} is already in use`); // Changed to appLogger.error
      } else if (err.code === 'EACCES') {
        appLogger.error(`Error: Port ${PORT} requires elevated privileges`); // Changed to appLogger.error
      } else {
        appLogger.error(`Error: ${err.message}`); // Changed to appLogger.error
      }
      process.exit(1);
    });

  } catch (err) {
    appLogger.error('Fatal: Failed to start server'); // Changed to appLogger.error
    appLogger.error('Error:', err.message); // Changed to appLogger.error
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;