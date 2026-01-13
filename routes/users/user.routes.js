import express from 'express';
import * as userController from '../../controllers/users/users.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';
import { createUploader } from '../../middleware/uploads.js';

const router = express.Router();

// ==================== UPLOAD CONFIG ====================
const avatarUpload = createUploader('avatars', {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// ==================== PUBLIC ROUTES ====================

// Authentication
router.post('/register', avatarUpload.single('image'), userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/admin/login', userController.adminLogin);
router.post('/google-auth', userController.googleAuth);
router.post('/logout', userController.logout);

// Admin Token Verification (Public but requires token)
router.get('/admin/verify-token', userController.verifyAdminToken);

// Password Reset
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Get public list of users by type (only 'user' type allowed now)
router.get('/public/type/:usertype', userController.getPublicUsersByType);

// Get public user profile by ID (only 'user' type allowed now)
router.get('/public/:id', userController.getPublicUserById);


// ==================== PROTECTED ROUTES (Login Required) ====================

// Profile Management
router.get('/profile', isAuthenticated, userController.getProfile);
router.put('/profile', isAuthenticated, avatarUpload.single('image'), userController.updateProfile);
router.put('/update-password', isAuthenticated, userController.updatePassword);

// ==================== ADMIN ROUTES ====================

// Dashboard & Stats
router.get('/admin/stats', isAuthenticated, isAdmin, userController.getUserStats);

// Admin can get all users or filter by usertype via query param or by specific type route
router.get('/admin/all', isAuthenticated, isAdmin, userController.getAdminAllUsers);

// Admin can get users by type from params (e.g., /admin/type/user, /admin/type/admin)
router.get('/admin/type/:usertype', isAuthenticated, isAdmin, userController.getAdminUsersByType);

// Admin Get single user by ID
router.get('/admin/:id', isAuthenticated, isAdmin, userController.getAdminUserById);
// Admin Update user
router.put('/admin/:id', isAuthenticated, isAdmin, avatarUpload.single('image'), userController.updateAdminUser);
// Admin Update user status
router.patch('/admin/:id/status', isAuthenticated, isAdmin, userController.updateAdminUserStatus);
// Admin Delete user
router.delete('/admin/:id', isAuthenticated, isAdmin, userController.deleteAdminUser);


// Admin Create Admin (specific route for clarity)
router.post('/admin/admins', isAuthenticated, isAdmin, userController.createAdmin);


// Search (admin only)
router.get('/admin/search', isAuthenticated, isAdmin, userController.searchAdminUsers);


export default router;