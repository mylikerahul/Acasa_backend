import path from 'path';
import fs from 'fs/promises';
import * as SubCommunitiesModel from '../../models/sub_community/sub_community.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_FOLDER = 'subcommunities';
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

// Helper to convert boolean values
const toBoolean = (value) => {
  return value === true || value === 'true' || value === 1 || value === '1';
};

// ==================== TABLE INITIALIZATION ====================
export const initializeSubCommunityTable = catchAsyncErrors(async (req, res, next) => {
  await SubCommunitiesModel.createSubCommunityTable();
  
  res.status(200).json({
    success: true,
    message: 'SubCommunity table initialized successfully'
  });
});

// ==================== CREATE ====================
export const createSubCommunity = catchAsyncErrors(async (req, res, next) => {
  console.log('📥 Create SubCommunity Request Body:', req.body);
  console.log('📥 Create SubCommunity File:', req.file);

  const {
    name,
    country_id,
    state_id,
    city_id,
    community_id,
    direction,
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
    sales_diretor,
    seo_slug,
    seo_title,
    seo_keyword,
    seo_keywork,
    seo_description,
    status
  } = req.body;

  // Validation
  if (!name || name.trim() === '') {
    return next(new ErrorHandler('SubCommunity name is required', 400));
  }

  // Handle file upload
  const img = req.file ? getFilePath(req.file) : null;

  const subCommunityData = {
    name: name.trim(),
    country_id: country_id ? parseInt(country_id) : null,
    state_id: state_id ? parseInt(state_id) : null,
    city_id: city_id ? parseInt(city_id) : null,
    community_id: community_id ? parseInt(community_id) : null,
    direction: direction || null,
    latitude: latitude || null,
    longitude: longitude || null,
    img,
    description: description || null,
    top_community: toBoolean(top_community),
    top_projects: top_projects || null,
    featured_project: featured_project || null,
    related_blog: related_blog || null,
    properties: properties || null,
    similar_location: similar_location || null,
    sales_director: sales_director || sales_diretor || null,
    seo_slug: seo_slug || null,
    seo_title: seo_title || null,
    seo_keyword: seo_keyword || seo_keywork || null,
    seo_description: seo_description || null,
    status: VALID_STATUSES.includes(status) ? status : 'active'
  };

  console.log('📤 SubCommunity Data to Save:', subCommunityData);

  const subCommunity = await SubCommunitiesModel.createSubCommunity(subCommunityData);

  res.status(201).json({
    success: true,
    message: 'SubCommunity created successfully',
    data: subCommunity
  });
});

// ==================== READ ====================
export const getAllSubCommunities = catchAsyncErrors(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    community_id, 
    city_id, 
    country_id, 
    top_community,
    search 
  } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (community_id) filters.community_id = parseInt(community_id);
  if (city_id) filters.city_id = parseInt(city_id);
  if (country_id) filters.country_id = parseInt(country_id);
  if (top_community !== undefined) filters.top_community = top_community === 'true';
  if (search) filters.search = search;

  const result = await SubCommunitiesModel.getAllSubCommunities(
    parseInt(page),
    parseInt(limit),
    filters
  );

  res.status(200).json({
    success: true,
    message: 'SubCommunities fetched successfully',
    data: result.data,
    pagination: result.pagination
  });
});

export const getAllSubCommunitiesNoPagination = catchAsyncErrors(async (req, res, next) => {
  const { status, community_id, top_community } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (community_id) filters.community_id = parseInt(community_id);
  if (top_community !== undefined) filters.top_community = top_community === 'true';

  const subCommunities = await SubCommunitiesModel.getAllSubCommunitiesNoPagination(filters);

  res.status(200).json({
    success: true,
    message: 'All SubCommunities fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const getSubCommunityById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid SubCommunity ID is required', 400));
  }

  const subCommunity = await SubCommunitiesModel.getSubCommunityById(parseInt(id));

  if (!subCommunity) {
    return next(new ErrorHandler('SubCommunity not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'SubCommunity fetched successfully',
    data: subCommunity
  });
});

export const getSubCommunityBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  if (!slug) {
    return next(new ErrorHandler('SubCommunity slug is required', 400));
  }

  const subCommunity = await SubCommunitiesModel.getSubCommunityBySlug(slug);

  if (!subCommunity) {
    return next(new ErrorHandler('SubCommunity not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'SubCommunity fetched successfully',
    data: subCommunity
  });
});

export const getSubCommunitiesByCommunity = catchAsyncErrors(async (req, res, next) => {
  const { communityId } = req.params;

  if (!communityId || isNaN(communityId)) {
    return next(new ErrorHandler('Valid Community ID is required', 400));
  }

  const subCommunities = await SubCommunitiesModel.getSubCommunitiesByCommunity(parseInt(communityId));

  res.status(200).json({
    success: true,
    message: 'SubCommunities fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const getSubCommunitiesByCity = catchAsyncErrors(async (req, res, next) => {
  const { cityId } = req.params;

  if (!cityId || isNaN(cityId)) {
    return next(new ErrorHandler('Valid City ID is required', 400));
  }

  const subCommunities = await SubCommunitiesModel.getSubCommunitiesByCity(parseInt(cityId));

  res.status(200).json({
    success: true,
    message: 'SubCommunities fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const getSubCommunitiesByCountry = catchAsyncErrors(async (req, res, next) => {
  const { countryId } = req.params;

  if (!countryId || isNaN(countryId)) {
    return next(new ErrorHandler('Valid Country ID is required', 400));
  }

  const subCommunities = await SubCommunitiesModel.getSubCommunitiesByCountry(parseInt(countryId));

  res.status(200).json({
    success: true,
    message: 'SubCommunities fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const getSubCommunitiesWithCommunity = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, status, community_id } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (community_id) filters.community_id = parseInt(community_id);

  const result = await SubCommunitiesModel.getSubCommunitiesWithCommunity(
    parseInt(page),
    parseInt(limit),
    filters
  );

  res.status(200).json({
    success: true,
    message: 'SubCommunities with community info fetched successfully',
    data: result.data,
    pagination: result.pagination
  });
});

// ==================== UPDATE ====================
export const updateSubCommunity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  console.log('📥 Update SubCommunity Request Body:', req.body);
  console.log('📥 Update SubCommunity File:', req.file);

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid SubCommunity ID is required', 400));
  }

  // Check if sub-community exists
  const existingSubCommunity = await SubCommunitiesModel.getSubCommunityById(parseInt(id));
  if (!existingSubCommunity) {
    return next(new ErrorHandler('SubCommunity not found', 404));
  }

  const updateData = {};

  // List of allowed fields
  const allowedFields = [
    'name', 'country_id', 'state_id', 'city_id', 'community_id', 'direction',
    'latitude', 'longitude', 'description', 'top_community', 'top_projects',
    'featured_project', 'related_blog', 'properties', 'similar_location',
    'sales_director', 'sales_diretor', 'seo_slug', 'seo_title', 
    'seo_keyword', 'seo_keywork', 'seo_description', 'status'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      let value = req.body[field];

      // Handle boolean conversions
      if (field === 'top_community') {
        value = toBoolean(value);
      }

      // Handle integer conversions
      if (['country_id', 'state_id', 'city_id', 'community_id'].includes(field) && value) {
        value = parseInt(value);
      }

      // Handle field name variations
      if (field === 'seo_keywork') {
        updateData['seo_keyword'] = value;
      } else if (field === 'sales_diretor') {
        updateData['sales_director'] = value;
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
    if (existingSubCommunity.img) {
      await deleteFile(existingSubCommunity.img);
    }
    updateData.img = getFilePath(req.file);
  }

  console.log('📤 Update Data:', updateData);

  const subCommunity = await SubCommunitiesModel.updateSubCommunity(parseInt(id), updateData);

  res.status(200).json({
    success: true,
    message: 'SubCommunity updated successfully',
    data: subCommunity
  });
});

export const updateSubCommunityMedia = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid SubCommunity ID is required', 400));
  }

  if (!req.file) {
    return next(new ErrorHandler('Image file is required', 400));
  }

  // Check if sub-community exists
  const existingSubCommunity = await SubCommunitiesModel.getSubCommunityById(parseInt(id));
  if (!existingSubCommunity) {
    return next(new ErrorHandler('SubCommunity not found', 404));
  }

  // Delete old image if exists
  if (existingSubCommunity.img) {
    await deleteFile(existingSubCommunity.img);
  }

  const mediaPath = getFilePath(req.file);
  const subCommunity = await SubCommunitiesModel.updateSubCommunityMedia(parseInt(id), mediaPath);

  res.status(200).json({
    success: true,
    message: 'SubCommunity image updated successfully',
    data: subCommunity
  });
});

export const deleteSubCommunityMedia = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid SubCommunity ID is required', 400));
  }

  // Check if sub-community exists
  const existingSubCommunity = await SubCommunitiesModel.getSubCommunityById(parseInt(id));
  if (!existingSubCommunity) {
    return next(new ErrorHandler('SubCommunity not found', 404));
  }

  // Delete file from storage
  if (existingSubCommunity.img) {
    await deleteFile(existingSubCommunity.img);
  }

  const subCommunity = await SubCommunitiesModel.deleteSubCommunityMedia(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'SubCommunity image deleted successfully',
    data: subCommunity
  });
});

// ==================== DELETE ====================
export const deleteSubCommunity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid SubCommunity ID is required', 400));
  }

  // Check if sub-community exists
  const existingSubCommunity = await SubCommunitiesModel.getSubCommunityById(parseInt(id));
  if (!existingSubCommunity) {
    return next(new ErrorHandler('SubCommunity not found', 404));
  }

  // Delete image if exists
  if (existingSubCommunity.img) {
    await deleteFile(existingSubCommunity.img);
  }

  const deletedSubCommunity = await SubCommunitiesModel.deleteSubCommunity(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'SubCommunity deleted successfully',
    data: deletedSubCommunity
  });
});

export const bulkDeleteSubCommunities = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('SubCommunity IDs array is required', 400));
  }

  // Get all sub-communities to delete their images
  for (const id of ids) {
    const subCommunity = await SubCommunitiesModel.getSubCommunityById(parseInt(id));
    if (subCommunity && subCommunity.img) {
      await deleteFile(subCommunity.img);
    }
  }

  const result = await SubCommunitiesModel.bulkDeleteSubCommunities(ids.map(id => parseInt(id)));

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} SubCommunities deleted successfully`,
    data: result
  });
});

// ==================== STATUS ====================
export const updateSubCommunityStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Valid SubCommunity ID is required', 400));
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const subCommunity = await SubCommunitiesModel.updateSubCommunityStatus(parseInt(id), status);

  res.status(200).json({
    success: true,
    message: 'SubCommunity status updated successfully',
    data: subCommunity
  });
});

export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('SubCommunity IDs array is required', 400));
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const subCommunities = await SubCommunitiesModel.bulkUpdateStatus(
    ids.map(id => parseInt(id)),
    status
  );

  res.status(200).json({
    success: true,
    message: `${subCommunities.length} SubCommunities status updated successfully`,
    data: subCommunities
  });
});

export const getSubCommunitiesByStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.params;

  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const subCommunities = await SubCommunitiesModel.getSubCommunitiesByStatus(status);

  res.status(200).json({
    success: true,
    message: 'SubCommunities fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

// ==================== SEARCH & FILTER ====================
export const searchSubCommunities = catchAsyncErrors(async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim() === '') {
    return next(new ErrorHandler('Search query is required', 400));
  }

  const subCommunities = await SubCommunitiesModel.searchSubCommunities(q.trim(), parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const filterSubCommunities = catchAsyncErrors(async (req, res, next) => {
  const { community_id, city_id, country_id, status, top_community, direction } = req.query;

  const filters = {};
  if (community_id) filters.community_id = parseInt(community_id);
  if (city_id) filters.city_id = parseInt(city_id);
  if (country_id) filters.country_id = parseInt(country_id);
  if (status) filters.status = status;
  if (top_community !== undefined) filters.top_community = top_community === 'true';
  if (direction) filters.direction = direction;

  const subCommunities = await SubCommunitiesModel.filterSubCommunities(filters);

  res.status(200).json({
    success: true,
    message: 'SubCommunities filtered successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

// ==================== STATS ====================
export const getSubCommunityStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await SubCommunitiesModel.getSubCommunityStats();

  res.status(200).json({
    success: true,
    message: 'SubCommunity stats fetched successfully',
    data: stats
  });
});

// ==================== UTILITIES ====================
export const getSubCommunitiesForDropdown = catchAsyncErrors(async (req, res, next) => {
  const { community_id } = req.query;

  const subCommunities = await SubCommunitiesModel.getSubCommunitiesForDropdown(
    community_id ? parseInt(community_id) : null
  );

  res.status(200).json({
    success: true,
    message: 'SubCommunities for dropdown fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const getActiveSubCommunities = catchAsyncErrors(async (req, res, next) => {
  const subCommunities = await SubCommunitiesModel.getActiveSubCommunities();

  res.status(200).json({
    success: true,
    message: 'Active SubCommunities fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const getRecentSubCommunities = catchAsyncErrors(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const subCommunities = await SubCommunitiesModel.getRecentSubCommunities(parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Recent SubCommunities fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const getSubCommunityByCoordinates = catchAsyncErrors(async (req, res, next) => {
  const { latitude, longitude, radius = 5 } = req.query;

  if (!latitude || !longitude) {
    return next(new ErrorHandler('Latitude and longitude are required', 400));
  }

  const subCommunities = await SubCommunitiesModel.getSubCommunityByCoordinates(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(radius)
  );

  res.status(200).json({
    success: true,
    message: 'SubCommunities fetched by coordinates successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

export const getSubCommunitiesWithMedia = catchAsyncErrors(async (req, res, next) => {
  const subCommunities = await SubCommunitiesModel.getSubCommunitiesWithMedia();

  res.status(200).json({
    success: true,
    message: 'SubCommunities with media fetched successfully',
    count: subCommunities.length,
    data: subCommunities
  });
});

// ==================== EXPORT DEFAULT ====================
export default {
  initializeSubCommunityTable,
  createSubCommunity,
  getAllSubCommunities,
  getAllSubCommunitiesNoPagination,
  getSubCommunityById,
  getSubCommunityBySlug,
  getSubCommunitiesByCommunity,
  getSubCommunitiesByCity,
  getSubCommunitiesByCountry,
  getSubCommunitiesWithCommunity,
  updateSubCommunity,
  updateSubCommunityMedia,
  deleteSubCommunityMedia,
  deleteSubCommunity,
  bulkDeleteSubCommunities,
  updateSubCommunityStatus,
  bulkUpdateStatus,
  getSubCommunitiesByStatus,
  searchSubCommunities,
  filterSubCommunities,
  getSubCommunityStats,
  getSubCommunitiesForDropdown,
  getActiveSubCommunities,
  getRecentSubCommunities,
  getSubCommunityByCoordinates,
  getSubCommunitiesWithMedia
};