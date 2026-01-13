import express from 'express';
import * as userDocumentController from '../../controllers/users/users_documents.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';


const router = express.Router();



// Create a new document
router.post(
  '/create', 
  isAuthenticated, 
  userDocumentController.createDocument
);

// Get all documents (Admin only)
router.get(
  '/admin/all', 
  isAuthenticated, 
  isAdmin, 
  userDocumentController.getAllDocuments
);

// Get logged-in user's documents
router.get(
  '/me', 
  isAuthenticated, 
  userDocumentController.getMyDocuments
);

// Get documents by specific User ID (Admin)
router.get(
  '/user/:userId', 
  isAuthenticated, 
  isAdmin, 
  userDocumentController.getUserDocuments
);

// Get documents by Project ID
router.get(
  '/project/:projectId', 
  isAuthenticated, 
  userDocumentController.getProjectDocuments
);

// Get single document by ID, Update, Delete
router.route('/:id')
  .get(isAuthenticated, userDocumentController.getDocumentById)
  .put(
    isAuthenticated, 
    // upload.single('attachment'), // Uncomment when multer is ready
    userDocumentController.updateDocument
  )
  .delete(isAuthenticated, userDocumentController.deleteDocument);

export default router;