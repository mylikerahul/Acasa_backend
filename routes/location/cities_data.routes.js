    import express from 'express';
import * as citiesDataController from '../../controllers/location/cities_data.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create (Admin)
router.post(
  '/create', 
  isAuthenticated, 
  isAdmin, 
  citiesDataController.createCityData
);

// Get All
router.get(
  '/all', 
  citiesDataController.getAllCitiesData
);

// Get by Country
router.get(
  '/country/:countryId', 
  citiesDataController.getCityDataByCountry
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(citiesDataController.getCityDataById)
  .put(isAuthenticated, isAdmin, citiesDataController.updateCityData)
  .delete(isAuthenticated, isAdmin, citiesDataController.deleteCityData);

export default router;