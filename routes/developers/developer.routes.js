import express from 'express';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';
import * as DeveloperController from '../../controllers/developers/developer.controller.js';

const router = express.Router();

const upload = createUploader('developers', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
});

router.get('/', DeveloperController.getAllDevelopers);
router.get('/stats', DeveloperController.getDeveloperStats);
router.get('/check-slug/:slug', DeveloperController.checkSlug);

router.get('/admin/all', isAuthenticated, isAdmin, DeveloperController.getAllDevelopersAdmin);
router.get('/admin/:id', isAuthenticated, isAdmin, DeveloperController.getDeveloperById);

router.post(
  '/admin/create',
  isAuthenticated,
  isAdmin,
  upload.single('image'),
  DeveloperController.createDeveloper
);

router.put(
  '/admin/:id',
  isAuthenticated,
  isAdmin,
  upload.single('image'),
  DeveloperController.updateDeveloper
);

router.delete(
  '/admin/:id',
  isAuthenticated,
  isAdmin,
  DeveloperController.deleteDeveloper
);

router.delete(
  '/admin/:id/permanent',
  isAuthenticated,
  isAdmin,
  DeveloperController.permanentDeleteDeveloper
);

router.delete(
  '/admin/:id/image',
  isAuthenticated,
  isAdmin,
  DeveloperController.deleteDeveloperImage
);

router.get('/:slugOrId', DeveloperController.getDeveloperBySlugOrId);

export default router;