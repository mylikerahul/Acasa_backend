import express from 'express';
import * as communityController from '../../controllers/location/community.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// Upload config
const imageUpload = createUploader('communities', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// Define allowed file fields
const uploadFields = imageUpload.fields([
  { name: 'img', maxCount: 1 },
  { name: 'school_img', maxCount: 1 },
  { name: 'hotel_img', maxCount: 1 },
  { name: 'hospital_img', maxCount: 1 },
  { name: 'train_img', maxCount: 1 },
  { name: 'bus_img', maxCount: 1 }
]);

router.post('/create', isAuthenticated, isAdmin, uploadFields, communityController.createCommunity);
router.get('/all', communityController.getAllCommunities);
router.get('/slug/:slug', communityController.getCommunityBySlug);

router.route('/:id')
  .get(communityController.getCommunityById)
  .put(isAuthenticated, isAdmin, uploadFields, communityController.updateCommunity)
  .delete(isAuthenticated, isAdmin, communityController.deleteCommunity);

export default router;