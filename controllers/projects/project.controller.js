// backend/controllers/projects/project.controller.js
import path from 'path';
import * as ProjectModel from '../../models/projects/project.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_BASE_PATH = 'uploads'; // Must match UPLOAD_BASE_PATH in uploads.js
const ITEMS_PER_PAGE = 20;

// Access API_URL from environment variable (ensure it's available in Node.js env)
const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

// ==================== HELPER FUNCTIONS FOR CONTROLLER ====================

/**
 * Converts an absolute file path from Multer to a path relative to the 'uploads' directory.
 * E.g., 'E:\project\backend\uploads\projects\image.jpg' -> 'uploads/projects/image.jpg'
 * Or if Multer already provides 'uploads/projects/image.jpg', it keeps it.
 */
const getRelativeUploadPath = (absolutePath) => {
  if (!absolutePath) return null;
  // Normalize path separators to '/' for consistency
  const normalizedPath = absolutePath.replace(/\\/g, '/');
  // Find the index of the UPLOAD_BASE_PATH segment
  const uploadsIndex = normalizedPath.indexOf(UPLOAD_BASE_PATH + '/');
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex); // Return path from 'uploads/' onwards
  }
  return normalizedPath; // Fallback, assume it's already relative or remote
};

// Helper to build full URL for images/files from their relative paths
const buildFullUrl = (relativePath) => {
  if (!relativePath) return null;
  // If it's already a full URL (e.g., from an external service), return as is
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  // Remove leading slash if any, then construct full URL
  const cleanPath = relativePath.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanPath}`;
};

const generateSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    // Add a short hash or timestamp for better uniqueness without relying on DB check for initial generation
    + '-' + Math.random().toString(36).substring(2, 8); 
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
// This function prepares project data for consistent frontend consumption
const prepareProjectForFrontend = (project) => {
  if (!project) return null;

  // Clone to avoid modifying original model data
  const transformedProject = { ...project };

  // Ensure main image URL is a full path for frontend
  transformedProject.featured_image = buildFullUrl(project.featured_image);
  
  // Combine latitude/longitude from main table or specs
  transformedProject.latitude = project.latitude || project.latitude_specs || null;
  transformedProject.longitude = project.longitude || project.longitude_specs || null;
  
  // Transform gallery images to full URLs
  if (project.gallery && Array.isArray(project.gallery)) {
    transformedProject.images = project.gallery.map(img => buildFullUrl(img.Url || img)); // Assuming img is { Url: 'path' } or just 'path'
  } else {
    transformedProject.images = [];
  }

  // Set developer name from main table or specs
  transformedProject.developerName = project.DeveloperName || project.developer_name_specs || '';

  // Add a simple slug if not present, useful for frontend routing
  if (!transformedProject.project_slug && transformedProject.id) {
    transformedProject.slug = String(transformedProject.id); // Fallback slug if actual slug is missing
  } else if (transformedProject.project_slug) {
     transformedProject.slug = transformedProject.project_slug;
  } else {
    transformedProject.slug = '';
  }

  // Map bedroom field from VARCHAR to int ranges if available
  // You might need to parse `project.bedroom` here if it's a single value like "2 BHK"
  // For now, assuming you have `bedrooms_from` and `bedrooms_to` or similar direct fields
  transformedProject.bedroomsFrom = Number(project.bedroom?.split('-')[0].trim()) || 0; // Example parsing "2 - 3"
  transformedProject.bedroomsTo = Number(project.bedroom?.split('-')[1]?.trim()) || transformedProject.bedroomsFrom || 0;

  // Cleanup redundant fields that were used for transformation
  delete transformedProject.developer_name_specs;
  delete transformedProject.latitude_specs;
  delete transformedProject.longitude_specs;
  delete transformedProject.gallery; // Remove raw gallery data as we put it into `images`
  delete transformedProject.thumbnail; // Use featured_image or first in images array in frontend
  
  // Convert featured_project (VARCHAR '0'/'1') to boolean
  transformedProject.featured = project.featured_project === '1';

  // Extract handover date (assuming completion_date is the handover date)
  transformedProject.handoverDate = project.completion_date || ''; // Format this in frontend if needed

  return transformedProject;
};


// ==================== TABLE INITIALIZATION ====================
export const initializeTables = catchAsyncErrors(async (req, res, next) => {
  const result = await ProjectModel.createProjectTables();
  
  res.status(200).json({
    success: true,
    message: result.message
  });
});

// ==================== CREATE PROJECT ====================
export const createProject = catchAsyncErrors(async (req, res, next) => {
  const uploadedFiles = processUploadedFiles(req.files || {});
  
  // Auto-generate slug if not provided, or ensure it's valid
  if (!req.body.project_slug && req.body.ProjectName) {
    req.body.project_slug = generateSlug(req.body.ProjectName);
  } else if (!req.body.project_slug) { // Fallback if no project name
    req.body.project_slug = generateSlug('untitled-project');
  }

  // Set user_id from authenticated user
  req.body.user_id = req.user.id; // Assumes req.user is set by auth middleware

  // Set featured_image from uploaded path (relative path to uploads folder)
  if (uploadedFiles.featured_image_path) {
    req.body.featured_image = uploadedFiles.featured_image_path;
  }

  // Prepare gallery images for related insert
  const relatedData = {};
  
  if (uploadedFiles.gallery_image_paths.length > 0) {
    relatedData.gallery = uploadedFiles.gallery_image_paths.map(url => ({ Url: url }));
  }
  // Add floor plans and documents if needed to relatedData or main body
  if (uploadedFiles.floor_plan_paths.length > 0) {
    req.body.floor_plans = JSON.stringify(uploadedFiles.floor_plan_paths); // Store relative paths as JSON string
  }
  if (uploadedFiles.document_paths.length > 0) {
    req.body.documents = JSON.stringify(uploadedFiles.document_paths); // Store relative paths as JSON string
  }

  // Prepare specs if provided
  if (req.body.specs) {
    try {
      relatedData.specs = typeof req.body.specs === 'string' 
        ? JSON.parse(req.body.specs) 
        : req.body.specs;
    } catch (e) {
      return next(new ErrorHandler('Invalid specs data format. Must be valid JSON.', 400));
    }
  }

  const result = await ProjectModel.createProject(req.body, relatedData);

  res.status(201).json({
    success: true,
    message: result.message,
    data: prepareProjectForFrontend(result.data), // Prepare for frontend
    projectId: result.projectId
  });
});

// ==================== GET ALL PROJECTS ====================
export const getAllProjects = catchAsyncErrors(async (req, res, next) => {
  const filters = {
    status: req.query.status ? parseInt(req.query.status) : undefined, // Allow frontend to filter by status
    city_id: req.query.city_id,
    state_id: req.query.state_id,
    community_id: req.query.community_id,
    sub_community_id: req.query.sub_community_id,
    developer_id: req.query.developer_id,
    listing_type: req.query.listing_type,
    property_type: req.query.property_type,
    min_price: req.query.min_price,
    max_price: req.query.max_price,
    bedroom: req.query.bedroom,
    featured_only: req.query.featured_only === 'true', // Convert to boolean
    verified_only: req.query.verified_only === 'true',
    search: req.query.search,
    user_id: req.query.user_id,
    sort_by: req.query.sort_by || req.query.orderBy || 'newest', // Default to 'newest'
    sort_order: req.query.sort_order || req.query.order || 'desc',
    include_inactive: req.query.include_inactive === 'true' // For admin view
  };

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || ITEMS_PER_PAGE
  };

  const result = await ProjectModel.getAllProjects(filters, pagination);

  // Transform each project for frontend consumption
  const listings = result.data.map(prepareProjectForFrontend);

  res.status(200).json({
    success: true,
    message: result.message || "Projects fetched successfully",
    listings: listings, // Changed to 'listings' for frontend consistency
    pagination: {
      currentPage: result.pagination.page,
      limit: result.pagination.limit,
      totalItems: result.pagination.total,
      totalPages: result.pagination.totalPages,
    },
    filters: filters // Return applied filters for client-side reference
  });
});

// ==================== GET PROJECT BY ID ====================
export const getProjectById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid project ID provided', 400));
  }

  const result = await ProjectModel.getProjectById(id);

  if (!result.success || !result.data) {
    return next(new ErrorHandler(result.message || 'Project not found', 404));
  }

  res.status(200).json({
    success: true,
    message: result.message || 'Project fetched successfully',
    data: prepareProjectForFrontend(result.data) // Prepare for frontend
  });
});

// ==================== GET PROJECT BY SLUG ====================
export const getProjectBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  if (!slug) {
    return next(new ErrorHandler('Project slug is required', 400));
  }

  const result = await ProjectModel.getProjectBySlug(slug);

  if (!result.success || !result.data) {
    return next(new ErrorHandler(result.message || 'Project not found', 404));
  }

  res.status(200).json({
    success: true,
    message: result.message || 'Project fetched successfully',
    data: prepareProjectForFrontend(result.data) // Prepare for frontend
  });
});

// ==================== UPDATE PROJECT ====================
export const updateProject = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid project ID for update', 400));
  }

  const uploadedFiles = processUploadedFiles(req.files || {});
  const updateData = { ...req.body };

  // Update featured_image if new one uploaded (relative path to uploads folder)
  if (uploadedFiles.featured_image_path) {
    updateData.featured_image = uploadedFiles.featured_image_path;
  }
   // Update floor plans and documents if new ones uploaded (relative paths)
  if (uploadedFiles.floor_plan_paths.length > 0) {
    updateData.floor_plans = JSON.stringify(uploadedFiles.floor_plan_paths);
  }
  if (uploadedFiles.document_paths.length > 0) {
    updateData.documents = JSON.stringify(uploadedFiles.document_paths);
  }

  // Prepare related updates
  const relatedUpdates = {};

  // Add new gallery images if uploaded (assuming these are appended or managed separately)
  if (uploadedFiles.gallery_image_paths.length > 0) {
    relatedUpdates.gallery = uploadedFiles.gallery_image_paths.map(url => ({ Url: url }));
  }
  // Handle explicit gallery clear if sent as `gallery: null`
  if (req.body.gallery_clear === 'true') {
    relatedUpdates.gallery = []; // Send empty array to model to clear existing
  }

  // Update specs if provided
  if (req.body.specs) {
    try {
      relatedUpdates.specs = typeof req.body.specs === 'string' 
        ? JSON.parse(req.body.specs) 
        : req.body.specs;
    } catch (e) {
      return next(new ErrorHandler('Invalid specs data format. Must be valid JSON.', 400));
    }
  }

  const result = await ProjectModel.updateProject(id, updateData, relatedUpdates);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to update project', 400));
  }

  res.status(200).json({
    success: true,
    message: result.message || 'Project updated successfully',
    data: prepareProjectForFrontend(result.data) // Prepare for frontend
  });
});

// ==================== DELETE PROJECT ====================
export const deleteProject = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const hardDelete = req.query.hard_delete === 'true';

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid project ID for deletion', 400));
  }

  const result = await ProjectModel.deleteProject(id, hardDelete);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to delete project', 400));
  }

  res.status(200).json({
    success: true,
    message: result.message || `Project ${result.deleteType} successfully`,
    data: {
      projectId: result.projectId,
      projectName: result.projectName,
      deleteType: result.deleteType
    }
  });
});

// ==================== SEARCH PROJECTS ====================
export const searchProjects = catchAsyncErrors(async (req, res, next) => {
  const searchCriteria = {
    keyword: req.query.keyword || req.query.search,
    status: req.query.status ? parseInt(req.query.status) : undefined,
    city_id: req.query.city_id,
    state_id: req.query.state_id,
    min_price: req.query.min_price,
    max_price: req.query.max_price,
    property_type: req.query.property_type,
    bedroom: req.query.bedroom,
    sort_by: req.query.sort_by || 'newest',
  };

  const pagination = {
    limit: parseInt(req.query.limit) || ITEMS_PER_PAGE,
    offset: parseInt(req.query.offset) || 0,
    page: Math.floor((parseInt(req.query.offset) || 0) / (parseInt(req.query.limit) || ITEMS_PER_PAGE)) + 1
  };

  const result = await ProjectModel.searchProjects(searchCriteria, pagination);

  const listings = result.data.map(prepareProjectForFrontend);

  res.status(200).json({
    success: true,
    message: result.message || "Projects found based on search criteria",
    listings: listings,
    pagination: {
      currentPage: pagination.page,
      limit: pagination.limit,
      totalItems: result.total || 0,
      totalPages: Math.ceil((result.total || 0) / pagination.limit),
      offset: pagination.offset
    },
    searchCriteria: searchCriteria
  });
});

// ==================== FEATURED PROJECTS ====================
export const getFeaturedProjects = catchAsyncErrors(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const result = await ProjectModel.getAllProjects(
    { featured_only: true, status: 1, sort_by: 'newest' }, // Explicitly ask for active & featured
    { page: 1, limit: limit }
  );

  const listings = result.data.map(prepareProjectForFrontend);

  res.status(200).json({
    success: true,
    message: result.message || "Featured projects fetched successfully",
    listings: listings,
    pagination: {
      currentPage: 1,
      limit: limit,
      totalItems: result.pagination.total || listings.length,
      totalPages: result.pagination.totalPages,
    },
  });
});

// ==================== AMENITIES ====================
export const createAmenity = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new ErrorHandler('Amenity name is required', 400));
  }

  const result = await ProjectModel.createAmenity(name);

  res.status(201).json({
    success: true,
    message: result.message,
    data: result.data
  });
});

export const getAllAmenities = catchAsyncErrors(async (req, res, next) => {
  const result = await ProjectModel.getAllAmenities();

  res.status(200).json({
    success: true,
    data: result.data,
    count: result.count
  });
});

export const deleteAmenity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid amenity ID', 400));
  }

  const result = await ProjectModel.deleteAmenity(id);

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// ==================== GALLERY ====================
export const addGalleryImages = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid project ID for gallery update', 400));
  }

  const uploadedFiles = processUploadedFiles(req.files || {});
  
  if (uploadedFiles.gallery_image_paths.length === 0) {
    return next(new ErrorHandler('No images provided for gallery upload', 400));
  }

  const result = await ProjectModel.addProjectGalleryImages(id, uploadedFiles.gallery_image_paths);

  res.status(201).json({
    success: true,
    message: result.message || 'Gallery images added successfully',
    insertedIds: result.insertedIds
  });
});

export const removeGalleryImage = catchAsyncErrors(async (req, res, next) => {
  const { imageId } = req.params;

  if (!imageId || isNaN(imageId)) {
    return next(new ErrorHandler('Invalid image ID for removal', 400));
  }

  const result = await ProjectModel.removeGalleryImage(imageId);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to remove gallery image', 400));
  }

  res.status(200).json({
    success: true,
    message: result.message || 'Gallery image removed successfully'
  });
});

// ==================== CONTACTS ====================
export const submitProjectContact = catchAsyncErrors(async (req, res, next) => {
  const contactData = {
    project_id: req.body.project_id,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    message: req.body.message
  };

  if (!contactData.project_id || !contactData.name) {
    return next(new ErrorHandler('Project ID and name are required', 400));
  }

  const result = await ProjectModel.createProjectContact(contactData);

  res.status(201).json({
    success: true,
    message: result.message,
    data: result.data
  });
});

export const getProjectContacts = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid project ID', 400));
  }

  const result = await ProjectModel.getProjectContacts(id, limit);

  res.status(200).json({
    success: true,
    data: result.data,
    count: result.count
  });
});

// ==================== STATISTICS ====================
export const getProjectStatistics = catchAsyncErrors(async (req, res, next) => {
  const filters = {
    user_id: req.query.user_id,
    start_date: req.query.start_date,
    end_date: req.query.end_date
  };

  const result = await ProjectModel.getProjectStatistics(filters);

  res.status(200).json({
    success: true,
    data: result.data
  });
});

export const getDashboardData = catchAsyncErrors(async (req, res, next) => {
  const userId = req.query.user_id || req.user.id;

  const [stats, recentProjectsResult] = await Promise.all([
    ProjectModel.getProjectStatistics({ user_id: userId }),
    ProjectModel.getAllProjects(
      { user_id: userId, sort_by: 'newest' },
      { page: 1, limit: 5 }
    )
  ]);

  const recentProjects = recentProjectsResult.data.map(prepareProjectForFrontend);

  res.status(200).json({
    success: true,
    data: {
      statistics: stats.data,
      recent_projects: recentProjects
    }
  });
});

// ==================== BULK OPERATIONS ====================
export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { project_ids, status } = req.body;

  if (!project_ids || !Array.isArray(project_ids) || project_ids.length === 0) {
    return next(new ErrorHandler('Project IDs array is required', 400));
  }

  if (status === undefined) {
    return next(new ErrorHandler('Status is required', 400));
  }

  const result = await ProjectModel.bulkUpdateProjectStatus(project_ids, status);

  res.status(200).json({
    success: true,
    message: result.message,
    affectedRows: result.affectedRows
  });
});

export const bulkDeleteProjects = catchAsyncErrors(async (req, res, next) => {
  const { project_ids } = req.body;
  const hardDelete = req.query.hard_delete === 'true';

  if (!project_ids || !Array.isArray(project_ids) || project_ids.length === 0) {
    return next(new ErrorHandler('Project IDs array is required', 400));
  }

  const result = await ProjectModel.bulkDeleteProjects(project_ids, hardDelete);

  res.status(200).json({
    success: true,
    message: result.message,
    affectedRows: result.affectedRows,
    deleteType: result.deleteType
  });
});

// ==================== EXPORT ====================
export const exportProjects = catchAsyncErrors(async (req, res, next) => {
  const filters = {
    user_id: req.query.user_id,
    city_id: req.query.city_id,
    developer_id: req.query.developer_id,
    status: req.query.status ? parseInt(req.query.status) : undefined,
    include_inactive: req.query.include_inactive === 'true'
  };

  const result = await ProjectModel.getAllProjects(filters, { page: 1, limit: 10000 });

  // Transform data slightly for CSV, but don't need full frontend prep
  const projectsForCsv = result.data.map(p => ({
    ...p,
    featured_image_url: buildFullUrl(p.featured_image) // Ensure image URL is absolute in CSV
  }));

  // Convert to CSV
  const headers = ['ID', 'Project Name', 'City', 'Price', 'Property Type', 'Status', 'Featured Image URL', 'Created At'];
  const csvData = projectsForCsv.map(p => [
    p.id,
    `"${(p.ProjectName || '').replace(/"/g, '""')}"`,
    p.CityName || '',
    p.price || '',
    p.property_type || '',
    p.status === 1 ? 'Active' : 'Inactive',
    p.featured_image_url || '', // Use the full URL
    p.created_at
  ]);

  const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=projects_export_${Date.now()}.csv`);
  res.status(200).send(csvContent);
});