// backend/routes/properties/properties.routes.js

import express from 'express';
import * as PropertiesController from '../../controllers/properties/properties.controller.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';
import { validateProperty, validatePropertyUpdate, validatePropertyFilters } from '../../middleware/validators/propertyValidator.js';

const router = express.Router();

// Multer Configuration
const propertiesUploader = createUploader('properties', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
});

const propertiesFields = propertiesUploader.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 20 },
  { name: 'floor_plans', maxCount: 10 },
  { name: 'documents', maxCount: 5 }
]);

const gallerySingleImageUpload = createUploader('properties/gallery', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
}).single('image');

// ==================== PUBLIC ROUTES ====================
router.get('/', validatePropertyFilters, PropertiesController.getAllProperties);
router.get('/search', validatePropertyFilters, PropertiesController.searchProperties);
router.get('/featured', PropertiesController.getFeaturedProperties);
router.get('/types', PropertiesController.getPropertyTypes);
router.get('/slug/:slug', PropertiesController.getPropertyBySlug);
router.get('/:id/similar', PropertiesController.getSimilarProperties);
router.get('/:id', PropertiesController.getPropertyById);
router.get('/health', PropertiesController.healthCheck);

// ==================== AUTHENTICATED ROUTES ====================
router.post('/:id/save', isAuthenticated, PropertiesController.saveProperty);
router.delete('/:id/save', isAuthenticated, PropertiesController.removeSavedProperty);

// FIXED: Moved before /:id route to prevent conflict
router.get('/my/saved', isAuthenticated, PropertiesController.getSavedProperties);
router.get('/my/properties', isAuthenticated, (req, res, next) => {
  req.query.user_id = req.user.id;
  PropertiesController.getAllProperties(req, res, next);
});

router.post('/types', isAuthenticated, isAdmin, PropertiesController.createPropertyType);
router.post('/init', isAuthenticated, isAdmin, PropertiesController.initializeTables);
router.post('/', isAuthenticated, propertiesFields, validateProperty, PropertiesController.createProperty);
router.put('/:id', isAuthenticated, propertiesFields, validatePropertyUpdate, PropertiesController.updateProperty);
router.delete('/:id', isAuthenticated, isAdmin, PropertiesController.deleteProperty);
router.post('/:id/gallery', isAuthenticated, gallerySingleImageUpload, PropertiesController.addGalleryImages);
router.delete('/gallery/:imageId', isAuthenticated, PropertiesController.removeGalleryImage);

// ==================== ADMIN-SPECIFIC ROUTES ====================
router.put('/admin/bulk/status', isAuthenticated, isAdmin, PropertiesController.bulkUpdateStatus);
router.delete('/admin/bulk', isAuthenticated, isAdmin, PropertiesController.bulkDeleteProperties);
router.get('/admin/statistics', isAuthenticated, isAdmin, PropertiesController.getPropertyStatistics);
router.get('/admin/export', isAuthenticated, isAdmin, PropertiesController.exportProperties);
router.get('/admin/dashboard', isAuthenticated, isAdmin, PropertiesController.getDashboardData);

export default router;
