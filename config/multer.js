import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directories configuration
const uploadDir = path.join(__dirname, '../uploads');
const directories = {
  avatar: path.join(uploadDir, 'avatar'),
  admin: path.join(uploadDir, 'admin'),
  services: path.join(uploadDir, 'services'),
  blogs: path.join(uploadDir, 'blogs'),
  loginSetting: path.join(uploadDir, 'loginSetting'),
  whychoose: path.join(uploadDir, 'whychoose'),
  slider: path.join(uploadDir, 'slider'),
  users: path.join(uploadDir, 'users') // New users directory
};

// Create directories if they don't exist
Object.values(directories).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Route to directory mapping
const routeMapping = {
  '/admin': { dir: directories.admin, prefix: 'admin' },
  '/user': { dir: directories.avatar, prefix: 'avatar' },
  '/service': { dir: directories.services, prefix: 'service' },
  '/blog': { dir: directories.blogs, prefix: 'blog' },
  '/login-settings': { dir: directories.loginSetting, prefix: 'login-image' },
  '/why-choose': { dir: directories.whychoose, prefix: 'whychoose' },
  '/slider': { dir: directories.slider, prefix: 'slider' },
  '/users': { dir: directories.users, prefix: 'user' } // New users route
};

// Get target directory and prefix based on route
const getUploadConfig = (req) => {
  const route = Object.keys(routeMapping).find(route => 
    req.path.includes(route) || req.originalUrl.includes(route)
  );
  return routeMapping[route] || { dir: uploadDir, prefix: 'file' };
};

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpeg', '.jpg', '.png', '.webp'];
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only JPG, PNG, or WEBP images allowed. Got: ${file.mimetype}`), false);
  }
};

// Main multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { dir } = getUploadConfig(req);
    console.log('Target upload directory:', dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const { prefix } = getUploadConfig(req);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${prefix}-${Date.now()}-${uuidv4().split('-')[0]}${ext}`;
    cb(null, filename);
  }
});

// Main upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Specific upload functions
const createUploader = (targetDir, prefix) => multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, targetDir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefix}-${Date.now()}-${uuidv4().split('-')[0]}${ext}`);
    }
  }),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

// Export specific uploaders
export const uploadUserImage = createUploader(directories.avatar, 'avatar');
export const uploadAdminImage = createUploader(directories.admin, 'admin');
export const uploadServiceImage = createUploader(directories.services, 'service');
export const uploadBlogImage = createUploader(directories.blogs, 'blog');
export const uploadLoginSettingImage = createUploader(directories.loginSetting, 'login-image');
export const uploadSliderImage = createUploader(directories.slider, 'slider');
export const uploadUsersImage = createUploader(directories.users, 'user'); // New users uploader

// Get directory path helper
export const getUploadPath = (type) => directories[type] || uploadDir;

export default upload;