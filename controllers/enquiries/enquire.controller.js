// controllers/enquiries/enquire.controller.js

import path from 'path';
import fs from 'fs/promises';
import * as EnquireModel from '../../models/enquiries/enquire.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_FOLDER = 'enquiries';
const ITEMS_PER_PAGE = 20;

const VALID_STATUSES = ['New', 'In Progress', 'Contacted', 'Qualified', 'Lost', 'Converted'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const VALID_QUALITY = ['Hot', 'Warm', 'Cold'];
const VALID_LEAD_STATUS = ['New', 'Follow Up', 'Meeting', 'Negotiation', 'Closed'];

// ==================== HELPER FUNCTIONS ====================

const deleteFile = async (filePath) => {
  if (!filePath) return;
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.access(fullPath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.warn(`File delete warning: ${error.message}`);
  }
};

const getFilePath = (file) => {
  if (!file) return null;
  return `/${UPLOAD_FOLDER}/${file.filename}`;
};

// ==================== INITIALIZE TABLE ====================

export const initEnquireTable = catchAsyncErrors(async (req, res, next) => {
  await EnquireModel.createEnquireTable();
  res.status(200).json({
    success: true,
    message: 'Enquire table initialized successfully'
  });
});

// ==================== CREATE ENQUIRY ====================

export const createEnquire = catchAsyncErrors(async (req, res, next) => {
  const data = { ...req.body };

  // Handle file uploads
  if (req.files) {
    if (req.files.property_image && req.files.property_image[0]) {
      data.property_image = getFilePath(req.files.property_image[0]);
    }
    if (req.files.resume && req.files.resume[0]) {
      data.resume = getFilePath(req.files.resume[0]);
    }
  }

  // Validate status
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    return next(new ErrorHandler(`Invalid status. Valid options: ${VALID_STATUSES.join(', ')}`, 400));
  }

  // Validate priority
  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    return next(new ErrorHandler(`Invalid priority. Valid options: ${VALID_PRIORITIES.join(', ')}`, 400));
  }

  // Set defaults
  data.status = data.status || 'New';
  data.drip_marketing = data.drip_marketing || 0;

  // Set agent_id from authenticated user if not provided
  if (!data.agent_id && req.user) {
    data.agent_id = req.user.id;
  }

  const result = await EnquireModel.createEnquire(data);

  res.status(201).json({
    success: true,
    message: 'Enquiry created successfully',
    data: {
      id: result.insertId,
      ...data
    }
  });
});

// ==================== GET ALL ENQUIRIES ====================

export const getAllEnquiries = catchAsyncErrors(async (req, res, next) => {
  const enquiries = await EnquireModel.getAllEnquiries();

  res.status(200).json({
    success: true,
    count: enquiries.length,
    data: enquiries
  });
});

// ==================== GET ALL ENQUIRIES WITH FILTERS ====================

export const getFilteredEnquiries = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = ITEMS_PER_PAGE,
    status,
    priority,
    quality,
    agent_id,
    type,
    source,
    lead_status,
    from_date,
    to_date,
    search
  } = req.query;

  let enquiries = await EnquireModel.getAllEnquiries();

  // Apply filters
  if (status) {
    enquiries = enquiries.filter(e => e.status === status);
  }
  if (priority) {
    enquiries = enquiries.filter(e => e.priority === priority);
  }
  if (quality) {
    enquiries = enquiries.filter(e => e.quality === quality);
  }
  if (agent_id) {
    enquiries = enquiries.filter(e => e.agent_id === parseInt(agent_id));
  }
  if (type) {
    enquiries = enquiries.filter(e => e.type === type);
  }
  if (source) {
    enquiries = enquiries.filter(e => e.source === source);
  }
  if (lead_status) {
    enquiries = enquiries.filter(e => e.lead_status === lead_status);
  }
  if (from_date) {
    enquiries = enquiries.filter(e => new Date(e.created_at) >= new Date(from_date));
  }
  if (to_date) {
    enquiries = enquiries.filter(e => new Date(e.created_at) <= new Date(to_date));
  }

  // Pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedData = enquiries.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    count: paginatedData.length,
    total: enquiries.length,
    totalPages: Math.ceil(enquiries.length / parseInt(limit)),
    currentPage: parseInt(page),
    data: paginatedData
  });
});

// ==================== GET ENQUIRY BY ID ====================

export const getEnquireById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const enquiry = await EnquireModel.getEnquireById(id);

  if (!enquiry) {
    return next(new ErrorHandler('Enquiry not found', 404));
  }

  res.status(200).json({
    success: true,
    data: enquiry
  });
});

// ==================== GET ENQUIRIES BY AGENT ====================

export const getEnquiriesByAgent = catchAsyncErrors(async (req, res, next) => {
  const { agent_id } = req.params;

  const enquiries = await EnquireModel.getEnquiriesByAgentId(agent_id);

  res.status(200).json({
    success: true,
    count: enquiries.length,
    data: enquiries
  });
});

// ==================== GET MY ENQUIRIES (For Logged In Agent) ====================

export const getMyEnquiries = catchAsyncErrors(async (req, res, next) => {
  const agent_id = req.user.id;

  const enquiries = await EnquireModel.getEnquiriesByAgentId(agent_id);

  res.status(200).json({
    success: true,
    count: enquiries.length,
    data: enquiries
  });
});

// ==================== UPDATE ENQUIRY ====================

export const updateEnquire = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const data = { ...req.body };

  // Check if enquiry exists
  const existingEnquiry = await EnquireModel.getEnquireById(id);
  if (!existingEnquiry) {
    return next(new ErrorHandler('Enquiry not found', 404));
  }

  // Handle file uploads
  if (req.files) {
    if (req.files.property_image && req.files.property_image[0]) {
      // Delete old image
      await deleteFile(existingEnquiry.property_image);
      data.property_image = getFilePath(req.files.property_image[0]);
    } else {
      data.property_image = existingEnquiry.property_image;
    }

    if (req.files.resume && req.files.resume[0]) {
      // Delete old resume
      await deleteFile(existingEnquiry.resume);
      data.resume = getFilePath(req.files.resume[0]);
    } else {
      data.resume = existingEnquiry.resume;
    }
  } else {
    data.property_image = existingEnquiry.property_image;
    data.resume = existingEnquiry.resume;
  }

  // Validate status
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    return next(new ErrorHandler(`Invalid status. Valid options: ${VALID_STATUSES.join(', ')}`, 400));
  }

  // Merge existing data with new data
  const updatedData = {
    contact_id: data.contact_id ?? existingEnquiry.contact_id,
    property_id: data.property_id ?? existingEnquiry.property_id,
    project_item_id: data.project_item_id ?? existingEnquiry.project_item_id,
    item_type: data.item_type ?? existingEnquiry.item_type,
    type: data.type ?? existingEnquiry.type,
    source: data.source ?? existingEnquiry.source,
    agent_id: data.agent_id ?? existingEnquiry.agent_id,
    country: data.country ?? existingEnquiry.country,
    priority: data.priority ?? existingEnquiry.priority,
    quality: data.quality ?? existingEnquiry.quality,
    contact_type: data.contact_type ?? existingEnquiry.contact_type,
    agent_activity: data.agent_activity ?? existingEnquiry.agent_activity,
    admin_activity: data.admin_activity ?? existingEnquiry.admin_activity,
    listing_type: data.listing_type ?? existingEnquiry.listing_type,
    exclusive_status: data.exclusive_status ?? existingEnquiry.exclusive_status,
    construction_status: data.construction_status ?? existingEnquiry.construction_status,
    state_id: data.state_id ?? existingEnquiry.state_id,
    community_id: data.community_id ?? existingEnquiry.community_id,
    sub_community_id: data.sub_community_id ?? existingEnquiry.sub_community_id,
    project_id: data.project_id ?? existingEnquiry.project_id,
    building: data.building ?? existingEnquiry.building,
    price_min: data.price_min ?? existingEnquiry.price_min,
    price_max: data.price_max ?? existingEnquiry.price_max,
    bedroom_min: data.bedroom_min ?? existingEnquiry.bedroom_min,
    bedroom_max: data.bedroom_max ?? existingEnquiry.bedroom_max,
    contact_source: data.contact_source ?? existingEnquiry.contact_source,
    lead_source: data.lead_source ?? existingEnquiry.lead_source,
    property_image: data.property_image,
    message: data.message ?? existingEnquiry.message,
    resume: data.resume,
    drip_marketing: data.drip_marketing ?? existingEnquiry.drip_marketing,
    status: data.status ?? existingEnquiry.status,
    contact_date: data.contact_date ?? existingEnquiry.contact_date,
    lead_status: data.lead_status ?? existingEnquiry.lead_status,
    lost_status: data.lost_status ?? existingEnquiry.lost_status
  };

  await EnquireModel.updateEnquire(id, updatedData);

  res.status(200).json({
    success: true,
    message: 'Enquiry updated successfully',
    data: { id: parseInt(id), ...updatedData }
  });
});

// ==================== UPDATE ENQUIRY STATUS ====================

export const updateEnquireStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status, lead_status, lost_status } = req.body;

  const existingEnquiry = await EnquireModel.getEnquireById(id);
  if (!existingEnquiry) {
    return next(new ErrorHandler('Enquiry not found', 404));
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return next(new ErrorHandler(`Invalid status. Valid options: ${VALID_STATUSES.join(', ')}`, 400));
  }

  const updatedData = {
    ...existingEnquiry,
    status: status || existingEnquiry.status,
    lead_status: lead_status || existingEnquiry.lead_status,
    lost_status: lost_status || existingEnquiry.lost_status
  };

  await EnquireModel.updateEnquire(id, updatedData);

  res.status(200).json({
    success: true,
    message: 'Enquiry status updated successfully'
  });
});

// ==================== ASSIGN AGENT ====================

export const assignAgent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { agent_id } = req.body;

  if (!agent_id) {
    return next(new ErrorHandler('Agent ID is required', 400));
  }

  const existingEnquiry = await EnquireModel.getEnquireById(id);
  if (!existingEnquiry) {
    return next(new ErrorHandler('Enquiry not found', 404));
  }

  const updatedData = {
    ...existingEnquiry,
    agent_id: agent_id
  };

  await EnquireModel.updateEnquire(id, updatedData);

  res.status(200).json({
    success: true,
    message: 'Agent assigned successfully'
  });
});

// ==================== DELETE ENQUIRY ====================

export const deleteEnquire = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingEnquiry = await EnquireModel.getEnquireById(id);
  if (!existingEnquiry) {
    return next(new ErrorHandler('Enquiry not found', 404));
  }

  // Delete associated files
  await deleteFile(existingEnquiry.property_image);
  await deleteFile(existingEnquiry.resume);

  await EnquireModel.deleteEnquire(id);

  res.status(200).json({
    success: true,
    message: 'Enquiry deleted successfully'
  });
});

// ==================== BULK DELETE ====================

export const bulkDeleteEnquiries = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Please provide enquiry IDs to delete', 400));
  }

  let deletedCount = 0;

  for (const id of ids) {
    const enquiry = await EnquireModel.getEnquireById(id);
    if (enquiry) {
      await deleteFile(enquiry.property_image);
      await deleteFile(enquiry.resume);
      await EnquireModel.deleteEnquire(id);
      deletedCount++;
    }
  }

  res.status(200).json({
    success: true,
    message: `${deletedCount} enquiries deleted successfully`
  });
});

// ==================== GET ENQUIRY STATS ====================

export const getEnquiryStats = catchAsyncErrors(async (req, res, next) => {
  const enquiries = await EnquireModel.getAllEnquiries();

  const stats = {
    total: enquiries.length,
    byStatus: {},
    byPriority: {},
    byQuality: {},
    bySource: {},
    thisMonth: 0,
    thisWeek: 0,
    today: 0
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

  enquiries.forEach(enquiry => {
    // Count by status
    stats.byStatus[enquiry.status] = (stats.byStatus[enquiry.status] || 0) + 1;
    
    // Count by priority
    if (enquiry.priority) {
      stats.byPriority[enquiry.priority] = (stats.byPriority[enquiry.priority] || 0) + 1;
    }
    
    // Count by quality
    if (enquiry.quality) {
      stats.byQuality[enquiry.quality] = (stats.byQuality[enquiry.quality] || 0) + 1;
    }
    
    // Count by source
    if (enquiry.source) {
      stats.bySource[enquiry.source] = (stats.bySource[enquiry.source] || 0) + 1;
    }

    // Time-based counts
    const createdAt = new Date(enquiry.created_at);
    if (createdAt >= startOfMonth) stats.thisMonth++;
    if (createdAt >= startOfWeek) stats.thisWeek++;
    if (createdAt >= startOfDay) stats.today++;
  });

  res.status(200).json({
    success: true,
    data: stats
  });
});