// backend/controllers/properties/properties.controller.js
import path from 'path'; // Not directly used in this version but useful for path manipulation
import * as PropertyModel from '../../models/properties/properties.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_BASE_PATH = 'uploads'; // Must match UPLOAD_BASE_PATH in uploads.js
const ITEMS_PER_PAGE = 20;

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

// Validation constants, might be redundant with propertyValidator.js
const VALID_STATUSES = ['draft', 'pending', 'published', 'unpublished', 'sold', 'rented', 'inactive', 'deleted', 'active'];
const VALID_LISTING_TYPES = ['sale', 'rent', 'lease'];
const VALID_PROPERTY_TYPES = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Duplex', 'Hotel Apartment', 'Commercial', 'Office', 'Shop', 'Warehouse', 'Land', 'Building'];
const VALID_PROPERTY_PURPOSES = ['Sale', 'Rent'];


// ==================== HELPER FUNCTIONS FOR CONTROLLER ====================

/**
 * Converts an absolute file path from Multer to a path relative to the 'uploads' directory.
 * E.g., 'E:\project\backend\uploads\properties\image.jpg' -> 'uploads/properties/image.jpg'
 * Or if Multer already provides 'uploads/properties/image.jpg', it keeps it.
 */
const getRelativeUploadPath = (absolutePath) => {
  if (!absolutePath) return null;
  const normalizedPath = absolutePath.replace(/\\/g, '/');
  const uploadsIndex = normalizedPath.indexOf(UPLOAD_BASE_PATH + '/');
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex);
  }
  return normalizedPath;
};

// Helper to build full URL for images/files from their relative paths
const buildFullUrl = (relativePath) => {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const cleanPath = relativePath.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanPath}`;
};

const generateSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).substring(2, 8); // Add a short hash for better uniqueness
};

const processUploadedFiles = (files) => {
  const result = {
    featured_image_path: null,
    gallery_image_paths: [],
    floor_plan_paths: [],
    document_paths: []
  };

  if (files.featured_image && files.featured_image[0]) {
    result.featured_image_path = getRelativeUploadPath(files.featured_image[0].path);
  }

  if (files.gallery_images) {
    result.gallery_image_paths = files.gallery_images.map(file => getRelativeUploadPath(file.path));
  }

  if (files.floor_plans) {
    result.floor_plan_paths = files.floor_plans.map(file => getRelativeUploadPath(file.path));
  }

  if (files.documents) {
    result.document_paths = files.documents.map(file => getRelativeUploadPath(file.path));
  }

  return result;
};


// ==================== DATA TRANSFORMATION FOR FRONTEND ====================
const preparePropertyForFrontend = (property) => {
  if (!property) return null;

  const transformedProperty = { ...property };

  // Ensure image URLs are full paths for frontend
  transformedProperty.featured_image = buildFullUrl(property.featured_image);
  transformedProperty.thumbnail = buildFullUrl(property.thumbnail); // For list view

  // Gallery images (assuming property.gallery is an array of {id, Url} from model)
  if (property.gallery && Array.isArray(property.gallery)) {
    transformedProperty.gallery = property.gallery.map(img => ({
      ...img,
      Url: buildFullUrl(img.Url)
    }));
  } else {
    transformedProperty.gallery = [];
  }

  // Combine location/address fields for simpler display
  if (!transformedProperty.location) {
    transformedProperty.location = [property.community, property.city].filter(Boolean).join(', ');
  }
  if (!transformedProperty.address) {
    transformedProperty.address = [property.BuildingName, property.StreetName, transformedProperty.location].filter(Boolean).join(', ');
  }

  // Convert status to readable string if needed, or keep as int
  // transformedProperty.status_text = statusMap[property.status] || 'Unknown';

  // Ensure boolean types for frontend
  transformedProperty.featured_property = property.featured_property === '1' || property.featured_property === true;

  // Cleanup redundant fields if they were used for internal linking but not for frontend display
  // delete transformedProperty.city_id;
  // delete transformedProperty.community_id;
  // delete transformedProperty.developer_id;
  // delete transformedProperty.propertyTypeDetails; // If combined into property object

  // Standardize property_slug to 'slug' for consistency with projects
  transformedProperty.slug = transformedProperty.property_slug;
  delete transformedProperty.property_slug;

  return transformedProperty;
};


// ==================== CONTROLLER FUNCTIONS ====================

// @desc    Initialize database tables
// @route   POST /api/v1/properties/init
// @access  Private/Admin
export const initializeTables = catchAsyncErrors(async (req, res, next) => {
  const result = await PropertyModel.createPropertyTables();
  
  res.status(201).json({
    success: true,
    message: result.message,
    timestamp: new Date().toISOString()
  });
});

// @desc    Create a new property
// @route   POST /api/v1/properties
// @access  Private
export const createProperty = catchAsyncErrors(async (req, res, next) => {
  let propertyData;
  let relatedData = {};
  
  if (req.body && req.body.property) {
    propertyData = req.body.property;
    relatedData = req.body.related || {};
  } else if (req.body && Object.keys(req.body).length > 0) {
    propertyData = req.body;
  } else {
    return next(new ErrorHandler('Request body is empty', 400));
  }
  
  // Get user ID from request (assuming user is attached by auth middleware)
  const userId = req.user ? req.user.id : (propertyData.user_id || 1); // Fallback to 1 if no user

  // Process uploaded files and get relative paths
  const uploadedFiles = processUploadedFiles(req.files || {});

  // Prepare propertyData for model
  const finalPropertyData = { ...propertyData };

  // Set property_slug if not provided
  if (!finalPropertyData.property_slug && finalPropertyData.property_name) {
    finalPropertyData.property_slug = generateSlug(finalPropertyData.property_name);
  } else if (!finalPropertyData.property_slug) {
    finalPropertyData.property_slug = generateSlug('untitled-property'); // Fallback
  }

  // Set user_id
  finalPropertyData.user_id = userId;

  // Set featured_image from uploaded path (relative path to uploads folder)
  if (uploadedFiles.featured_image_path) {
    finalPropertyData.featured_image = uploadedFiles.featured_image_path;
  }

  // Handle gallery images
  if (uploadedFiles.gallery_image_paths.length > 0) {
    relatedData.gallery = uploadedFiles.gallery_image_paths.map(url => ({ Url: url }));
  }
  // Add floor plans and documents if needed to relatedData or main body
  if (uploadedFiles.floor_plan_paths.length > 0) {
    finalPropertyData.floor_media_ids = JSON.stringify(uploadedFiles.floor_plan_paths); // Store relative paths as JSON string
  }
  if (uploadedFiles.document_paths.length > 0) {
    finalPropertyData.documents_id = JSON.stringify(uploadedFiles.document_paths); // Store relative paths as JSON string
  }
  
  // Set default status (1 = active) if not provided
  if (!finalPropertyData.status) {
    finalPropertyData.status = 1;
  } else {
    finalPropertyData.status = Number(finalPropertyData.status);
  }

  // Ensure proper data types for numbers
  finalPropertyData.price = Number(finalPropertyData.price) || 0;
  finalPropertyData.area = Number(finalPropertyData.area) || 0;
  finalPropertyData.currency_id = Number(finalPropertyData.currency_id) || 1;
  finalPropertyData.developer_id = Number(finalPropertyData.developer_id) || 1;
  finalPropertyData.city_id = Number(finalPropertyData.city_id) || 1;
  finalPropertyData.community_id = Number(finalPropertyData.community_id) || 1;
  finalPropertyData.sub_community_id = Number(finalPropertyData.sub_community_id) || 1;
  finalPropertyData.bedroom = String(finalPropertyData.bedroom || '0'); // Ensure string for DB
  finalPropertyData.bathrooms = Number(finalPropertyData.bathrooms) || 0;


  // Set default values for other fields if not provided
  const defaults = {
    listing_type: 'sale',
    property_type: 'Apartment',
    property_purpose: 'Sale',
    description: '',
    address: '',
    location: '',
    featured_property: '0'
  };
  Object.keys(defaults).forEach(key => {
    if (finalPropertyData[key] === undefined || finalPropertyData[key] === null) {
      finalPropertyData[key] = defaults[key];
    }
  });

  // Build location string if not explicitly set
  if (!finalPropertyData.location && (propertyData.city || propertyData.community)) {
    finalPropertyData.location = [propertyData.city, propertyData.community].filter(Boolean).join(', ');
  }


  try {
    const result = await PropertyModel.createProperty(finalPropertyData, relatedData);

    res.status(201).json({
      success: true,
      message: result.message || 'Property created successfully',
      data: preparePropertyForFrontend(result.data),
      propertyId: result.propertyId,
      relatedIds: result.relatedIds
    });
  } catch (error) {
    // console.error("Database error during createProperty:", error); // Keep error logging
    if (error.message.includes('already exists')) {
      return next(new ErrorHandler('Property with this slug already exists', 409));
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message.includes('foreign key constraint fails')) {
      return next(new ErrorHandler('Invalid reference ID (e.g., user, city, community, developer)', 400));
    }
    return next(new ErrorHandler(error.message || 'Failed to create property', 500));
  }
});

// @desc    Get all properties with filters
// @route   GET /api/v1/properties
// @access  Public
export const getAllProperties = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = ITEMS_PER_PAGE,
    status = 1, // Default to active properties
  } = req.query;

  const filters = {};

  // Build filters from req.query
  for (const key of Object.keys(req.query)) {
    if (key !== 'page' && key !== 'limit') {
      filters[key] = req.query[key];
    }
  }
  
  // Explicitly handle status mapping if passed as string
  if (filters.status !== undefined) {
    if (typeof filters.status === 'string' && isNaN(filters.status)) {
      const statusMap = {
        'active': 1, 'published': 1, 'inactive': 0, 'unpublished': 0, 'deleted': 0,
        'draft': 2, 'pending': 2, 'sold': 0, 'rented': 0
      };
      filters.status = statusMap[filters.status.toLowerCase()];
      if (filters.status === undefined) { // If not mapped, fall back to default active
        filters.status = 1;
      }
    } else {
      filters.status = parseInt(filters.status); // Ensure numeric
    }
  } else {
    filters.status = 1; // Default to 1 (active) if not provided
  }

  // Convert boolean-like strings
  if (filters.featured_only) filters.featured_only = filters.featured_only === 'true';

  try {
    const result = await PropertyModel.getAllProperties(filters, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      message: result.message || 'Properties fetched successfully',
      listings: result.data.map(preparePropertyForFrontend), // Use listings for consistency
      pagination: result.pagination,
      filters: result.filters,
      total: result.pagination ? result.pagination.total : result.data.length
    });
  } catch (error) {
    // console.error("Error in getAllProperties controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch properties', 500));
  }
});

// @desc    Get property by ID
// @route   GET /api/v1/properties/:id
// @access  Public
export const getPropertyById = catchAsyncErrors(async (req, res, next) => {
  const propertyId = parseInt(req.params.id);

  if (isNaN(propertyId) || propertyId <= 0) {
    return next(new ErrorHandler('Invalid property ID', 400));
  }

  try {
    const result = await PropertyModel.getPropertyById(propertyId);

    if (!result.success) {
      return next(new ErrorHandler(result.message, 404));
    }

    res.status(200).json({
      success: true,
      message: result.message || 'Property found',
      data: preparePropertyForFrontend(result.data)
    });
  } catch (error) {
    // console.error("Error in getPropertyById controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch property', 500));
  }
});

// @desc    Get property by slug
// @route   GET /api/v1/properties/slug/:slug
// @access  Public
export const getPropertyBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  if (!slug) {
    return next(new ErrorHandler('Property slug is required', 400));
  }

  try {
    const result = await PropertyModel.getPropertyBySlug(slug);

    if (!result.success) {
      return next(new ErrorHandler(result.message, 404));
    }

    res.status(200).json({
      success: true,
      message: result.message || 'Property found',
      data: preparePropertyForFrontend(result.data)
    });
  } catch (error) {
    // console.error("Error in getPropertyBySlug controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch property by slug', 500));
  }
});

// @desc    Update property
// @route   PUT /api/v1/properties/:id
// @access  Private
export const updateProperty = catchAsyncErrors(async (req, res, next) => {
  const propertyId = parseInt(req.params.id);
  
  if (isNaN(propertyId) || propertyId <= 0) {
    return next(new ErrorHandler('Invalid property ID', 400));
  }

  let updateData;
  let relatedUpdates = {};
  
  if (req.body && req.body.property) {
    updateData = req.body.property;
    relatedUpdates = req.body.related || {};
  } else if (req.body && Object.keys(req.body).length > 0) {
    updateData = req.body;
  } else {
    return next(new ErrorHandler('Update data is required', 400));
  }

  // Process uploaded files and get relative paths
  const uploadedFiles = processUploadedFiles(req.files || {});

  // Set featured_image from uploaded path (relative path to uploads folder)
  if (uploadedFiles.featured_image_path) {
    updateData.featured_image = uploadedFiles.featured_image_path;
  }

  // Handle gallery images
  if (uploadedFiles.gallery_image_paths.length > 0) {
    relatedUpdates.gallery = uploadedFiles.gallery_image_paths.map(url => ({ Url: url }));
  }
  // Add floor plans and documents if needed
  if (uploadedFiles.floor_plan_paths.length > 0) {
    updateData.floor_media_ids = JSON.stringify(uploadedFiles.floor_plan_paths);
  }
  if (uploadedFiles.document_paths.length > 0) {
    updateData.documents_id = JSON.stringify(uploadedFiles.document_paths);
  }

  // Add updated_by user if available
  if (req.user && !updateData.modify_by_admin) {
    updateData.modify_by_admin = req.user.id;
  }

  // Ensure proper data types
  if (updateData.price) updateData.price = Number(updateData.price);
  if (updateData.area) updateData.area = Number(updateData.area);
  if (updateData.status) updateData.status = Number(updateData.status);
  if (updateData.bedroom) updateData.bedroom = String(updateData.bedroom);
  if (updateData.bathrooms) updateData.bathrooms = Number(updateData.bathrooms);
  if (updateData.developer_id) updateData.developer_id = Number(updateData.developer_id);
  if (updateData.city_id) updateData.city_id = Number(updateData.city_id);
  if (updateData.community_id) updateData.community_id = Number(updateData.community_id);

  try {
    const result = await PropertyModel.updateProperty(propertyId, updateData, relatedUpdates);

    res.status(200).json({
      success: true,
      message: result.message || 'Property updated successfully',
      data: preparePropertyForFrontend(result.data),
      propertyId: result.propertyId,
      updatedFields: {
        main: result.mainUpdated,
        related: result.relatedUpdated
      }
    });
  } catch (error) {
    // console.error("Error in updateProperty controller:", error);
    if (error.message.includes('not found')) {
      return next(new ErrorHandler(error.message, 404));
    }
    if (error.message.includes('already exists')) {
      return next(new ErrorHandler(error.message, 409));
    }
    return next(new ErrorHandler(error.message || 'Failed to update property', 500));
  }
});

// @desc    Delete property
// @route   DELETE /api/v1/properties/:id
// @access  Private/Admin
export const deleteProperty = catchAsyncErrors(async (req, res, next) => {
  const propertyId = parseInt(req.params.id);
  const hardDelete = req.query.hard === 'true';

  if (isNaN(propertyId) || propertyId <= 0) {
    return next(new ErrorHandler('Invalid property ID', 400));
  }

  try {
    const result = await PropertyModel.deleteProperty(propertyId, hardDelete);

    res.status(200).json({
      success: true,
      message: result.message || 'Property deleted successfully',
      propertyId: result.propertyId,
      propertyName: result.propertyName,
      deleteType: result.deleteType,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    // console.error("Error in deleteProperty controller:", error);
    if (error.message.includes('not found')) {
      return next(new ErrorHandler(error.message, 404));
    }
    return next(new ErrorHandler(error.message || 'Failed to delete property', 500));
  }
});

// @desc    Search properties
// @route   GET /api/v1/properties/search
// @access  Public
export const searchProperties = catchAsyncErrors(async (req, res, next) => {
  const searchCriteria = {};

  // Build searchCriteria from req.query
  for (const key of Object.keys(req.query)) {
    searchCriteria[key] = req.query[key];
  }
  
  // Explicitly handle status mapping if passed as string
  if (searchCriteria.status !== undefined) {
    if (typeof searchCriteria.status === 'string' && isNaN(searchCriteria.status)) {
      const statusMap = {
        'active': 1, 'published': 1, 'inactive': 0, 'unpublished': 0, 'deleted': 0,
        'draft': 2, 'pending': 2, 'sold': 0, 'rented': 0
      };
      searchCriteria.status = statusMap[searchCriteria.status.toLowerCase()];
      if (searchCriteria.status === undefined) {
        searchCriteria.status = 1;
      }
    } else {
      searchCriteria.status = parseInt(searchCriteria.status);
    }
  } else {
    searchCriteria.status = 1; // Default to active
  }

  // Convert boolean-like strings
  if (searchCriteria.featured_only) searchCriteria.featured_only = searchCriteria.featured_only === 'true';

  // Ensure numeric types for min/max
  if (searchCriteria.min_price) searchCriteria.min_price = parseFloat(searchCriteria.min_price);
  if (searchCriteria.max_price) searchCriteria.max_price = parseFloat(searchCriteria.max_price);
  if (searchCriteria.min_area) searchCriteria.min_area = parseFloat(searchCriteria.min_area);
  if (searchCriteria.max_area) searchCriteria.max_area = parseFloat(searchCriteria.max_area);
  if (searchCriteria.limit) searchCriteria.limit = parseInt(searchCriteria.limit);
  if (searchCriteria.offset) searchCriteria.offset = parseInt(searchCriteria.offset);


  try {
    const result = await PropertyModel.searchProperties(searchCriteria);

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      listings: result.data.map(preparePropertyForFrontend), // Use listings for consistency
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      searchCriteria: result.searchCriteria
    });
  } catch (error) {
    // console.error("Error in searchProperties controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to search properties', 500));
  }
});

// @desc    Get property statistics
// @route   GET /api/v1/properties/statistics
// @access  Private/Admin
export const getPropertyStatistics = catchAsyncErrors(async (req, res, next) => {
  const filters = {};

  for (const key of Object.keys(req.query)) {
    filters[key] = req.query[key];
  }

  // Convert numeric filters
  if (filters.user_id) filters.user_id = parseInt(filters.user_id);
  if (filters.city_id) filters.city_id = parseInt(filters.city_id);

  try {
    const result = await PropertyModel.getPropertyStatistics(filters);

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      ...result // model already returns { success, data }
    });
  } catch (error) {
    // console.error("Error in getPropertyStatistics controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch property statistics', 500));
  }
});

// @desc    Get featured properties
// @route   GET /api/v1/properties/featured
// @access  Public
export const getFeaturedProperties = catchAsyncErrors(async (req, res, next) => {
  const { limit = 10 } = req.query;

  try {
    // Using getAllProperties with featured_only filter
    const result = await PropertyModel.getAllProperties(
      { featured_only: true, status: 1 }, // Always active
      1, // page
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Featured properties retrieved successfully',
      listings: result.data.map(preparePropertyForFrontend),
      pagination: {
        currentPage: result.pagination.page,
        limit: result.pagination.limit,
        totalItems: result.pagination.total,
        totalPages: result.pagination.totalPages,
      }
    });
  } catch (error) {
    // console.error("Error in getFeaturedProperties controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch featured properties', 500));
  }
});

// @desc    Get similar properties
// @route   GET /api/v1/properties/:id/similar
// @access  Public
export const getSimilarProperties = catchAsyncErrors(async (req, res, next) => {
  const propertyId = parseInt(req.params.id);
  const { limit = 6 } = req.query;

  if (isNaN(propertyId) || propertyId <= 0) {
    return next(new ErrorHandler('Invalid property ID', 400));
  }

  try {
    // First get the target property
    const targetPropertyResult = await PropertyModel.getPropertyById(propertyId);
    
    if (!targetPropertyResult.success || !targetPropertyResult.data) {
      return next(new ErrorHandler(targetPropertyResult.message || 'Target property not found', 404));
    }

    const target = targetPropertyResult.data;
    
    // Search for similar properties
    const searchCriteria = {
      city_id: target.city_id, // Use city_id for better accuracy
      property_type: target.property_type,
      bedroom: target.bedroom,
      limit: parseInt(limit),
      status: 1 // Only active similar properties
    };

    const result = await PropertyModel.searchProperties(searchCriteria);

    // Filter out the target property from results
    const similarProperties = result.data.filter(property => property.id !== propertyId);

    res.status(200).json({
      success: true,
      message: 'Similar properties retrieved successfully',
      listings: similarProperties.map(preparePropertyForFrontend),
      targetProperty: { // Keep a simplified target for client-side context
        id: target.id,
        property_name: target.property_name,
        property_type: target.property_type,
        city: target.city,
        bedroom: target.bedroom
      },
      total: similarProperties.length
    });
  } catch (error) {
    // console.error("Error in getSimilarProperties controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch similar properties', 500));
  }
});

// @desc    Save property for user
// @route   POST /api/v1/properties/:id/save
// @access  Private
export const saveProperty = catchAsyncErrors(async (req, res, next) => {
  const propertyId = parseInt(req.params.id);
  const userId = req.user?.id;
  const { type = 'favorite' } = req.body;

  if (isNaN(propertyId) || propertyId <= 0) {
    return next(new ErrorHandler('Invalid property ID', 400));
  }

  if (!userId) {
    return next(new ErrorHandler('User authentication required', 401));
  }

  // Check if property exists
  const propertyCheck = await PropertyModel.getPropertyById(propertyId);
  if (!propertyCheck.success) {
    return next(new ErrorHandler(propertyCheck.message, 404));
  }

  try {
    const result = await PropertyModel.savePropertyForUser(userId, propertyId, type);

    res.status(200).json({
      success: true,
      message: result.message || 'Property saved successfully',
      savedId: result.savedId,
      action: result.action,
      propertyId,
      userId
    });
  } catch (error) {
    // console.error("Error in saveProperty controller:", error);
    if (error.message.includes('already saved')) {
      return next(new ErrorHandler(error.message, 409));
    }
    return next(new ErrorHandler(error.message || 'Failed to save property', 500));
  }
});

// @desc    Remove saved property
// @route   DELETE /api/v1/properties/:id/save
// @access  Private
export const removeSavedProperty = catchAsyncErrors(async (req, res, next) => {
  const propertyId = parseInt(req.params.id);
  const userId = req.user?.id;

  if (isNaN(propertyId) || propertyId <= 0) {
    return next(new ErrorHandler('Invalid property ID', 400));
  }

  if (!userId) {
    return next(new ErrorHandler('User authentication required', 401));
  }

  try {
    const result = await PropertyModel.removeSavedProperty(userId, propertyId);

    res.status(200).json({
      success: true,
      message: result.message || 'Property removed from saved list',
      propertyId,
      userId
    });
  } catch (error) {
    // console.error("Error in removeSavedProperty controller:", error);
    if (error.message.includes('not found')) {
      return next(new ErrorHandler(error.message, 404));
    }
    return next(new ErrorHandler(error.message || 'Failed to remove saved property', 500));
  }
});

// @desc    Get saved properties for user
// @route   GET /api/v1/properties/saved
// @access  Private
export const getSavedProperties = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user?.id;
  const { type, page = 1, limit = ITEMS_PER_PAGE } = req.query;

  if (!userId) {
    return next(new ErrorHandler('User authentication required', 401));
  }

  try {
    const result = await PropertyModel.getSavedPropertiesForUser(userId, type);

    // Apply pagination manually since the model doesn't support it directly
    const paginatedData = result.data.slice(
      (parseInt(page) - 1) * parseInt(limit),
      parseInt(page) * parseInt(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Saved properties retrieved successfully',
      listings: paginatedData.map(preparePropertyForFrontend), // Use listings for consistency
      total: result.data.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.data.length / parseInt(limit)),
      userId
    });
  } catch (error) {
    // console.error("Error in getSavedProperties controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch saved properties', 500));
  }
});

// @desc    Create property type
// @route   POST /api/v1/properties/types
// @access  Private/Admin
export const createPropertyType = catchAsyncErrors(async (req, res, next) => {
  const { types, slug, property_for, heading, descriptions, imageurl } = req.body;

  if (!types || !slug) {
    return next(new ErrorHandler('Type name and slug are required', 400));
  }

  const typeData = {
    types,
    slug,
    property_for,
    heading,
    descriptions,
    imageurl,
    status: 1
  };

  try {
    const result = await PropertyModel.createPropertyType(typeData);

    res.status(201).json({
      success: true,
      message: result.message || 'Property type created successfully',
      data: result.data,
      typeId: result.typeId
    });
  } catch (error) {
    // console.error("Error in createPropertyType controller:", error);
    if (error.message.includes('already exists')) {
      return next(new ErrorHandler(error.message, 409));
    }
    return next(new ErrorHandler(error.message || 'Failed to create property type', 500));
  }
});

// @desc    Get all property types
// @route   GET /api/v1/properties/types
// @access  Public
export const getPropertyTypes = catchAsyncErrors(async (req, res, next) => {
  const { active_only = 'true' } = req.query;

  try {
    const result = await PropertyModel.getAllPropertyTypes(active_only === 'true');

    res.status(200).json({
      success: true,
      data: result.data,
      count: result.count
    });
  } catch (error) {
    // console.error("Error in getPropertyTypes controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch property types', 500));
  }
});

// @desc    Add images to property gallery
// @route   POST /api/v1/properties/:id/gallery
// @access  Private
export const addGalleryImages = catchAsyncErrors(async (req, res, next) => {
  const propertyId = parseInt(req.params.id);
  const addedBy = req.user?.id || 1; // Fallback to 1 if no user

  if (isNaN(propertyId) || propertyId <= 0) {
    return next(new ErrorHandler('Invalid property ID', 400));
  }

  // Get image paths from Multer (assuming array('images') was used, or single 'image')
  const uploadedFiles = processUploadedFiles(req.files || (req.file ? { image: [req.file] } : {}));
  const images = uploadedFiles.gallery_image_paths || (uploadedFiles.featured_image_path ? [uploadedFiles.featured_image_path] : []); // Adapt to single or array

  if (images.length === 0) {
    return next(new ErrorHandler('No images provided for gallery upload', 400));
  }
  
  // Check if property exists
  const propertyCheck = await PropertyModel.getPropertyById(propertyId);
  if (!propertyCheck.success) {
    return next(new ErrorHandler(propertyCheck.message, 404));
  }

  try {
    const result = await PropertyModel.addPropertyGalleryImages(propertyId, images, addedBy);

    res.status(201).json({
      success: true,
      message: result.message || 'Images added to gallery successfully',
      insertedIds: result.insertedIds,
      propertyId,
      imagesCount: images.length
    });
  } catch (error) {
    // console.error("Error in addGalleryImages controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to add gallery images', 500));
  }
});

// @desc    Remove image from gallery
// @route   DELETE /api/v1/properties/gallery/:imageId
// @access  Private
export const removeGalleryImage = catchAsyncErrors(async (req, res, next) => {
  const imageId = parseInt(req.params.imageId);

  if (isNaN(imageId) || imageId <= 0) {
    return next(new ErrorHandler('Invalid image ID', 400));
  }

  try {
    const result = await PropertyModel.removeGalleryImage(imageId);

    res.status(200).json({
      success: true,
      message: result.message || 'Gallery image removed successfully',
      imageId
    });
  } catch (error) {
    // console.error("Error in removeGalleryImage controller:", error);
    if (error.message.includes('not found')) {
      return next(new ErrorHandler(error.message, 404));
    }
    return next(new ErrorHandler(error.message || 'Failed to remove gallery image', 500));
  }
});

// @desc    Bulk update property status
// @route   PUT /api/v1/properties/bulk/status
// @access  Private/Admin
export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { propertyIds, status } = req.body;

  if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
    return next(new ErrorHandler('Property IDs array is required', 400));
  }

  if (status === undefined || isNaN(status) || (Number(status) !== 0 && Number(status) !== 1 && Number(status) !== 2)) {
    return next(new ErrorHandler('Valid status (0, 1, or 2) is required', 400));
  }

  const invalidIds = propertyIds.filter(id => isNaN(parseInt(id)) || parseInt(id) <= 0);
  if (invalidIds.length > 0) {
    return next(new ErrorHandler(`Invalid property IDs: ${invalidIds.join(', ')}`, 400));
  }

  try {
    const result = await PropertyModel.bulkUpdatePropertyStatus(propertyIds.map(id => parseInt(id)), parseInt(status));

    res.status(200).json({
      success: true,
      message: result.message || 'Properties status updated successfully',
      affectedRows: result.affectedRows,
      propertyIds: result.propertyIds
    });
  } catch (error) {
    // console.error("Error in bulkUpdateStatus controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to bulk update property status', 500));
  }
});

// @desc    Bulk delete properties
// @route   DELETE /api/v1/properties/bulk
// @access  Private/Admin
export const bulkDeleteProperties = catchAsyncErrors(async (req, res, next) => {
  const { propertyIds } = req.body;
  const hardDelete = req.query.hard === 'true';

  if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
    return next(new ErrorHandler('Property IDs array is required', 400));
  }

  const invalidIds = propertyIds.filter(id => isNaN(parseInt(id)) || parseInt(id) <= 0);
  if (invalidIds.length > 0) {
    return next(new ErrorHandler(`Invalid property IDs: ${invalidIds.join(', ')}`, 400));
  }

  try {
    const result = await PropertyModel.bulkDeleteProperties(
      propertyIds.map(id => parseInt(id)), 
      hardDelete
    );

    res.status(200).json({
      success: true,
      message: result.message || 'Properties deleted successfully',
      affectedRows: result.affectedRows,
      propertyIds: result.propertyIds,
      deleteType: result.deleteType
    });
  } catch (error) {
    // console.error("Error in bulkDeleteProperties controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to bulk delete properties', 500));
  }
});

// @desc    Export properties data
// @route   GET /api/v1/properties/export
// @access  Private/Admin
export const exportProperties = catchAsyncErrors(async (req, res, next) => {
  const { format = 'json', include_related = 'false', limit = 1000 } = req.query; // Added limit for safety
  
  try {
    const result = await PropertyModel.getAllProperties({}, 1, parseInt(limit));

    let exportData;
    
    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Type', 'Purpose', 'Price', 'Area', 'Bedrooms', 'Location', 'Status', 'Featured Image URL', 'Created At'];
      const csvRows = [
        headers.join(','),
        ...result.data.map(property => [
          property.id,
          `"${property.property_name.replace(/"/g, '""')}"`,
          property.property_type,
          property.property_purpose,
          property.price,
          property.area,
          property.bedroom,
          `"${property.location?.replace(/"/g, '""') || ''}"`,
          property.status,
          buildFullUrl(property.featured_image) || '', // Ensure full URL for CSV
          property.created_at
        ].join(','))
      ];
      
      exportData = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=properties.csv');
      res.send(exportData);
    } else {
      // Default to JSON
      let dataToExport = result.data.map(preparePropertyForFrontend); // Transform for consistency
      
      if (include_related === 'true') {
        dataToExport = await Promise.all(
          result.data.map(async (property) => {
            const detailed = await PropertyModel.getPropertyById(property.id);
            return detailed.success ? preparePropertyForFrontend(detailed.data) : preparePropertyForFrontend(property);
          })
        );
      }
      
      res.status(200).json({
        success: true,
        message: 'Properties exported successfully',
        exported_at: new Date().toISOString(),
        total: result.pagination ? result.pagination.total : dataToExport.length,
        data: dataToExport
      });
    }
  } catch (error) {
    // console.error("Error in exportProperties controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to export properties', 500));
  }
});

// @desc    Get property dashboard data
// @route   GET /api/v1/properties/dashboard
// @access  Private/Admin
export const getDashboardData = catchAsyncErrors(async (req, res, next) => {
  try {
    const statsResult = await PropertyModel.getPropertyStatistics({});
    const recentPropertiesResult = await PropertyModel.getAllProperties({}, 1, 10);
    const propertyTypesResult = await PropertyModel.getAllPropertyTypes(true); // Active only

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        statistics: statsResult.data,
        recentProperties: recentPropertiesResult.data.map(preparePropertyForFrontend),
        propertyTypes: propertyTypesResult.data,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    // console.error("Error in getDashboardData controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to fetch dashboard data', 500));
  }
});

// @desc    Health check endpoint
// @route   GET /api/v1/properties/health
// @access  Public
export const healthCheck = catchAsyncErrors(async (req, res, next) => {
  try {
    // You could also try a simple DB query here to check DB health
    await PropertyModel.getAllPropertyTypes(true); // Example light DB check
    res.status(200).json({
      success: true,
      message: 'Property service is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // console.error("Error in healthCheck controller:", error);
    res.status(500).json({ // Changed to 500 if check fails
      success: false,
      message: 'Property service health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @desc    Simple create property endpoint (for testing)
// @route   POST /api/v1/properties/simple
// @access  Private
export const simpleCreateProperty = catchAsyncErrors(async (req, res, next) => {
  const propertyData = req.body;

  // Manual validation
  if (!propertyData.property_name) return next(new ErrorHandler('Property name is required', 400));
  if (!propertyData.price) return next(new ErrorHandler('Price is required', 400));
  if (!propertyData.bedroom) return next(new ErrorHandler('Bedrooms is required', 400));
  if (!propertyData.city) return next(new ErrorHandler('City is required', 400));
  if (!propertyData.community) return next(new ErrorHandler('Community is required', 400));

  const finalData = {
    ...propertyData,
    property_slug: propertyData.property_slug || generateSlug(propertyData.property_name),
    listing_type: propertyData.listing_type || 'sale',
    property_type: propertyData.property_type || 'Apartment',
    property_purpose: propertyData.property_purpose || 'Sale',
    status: propertyData.status || 1,
    user_id: req.user ? req.user.id : (propertyData.user_id || 1),
    developer_id: propertyData.developer_id || 1,
    currency_id: propertyData.currency_id || 1,
    city_id: propertyData.city_id || 1,
    community_id: propertyData.community_id || 1,
    price: Number(propertyData.price),
    area: propertyData.area ? Number(propertyData.area) : 0,
    bedroom: String(propertyData.bedroom)
  };

  try {
    const result = await PropertyModel.createProperty(finalData, {});

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: preparePropertyForFrontend(result.data),
      propertyId: result.propertyId
    });
  } catch (error) {
    // console.error("Error in simpleCreateProperty controller:", error);
    if (error.message.includes('already exists')) {
      return next(new ErrorHandler(error.message, 409));
    }
    return next(new ErrorHandler(error.message || 'Failed to create property', 500));
  }
});