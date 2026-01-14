// routes/users/users.routes.js

import express from 'express';
import * as userController from '../../controllers/users/users.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// Upload config
const avatarUpload = createUploader('avatars', {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// ==================== PUBLIC ROUTES ====================

// Authentication
router.post('/register', avatarUpload.single('image'), userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/google-auth', userController.googleAuth);
router.post('/logout', userController.logout);

// Admin Auth
router.post('/admin/login', userController.adminLogin);
router.post('/admin/google-auth', userController.adminGoogleAuth);
router.get('/admin/verify-token', userController.verifyAdminToken);

// Password Reset
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Public Users
router.get('/public/type/:usertype', userController.getPublicUsersByType);
router.get('/public/:id', userController.getPublicUserById);

// ==================== PROTECTED ROUTES ====================

// Profile
router.get('/profile', isAuthenticated, userController.getProfile);
router.put('/profile', isAuthenticated, avatarUpload.single('image'), userController.updateProfile);
router.put('/update-password', isAuthenticated, userController.updatePassword);

// ==================== ADMIN ROUTES ====================

router.get('/admin/stats', isAuthenticated, isAdmin, userController.getUserStats);
router.get('/admin/all', isAuthenticated, isAdmin, userController.getAdminAllUsers);
router.get('/admin/type/:usertype', isAuthenticated, isAdmin, userController.getAdminUsersByType);
router.get('/admin/:id', isAuthenticated, isAdmin, userController.getAdminUserById);
router.put('/admin/:id', isAuthenticated, isAdmin, avatarUpload.single('image'), userController.updateAdminUser);
router.patch('/admin/:id/status', isAuthenticated, isAdmin, userController.updateAdminUserStatus);
router.delete('/admin/:id', isAuthenticated, isAdmin, userController.deleteAdminUser);
router.post('/admin/admins', isAuthenticated, isAdmin, userController.createAdmin);
router.get('/admin/search', isAuthenticated, isAdmin, userController.searchAdminUsers);

export default router;