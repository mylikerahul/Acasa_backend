import * as AgentModel from '../../models/agent/agent.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// Helper Function: Slug Generator
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    + '-' + Date.now();       // Add timestamp to ensure it is unique
};

/* =========================================================
   1. INIT TABLE (Admin Only - Run once via API if needed)
========================================================= */
export const initTable = catchAsyncErrors(async (req, res, next) => {
  await AgentModel.createAgentsTable();
  res.status(200).json({
    success: true,
    message: 'Agents table checked and schema updated successfully.',
  });
});

/* =========================================================
   2. CREATE AGENT
========================================================= */
export const createAgent = catchAsyncErrors(async (req, res, next) => {
  // 1. Data Collection
  let agentData = { ...req.body };

  // 2. Validate Name
  if (!agentData.name) {
    return next(new ErrorHandler('Name is required', 400));
  }

  // 3. Handle Image Upload (Multer middleware se req.file milta hai)
  if (req.file) {
    agentData.image = req.file.filename; // Database mein sirf filename save hoga
  }

  // 4. Generate Slug if not provided
  if (!agentData.slug) {
    agentData.slug = generateSlug(agentData.name);
  } else {
    // Agar slug user ne diya hai, usko bhi clean kar lo
    agentData.slug = agentData.slug.toLowerCase().replace(/\s+/g, '-');
  }

  // 5. Database Operation
  try {
    const result = await AgentModel.createAgent(agentData);
    const newAgent = await AgentModel.getAgentById(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      agent: newAgent,
    });
  } catch (error) {
    // Handle Duplicate Slug or Email
    if (error.code === 'ER_DUP_ENTRY') {
      return next(new ErrorHandler('Agent with this Slug or Email already exists.', 400));
    }
    return next(new ErrorHandler(error.message, 500));
  }
});

/* =========================================================
   3. GET ALL AGENTS (With Pagination Support Logic)
========================================================= */
export const getAllAgents = catchAsyncErrors(async (req, res, next) => {
  // Note: Filhal Model mein basic select all hai. 
  // Agar search query param hai to search function call karein
  const { search, q } = req.query;
  
  if (search || q) {
    const searchTerm = search || q;
    const agents = await AgentModel.searchAgents(searchTerm);
    return res.status(200).json({
      success: true,
      count: agents.length,
      agents,
    });
  }

  const agents = await AgentModel.getAllAgents();
  
  res.status(200).json({
    success: true,
    count: agents.length,
    agents, // Frontend expects "agents" array
  });
});

/* =========================================================
   4. GET AGENT BY ID
========================================================= */
export const getAgentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const agent = await AgentModel.getAgentById(id);

  if (!agent) {
    return next(new ErrorHandler('Agent not found', 404));
  }

  res.status(200).json({
    success: true,
    agent,
  });
});

/* =========================================================
   5. GET AGENT BY SLUG (Public/SEO)
========================================================= */
export const getAgentBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;
  const agent = await AgentModel.getAgentBySlug(slug);

  if (!agent) {
    return next(new ErrorHandler('Agent not found', 404));
  }

  res.status(200).json({
    success: true,
    agent,
  });
});

/* =========================================================
   6. SEARCH AGENTS
========================================================= */
export const searchAgents = catchAsyncErrors(async (req, res, next) => {
  const { q } = req.query; // e.g., ?q=john

  if (!q) {
    return next(new ErrorHandler('Please provide a search term', 400));
  }

  const agents = await AgentModel.searchAgents(q);

  res.status(200).json({
    success: true,
    count: agents.length,
    agents,
  });
});

/* =========================================================
   7. UPDATE AGENT
========================================================= */
export const updateAgent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  let agentData = { ...req.body };

  // Check if agent exists
  const existingAgent = await AgentModel.getAgentById(id);
  if (!existingAgent) {
    return next(new ErrorHandler('Agent not found', 404));
  }

  // Handle Image Update
  if (req.file) {
    agentData.image = req.file.filename;
    // (Optional) Aap yahan purani image delete karne ka logic laga sakte hain fs.unlinkSync use karke
  }

  // Handle Slug Update check
  if (agentData.slug && agentData.slug !== existingAgent.slug) {
     // Ensure safe slug
     agentData.slug = agentData.slug.toLowerCase().replace(/\s+/g, '-');
  }

  await AgentModel.updateAgent(id, agentData);
  const updatedAgent = await AgentModel.getAgentById(id);

  res.status(200).json({
    success: true,
    message: 'Agent updated successfully',
    agent: updatedAgent,
  });
});

/* =========================================================
   8. DELETE AGENT
========================================================= */
export const deleteAgent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const agent = await AgentModel.getAgentById(id);
  if (!agent) {
    return next(new ErrorHandler('Agent not found', 404));
  }

  // Call Model Delete (Soft Delete as per model logic)
  await AgentModel.deleteAgent(id);

  res.status(200).json({
    success: true,
    message: 'Agent deleted successfully',
  });
});