import express from 'express';
import * as blogsController from '../../controllers/blogs/blogs.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
// Folder name 'blogs'
const imageUpload = createUploader('blogs', {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// Create new Blog (Admin)
router.post(
  '/', 
  isAuthenticated, 
  isAdmin, 
  imageUpload.single('imageurl'), 
  blogsController.createBlog
);

// Get All Blogs (Public)
router.get(
  '/all', 
  blogsController.getAllBlogs
);

// Get Blog by Slug (Public)
router.get(
  '/slug/:slug', 
  blogsController.getBlogBySlug
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(blogsController.getBlogById)
  .put(
    isAuthenticated, 
    isAdmin, 
    imageUpload.single('imageurl'), 
    blogsController.updateBlog
  )
  .delete(
    isAuthenticated, 
    isAdmin, 
    blogsController.deleteBlog
  );

export default router;