import express from 'express';
import * as cityController from '../../controllers/location/cities.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

const imageUpload = createUploader('cities', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

router.post('/create', isAuthenticated, isAdmin, imageUpload.single('img'), cityController.createCity);
router.get('/all', cityController.getAllCities);
router.get('/slug/:slug', cityController.getCityBySlug);

router.route('/:id')
  .get(cityController.getCityById)
  .put(isAuthenticated, isAdmin, imageUpload.single('img'), cityController.updateCity)
  .delete(isAuthenticated, isAdmin, cityController.deleteCity);

export default router;