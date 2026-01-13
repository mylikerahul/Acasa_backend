// backend/middleware/uploads.js

import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Use fs.promises for async operations if needed, but fs.existsSync is sync
import crypto from 'crypto';

// ==================== CONFIGURATION ====================

const UPLOAD_BASE_PATH = 'uploads';

const DEFAULT_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Ensure directory exists
 * @param {string} dirPath - Relative path within UPLOAD_BASE_PATH (e.g., 'projects', 'projects/gallery')
 * @returns {string} The full absolute path to the destination directory.
 */
const ensureDir = (dirPath) => {
  const fullPath = path.join(process.cwd(), UPLOAD_BASE_PATH, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

/**
 * Generate unique filename
 * @param {string} originalName - The original name of the file
 * @returns {string} A unique filename with a timestamp and random string
 */
const generateFilename = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

/**
 * Create multer storage
 */
const createStorage = (folder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = ensureDir(folder); // Ensure the folder exists
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const filename = generateFilename(file.originalname);
      // Multer typically sets file.path to the absolute path.
      // We will ensure that the path stored in the DB (via controller) is relative.
      // For now, Multer's default behavior for `file.path` is fine.
      cb(null, filename);
    }
  });
};

/**
 * Create file filter
 */
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// ==================== MAIN UPLOADER FACTORY ====================

/**
 * Creates a configured Multer instance for a specific upload folder.
 * @param {string} folder - The subfolder within UPLOAD_BASE_PATH to store files.
 * @param {object} options - Configuration options like maxSize and allowedTypes.
 * @returns {multer.Multer} A Multer instance.
 */
export const createUploader = (folder, options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  
  ensureDir(folder); // Ensure base directory for type exists.
  
  return multer({
    storage: createStorage(folder),
    limits: {
      fileSize: config.maxSize
    },
    fileFilter: createFileFilter(config.allowedTypes)
  });
};

// ==================== PRE-CONFIGURED UPLOADERS ====================

// Agents uploader
export const agentsMulter = createUploader('agents', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// Admin uploader
export const adminMulter = createUploader('admin', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
});

// Properties uploader
export const propertiesMulter = createUploader('properties', {
  maxSize: 10 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// Blogs uploader
export const blogsMulter = createUploader('blogs', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// ==================== IMAGE DELETION ====================

/**
 * Delete image from server
 * @param {string} imagePath - Relative path to image (e.g., 'projects/image.jpg')
 * @returns {Promise<boolean>} True if deleted, false otherwise.
 */
export const deleteImage = async (imagePath) => {
  if (!imagePath) {
    console.warn('Attempted to delete image with empty path.');
    return false;
  }
  
  try {
    let fullPath;
    // Attempt to normalize path to ensure it starts from UPLOAD_BASE_PATH
    // Multer stores `file.path` as absolute; for deletion we need to work backwards from what's stored in DB
    // Assuming DB stores paths relative to `uploads/`
    const relativeToUploads = imagePath.replace(/^uploads\//, ''); // Remove 'uploads/' prefix if present
    fullPath = path.join(process.cwd(), UPLOAD_BASE_PATH, relativeToUploads);
    
    // Check if file exists asynchronously before attempting to delete
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK); // Check if file exists
    } catch (e) {
      console.warn(`⚠️ File not found at ${fullPath}`);
      return false; // File does not exist
    }

    await fs.promises.unlink(fullPath); // Delete file asynchronously
    console.log(`✅ Deleted: ${fullPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Delete error for ${imagePath}: ${error.message}`);
    return false;
  }
};

// ==================== ERROR HANDLER ====================

/**
 * Multer error handler middleware.
 * Should be placed after your multer instance in route definitions.
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size allowed is ${DEFAULT_CONFIG.maxSize / (1024 * 1024)}MB`
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload. Check your field names in multer.fields() or multer.single().'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Generic error caught by fileFilter
  if (err && err.message.includes('Invalid file type')) {
     return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Pass to the next error handler if not a Multer error
  next(err); 
};