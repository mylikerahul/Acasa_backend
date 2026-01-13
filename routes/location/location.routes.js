// // routes/location/location.routes.js

// import express from 'express';
// import * as locationController from '../../controllers/location/location.controller.js';
// import { 
//   isAuthenticated, 
//   isOptionalAuth,  // 🆕 Import this
//   guestOrUser      // 🆕 Or this (same thing)
// } from '../../guards/guards.js';

// const router = express.Router();

// /* =========================================================
//    PUBLIC ROUTES (Guest + Logged Both)
// ========================================================= */

// // Get location info - Guest bhi access kar sakta hai
// router.post('/info', isOptionalAuth, locationController.getLocationInfo);

// /* =========================================================
//    PROTECTED ROUTES (Logged Users Only)
// ========================================================= */

// // Save location - Sirf logged users
// router.post('/save', isAuthenticated, locationController.saveLocation);

// // Get all my locations
// router.get('/my-locations', isAuthenticated, locationController.getMyLocations);

// // Get primary location
// router.get('/my-location', isAuthenticated, locationController.getMyPrimaryLocation);

// // Delete location
// router.delete('/:locationId', isAuthenticated, locationController.deleteLocation);

// export default router;