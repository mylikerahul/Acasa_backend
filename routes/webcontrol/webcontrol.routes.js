// backend/routes/webcontrol/webcontrol.routes.js

import express from 'express';
import * as WebControlController from '../../controllers/webcontrol/webcontrol.controller.js';
import { isAdmin, isAuthenticated } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// Define multer middleware outside of route handlers to avoid re-creation
const webcontrolUpload = createUploader('webcontrol', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
});

// ==================== PUBLIC ROUTES ====================

// Get all web controls (with optional filters)
router.get('/', WebControlController.getAllWebControls);

// Get single web control by ID or slug
router.get('/:id', WebControlController.getWebControlDetails);

// ==================== ADMIN PROTECTED ROUTES ====================

// Create new web control
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  webcontrolUpload.single('image'),
  WebControlController.createWebControl
);

// Update web control
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  webcontrolUpload.single('image'),
  WebControlController.updateWebControl
);

// Delete web control
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  WebControlController.deleteWebControl
);

export default router;