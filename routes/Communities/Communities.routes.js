import express from 'express';
import * as CommunitiesController from '../../controllers/communities/communities.contollers.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
const communityUpload = createUploader('communities', {
  maxSize: 20 * 1024 * 1024,
  allowedTypes: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/ogg'
  ]
});

// Upload middleware with error handling
const handleMediaUpload = (req, res, next) => {
  communityUpload.single('media')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Media upload failed'
      });
    }
    next();
  });
};

const handleImageUpload = (req, res, next) => {
  communityUpload.single('img')(req, res, (err) => {
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
// Get communities for dropdown (public)
router.get('/dropdown', CommunitiesController.getCommunitiesForDropdown);

// Get active communities (public)
router.get('/active', CommunitiesController.getActiveCommunities);

// Get recent communities (public)
router.get('/recent', CommunitiesController.getRecentCommunities);

// Get community by slug (public)
router.get('/slug/:slug', CommunitiesController.getCommunityBySlug);

// Search communities (public)
router.get('/search', CommunitiesController.searchCommunities);

// Filter communities (public)
router.get('/filter', CommunitiesController.filterCommunities);

// Get communities by coordinates (public)
router.get('/nearby', CommunitiesController.getCommunityByCoordinates);

// Get communities by city (public)
router.get('/city/:cityId', CommunitiesController.getCommunitiesByCity);

// Get communities by country (public)
router.get('/country/:countryId', CommunitiesController.getCommunitiesByCountry);

// ==================== ADMIN ROUTES ====================
// Initialize table (admin only)
router.post(
  '/init-table',
  isAuthenticated,
  isAdmin,
  CommunitiesController.initializeCommunityTable
);

// Get all communities with pagination (admin)
router.get(
  '/',
  isAuthenticated,
  isAdmin,
  CommunitiesController.getAllCommunities
);

// Get all communities without pagination (admin)
router.get(
  '/all',
  isAuthenticated,
  isAdmin,
  CommunitiesController.getAllCommunitiesNoPagination
);

// Get community stats (admin)
router.get(
  '/stats',
  isAuthenticated,
  isAdmin,
  CommunitiesController.getCommunityStats
);

// Get communities with media (admin)
router.get(
  '/with-media',
  isAuthenticated,
  isAdmin,
  CommunitiesController.getCommunitiesWithMedia
);

// Get communities by status (admin)
router.get(
  '/status/:status',
  isAuthenticated,
  isAdmin,
  CommunitiesController.getCommunitiesByStatus
);

// Get community by ID (admin)
router.get(
  '/:id',
  isAuthenticated,
  isAdmin,
  CommunitiesController.getCommunityById
);

// Create community (admin)
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  handleImageUpload,
  CommunitiesController.createCommunity
);

// Update community (admin)
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  handleImageUpload,
  CommunitiesController.updateCommunity
);

// Update community media (admin)
router.patch(
  '/:id/media',
  isAuthenticated,
  isAdmin,
  handleMediaUpload,
  CommunitiesController.updateCommunityMedia
);

// Delete community media (admin)
router.delete(
  '/:id/media',
  isAuthenticated,
  isAdmin,
  CommunitiesController.deleteCommunityMedia
);

// Update community status (admin)
router.patch(
  '/:id/status',
  isAuthenticated,
  isAdmin,
  CommunitiesController.updateCommunityStatus
);

// Bulk update status (admin)
router.patch(
  '/bulk/status',
  isAuthenticated,
  isAdmin,
  CommunitiesController.bulkUpdateStatus
);

// Delete community (admin)
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  CommunitiesController.deleteCommunity
);

// Bulk delete communities (admin)
router.post(
  '/bulk/delete',
  isAuthenticated,
  isAdmin,
  CommunitiesController.bulkDeleteCommunities
);

export default router;