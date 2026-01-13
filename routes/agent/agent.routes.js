import express from 'express';
import * as agentController from '../../controllers/agent/agent.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// Upload configuration for agent images
const upload = createUploader('agents', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// Database fix route (run once to add image column)
router.get('/fix-db', async (req, res) => {
  try {
    await agentController.initTable(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public routes
router.get('/search', agentController.searchAgents);
router.get('/', agentController.getAllAgents);
router.get('/details/:slug', agentController.getAgentBySlug);
router.get('/:id', agentController.getAgentById);

// Admin protected routes
router.post(
  '/', 
  isAuthenticated, 
  isAdmin, 
  upload.single('image'),
  agentController.createAgent
);

router.put(
  '/:id', 
  isAuthenticated, 
  isAdmin, 
  upload.single('image'), 
  agentController.updateAgent
);

router.delete(
  '/:id', 
  isAuthenticated, 
  isAdmin, 
  agentController.deleteAgent
);

export default router;