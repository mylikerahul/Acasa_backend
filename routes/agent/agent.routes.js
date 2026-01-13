// backend/routes/agents/agents.routes.js
import express from 'express';
import * as agentController from '../../controllers/agent/agent.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
// Folder name 'agents'
const imageUpload = createUploader('agents', {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

/* =========================================================
   PUBLIC ROUTES
========================================================= */

/**
 * @route   GET /api/agents
 * @desc    Get all active agents (public)
 * @access  Public
 */
router.get('/', agentController.getAllAgents);

/**
 * @route   GET /api/agents/stats
 * @desc    Get public agent statistics
 * @access  Public
 */
router.get('/stats', agentController.getAgentStats);

/**
 * @route   GET /api/agents/company/:company
 * @desc    Get agents by company (public)
 * @access  Public
 */
router.get('/company/:company', agentController.getAgentsByCompany);

/**
 * @route   GET /api/agents/nationality/:nationality
 * @desc    Get agents by nationality (public)
 * @access  Public
 */
router.get('/nationality/:nationality', agentController.getAgentsByNationality);

/**
 * @route   GET /api/agents/:slugOrId
 * @desc    Get single agent by ID or slug (public)
 * @access  Public
 * @note    This should be LAST among public GET routes to avoid conflicts
 */
router.get('/:slugOrId', agentController.getAgentBySlugOrId);

/* =========================================================
   ADMIN ROUTES
========================================================= */

/**
 * @route   GET /api/agents/admin/all
 * @desc    Get all agents including inactive (admin)
 * @access  Private/Admin
 */
router.get('/admin/all', isAuthenticated, isAdmin, agentController.getAllAgentsAdmin);

/**
 * @route   GET /api/agents/admin/stats
 * @desc    Get full agent statistics (admin)
 * @access  Private/Admin
 */
router.get('/admin/stats', isAuthenticated, isAdmin, agentController.getAgentStatsAdmin);

/**
 * @route   GET /api/agents/admin/:id
 * @desc    Get single agent by ID (admin - includes inactive)
 * @access  Private/Admin
 */
router.get('/admin/:id', isAuthenticated, isAdmin, agentController.getAgentById);

/**
 * @route   POST /api/agents/admin/create
 * @desc    Create new agent
 * @access  Private/Admin
 */
router.post('/admin/create', isAuthenticated, isAdmin, agentController.createAgent);

/**
 * @route   POST /api/agents/admin/create-with-image
 * @desc    Create new agent with image upload
 * @access  Private/Admin
 */
router.post(
  '/admin/create-with-image',
  isAuthenticated,
  isAdmin,
  imageUpload.single('image'),
  agentController.createAgent
);

/**
 * @route   PUT /api/agents/admin/:id
 * @desc    Update agent
 * @access  Private/Admin
 */
router.put('/admin/:id', isAuthenticated, isAdmin, agentController.updateAgent);

/**
 * @route   PUT /api/agents/admin/:id/with-image
 * @desc    Update agent with image upload
 * @access  Private/Admin
 */
router.put(
  '/admin/:id/with-image',
  isAuthenticated,
  isAdmin,
  imageUpload.single('image'),
  agentController.updateAgent
);

/**
 * @route   DELETE /api/agents/admin/:id
 * @desc    Soft delete agent (set status to 0)
 * @access  Private/Admin
 */
router.delete('/admin/:id', isAuthenticated, isAdmin, agentController.deleteAgent);

/**
 * @route   DELETE /api/agents/admin/permanent/:id
 * @desc    Permanently delete agent (hard delete)
 * @access  Private/Admin
 */
router.delete('/admin/permanent/:id', isAuthenticated, isAdmin, agentController.permanentDeleteAgent);

/**
 * @route   PUT /api/agents/admin/bulk-status
 * @desc    Bulk update agent status
 * @access  Private/Admin
 */
router.put('/admin/bulk-status', isAuthenticated, isAdmin, agentController.bulkUpdateAgentStatus);

/* =========================================================
   EXPORT ROUTER
========================================================= */

export default router;