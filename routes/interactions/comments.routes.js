import express from 'express';
import * as commentController from '../../controllers/interactions/comments.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create Comment (Authenticated Users)
router.post(
  '/create', 
  isAuthenticated, 
  commentController.createComment
);

// Get Comments for a specific entity (e.g. /entity/blog/5)
router.get(
  '/entity/:type/:pid', 
  commentController.getCommentsByEntity
);

// Get All Comments (Admin)
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  commentController.getAllComments
);

// Get, Update, Delete by ID
router.route('/:id')
  // Update/Reply (Admin or Owner)
  .put(isAuthenticated, commentController.updateComment)
  // Delete (Admin or Owner)
  .delete(isAuthenticated, commentController.deleteComment);

export default router;