// import express from 'express';
// import * as CitiesController from '../../../controllers/admin/Cities/Cities.controller.js';
// import { isAdminAuthenticated } from '../../../guards/guards.js';
// import { citiesUploader, handleUploadError } from '../../../middleware/upload.js';

// const router = express.Router();

// // ==================== UPLOAD CONFIG ====================
// const uploadFields = citiesUploader.fields([
//   { name: 'image', maxCount: 1 }
// ]);

// // ==================== TABLE INIT (One-time use) ====================
// router.post('/init-table', isAdminAuthenticated, CitiesController.initCitiesTable);

// // ==================== PUBLIC ROUTES ====================
// router.get('/country/:country', CitiesController.getCitiesByCountry);
// router.get('/slug/:slug', CitiesController.getCityBySlug);

// // ==================== ADMIN ROUTES ====================

// // Get all cities (with pagination)
// router.get('/', isAdminAuthenticated, CitiesController.getAllCities);

// // Get city by ID
// router.get('/:id', isAdminAuthenticated, CitiesController.getCityById);

// // Create new city
// router.post(
//   '/',
//   isAdminAuthenticated,
//   uploadFields,
//   handleUploadError,
//   CitiesController.createCity
// );

// // Update city
// router.put(
//   '/:id',
//   isAdminAuthenticated,
//   uploadFields,
//   handleUploadError,
//   CitiesController.updateCity
// );

// // Update city status only
// router.patch(
//   '/:id/status',
//   isAdminAuthenticated,
//   CitiesController.updateCityStatus
// );

// // Delete city
// router.delete('/:id', isAdminAuthenticated, CitiesController.deleteCity);

// export default router;