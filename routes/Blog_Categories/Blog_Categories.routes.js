// import express from 'express';
// import * as CategoryController from '../../../controllers/admin/Blog_Categories/Blog_Categories.controller.js';
// import { isAdminAuthenticated } from '../../../guards/guards.js';

// const router = express.Router();

// // Public routes
// router.get('/', CategoryController.getAllCategories);
// router.get('/search', CategoryController.searchCategories);
// router.get('/stats', CategoryController.getCategoryStats);
// router.get('/:id', CategoryController.getCategory);

// // Admin routes (require authentication)
// router.post('/', isAdminAuthenticated, CategoryController.createCategory);
// router.put('/:id', isAdminAuthenticated, CategoryController.updateCategory);
// router.delete('/:id', isAdminAuthenticated, CategoryController.deleteCategory);
// router.post('/generate-slug', isAdminAuthenticated, CategoryController.generateSlug);
// router.post('/bulk-delete', isAdminAuthenticated, CategoryController.bulkDelete);

// export default router;