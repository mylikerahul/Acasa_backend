// backend/routes/projects/project.routes.js

import express from 'express';
import * as ProjectsController from '../../controllers/projects/project.controller.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

// Validators removed as per your request.
// If you want to re-add them, uncomment the import and add them to the routes.
// import {
//   validateProject,
//   validateProjectUpdate,
//   validateProjectContact
// } from '../../middleware/validators/projectValidator.js';

const router = express.Router();

// Define multer middleware outside of route handlers to avoid re-creation
const projectsUpload = createUploader('projects', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
});

const projectsFields = projectsUpload.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 20 },
  { name: 'floor_plans', maxCount: 10 },
  { name: 'documents', maxCount: 5 }
]);

const galleryUpload = createUploader('projects/gallery', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
}).array('images', 20);

// ==================== PUBLIC ROUTES ====================

// Get all projects
router.get('/', ProjectsController.getAllProjects);

// Search projects
router.get('/search', ProjectsController.searchProjects);

// Get featured projects
router.get('/featured', ProjectsController.getFeaturedProjects);

// Get project by slug
router.get('/slug/:slug', ProjectsController.getProjectBySlug);

// Get project by ID
router.get('/:id', ProjectsController.getProjectById);

// Submit contact inquiry (public)
// Validator removed
router.post('/contact', ProjectsController.submitProjectContact);

// Get amenities
router.get('/amenities/list', ProjectsController.getAllAmenities);

// ==================== AUTHENTICATED ROUTES ====================

// Initialize tables (admin only)
router.post('/init', isAuthenticated, isAdmin, ProjectsController.initializeTables);

// Create project
// Validator removed
router.post('/',
  isAuthenticated,
  projectsFields,
  ProjectsController.createProject
);

// Update project
// Validator removed
router.put('/:id',
  isAuthenticated,
  projectsFields,
  ProjectsController.updateProject
);

// Delete project
router.delete('/:id', isAuthenticated, ProjectsController.deleteProject);

// ==================== GALLERY ROUTES ====================

// Add gallery images
router.post('/:id/gallery',
  isAuthenticated,
  galleryUpload,
  ProjectsController.addGalleryImages
);

// Remove gallery image
router.delete('/gallery/:imageId', isAuthenticated, ProjectsController.removeGalleryImage);

// ==================== AMENITIES ROUTES (Admin Only) ====================

router.post('/amenities', isAuthenticated, isAdmin, ProjectsController.createAmenity);
router.delete('/amenities/:id', isAuthenticated, isAdmin, ProjectsController.deleteAmenity);

// ==================== CONTACTS ROUTES (Admin Only) ====================

router.get('/:id/contacts', isAuthenticated, isAdmin, ProjectsController.getProjectContacts);

// ==================== STATISTICS & ANALYTICS (Admin Only) ====================

router.get('/stats/overview', isAuthenticated, isAdmin, ProjectsController.getProjectStatistics);
router.get('/stats/dashboard', isAuthenticated, isAdmin, ProjectsController.getDashboardData);

// ==================== BULK OPERATIONS (Admin Only) ====================

router.put('/bulk/status', isAuthenticated, isAdmin, ProjectsController.bulkUpdateStatus);
router.delete('/bulk', isAuthenticated, isAdmin, ProjectsController.bulkDeleteProjects);

// ==================== EXPORT (Admin Only) ====================

router.get('/export/csv', isAuthenticated, isAdmin, ProjectsController.exportProjects);

export default router;