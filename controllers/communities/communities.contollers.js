// controllers/admin/Communities/Communities.controllers.js

import path from 'path';
import fs from 'fs/promises';
import * as CommunitiesModel from '../../models/communities/communities.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_FOLDER = 'communities';
const VALID_STATUSES = ['active', 'inactive'];
const MEDIA_FIELDS = ['img', 'school_img', 'hotel_img', 'hospital_img', 'train_img', 'bus_img'];

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
export const initializeCommunityTable = catchAsyncErrors(async (req, res, next) => {
  await CommunitiesModel.createCommunityTable();
  
  res.status(200).json({
    success: true,
    message: 'Communities table initialized successfully'
  });
});

// ==================== CREATE ====================
export const createCommunity = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    country_id,
    state_id,
    city_id,
    latitude,
    longitude,
    description,
    top_community,
    top_projects,
    featured_project,
    related_blog,
    properties,
    similar_location,
    sales_director,
    seo_slug,
    seo_title,
    seo_keyword,
    seo_description,
    featured,
    status
  } = req.body;

  // Validation
  if (!name || name.trim() === '') {
    return next(new ErrorHandler('Community name is required', 400));
  }

  // Handle file upload
  const img = req.file ? getFilePath(req.file) : null;

  const communityData = {
    name: name.trim(),
    country_id: country_id || null,
    state_id: state_id || null,
    city_id: city_id || null,
    latitude: latitude || null,
    longitude: longitude || null,
    img,
    description: description || null,
    top_community: top_community === 'true' || top_community === true,
    top_projects: top_projects || null,
    featured_project: featured_project || null,
    related_blog: related_blog || null,
    properties: properties || null,
    similar_location: similar_location || null,
    sales_director: sales_director || null,
    seo_slug: seo_slug || null,
    seo_title: seo_title || null,
    seo_keyword: seo_keyword || null,
    seo_description: seo_description || null,
    featured: featured === 'true' || featured === true,
    status: VALID_STATUSES.includes(status) ? status : 'active'
  };

  const community = await CommunitiesModel.createCommunity(communityData);

  res.status(201).json({
    success: true,
    message: 'Community created successfully',
    data: community
  });
});

// ==================== READ ====================
export const getAllCommunities = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, status, city_id, country_id, featured, search } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (city_id) filters.city_id = parseInt(city_id);
  if (country_id) filters.country_id = parseInt(country_id);
  if (featured !== undefined) filters.featured = featured === 'true';
  if (search) filters.search = search;

  const result = await CommunitiesModel.getAllCommunities(
    parseInt(page),
    parseInt(limit),
    filters
  );

  res.status(200).json({
    success: true,
    message: 'Communities fetched successfully',
    ...result
  });
});

export const getAllCommunitiesNoPagination = catchAsyncErrors(async (req, res, next) => {
  const { status, featured } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (featured !== undefined) filters.featured = featured === 'true';

  const communities = await CommunitiesModel.getAllCommunitiesNoPagination(filters);

  res.status(200).json({
    success: true,
    message: 'All communities fetched successfully',
    count: communities.length,
    data: communities
  });
});

export const getCommunityById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid community ID is required', 400));
  }

  const community = await CommunitiesModel.getCommunityById(parseInt(id));

  if (!community) {
    return next(new ErrorHandler('Community not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Community fetched successfully',
    data: community
  });
});

export const getCommunityBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  if (!slug) {
    return next(new ErrorHandler('Community slug is required', 400));
  }

  const community = await CommunitiesModel.getCommunityBySlug(slug);

  if (!community) {
    return next(new ErrorHandler('Community not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Community fetched successfully',
    data: community
  });
});

export const getCommunitiesByCity = catchAsyncErrors(async (req, res, next) => {
  const { cityId } = req.params;

  if (!cityId || isNaN(cityId)) {
    return next(new ErrorHandler('Valid city ID is required', 400));
  }

  const communities = await CommunitiesModel.getCommunitiesByCity(parseInt(cityId));

  res.status(200).json({
    success: true,
    message: 'Communities fetched successfully',
    count: communities.length,
    data: communities
  });
});

export const getCommunitiesByCountry = catchAsyncErrors(async (req, res, next) => {
  const { countryId } = req.params;

  if (!countryId || isNaN(countryId)) {
    return next(new ErrorHandler('Valid country ID is required', 400));
  }

  const communities = await CommunitiesModel.getCommunitiesByCountry(parseInt(countryId));

  res.status(200).json({
    success: true,
    message: 'Communities fetched successfully',
    count: communities.length,
    data: communities
  });
});

// ==================== UPDATE ====================
export const updateCommunity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid community ID is required', 400));
  }

  // Check if community exists
  const existingCommunity = await CommunitiesModel.getCommunityById(parseInt(id));
  if (!existingCommunity) {
    return next(new ErrorHandler('Community not found', 404));
  }

  const updateData = { ...req.body };

  // Handle boolean conversions
  if (updateData.top_community !== undefined) {
    updateData.top_community = updateData.top_community === 'true' || updateData.top_community === true;
  }
  if (updateData.featured !== undefined) {
    updateData.featured = updateData.featured === 'true' || updateData.featured === true;
  }

  // Validate status if provided
  if (updateData.status && !VALID_STATUSES.includes(updateData.status)) {
    return next(new ErrorHandler('Invalid status value', 400));
  }

  // Handle file upload
  if (req.file) {
    // Delete old image if exists
    if (existingCommunity.img) {
      await deleteFile(existingCommunity.img);
    }
    updateData.img = getFilePath(req.file);
  }

  const community = await CommunitiesModel.updateCommunity(parseInt(id), updateData);

  res.status(200).json({
    success: true,
    message: 'Community updated successfully',
    data: community
  });
});

export const updateCommunityMedia = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { mediaField } = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid community ID is required', 400));
  }

  if (!mediaField || !MEDIA_FIELDS.includes(mediaField)) {
    return next(new ErrorHandler(`Invalid media field. Valid fields: ${MEDIA_FIELDS.join(', ')}`, 400));
  }

  if (!req.file) {
    return next(new ErrorHandler('Media file is required', 400));
  }

  // Check if community exists
  const existingCommunity = await CommunitiesModel.getCommunityById(parseInt(id));
  if (!existingCommunity) {
    return next(new ErrorHandler('Community not found', 404));
  }

  // Delete old media if exists
  if (existingCommunity[mediaField]) {
    await deleteFile(existingCommunity[mediaField]);
  }

  const mediaPath = getFilePath(req.file);
  const community = await CommunitiesModel.updateCommunityMedia(parseInt(id), mediaField, mediaPath);

  res.status(200).json({
    success: true,
    message: `${mediaField} updated successfully`,
    data: community
  });
});

export const deleteCommunityMedia = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { mediaField } = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid community ID is required', 400));
  }

  if (!mediaField || !MEDIA_FIELDS.includes(mediaField)) {
    return next(new ErrorHandler(`Invalid media field. Valid fields: ${MEDIA_FIELDS.join(', ')}`, 400));
  }

  // Check if community exists
  const existingCommunity = await CommunitiesModel.getCommunityById(parseInt(id));
  if (!existingCommunity) {
    return next(new ErrorHandler('Community not found', 404));
  }

  // Delete file from storage
  if (existingCommunity[mediaField]) {
    await deleteFile(existingCommunity[mediaField]);
  }

  const community = await CommunitiesModel.deleteCommunityMedia(parseInt(id), mediaField);

  res.status(200).json({
    success: true,
    message: `${mediaField} deleted successfully`,
    data: community
  });
});

// ==================== DELETE ====================
export const deleteCommunity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid community ID is required', 400));
  }

  // Check if community exists
  const existingCommunity = await CommunitiesModel.getCommunityById(parseInt(id));
  if (!existingCommunity) {
    return next(new ErrorHandler('Community not found', 404));
  }

  // Delete all media files
  for (const field of MEDIA_FIELDS) {
    if (existingCommunity[field]) {
      await deleteFile(existingCommunity[field]);
    }
  }

  const deletedCommunity = await CommunitiesModel.deleteCommunity(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'Community deleted successfully',
    data: deletedCommunity
  });
});

export const bulkDeleteCommunities = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Community IDs array is required', 400));
  }

  // Get all communities to delete their media
  for (const id of ids) {
    const community = await CommunitiesModel.getCommunityById(parseInt(id));
    if (community) {
      for (const field of MEDIA_FIELDS) {
        if (community[field]) {
          await deleteFile(community[field]);
        }
      }
    }
  }

  const deletedCommunities = await CommunitiesModel.bulkDeleteCommunities(ids.map(id => parseInt(id)));

  res.status(200).json({
    success: true,
    message: `${deletedCommunities.length} communities deleted successfully`,
    data: deletedCommunities
  });
});

// ==================== STATUS ====================
export const updateCommunityStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid community ID is required', 400));
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const community = await CommunitiesModel.updateCommunityStatus(parseInt(id), status);

  res.status(200).json({
    success: true,
    message: 'Community status updated successfully',
    data: community
  });
});

export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Community IDs array is required', 400));
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const communities = await CommunitiesModel.bulkUpdateStatus(
    ids.map(id => parseInt(id)),
    status
  );

  res.status(200).json({
    success: true,
    message: `${communities.length} communities status updated successfully`,
    data: communities
  });
});

export const getCommunitiesByStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.params;

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const communities = await CommunitiesModel.getCommunitiesByStatus(status);

  res.status(200).json({
    success: true,
    message: 'Communities fetched successfully',
    count: communities.length,
    data: communities
  });
});

// ==================== SEARCH & FILTER ====================
export const searchCommunities = catchAsyncErrors(async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim() === '') {
    return next(new ErrorHandler('Search query is required', 400));
  }

  const communities = await CommunitiesModel.searchCommunities(q.trim(), parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    count: communities.length,
    data: communities
  });
});

export const filterCommunities = catchAsyncErrors(async (req, res, next) => {
  const { city_id, country_id, status, featured, top_community } = req.query;

  const filters = {};
  if (city_id) filters.city_id = parseInt(city_id);
  if (country_id) filters.country_id = parseInt(country_id);
  if (status) filters.status = status;
  if (featured !== undefined) filters.featured = featured === 'true';
  if (top_community !== undefined) filters.top_community = top_community === 'true';

  const communities = await CommunitiesModel.filterCommunities(filters);

  res.status(200).json({
    success: true,
    message: 'Communities filtered successfully',
    count: communities.length,
    data: communities
  });
});

// ==================== STATS ====================
export const getCommunityStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await CommunitiesModel.getCommunityStats();

  res.status(200).json({
    success: true,
    message: 'Community stats fetched successfully',
    data: stats
  });
});

// ==================== UTILITIES ====================
export const getCommunitiesForDropdown = catchAsyncErrors(async (req, res, next) => {
  const communities = await CommunitiesModel.getCommunitiesForDropdown();

  res.status(200).json({
    success: true,
    message: 'Communities for dropdown fetched successfully',
    count: communities.length,
    data: communities
  });
});

export const getActiveCommunities = catchAsyncErrors(async (req, res, next) => {
  const communities = await CommunitiesModel.getActiveCommunities();

  res.status(200).json({
    success: true,
    message: 'Active communities fetched successfully',
    count: communities.length,
    data: communities
  });
});

export const getRecentCommunities = catchAsyncErrors(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const communities = await CommunitiesModel.getRecentCommunities(parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Recent communities fetched successfully',
    count: communities.length,
    data: communities
  });
});

export const getCommunityByCoordinates = catchAsyncErrors(async (req, res, next) => {
  const { latitude, longitude, radius = 5 } = req.query;

  if (!latitude || !longitude) {
    return next(new ErrorHandler('Latitude and longitude are required', 400));
  }

  const communities = await CommunitiesModel.getCommunityByCoordinates(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(radius)
  );

  res.status(200).json({
    success: true,
    message: 'Communities fetched by coordinates successfully',
    count: communities.length,
    data: communities
  });
});

export const getCommunitiesWithMedia = catchAsyncErrors(async (req, res, next) => {
  const communities = await CommunitiesModel.getCommunitiesWithMedia();

  res.status(200).json({
    success: true,
    message: 'Communities with media fetched successfully',
    count: communities.length,
    data: communities
  });
});

export const getAllCities = catchAsyncErrors(async (req, res, next) => {
  const cities = await CommunitiesModel.getAllCities();

  res.status(200).json({
    success: true,
    message: 'Cities fetched successfully',
    count: cities.length,
    data: cities
  });
});

export const getAllCountries = catchAsyncErrors(async (req, res, next) => {
  const countries = await CommunitiesModel.getAllCountries();

  res.status(200).json({
    success: true,
    message: 'Countries fetched successfully',
    count: countries.length,
    data: countries
  });
});

export const getCitiesByCountry = catchAsyncErrors(async (req, res, next) => {
  const { countryId } = req.params;

  if (!countryId || isNaN(countryId)) {
    return next(new ErrorHandler('Valid country ID is required', 400));
  }

  const cities = await CommunitiesModel.getCitiesByCountry(parseInt(countryId));

  res.status(200).json({
    success: true,
    message: 'Cities fetched successfully',
    count: cities.length,
    data: cities
  });
});

// ==================== EXPORT DEFAULT ====================
export default {
  initializeCommunityTable,
  createCommunity,
  getAllCommunities,
  getAllCommunitiesNoPagination,
  getCommunityById,
  getCommunityBySlug,
  getCommunitiesByCity,
  getCommunitiesByCountry,
  updateCommunity,
  updateCommunityMedia,
  deleteCommunityMedia,
  deleteCommunity,
  bulkDeleteCommunities,
  updateCommunityStatus,
  bulkUpdateStatus,
  getCommunitiesByStatus,
  searchCommunities,
  filterCommunities,
  getCommunityStats,
  getCommunitiesForDropdown,
  getActiveCommunities,
  getRecentCommunities,
  getCommunityByCoordinates,
  getCommunitiesWithMedia,
  getAllCities,
  getAllCountries,
  getCitiesByCountry
};