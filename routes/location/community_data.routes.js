import express from 'express';
import * as communityDataController from '../../controllers/location/community_data.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create (Admin)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  communityDataController.createCommunityData
);

// Get All
router.get(
  '/all', 
  communityDataController.getAllCommunityData
);

// Get by City (e.g. dropdown filtering)
router.get(
  '/city/:cityId', 
  communityDataController.getCommunityDataByCity
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(communityDataController.getCommunityDataById)
  .put(isAuthenticated, isAdmin, communityDataController.updateCommunityData)
  .delete(isAuthenticated, isAdmin, communityDataController.deleteCommunityData);

export default router;