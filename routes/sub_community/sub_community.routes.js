import express from 'express';
import * as SubCommunitiesController from '../../controllers/sub_community/sub_community.controller.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
const subCommunityUpload = createUploader('subcommunities', {
  maxSize: 20 * 1024 * 1024,
  allowedTypes: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/ogg'
  ]
});

// Upload middleware with error handling
const handleImageUpload = (req, res, next) => {
  subCommunityUpload.single('img')(req, res, (err) => {
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
// Get sub-communities for dropdown (public)
router.get('/dropdown', SubCommunitiesController.getSubCommunitiesForDropdown);

// Get active sub-communities (public)
router.get('/active', SubCommunitiesController.getActiveSubCommunities);

// Get recent sub-communities (public)
router.get('/recent', SubCommunitiesController.getRecentSubCommunities);

// Get sub-community by slug (public)
router.get('/slug/:slug', SubCommunitiesController.getSubCommunityBySlug);

// Search sub-communities (public)
router.get('/search', SubCommunitiesController.searchSubCommunities);

// Filter sub-communities (public)
router.get('/filter', SubCommunitiesController.filterSubCommunities);

// Get sub-communities by coordinates (public)
router.get('/nearby', SubCommunitiesController.getSubCommunityByCoordinates);

// Get sub-communities by community (public)
router.get('/community/:communityId', SubCommunitiesController.getSubCommunitiesByCommunity);

// Get sub-communities by city (public)
router.get('/city/:cityId', SubCommunitiesController.getSubCommunitiesByCity);

// Get sub-communities by country (public)
router.get('/country/:countryId', SubCommunitiesController.getSubCommunitiesByCountry);

// ==================== ADMIN ROUTES ====================
// Initialize table (admin only)
router.post(
  '/init-table',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.initializeSubCommunityTable
);

// Get all sub-communities with pagination (admin)
router.get(
  '/',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.getAllSubCommunities
);

// Get all sub-communities without pagination (admin)
router.get(
  '/all',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.getAllSubCommunitiesNoPagination
);

// Get sub-community stats (admin)
router.get(
  '/stats',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.getSubCommunityStats
);

// Get sub-communities with media (admin)
router.get(
  '/with-media',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.getSubCommunitiesWithMedia
);

// Get sub-communities with parent community info (admin)
router.get(
  '/with-community',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.getSubCommunitiesWithCommunity
);

// Get sub-communities by status (admin)
router.get(
  '/status/:status',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.getSubCommunitiesByStatus
);

// Get sub-community by ID (admin)
router.get(
  '/:id',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.getSubCommunityById
);

// Create sub-community (admin)
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  handleImageUpload,
  SubCommunitiesController.createSubCommunity
);

// Update sub-community (admin)
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  handleImageUpload,
  SubCommunitiesController.updateSubCommunity
);

// Update sub-community image (admin)
router.patch(
  '/:id/media',
  isAuthenticated,
  isAdmin,
  handleImageUpload,
  SubCommunitiesController.updateSubCommunityMedia
);

// Delete sub-community image (admin)
router.delete(
  '/:id/media',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.deleteSubCommunityMedia
);

// Update sub-community status (admin)
router.patch(
  '/:id/status',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.updateSubCommunityStatus
);

// Bulk update status (admin)
router.patch(
  '/bulk/status',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.bulkUpdateStatus
);

// Delete sub-community (admin)
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.deleteSubCommunity
);

// Bulk delete sub-communities (admin)
router.post(
  '/bulk/delete',
  isAuthenticated,
  isAdmin,
  SubCommunitiesController.bulkDeleteSubCommunities
);

export default router;