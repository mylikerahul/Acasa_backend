import path from 'path';
import fs from 'fs/promises';
import * as CitiesModel from '../../models/cities/cities.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_FOLDER = 'cities';
const VALID_STATUSES = ['active', 'inactive'];

// ==================== HELPER FUNCTIONS ====================
const deleteFile = async (filePath) => {
  try {
    if (filePath) {
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      console.log(`✅ File deleted: ${fullPath}`);
    }
  } catch (error) {
    console.log(`⚠️ File not found or already deleted: ${filePath}`);
  }
};

const getFilePath = (file) => {
  if (!file) return null;
  return `${UPLOAD_FOLDER}/${file.filename}`;
};

// ==================== TABLE INITIALIZATION ====================
export const initializeCitiesTable = catchAsyncErrors(async (req, res, next) => {
  await CitiesModel.createCitiesTable();
  
  res.status(200).json({
    success: true,
    message: 'Cities table initialized successfully'
  });
});

// ==================== CREATE ====================
export const createCity = catchAsyncErrors(async (req, res, next) => {
  console.log('📥 Create City Request Body:', req.body);
  console.log('📥 Create City File:', req.file);

  const {
    name,
    country_id,
    state_id,
    city_data_id,
    latitude,
    longitude,
    description,
    seo_title,
    seo_keyword,
    seo_keywork,
    seo_description,
    status
  } = req.body;

  // Validation
  if (!name || name.trim() === '') {
    return next(new ErrorHandler('City name is required', 400));
  }

  // Handle file upload
  const img = req.file ? getFilePath(req.file) : null;

  const cityData = {
    name: name.trim(),
    country_id: country_id ? parseInt(country_id) : null,
    state_id: state_id ? parseInt(state_id) : null,
    city_data_id: city_data_id || null,
    latitude: latitude || null,
    longitude: longitude || null,
    img,
    description: description || null,
    seo_title: seo_title || null,
    seo_keyword: seo_keyword || seo_keywork || null,
    seo_description: seo_description || null,
    status: VALID_STATUSES.includes(status) ? status : 'active'
  };

  console.log('📤 City Data to Save:', cityData);

  const city = await CitiesModel.createCity(cityData);

  res.status(201).json({
    success: true,
    message: 'City created successfully',
    data: city
  });
});

// ==================== READ ====================
export const getAllCities = catchAsyncErrors(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    country_id, 
    state_id,
    search 
  } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (country_id) filters.country_id = parseInt(country_id);
  if (state_id) filters.state_id = parseInt(state_id);
  if (search) filters.search = search;

  const result = await CitiesModel.getAllCities(
    parseInt(page),
    parseInt(limit),
    filters
  );

  res.status(200).json({
    success: true,
    message: 'Cities fetched successfully',
    data: result.data,
    pagination: result.pagination
  });
});

export const getAllCitiesNoPagination = catchAsyncErrors(async (req, res, next) => {
  const { status, country_id } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (country_id) filters.country_id = parseInt(country_id);

  const cities = await CitiesModel.getAllCitiesNoPagination(filters);

  res.status(200).json({
    success: true,
    message: 'All Cities fetched successfully',
    count: cities.length,
    data: cities
  });
});

export const getCityById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid City ID is required', 400));
  }

  const city = await CitiesModel.getCityById(parseInt(id));

  if (!city) {
    return next(new ErrorHandler('City not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'City fetched successfully',
    data: city
  });
});

export const getCityBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  if (!slug) {
    return next(new ErrorHandler('City slug is required', 400));
  }

  const city = await CitiesModel.getCityBySlug(slug);

  if (!city) {
    return next(new ErrorHandler('City not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'City fetched successfully',
    data: city
  });
});

export const getCitiesByCountry = catchAsyncErrors(async (req, res, next) => {
  const { countryId } = req.params;

  if (!countryId || isNaN(countryId)) {
    return next(new ErrorHandler('Valid Country ID is required', 400));
  }

  const cities = await CitiesModel.getCitiesByCountry(parseInt(countryId));

  res.status(200).json({
    success: true,
    message: 'Cities fetched successfully',
    count: cities.length,
    data: cities
  });
});

export const getCitiesByState = catchAsyncErrors(async (req, res, next) => {
  const { stateId } = req.params;

  if (!stateId || isNaN(stateId)) {
    return next(new ErrorHandler('Valid State ID is required', 400));
  }

  const cities = await CitiesModel.getCitiesByState(parseInt(stateId));

  res.status(200).json({
    success: true,
    message: 'Cities fetched successfully',
    count: cities.length,
    data: cities
  });
});

// ==================== UPDATE ====================
export const updateCity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  console.log('📥 Update City Request Body:', req.body);
  console.log('📥 Update City File:', req.file);

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid City ID is required', 400));
  }

  // Check if city exists
  const existingCity = await CitiesModel.getCityById(parseInt(id));
  if (!existingCity) {
    return next(new ErrorHandler('City not found', 404));
  }

  const updateData = {};

  // List of allowed fields
  const allowedFields = [
    'name', 'country_id', 'state_id', 'city_data_id',
    'latitude', 'longitude', 'description',
    'seo_title', 'seo_keyword', 'seo_keywork', 'seo_description', 'status'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      let value = req.body[field];

      // Handle integer conversions
      if (['country_id', 'state_id'].includes(field) && value) {
        value = parseInt(value);
      }

      // Handle field name variations
      if (field === 'seo_keywork') {
        updateData['seo_keyword'] = value;
      } else {
        updateData[field] = value;
      }
    }
  });

  // Validate status if provided
  if (updateData.status && !VALID_STATUSES.includes(updateData.status)) {
    return next(new ErrorHandler('Invalid status value', 400));
  }

  // Handle file upload
  if (req.file) {
    // Delete old image if exists
    if (existingCity.img) {
      await deleteFile(existingCity.img);
    }
    updateData.img = getFilePath(req.file);
  }

  console.log('📤 Update Data:', updateData);

  const city = await CitiesModel.updateCity(parseInt(id), updateData);

  res.status(200).json({
    success: true,
    message: 'City updated successfully',
    data: city
  });
});

export const updateCityMedia = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid City ID is required', 400));
  }

  if (!req.file) {
    return next(new ErrorHandler('Image file is required', 400));
  }

  // Check if city exists
  const existingCity = await CitiesModel.getCityById(parseInt(id));
  if (!existingCity) {
    return next(new ErrorHandler('City not found', 404));
  }

  // Delete old image if exists
  if (existingCity.img) {
    await deleteFile(existingCity.img);
  }

  const mediaPath = getFilePath(req.file);
  const city = await CitiesModel.updateCityMedia(parseInt(id), mediaPath);

  res.status(200).json({
    success: true,
    message: 'City image updated successfully',
    data: city
  });
});

export const deleteCityMedia = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid City ID is required', 400));
  }

  // Check if city exists
  const existingCity = await CitiesModel.getCityById(parseInt(id));
  if (!existingCity) {
    return next(new ErrorHandler('City not found', 404));
  }

  // Delete file from storage
  if (existingCity.img) {
    await deleteFile(existingCity.img);
  }

  const city = await CitiesModel.deleteCityMedia(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'City image deleted successfully',
    data: city
  });
});

// ==================== DELETE ====================
export const deleteCity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid City ID is required', 400));
  }

  // Check if city exists
  const existingCity = await CitiesModel.getCityById(parseInt(id));
  if (!existingCity) {
    return next(new ErrorHandler('City not found', 404));
  }

  // Delete image if exists
  if (existingCity.img) {
    await deleteFile(existingCity.img);
  }

  const deletedCity = await CitiesModel.deleteCity(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'City deleted successfully',
    data: deletedCity
  });
});

export const bulkDeleteCities = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('City IDs array is required', 400));
  }

  // Get all cities to delete their images
  for (const id of ids) {
    const city = await CitiesModel.getCityById(parseInt(id));
    if (city && city.img) {
      await deleteFile(city.img);
    }
  }

  const result = await CitiesModel.bulkDeleteCities(ids.map(id => parseInt(id)));

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} Cities deleted successfully`,
    data: result
  });
});

// ==================== STATUS ====================
export const updateCityStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid City ID is required', 400));
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const city = await CitiesModel.updateCityStatus(parseInt(id), status);

  res.status(200).json({
    success: true,
    message: 'City status updated successfully',
    data: city
  });
});

export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('City IDs array is required', 400));
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const cities = await CitiesModel.bulkUpdateStatus(
    ids.map(id => parseInt(id)),
    status
  );

  res.status(200).json({
    success: true,
    message: `${cities.length} Cities status updated successfully`,
    data: cities
  });
});

export const getCitiesByStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.params;

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const cities = await CitiesModel.getCitiesByStatus(status);

  res.status(200).json({
    success: true,
    message: 'Cities fetched successfully',
    count: cities.length,
    data: cities
  });
});

// ==================== SEARCH & FILTER ====================
export const searchCities = catchAsyncErrors(async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim() === '') {
    return next(new ErrorHandler('Search query is required', 400));
  }

  const cities = await CitiesModel.searchCities(q.trim(), parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    count: cities.length,
    data: cities
  });
});

export const filterCities = catchAsyncErrors(async (req, res, next) => {
  const { country_id, state_id, status } = req.query;

  const filters = {};
  if (country_id) filters.country_id = parseInt(country_id);
  if (state_id) filters.state_id = parseInt(state_id);
  if (status) filters.status = status;

  const cities = await CitiesModel.filterCities(filters);

  res.status(200).json({
    success: true,
    message: 'Cities filtered successfully',
    count: cities.length,
    data: cities
  });
});

// ==================== STATS ====================
export const getCityStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await CitiesModel.getCityStats();

  res.status(200).json({
    success: true,
    message: 'City stats fetched successfully',
    data: stats
  });
});

// ==================== UTILITIES ====================
export const getCitiesForDropdown = catchAsyncErrors(async (req, res, next) => {
  const { country_id } = req.query;

  const cities = await CitiesModel.getCitiesForDropdown(
    country_id ? parseInt(country_id) : null
  );

  res.status(200).json({
    success: true,
    message: 'Cities for dropdown fetched successfully',
    count: cities.length,
    data: cities
  });
});

export const getActiveCities = catchAsyncErrors(async (req, res, next) => {
  const cities = await CitiesModel.getActiveCities();

  res.status(200).json({
    success: true,
    message: 'Active Cities fetched successfully',
    count: cities.length,
    data: cities
  });
});

export const getRecentCities = catchAsyncErrors(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const cities = await CitiesModel.getRecentCities(parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Recent Cities fetched successfully',
    count: cities.length,
    data: cities
  });
});

export const getCityByCoordinates = catchAsyncErrors(async (req, res, next) => {
  const { latitude, longitude, radius = 5 } = req.query;

  if (!latitude || !longitude) {
    return next(new ErrorHandler('Latitude and longitude are required', 400));
  }

  const cities = await CitiesModel.getCityByCoordinates(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(radius)
  );

  res.status(200).json({
    success: true,
    message: 'Cities fetched by coordinates successfully',
    count: cities.length,
    data: cities
  });
});

export const getCitiesWithMedia = catchAsyncErrors(async (req, res, next) => {
  const cities = await CitiesModel.getCitiesWithMedia();

  res.status(200).json({
    success: true,
    message: 'Cities with media fetched successfully',
    count: cities.length,
    data: cities
  });
});

// ==================== EXPORT DEFAULT ====================
export default {
  initializeCitiesTable,
  createCity,
  getAllCities,
  getAllCitiesNoPagination,
  getCityById,
  getCityBySlug,
  getCitiesByCountry,
  getCitiesByState,
  updateCity,
  updateCityMedia,
  deleteCityMedia,
  deleteCity,
  bulkDeleteCities,
  updateCityStatus,
  bulkUpdateStatus,
  getCitiesByStatus,
  searchCities,
  filterCities,
  getCityStats,
  getCitiesForDropdown,
  getActiveCities,
  getRecentCities,
  getCityByCoordinates,
  getCitiesWithMedia
};