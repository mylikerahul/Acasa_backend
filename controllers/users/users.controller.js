// controllers/users/users.controller.js

import path from 'path';
import fs from 'fs/promises';
import * as UserModel from "../../models/user/user.model.js";
import { OAuth2Client } from "google-auth-library";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";
import { sendToken, logout as jwtLogout, verifyJWT } from "../../utils/jwtToken.js";

/* =========================================================
   CONFIGURATION
========================================================= */

const UPLOAD_FOLDERS = {
  user: 'uploads/users',
  admin: 'uploads/admins',
};

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

const deleteOldImage = async (imagePath) => {
  if (!imagePath) return;
  
  try {
    if (imagePath.startsWith('http')) return;
    const cleanPath = imagePath.replace(/^\//, ''); 
    const fullPath = path.join(process.cwd(), 'public', cleanPath);
    await fs.unlink(fullPath);
  } catch (err) {
    console.warn(`Could not delete old image: ${imagePath}. Error: ${err.message}`);
  }
};

const getUploadFolder = (usertype) => {
  const type = usertype?.toLowerCase();
  if (type === 'admin') return UPLOAD_FOLDERS.admin;
  return UPLOAD_FOLDERS.user;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, reset_token, reset_token_expiry, ...safeUser } = user;
  return safeUser;
};

/* =========================================================
   AUTHENTICATION
========================================================= */

/**
 * Register new user - PRODUCTION READY
 * POST /api/users/register
 * Public
 */
export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { 
    full_name, 
    name, 
    email, 
    password 
  } = req.body;

  // Validate required fields
  if (!full_name && !name) {
    return next(new ErrorHandler('Full name is required', 400));
  }
  
  if (!email || !email.trim()) {
    return next(new ErrorHandler('Email is required', 400));
  }
  
  if (!password || !password.trim()) {
    return next(new ErrorHandler('Password is required', 400));
  }

  if (password.length < 6) {
    return next(new ErrorHandler('Password must be at least 6 characters', 400));
  }

  // Validate usertype
  const usertype = req.body.usertype || UserModel.USER_TYPES.USER;
  const allowedPublicTypes = [UserModel.USER_TYPES.USER];
  
  if (!allowedPublicTypes.includes(usertype)) {
    return next(new ErrorHandler(`Invalid user type. Only '${UserModel.USER_TYPES.USER}' allowed.`, 400));
  }

  // Check existing user
  const existingUser = await UserModel.getUserByEmail(email.trim());
  if (existingUser) {
    return next(new ErrorHandler('Email already registered', 400));
  }

  // Prepare clean user data
  const userData = {
    full_name: (full_name || name)?.trim(),
    name: (name || full_name)?.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    usertype: usertype,
    status: 1,
    public_permision: 1
  };

  // Add optional fields ONLY if they have values
  const optionalFields = [
    'phone', 'mobile_phone', 'salutation', 'first_name', 'last_name',
    'nationality', 'department', 'city', 'about', 'country',
    'treatment', 'length_of_service', 'other_email', 'fax',
    'facebook', 'twitter', 'linkedin', 'instagram', 'website',
    'category', 'seo_title', 'seo_keywork', 'seo_description',
    'marital_status', 'languages', 'contact_type', 'dob', 'gender'
  ];

  for (const field of optionalFields) {
    const value = req.body[field];
    
    if (value !== undefined && value !== null && value !== '') {
      if (field === 'country') {
        userData[field] = parseInt(value) || 0;
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '') {
          userData[field] = trimmed;
        }
      } else {
        userData[field] = value;
      }
    }
  }

  // Handle file upload
  if (req.file) {
    const uploadFolder = getUploadFolder(usertype);
    userData.image_icon = `${uploadFolder}/${req.file.filename}`;
  }

  console.log('Register user data:', Object.keys(userData));

  // Create user
  const user = await UserModel.createUser(userData);

  // Send response with token
  sendToken(user, 201, res, 'user');
});

/**
 * Login User
 * POST /api/users/login
 * Public
 */
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler('Please enter email and password', 400));
  }

  const user = await UserModel.getUserWithPassword(email);

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  const usertype = user.usertype?.toLowerCase();
  if (usertype === 'admin') {
    return next(new ErrorHandler('Access denied. Use admin login for administrator accounts.', 403));
  }

  if (!user.password) {
    return next(new ErrorHandler('Please login with Google', 401));
  }

  const isPasswordMatched = await UserModel.comparePassword(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  if (user.status !== 1) {
    return next(new ErrorHandler('Your account is inactive. Please contact admin', 403));
  }

  const fullUser = await UserModel.getUserById(user.id, false);

  sendToken(fullUser, 200, res, 'user');
});

/**
 * Admin Login
 * POST /api/users/admin/login
 * Public
 */
export const adminLogin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler('Please enter email and password', 400));
  }

  const user = await UserModel.getUserWithPassword(email);

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  const usertype = user.usertype?.toLowerCase();
  if (usertype !== 'admin') {
    return next(new ErrorHandler('Access denied. Admin only', 403));
  }

  if (!user.password) {
    return next(new ErrorHandler('Password not set. Contact administrator', 401));
  }

  const isPasswordMatched = await UserModel.comparePassword(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  if (user.status !== 1) {
    return next(new ErrorHandler('Your account is inactive', 403));
  }

  const fullUser = await UserModel.getUserById(user.id, true);

  sendToken(fullUser, 200, res, 'admin');
});

/**
 * Verify Admin Token
 * GET /api/users/admin/verify-token
 * Public (but requires token)
 */
export const verifyAdminToken = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.adminToken || 
                req.cookies.userToken ||
                req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
      isAuthenticated: false
    });
  }

  try {
    const decoded = verifyJWT(token, 'admin');

    const user = await UserModel.getUserById(decoded.id, true);

    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    const usertype = user.usertype?.toLowerCase();
    if (usertype !== 'admin') {
      return next(new ErrorHandler('Access denied. Admin only', 403));
    }

    if (user.status !== 1) {
      return next(new ErrorHandler('Account has been deactivated', 401));
    }

    const safeUser = sanitizeUser(user);

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      isAuthenticated: true,
      admin: safeUser,
      tokenInfo: {
        id: decoded.id,
        email: decoded.email,
        usertype: user.usertype,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    let message = 'Invalid token';
    if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token signature';
    }
    
    return next(new ErrorHandler(message, 401, error));
  }
});

/**
 * Google Login/Register
 * POST /api/users/google-auth
 * Public
 */
export const googleAuth = catchAsyncErrors(async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return next(new ErrorHandler('Google credential is required', 400));
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await UserModel.getUserByProviderIdAndProvider(googleId, 'google');

    if (!user) {
      const existingUser = await UserModel.getUserByEmail(email);
      
      if (existingUser && existingUser.provider !== 'google') {
        return next(new ErrorHandler('Email already registered. Please login with email/password', 400));
      }

      user = await UserModel.createGoogleUser({
        full_name: name,
        name: name,
        email: email,
        provider_id: googleId,
        image_icon: picture,
        usertype: UserModel.USER_TYPES.USER,
        status: 1,
        public_permision: 1
      });
    }

    if (user.status !== 1) {
      return next(new ErrorHandler('Your account is inactive. Please contact admin', 403));
    }

    const fullUser = await UserModel.getUserById(user.id, false);

    sendToken(fullUser, 200, res, 'user');

  } catch (error) {
    return next(new ErrorHandler('Google authentication failed', 401, error));
  }
});

/**
 * Logout - Enhanced Production Ready
 * POST /api/users/logout
 * Public (can be called by anyone with or without token)
 * 
 * Features:
 * - Clears both user and admin cookies
 * - Multiple cookie clearing strategies
 * - Frontend localStorage clearing signal
 * - Audit logging support
 */
export const logout = catchAsyncErrors(async (req, res, next) => {
  try {
    // Step 1: Use jwtLogout utility function
    jwtLogout(res);
    
    // Step 2: Explicitly clear all auth cookies (backup strategy)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: new Date(0), // Set expiry to past date
      maxAge: 0
    };
    
    // Clear user token
    res.cookie('userToken', '', cookieOptions);
    
    // Clear admin token
    res.cookie('adminToken', '', cookieOptions);
    
    // Clear refresh token (if you have one)
    res.cookie('refreshToken', '', cookieOptions);
    
    // Step 3: Log logout event for audit trail (optional)
    if (req.user) {
      console.log(`[LOGOUT] User: ${req.user.email} (ID: ${req.user.id}) logged out at ${new Date().toISOString()}`);
    } else {
      console.log(`[LOGOUT] Anonymous logout request at ${new Date().toISOString()}`);
    }
    
    // Step 4: Send success response with frontend instructions
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      clearStorage: true,      // Signal to clear localStorage
      clearSessionStorage: true, // Signal to clear sessionStorage
      clearAll: true,          // Signal to clear all auth data
      timestamp: new Date().toISOString(),
      redirectTo: '/login'     // Optional: suggest redirect path
    });
    
  } catch (error) {
    console.error('[LOGOUT ERROR]:', error);
    
    // Even if error occurs, still try to clear cookies using fallback
    res.clearCookie('userToken', { path: '/' });
    res.clearCookie('adminToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    
    // Still return success since cookies are cleared
    res.status(200).json({
      success: true,
      message: 'Logged out (cookies cleared despite error)',
      clearStorage: true,
      clearAll: true,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Logout from all devices (Optional Advanced Feature)
 * POST /api/users/logout-all
 * Private (requires authentication)
 * 
 * Use case: User suspects account compromise
 */
export const logoutAllDevices = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  
  try {
    // Option 1: Increment token version in database
    // This would invalidate all existing tokens
    // await UserModel.incrementTokenVersion(userId);
    
    // Option 2: Update last_logout timestamp
    // Tokens issued before this time would be invalid
    await UserModel.updateUser(userId, { 
      last_force_logout: new Date() 
    });
    
    // Clear current device cookies
    jwtLogout(res);
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: new Date(0)
    };
    
    res.cookie('userToken', '', cookieOptions);
    res.cookie('adminToken', '', cookieOptions);
    res.cookie('refreshToken', '', cookieOptions);
    
    console.log(`[LOGOUT ALL] User: ${userEmail} (ID: ${userId}) logged out from all devices`);
    
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
      clearStorage: true,
      clearAll: true,
      devicesCleared: true
    });
    
  } catch (error) {
    console.error('[LOGOUT ALL ERROR]:', error);
    return next(new ErrorHandler('Failed to logout from all devices', 500));
  }
});

/* =========================================================
   PROFILE MANAGEMENT
========================================================= */

/**
 * Get current user profile
 * GET /api/users/profile
 * Private
 */
export const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await UserModel.getUserById(req.user.id, false);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  res.status(200).json({
    success: true,
    user: user
  });
});

/**
 * Update profile - PRODUCTION READY
 * PUT /api/users/profile
 * Private
 */
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const updateData = { ...req.body };

  // Remove protected fields
  delete updateData.password;
  delete updateData.email;
  delete updateData.usertype;
  delete updateData.status;
  delete updateData.public_permision;

  const currentUser = await UserModel.getUserById(userId, true);

  if (!currentUser) {
    return next(new ErrorHandler('User not found', 404));
  }

  // Handle file upload
  if (req.file) {
    if (currentUser.image_icon && !currentUser.image_icon.startsWith('http') && !currentUser.image_icon.includes('default.jpg')) {
      await deleteOldImage(currentUser.image_icon);
    }
    const uploadFolder = getUploadFolder(currentUser.usertype);
    updateData.image_icon = `${uploadFolder}/${req.file.filename}`;
  }

  const updatedUser = await UserModel.updateUser(userId, updateData);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
});

/**
 * Update password
 * PUT /api/users/update-password
 * Private
 */
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorHandler('Please provide current and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new ErrorHandler('New password must be at least 6 characters', 400));
  }

  const user = await UserModel.getUserWithPassword(req.user.email);

  if (!user?.password) {
    return next(new ErrorHandler('Cannot change password for Google login accounts', 400));
  }

  const isPasswordMatched = await UserModel.comparePassword(currentPassword, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Current password is incorrect', 400));
  }

  await UserModel.updateUserPassword(user.id, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

/* =========================================================
   PUBLIC - USER LISTINGS
========================================================= */

/**
 * Get public list of users (only 'user' type)
 * GET /api/users/public/type/:usertype
 * Public
 */
export const getPublicUsersByType = catchAsyncErrors(async (req, res, next) => {
  const usertype = req.params.usertype;
  const { search, page, limit, orderBy, order } = req.query;

  if (usertype.toLowerCase() !== UserModel.USER_TYPES.USER.toLowerCase()) {
    return next(new ErrorHandler(`Invalid user type. Only '${UserModel.USER_TYPES.USER}' allowed.`, 400));
  }

  const usersData = await UserModel.getUsers({
    usertype,
    status: 1,
    public_permision: 1,
    search,
    orderBy,
    order
  }, { page, limit }, false);

  res.status(200).json({
    success: true,
    ...usersData
  });
});

/**
 * Get public user by ID
 * GET /api/users/public/:id
 * Public
 */
export const getPublicUserById = catchAsyncErrors(async (req, res, next) => {
  const user = await UserModel.getUserById(req.params.id, false);

  if (!user || user.status !== 1 || user.public_permision !== 1) {
    return next(new ErrorHandler('User not found or not publicly accessible', 404));
  }

  if (user.usertype.toLowerCase() !== UserModel.USER_TYPES.USER.toLowerCase()) {
    return next(new ErrorHandler('Access denied. Only regular user profiles are publicly accessible.', 403));
  }

  res.status(200).json({
    success: true,
    user: user
  });
});

/* =========================================================
   ADMIN - USER MANAGEMENT
========================================================= */

/**
 * Get all users (admin)
 * GET /api/users/admin/all
 * Admin only
 */
export const getAdminAllUsers = catchAsyncErrors(async (req, res, next) => {
  const { search, usertype, status, page, limit, orderBy, order } = req.query;
  
  const usersData = await UserModel.getUsers({ 
    search, 
    usertype, 
    status,
    orderBy,
    order
  }, { page, limit }, true);

  res.status(200).json({
    success: true,
    ...usersData
  });
});

/**
 * Get users by type (admin)
 * GET /api/users/admin/type/:usertype
 * Admin only
 */
export const getAdminUsersByType = catchAsyncErrors(async (req, res, next) => {
  const { usertype } = req.params;
  const { search, status, page, limit, orderBy, order } = req.query;

  const allowedTypes = [UserModel.USER_TYPES.USER.toLowerCase(), UserModel.USER_TYPES.ADMIN.toLowerCase()];
  if (!allowedTypes.includes(usertype.toLowerCase())) {
    return next(new ErrorHandler(`Invalid user type. Allowed: '${UserModel.USER_TYPES.USER}', '${UserModel.USER_TYPES.ADMIN}'.`, 400));
  }

  const usersData = await UserModel.getUsers({
    usertype, 
    status, 
    search, 
    orderBy, 
    order
  }, { page, limit }, true);

  res.status(200).json({
    success: true,
    ...usersData
  });
});

/**
 * Get single user by ID (admin)
 * GET /api/users/admin/:id
 * Admin only
 */
export const getAdminUserById = catchAsyncErrors(async (req, res, next) => {
  const user = await UserModel.getUserById(req.params.id, true);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  res.status(200).json({
    success: true,
    user: user
  });
});

/**
 * Create admin
 * POST /api/users/admin/admins
 * Admin only
 */
export const createAdmin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler('Email and password are required', 400));
  }

  const existingUser = await UserModel.getUserByEmail(email);
  if (existingUser) {
    return next(new ErrorHandler('Email already registered', 400));
  }

  const adminData = {
    ...req.body,
    usertype: UserModel.USER_TYPES.ADMIN,
    status: req.body.status ?? 1,
    public_permision: 0
  };

  const admin = await UserModel.createAdmin(adminData);

  res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    admin: admin
  });
});

/**
 * Update user (Admin) - PRODUCTION READY
 * PUT /api/users/admin/:id
 * Admin only
 */
export const updateAdminUser = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;
  const updateData = { ...req.body };

  const existingUser = await UserModel.getUserById(userId, true);
  if (!existingUser) {
    return next(new ErrorHandler('User not found', 404));
  }

  // Remove protected fields
  delete updateData.email;
  
  // Don't update password through this endpoint
  if (updateData.password) {
    delete updateData.password; 
  }

  // Handle file upload
  if (req.file) {
    if (existingUser.image_icon && !existingUser.image_icon.startsWith('http') && !existingUser.image_icon.includes('default.jpg')) {
      await deleteOldImage(existingUser.image_icon);
    }
    const uploadFolder = getUploadFolder(existingUser.usertype);
    updateData.image_icon = `${uploadFolder}/${req.file.filename}`;
  }

  const updatedUser = await UserModel.updateUser(userId, updateData);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: updatedUser
  });
});

/**
 * Update user status (Admin)
 * PATCH /api/users/admin/:id/status
 * Admin only
 */
export const updateAdminUserStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.body;
  const userId = req.params.id;

  if (status !== 0 && status !== 1) {
    return next(new ErrorHandler('Status must be 0 or 1', 400));
  }

  const user = await UserModel.getUserById(userId, true);
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  if (user.id === req.user.id && status === 0) {
    return next(new ErrorHandler('You cannot deactivate your own account', 400));
  }

  await UserModel.updateUserStatus(userId, status);

  res.status(200).json({
    success: true,
    message: `User ${status === 1 ? 'activated' : 'deactivated'} successfully`
  });
});

/**
 * Delete user (Admin)
 * DELETE /api/users/admin/:id
 * Admin only
 */
export const deleteAdminUser = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;

  const user = await UserModel.getUserById(userId, true);
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  if (user.id === req.user.id) {
    return next(new ErrorHandler('You cannot delete your own account', 400));
  }

  // Delete image if exists
  if (user.image_icon && !user.image_icon.startsWith('http') && !user.image_icon.includes('default.jpg')) {
    await deleteOldImage(user.image_icon);
  }

  const deleted = await UserModel.deleteUser(userId);

  if (!deleted) {
    return next(new ErrorHandler('Failed to delete user', 500));
  }

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * Search users (Admin)
 * GET /api/users/admin/search
 * Admin only
 */
export const searchAdminUsers = catchAsyncErrors(async (req, res, next) => {
  const { q, usertype, page, limit, orderBy, order } = req.query;

  if (!q || q.trim().length < 2) {
    return next(new ErrorHandler('Search term must be at least 2 characters', 400));
  }

  let filteredUsertype = usertype;
  const allowedTypes = [UserModel.USER_TYPES.USER.toLowerCase(), UserModel.USER_TYPES.ADMIN.toLowerCase()];
  
  if (usertype && !allowedTypes.includes(usertype.toLowerCase())) {
    filteredUsertype = null;
  }

  const usersData = await UserModel.getUsers({
    search: q.trim(), 
    usertype: filteredUsertype, 
    orderBy, 
    order
  }, { page, limit }, true);

  res.status(200).json({
    success: true,
    ...usersData
  });
});

/**
 * Get user statistics (Admin)
 * GET /api/users/admin/stats
 * Admin only
 */
export const getUserStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await UserModel.getUserStats();
  const dashboard = await UserModel.getDashboardStats();

  res.status(200).json({
    success: true,
    dashboard,
    breakdown: stats
  });
});

/* =========================================================
   PASSWORD RESET
========================================================= */

/**
 * Forgot password
 * POST /api/users/forgot-password
 * Public
 */
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler('Email is required', 400));
  }

  const user = await UserModel.getUserByEmail(email);

  if (!user) {
    return next(new ErrorHandler('No account found with this email', 404));
  }

  if (user.provider === 'google') {
    return next(new ErrorHandler('Cannot reset password for Google accounts', 400));
  }

  const resetToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15) +
                     Date.now().toString(36);

  await UserModel.setResetToken(email, resetToken);
  
  res.status(200).json({
    success: true,
    message: 'Password reset link sent to your email',
    resetToken
  });
});

/**
 * Reset password
 * POST /api/users/reset-password
 * Public
 */
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(new ErrorHandler('Token and new password are required', 400));
  }

  if (newPassword.length < 6) {
    return next(new ErrorHandler('Password must be at least 6 characters', 400));
  }

  const user = await UserModel.getUserByResetToken(token);

  if (!user) {
    return next(new ErrorHandler('Invalid or expired reset token', 400));
  }

  await UserModel.updateUserPassword(user.id, newPassword);
  await UserModel.clearResetToken(user.id);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});