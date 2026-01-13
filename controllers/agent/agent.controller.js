// backend/controllers/agent/agent.controller.js
import * as AgentModel from '../../models/agent/agent.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/**
 * Generate unique slug from name
 */
export const generateUniqueSlug = async (name, excludeId = null) => {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  let finalSlug = slug;
  let counter = 1;
  
  while (await AgentModel.checkSlugExists(finalSlug, excludeId)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return finalSlug;
};

/* =========================================================
   PUBLIC CONTROLLERS
========================================================= */

/**
 * @desc    Get all active agents (public)
 * @route   GET /api/agents
 * @access  Public
 */
export const getAllAgents = catchAsyncErrors(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    orderBy = 'name', 
    order = 'ASC',
    company = '',
    nationality = ''
  } = req.query;

  const filters = {
    status: 1, // Only active agents
    search: search.trim(),
    orderBy,
    order,
    company: company.trim(),
    nationality: nationality.trim()
  };

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await AgentModel.getAllAgents(filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Agents fetched successfully',
    data: result
  });
});

/**
 * @desc    Get public agent statistics
 * @route   GET /api/agents/stats
 * @access  Public
 */
export const getAgentStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await AgentModel.getAgentStats();
  
  res.status(200).json({
    success: true,
    message: 'Agent statistics fetched successfully',
    data: {
      total_agents: stats.active_agents, // Only show active count publicly
      total_companies: stats.total_companies,
      total_nationalities: stats.total_nationalities
    }
  });
});

/**
 * @desc    Get single agent by ID or slug (public)
 * @route   GET /api/agents/:slugOrId
 * @access  Public
 */
export const getAgentBySlugOrId = catchAsyncErrors(async (req, res, next) => {
  const { slugOrId } = req.params;

  const agent = await AgentModel.getAgentByIdOrSlug(slugOrId);

  if (!agent) {
    return next(new ErrorHandler('Agent not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Agent fetched successfully',
    data: agent
  });
});

/**
 * @desc    Get agents by company (public)
 * @route   GET /api/agents/company/:company
 * @access  Public
 */
export const getAgentsByCompany = catchAsyncErrors(async (req, res, next) => {
  const { company } = req.params;

  const agents = await AgentModel.getAgentsByCompany(company);

  res.status(200).json({
    success: true,
    message: 'Agents fetched successfully',
    data: {
      company,
      total: agents.length,
      agents
    }
  });
});

/**
 * @desc    Get agents by nationality (public)
 * @route   GET /api/agents/nationality/:nationality
 * @access  Public
 */
export const getAgentsByNationality = catchAsyncErrors(async (req, res, next) => {
  const { nationality } = req.params;

  const agents = await AgentModel.getAgentsByNationality(nationality);

  res.status(200).json({
    success: true,
    message: 'Agents fetched successfully',
    data: {
      nationality,
      total: agents.length,
      agents
    }
  });
});

/* =========================================================
   ADMIN CONTROLLERS
========================================================= */

/**
 * @desc    Get all agents (admin - includes inactive)
 * @route   GET /api/agents/admin/all
 * @access  Private/Admin
 */
export const getAllAgentsAdmin = catchAsyncErrors(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    orderBy = 'created_at', 
    order = 'DESC',
    status = '',
    company = ''
  } = req.query;

  const filters = {
    search: search.trim(),
    orderBy,
    order,
    company: company.trim()
  };

  // Add status filter if provided
  if (status !== '') {
    filters.status = parseInt(status);
  }

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const result = await AgentModel.getAllAgentsAdmin(filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Agents fetched successfully',
    data: result
  });
});

/**
 * @desc    Get full agent statistics (admin)
 * @route   GET /api/agents/admin/stats
 * @access  Private/Admin
 */
export const getAgentStatsAdmin = catchAsyncErrors(async (req, res, next) => {
  const stats = await AgentModel.getAgentStats();
  
  res.status(200).json({
    success: true,
    message: 'Agent statistics fetched successfully',
    data: stats
  });
});

/**
 * @desc    Get single agent by ID (admin)
 * @route   GET /api/agents/admin/:id
 * @access  Private/Admin
 */
export const getAgentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new ErrorHandler('Invalid agent ID', 400));
  }

  const agent = await AgentModel.getAgentById(id);

  if (!agent) {
    return next(new ErrorHandler('Agent not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Agent fetched successfully',
    data: agent
  });
});

/**
 * @desc    Create new agent
 * @route   POST /api/agents/admin/create
 * @access  Private/Admin
 */
export const createAgent = catchAsyncErrors(async (req, res, next) => {
  const {
    title,
    slug,
    sub_title,
    cuid,
    name,
    first_name,
    last_name,
    nationality,
    orn_number,
    orn,
    brn,
    mobile,
    designation,
    languages,
    aos,
    company,
    email,
    descriptions,
    seo_title,
    seo_keywork,
    seo_description,
    status
  } = req.body;

  // Validate required fields
  if (!name || name.trim() === '') {
    return next(new ErrorHandler('Agent name is required', 400));
  }

  // Generate slug if not provided or empty
  let agentSlug;
  if (!slug || slug.trim() === '') {
    agentSlug = await generateUniqueSlug(name);
  } else {
    // Check if provided slug already exists
    if (await AgentModel.checkSlugExists(slug.trim())) {
      return next(new ErrorHandler('This slug already exists', 400));
    }
    agentSlug = slug.trim();
  }

  // Check if email already exists
  if (email && await AgentModel.checkEmailExists(email.trim())) {
    return next(new ErrorHandler('This email is already registered', 400));
  }

  // Check if ORN number already exists
  if (orn_number && await AgentModel.checkOrnExists(orn_number.trim())) {
    return next(new ErrorHandler('This ORN number is already registered', 400));
  }

  // Prepare agent data, setting empty strings to null for DB
  const agentData = {
    title: title ? title.trim() : null,
    slug: agentSlug,
    sub_title: sub_title ? sub_title.trim() : null,
    cuid: cuid ? cuid.trim() : null,
    name: name.trim(),
    first_name: first_name ? first_name.trim() : null,
    last_name: last_name ? last_name.trim() : null,
    nationality: nationality ? nationality.trim() : null,
    orn_number: orn_number ? orn_number.trim() : null,
    orn: orn ? orn.trim() : null,
    brn: brn ? brn.trim() : null,
    mobile: mobile ? mobile.trim() : null,
    designation: designation ? designation.trim() : null,
    languages: languages ? languages.trim() : null, // TEXT fields
    aos: aos ? aos.trim() : null,                 // TEXT fields
    company: company ? company.trim() : null,
    email: email ? email.trim() : null,
    descriptions: descriptions ? descriptions.trim() : null, // TEXT field
    seo_title: seo_title ? seo_title.trim() : null,
    seo_keywork: seo_keywork ? seo_keywork.trim() : null,
    seo_description: seo_description ? seo_description.trim() : null, // TEXT field
    status: status !== undefined ? parseInt(status) : 1
  };

  try {
    const agent = await AgentModel.createAgent(agentData);

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: agent
    });
  } catch (error) {
    console.error('Error in agent creation controller:', error);
    // The model's createAgent already throws specific errors (e.g., 'This slug already exists')
    // which ErrorHandler will catch and format.
    return next(new ErrorHandler(error.message || 'Failed to create agent', 500));
  }
});

/**
 * @desc    Update agent
 * @route   PUT /api/agents/admin/:id
 * @access  Private/Admin
 */
export const updateAgent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new ErrorHandler('Invalid agent ID', 400));
  }

  // Check if agent exists
  const existingAgent = await AgentModel.getAgentById(id);
  if (!existingAgent) {
    return next(new ErrorHandler('Agent not found', 404));
  }

  const {
    title,
    slug,
    sub_title,
    cuid,
    name,
    first_name,
    last_name,
    nationality,
    orn_number,
    orn,
    brn,
    mobile,
    designation,
    languages,
    aos,
    company,
    email,
    descriptions,
    seo_title,
    seo_keywork,
    seo_description,
    status
  } = req.body;

  const updateData = {};

  // Name validation and assignment
  if (name !== undefined) {
    if (name.trim() === '') {
      return next(new ErrorHandler('Agent name cannot be empty', 400));
    }
    updateData.name = name.trim();
  }

  // Slug generation/assignment logic
  if (slug !== undefined) {
    if (slug.trim() === '') {
      // If slug is explicitly emptied, generate one from the current (or updated) name
      updateData.slug = await generateUniqueSlug(updateData.name || existingAgent.name, id);
    } else {
      updateData.slug = slug.trim();
    }
  } else if (updateData.name && existingAgent.name && updateData.name !== existingAgent.name) {
    // If name is updated but slug is not provided, regenerate slug from the new name
    updateData.slug = await generateUniqueSlug(updateData.name, id);
  }

  // Helper to assign a field if it's explicitly provided in the request body
  // Handles trimming strings and setting empty strings to null
  const assignField = (key, value) => {
    if (value !== undefined) { // Check if the field was sent in the request body
      if (typeof value === 'string') {
        updateData[key] = value.trim() === '' ? null : value.trim();
      } else {
        updateData[key] = value; // For non-string values like numbers (status)
      }
    }
  };

  assignField('title', title);
  assignField('sub_title', sub_title);
  assignField('cuid', cuid);
  assignField('first_name', first_name);
  assignField('last_name', last_name);
  assignField('nationality', nationality);
  assignField('orn_number', orn_number);
  assignField('orn', orn);
  assignField('brn', brn);
  assignField('mobile', mobile);
  assignField('designation', designation);
  assignField('languages', languages); // TEXT field
  assignField('aos', aos);             // TEXT field
  assignField('company', company);
  assignField('email', email);
  assignField('descriptions', descriptions); // TEXT field
  assignField('seo_title', seo_title);
  assignField('seo_keywork', seo_keywork);
  assignField('seo_description', seo_description); // TEXT field
  
  if (status !== undefined) {
    updateData.status = parseInt(status);
  }

  try {
    // The model's updateAgent function includes checks for slug, email, and ORN number uniqueness,
    // and throws an error if no valid fields are provided or uniqueness checks fail.
    const updatedAgent = await AgentModel.updateAgent(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: updatedAgent
    });
  } catch (error) {
    console.error("Error in agent update controller:", error);
    return next(new ErrorHandler(error.message || 'Failed to update agent', 500));
  }
});

/**
 * @desc    Delete agent (soft delete)
 * @route   DELETE /api/agents/admin/:id
 * @access  Private/Admin
 */
export const deleteAgent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new ErrorHandler('Invalid agent ID', 400));
  }

  try {
    const success = await AgentModel.deleteAgent(id); // This performs a soft delete (status = 0)
    if (!success) {
      return next(new ErrorHandler('Agent not found or could not be deleted', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Agent deleted successfully (status set to inactive)'
    });
  } catch (error) {
    console.error('Error in agent deletion controller:', error);
    return next(new ErrorHandler(error.message || 'Failed to delete agent', 500));
  }
});

/**
 * @desc    Permanently delete agent (hard delete)
 * @route   DELETE /api/agents/admin/permanent/:id
 * @access  Private/Admin
 */
export const permanentDeleteAgent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return next(new ErrorHandler('Invalid agent ID', 400));
  }

  try {
    const success = await AgentModel.permanentDeleteAgent(id); // This performs a hard delete
    if (!success) {
      return next(new ErrorHandler('Agent not found or could not be permanently deleted', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Agent permanently deleted successfully'
    });
  } catch (error) {
    console.error('Error in agent permanent deletion controller:', error);
    return next(new ErrorHandler(error.message || 'Failed to permanently delete agent', 500));
  }
});

/**
 * @desc    Bulk update agent status
 * @route   PUT /api/agents/admin/bulk-status
 * @access  Private/Admin
 */
export const bulkUpdateAgentStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Invalid or empty array of agent IDs provided', 400));
  }
  if (status === undefined || (status !== 0 && status !== 1)) {
    return next(new ErrorHandler('Invalid status provided. Must be 0 or 1.', 400));
  }

  try {
    await AgentModel.bulkUpdateStatus(ids, status);

    res.status(200).json({
      success: true,
      message: `Selected agents' status updated to ${status === 1 ? 'active' : 'inactive'} successfully.`
    });
  } catch (error) {
    console.error('Error in bulk update status controller:', error);
    return next(new ErrorHandler(error.message || 'Failed to bulk update agent status', 500));
  }
});