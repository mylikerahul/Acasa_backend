import express from 'express';
import * as leadController from '../../controllers/leads/leads.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// Upload config for attachments (docs, images)
const attachmentUpload = createUploader('attachments', {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
});

// Create Lead (Public - e.g. Contact Form)
// Note: If you want this purely public, remove 'isAuthenticated'.
// Keeping it open here for general website use.
router.post(
  '/create', 
  attachmentUpload.single('attachment'), 
  leadController.createLead
);

// Get All Leads (Admin)
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  leadController.getAllLeads
);

// Get My Leads (Agent)
router.get(
  '/my-leads', 
  isAuthenticated, 
  leadController.getMyLeads
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, leadController.getLeadById)
  .put(
    isAuthenticated, 
    attachmentUpload.single('attachment'), 
    leadController.updateLead
  )
  .delete(isAuthenticated, isAdmin, leadController.deleteLead);

export default router;