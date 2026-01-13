import express from 'express';
import * as blocksController from '../../controllers/blocks/blocks.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
// Changed folder name from 'avatars' to 'blocks' to match content type
const imageUpload = createUploader('blocks', {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// Create new Block
router.post(
  '/create',
  isAuthenticated,
  isAdmin,
  imageUpload.single('imageurl'), // Matches DB column name
  blocksController.createBlock
);

// Get All Blocks
router.get(
  '/all',
  blocksController.getAllBlocks
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(blocksController.getBlockById)
  .put(
    isAuthenticated,
    isAdmin,
    imageUpload.single('imageurl'),
    blocksController.updateBlock
  )
  .delete(
    isAuthenticated,
    isAdmin,
    blocksController.deleteBlock
  );

export default router;