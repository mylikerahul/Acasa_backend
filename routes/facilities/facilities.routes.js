import express from 'express';
import * as FacilitiesController from '../../controllers/facilities/facilities.controller.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// Define multer middleware for file uploads
const facilitiesUpload = createUploader('facilities', {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
});

// ==================== PUBLIC ROUTES ====================
// Get all facilities (with pagination & filters)
router.get('/', FacilitiesController.getAllFacilities);

// Get facility by ID
router.get('/:id', FacilitiesController.getFacilityById);

// Get facility by property ID
router.get('/property/:propertyId', FacilitiesController.getFacilityByPropertyId);

// Check if facility exists for property
router.get('/exists/:propertyId', FacilitiesController.checkFacilityExists);

// Search facilities
router.get('/search/filter', FacilitiesController.searchFacilities);

// Get facility statistics
router.get('/stats/overview', FacilitiesController.getFacilityStatistics);

// ==================== AUTHENTICATED ROUTES ====================
// Create facility
router.post(
  '/',
  isAuthenticated,
  FacilitiesController.createFacility
);

// Create or Update facility (upsert)
router.post(
  '/upsert',
  isAuthenticated,
  FacilitiesController.createOrUpdateFacility
);

// Update facility by ID
router.put(
  '/:id',
  isAuthenticated,
  FacilitiesController.updateFacility
);

// Update facility by property ID
router.put(
  '/property/:propertyId',
  isAuthenticated,
  FacilitiesController.updateFacilityByPropertyId
);

// Soft delete facility
router.delete(
  '/:id',
  isAuthenticated,
  FacilitiesController.deleteFacility
);

// Delete facility by property ID
router.delete(
  '/property/:propertyId',
  isAuthenticated,
  FacilitiesController.deleteFacilityByPropertyId
);

// ==================== ADMIN ONLY ROUTES ====================
// Hard delete facility (permanent)
router.delete(
  '/hard/:id',
  isAuthenticated,
  isAdmin,
  FacilitiesController.hardDeleteFacility
);

// Restore deleted facility
router.patch(
  '/restore/:id',
  isAuthenticated,
  isAdmin,
  FacilitiesController.restoreFacility
);

// Bulk create facilities
router.post(
  '/bulk',
  isAuthenticated,
  isAdmin,
  FacilitiesController.bulkCreateFacilities
);

export default router;