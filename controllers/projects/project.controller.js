// backend/controllers/projects/project.controller.js
import path from 'path';
import * as ProjectModel from '../../models/projects/project.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_BASE_PATH = 'uploads';
const ITEMS_PER_PAGE = 20;
const API_BASE_URL = process.env.API_URL;

// ==================== FIELDS THAT GO TO SPECS TABLE ====================
const SPECS_FIELDS = [
  'ReraNumber',
  'DeveloperName', 
  'CompanyName',
  'MaxArea',
  'MinArea',
  'MaxPrice',
  'MinPrice',
  'Latitude',
  'Longitude',
];

// ==================== HELPER FUNCTIONS ====================
const getRelativeUploadPath = (absolutePath) => {
  if (!absolutePath) return null;
  const normalizedPath = absolutePath.replace(/\\/g, '/');
  const uploadsIndex = normalizedPath.indexOf(UPLOAD_BASE_PATH + '/');
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex);
  }
  return normalizedPath;
};

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

/**
 * Separates project data from specs data
 * @param {Object} body - Request body
 * @returns {Object} { projectData, specsData }
 */
const separateProjectAndSpecs = (body) => {
  const projectData = {};
  const specsData = {};

  Object.keys(body).forEach(key => {
    const value = body[key];
    
    // Skip null, undefined, empty strings
    if (value === null || value === undefined || value === '') {
      return;
    }

    // Skip the 'specs' JSON field - we'll handle it separately
    if (key === 'specs') {
      return;
    }

    // Check if this field belongs to specs table
    if (SPECS_FIELDS.includes(key)) {
      specsData[key] = value;
    } else {
      projectData[key] = value;
    }
  });

  // Handle specs JSON if sent as a string
  if (body.specs) {
    try {
      const parsedSpecs = typeof body.specs === 'string' 
        ? JSON.parse(body.specs) 
        : body.specs;
      
      // Merge parsed specs into specsData
      Object.assign(specsData, parsedSpecs);
    } catch (e) {
      console.error('Failed to parse specs JSON:', e);
    }
  }

  return { projectData, specsData };
};

const prepareProjectForFrontend = (project) => {
  if (!project) return null;

  const transformedProject = { ...project };

  transformedProject.featured_image = buildFullUrl(project.featured_image);
  transformedProject.latitude = project.latitude || project.Latitude || null;
  transformedProject.longitude = project.longitude || project.Longitude || null;

  if (project.gallery && Array.isArray(project.gallery)) {
    transformedProject.images = project.gallery.map(img => buildFullUrl(img.Url || img));
  } else {
    transformedProject.images = [];
  }

  transformedProject.developerName = project.DeveloperName || '';

  if (!transformedProject.project_slug && transformedProject.id) {
    transformedProject.slug = String(transformedProject.id);
  } else if (transformedProject.project_slug) {
    transformedProject.slug = transformedProject.project_slug;
  } else {
    transformedProject.slug = '';
  }

  transformedProject.featured = project.featured_project === '1' || project.featured_project === 1;
  transformedProject.handoverDate = project.completion_date || '';

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
  console.log('=== CREATE PROJECT START ===');
  console.log('Request body keys:', Object.keys(req.body));
  
  const uploadedFiles = processUploadedFiles(req.files || {});

  // Separate project fields from specs fields
  const { projectData, specsData } = separateProjectAndSpecs(req.body);

  console.log('Project data fields:', Object.keys(projectData));
  console.log('Specs data:', specsData);

  // Auto-generate slug if not provided
  if (!projectData.project_slug && projectData.ProjectName) {
    projectData.project_slug = generateSlug(projectData.ProjectName);
  } else if (!projectData.project_slug) {
    projectData.project_slug = generateSlug('untitled-project');
  }

  // Set user_id from authenticated user
  projectData.user_id = req.user?.id || projectData.user_id || 1;

  // Set featured_image from uploaded path
  if (uploadedFiles.featured_image_path) {
    projectData.featured_image = uploadedFiles.featured_image_path;
  }

  // Prepare related data
  const relatedData = {};

  // Gallery images
  if (uploadedFiles.gallery_image_paths.length > 0) {
    relatedData.gallery = uploadedFiles.gallery_image_paths.map(url => ({ Url: url }));
  }

  // Floor plans and documents
  if (uploadedFiles.floor_plan_paths.length > 0) {
    projectData.floor_plans = JSON.stringify(uploadedFiles.floor_plan_paths);
  }
  if (uploadedFiles.document_paths.length > 0) {
    projectData.documents = JSON.stringify(uploadedFiles.document_paths);
  }

  // Add specs to related data if we have any
  if (Object.keys(specsData).length > 0) {
    relatedData.specs = specsData;
  }

  console.log('Final project data:', projectData);
  console.log('Related data:', relatedData);

  const result = await ProjectModel.createProject(projectData, relatedData);

  console.log('=== CREATE PROJECT END ===');

  res.status(201).json({
    success: true,
    message: result.message,
    data: prepareProjectForFrontend(result.data),
    projectId: result.projectId
  });
});

// ==================== GET ALL PROJECTS ====================
export const getAllProjects = catchAsyncErrors(async (req, res, next) => {
  const filters = {
    status: req.query.status !== undefined ? parseInt(req.query.status) : undefined,
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
    featured_only: req.query.featured_only === 'true',
    verified_only: req.query.verified_only === 'true',
    search: req.query.search,
    user_id: req.query.user_id,
    sort_by: req.query.sort_by || req.query.orderBy || 'newest',
    sort_order: req.query.sort_order || req.query.order || 'desc',
    include_inactive: req.query.include_inactive === 'true'
  };

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || ITEMS_PER_PAGE
  };

  const result = await ProjectModel.getAllProjects(filters, pagination);

  const listings = result.data.map(prepareProjectForFrontend);

  res.status(200).json({
    success: true,
    message: result.message || "Projects fetched successfully",
    projects: listings,  // Added for frontend compatibility
    listings: listings,
    data: listings,      // Added for frontend compatibility
    total: result.pagination.total,
    pagination: {
      currentPage: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalItems: result.pagination.total,
      totalPages: result.pagination.totalPages,
    },
    filters: filters
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
    data: prepareProjectForFrontend(result.data)
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
    data: prepareProjectForFrontend(result.data)
  });
});

// ==================== UPDATE PROJECT ====================
export const updateProject = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Invalid project ID for update', 400));
  }

  console.log('=== UPDATE PROJECT START ===');
  console.log('Project ID:', id);
  console.log('Request body keys:', Object.keys(req.body));

  const uploadedFiles = processUploadedFiles(req.files || {});

  // Separate project fields from specs fields
  const { projectData, specsData } = separateProjectAndSpecs(req.body);

  console.log('Project data fields:', Object.keys(projectData));
  console.log('Specs data:', specsData);

  // Update featured_image if new one uploaded
  if (uploadedFiles.featured_image_path) {
    projectData.featured_image = uploadedFiles.featured_image_path;
  }

  // Update floor plans and documents if new ones uploaded
  if (uploadedFiles.floor_plan_paths.length > 0) {
    projectData.floor_plans = JSON.stringify(uploadedFiles.floor_plan_paths);
  }
  if (uploadedFiles.document_paths.length > 0) {
    projectData.documents = JSON.stringify(uploadedFiles.document_paths);
  }

  // Prepare related updates
  const relatedUpdates = {};

  // Add new gallery images if uploaded
  if (uploadedFiles.gallery_image_paths.length > 0) {
    relatedUpdates.gallery = uploadedFiles.gallery_image_paths.map(url => ({ Url: url }));
  }

  // Handle explicit gallery clear
  if (req.body.gallery_clear === 'true') {
    relatedUpdates.gallery = [];
  }

  // Add specs to related updates if we have any
  if (Object.keys(specsData).length > 0) {
    relatedUpdates.specs = specsData;
  }

  console.log('Final project data:', projectData);
  console.log('Related updates:', relatedUpdates);

  const result = await ProjectModel.updateProject(id, projectData, relatedUpdates);

  console.log('=== UPDATE PROJECT END ===');

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to update project', 400));
  }

  res.status(200).json({
    success: true,
    message: result.message || 'Project updated successfully',
    data: prepareProjectForFrontend(result.data)
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
    status: req.query.status !== undefined ? parseInt(req.query.status) : undefined,
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
    { featured_only: true, status: 1, sort_by: 'newest' },
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
  const userId = req.query.user_id || req.user?.id;

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
    status: req.query.status !== undefined ? parseInt(req.query.status) : undefined,
    include_inactive: req.query.include_inactive === 'true'
  };

  const result = await ProjectModel.getAllProjects(filters, { page: 1, limit: 10000 });

  const projectsForCsv = result.data.map(p => ({
    ...p,
    featured_image_url: buildFullUrl(p.featured_image)
  }));

  const headers = ['ID', 'Project Name', 'City', 'Price', 'Property Type', 'Status', 'Featured Image URL', 'Created At'];
  const csvData = projectsForCsv.map(p => [
    p.id,
    `"${(p.ProjectName || '').replace(/"/g, '""')}"`,
    p.CityName || '',
    p.price || '',
    p.property_type || '',
    p.status === 1 ? 'Active' : 'Inactive',
    p.featured_image_url || '',
    p.created_at
  ]);

  const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=projects_export_${Date.now()}.csv`);
  res.status(200).send(csvContent);
});