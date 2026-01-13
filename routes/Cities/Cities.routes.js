import express from 'express';
import * as CitiesController from '../../controllers/cities/cities.controller.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
const cityUpload = createUploader('cities', {
  maxSize: 20 * 1024 * 1024,
  allowedTypes: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
  ]
});

// Upload middleware with error handling
const handleImageUpload = (req, res, next) => {
  cityUpload.single('img')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed'
      });
    }
    next();
  });
};

// ==================== PUBLIC ROUTES ====================
// Get cities for dropdown (public)
router.get('/dropdown', CitiesController.getCitiesForDropdown);

// Get active cities (public)
router.get('/active', CitiesController.getActiveCities);

// Get recent cities (public)
router.get('/recent', CitiesController.getRecentCities);

// Get city by slug (public)
router.get('/slug/:slug', CitiesController.getCityBySlug);

// Search cities (public)
router.get('/search', CitiesController.searchCities);

// Filter cities (public)
router.get('/filter', CitiesController.filterCities);

// Get cities by coordinates (public)
router.get('/nearby', CitiesController.getCityByCoordinates);

// Get cities by country (public)
router.get('/country/:countryId', CitiesController.getCitiesByCountry);

// Get cities by state (public)
router.get('/state/:stateId', CitiesController.getCitiesByState);

// ==================== ADMIN ROUTES ====================
// Initialize table (admin only)
router.post(
  '/init-table',
  isAuthenticated,
  isAdmin,
  CitiesController.initializeCitiesTable
);

// Get all cities with pagination (admin)
router.get(
  '/',
  isAuthenticated,
  isAdmin,
  CitiesController.getAllCities
);

// Get all cities without pagination (admin)
router.get(
  '/all',
  isAuthenticated,
  isAdmin,
  CitiesController.getAllCitiesNoPagination
);

// Get city stats (admin)
router.get(
  '/stats',
  isAuthenticated,
  isAdmin,
  CitiesController.getCityStats
);

// Get cities with media (admin)
router.get(
  '/with-media',
  isAuthenticated,
  isAdmin,
  CitiesController.getCitiesWithMedia
);

// Get cities by status (admin)
router.get(
  '/status/:status',
  isAuthenticated,
  isAdmin,
  CitiesController.getCitiesByStatus
);

// Get city by ID (admin)
router.get(
  '/:id',
  isAuthenticated,
  isAdmin,
  CitiesController.getCityById
);

// Create city (admin)
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  handleImageUpload,
  CitiesController.createCity
);

// Update city (admin)
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  handleImageUpload,
  CitiesController.updateCity
);

// Update city image (admin)
router.patch(
  '/:id/media',
  isAuthenticated,
  isAdmin,
  handleImageUpload,
  CitiesController.updateCityMedia
);

// Delete city image (admin)
router.delete(
  '/:id/media',
  isAuthenticated,
  isAdmin,
  CitiesController.deleteCityMedia
);

// Update city status (admin)
router.patch(
  '/:id/status',
  isAuthenticated,
  isAdmin,
  CitiesController.updateCityStatus
);

// Bulk update status (admin)
router.patch(
  '/bulk/status',
  isAuthenticated,
  isAdmin,
  CitiesController.bulkUpdateStatus
);

// Delete city (admin)
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  CitiesController.deleteCity
);

// Bulk delete cities (admin)
router.post(
  '/bulk/delete',
  isAuthenticated,
  isAdmin,
  CitiesController.bulkDeleteCities
);

export default router;