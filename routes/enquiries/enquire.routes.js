// routes/enquiries/enquire.routes.js

import express from 'express';
import * as enquireController from '../../controllers/enquiries/enquire.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
const enquireUpload = createUploader('enquiries', {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
});

const uploadFields = enquireUpload.fields([
  { name: 'property_image', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]);

// ==================== PUBLIC ROUTES ====================

// Initialize table (run once)
router.post('/init-table', enquireController.initEnquireTable);

// Create enquiry (public - for website contact forms)
router.post('/create', uploadFields, enquireController.createEnquire);

// ==================== AUTHENTICATED ROUTES ====================

// Get all enquiries
router.get('/all', isAuthenticated, enquireController.getAllEnquiries);

// Get filtered enquiries with pagination
router.get('/list', isAuthenticated, enquireController.getFilteredEnquiries);

// Get enquiry stats
router.get('/stats', isAuthenticated, enquireController.getEnquiryStats);

// Get my enquiries (for logged in agent)
router.get('/my-enquiries', isAuthenticated, enquireController.getMyEnquiries);

// Get enquiries by agent ID
router.get('/agent/:agent_id', isAuthenticated, enquireController.getEnquiriesByAgent);

// Get single enquiry by ID
router.get('/:id', isAuthenticated, enquireController.getEnquireById);

// Update enquiry
router.put('/update/:id', isAuthenticated, uploadFields, enquireController.updateEnquire);

// Update enquiry status only
router.patch('/status/:id', isAuthenticated, enquireController.updateEnquireStatus);

// Assign agent to enquiry
router.patch('/assign-agent/:id', isAuthenticated, isAdmin, enquireController.assignAgent);

// Delete enquiry
router.delete('/delete/:id', isAuthenticated, isAdmin, enquireController.deleteEnquire);

// Bulk delete enquiries
router.post('/bulk-delete', isAuthenticated, isAdmin, enquireController.bulkDeleteEnquiries);

export default router;