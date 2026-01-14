// controllers/users/users.controller.js

import path from 'path';
import fs from 'fs/promises';
import * as UserModel from "../../models/user/user.model.js";
import { OAuth2Client } from "google-auth-library";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";
import { sendToken, logout as jwtLogout, verifyJWT } from "../../utils/jwtToken.js";

const UPLOAD_FOLDERS = {
  user: 'uploads/users',
  admin: 'uploads/admins',
};

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const deleteOldImage = async (imagePath) => {
  if (!imagePath || imagePath.startsWith('http')) return;
  try {
    const cleanPath = imagePath.replace(/^\//, ''); 
    const fullPath = path.join(process.cwd(), 'public', cleanPath);
    await fs.unlink(fullPath);
  } catch (err) {
    console.warn(`⚠️ Could not delete: ${imagePath}`);
  }
};

const getUploadFolder = (usertype) => {
  return usertype?.toLowerCase() === 'admin' ? UPLOAD_FOLDERS.admin : UPLOAD_FOLDERS.user;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, reset_token, reset_token_expiry, ...safeUser } = user;
  return safeUser;
};

/* =========================================================
   REGISTER USER
========================================================= */

export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { full_name, name, email, password, phone } = req.body;

  if (!email || !email.trim()) {
    return next(new ErrorHandler('Email is required', 400));
  }
  
  if (!password || !password.trim()) {
    return next(new ErrorHandler('Password is required', 400));
  }

  if (password.length < 6) {
    return next(new ErrorHandler('Password must be at least 6 characters', 400));
  }

  const existingUser = await UserModel.getUserByEmail(email.trim());
  if (existingUser) {
    return next(new ErrorHandler('Email already registered', 400));
  }

  const userData = {
    email: email.trim().toLowerCase(),
    password: password,
    usertype: req.body.usertype || UserModel.USER_TYPES.USER,
    status: 1,
    public_permision: 1
  };

  if (full_name && full_name.trim()) userData.full_name = full_name.trim();
  if (name && name.trim()) userData.name = name.trim();
  
  if (!userData.full_name && !userData.name) {
    const emailUsername = email.split('@')[0];
    userData.name = emailUsername;
    userData.full_name = emailUsername;
  }

  if (phone && phone.trim()) userData.phone = phone.trim();

  const optionalFields = [
    'salutation', 'first_name', 'last_name', 'mobile_phone', 
    'nationality', 'department', 'city', 'about', 'country',
    'treatment', 'length_of_service', 'other_email', 'fax',
    'facebook', 'twitter', 'linkedin', 'instagram', 'website',
    'category', 'marital_status', 'languages', 'contact_type', 
    'dob', 'gender'
  ];

  for (const field of optionalFields) {
    const value = req.body[field];
    if (value !== undefined && value !== null && value !== '') {
      if (field === 'country') {
        userData[field] = parseInt(value) || 0;
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '') userData[field] = trimmed;
      } else {
        userData[field] = value;
      }
    }
  }

  if (req.file) {
    const uploadFolder = getUploadFolder(userData.usertype);
    userData.image_icon = `${uploadFolder}/${req.file.filename}`;
  }

  console.log('✅ Registering:', userData.email);

  try {
    const user = await UserModel.createUser(userData);
    sendToken(user, 201, res, 'user');
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return next(new ErrorHandler('Email already registered', 400));
    }
    
    if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
      return next(new ErrorHandler('Database error. Please contact support.', 500));
    }
    
    throw error;
  }
});

/* =========================================================
   LOGIN USER
========================================================= */

export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler('Please enter email and password', 400));
  }

  const user = await UserModel.getUserWithPassword(email);

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  if (user.usertype?.toLowerCase() === 'admin') {
    return next(new ErrorHandler('Use admin login endpoint', 403));
  }

  if (!user.password) {
    return next(new ErrorHandler('Please login with Google', 401));
  }

  const isPasswordMatched = await UserModel.comparePassword(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  if (user.status !== 1) {
    return next(new ErrorHandler('Account inactive. Contact admin', 403));
  }

  const fullUser = await UserModel.getUserById(user.id, false);
  sendToken(fullUser, 200, res, 'user');
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

export const adminLogin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler('Please enter email and password', 400));
  }

  const user = await UserModel.getUserWithPassword(email);

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  if (user.usertype?.toLowerCase() !== 'admin') {
    return next(new ErrorHandler('Admin access required', 403));
  }

  if (!user.password) {
    return next(new ErrorHandler('Password not set', 401));
  }

  const isPasswordMatched = await UserModel.comparePassword(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  if (user.status !== 1) {
    return next(new ErrorHandler('Account inactive', 403));
  }

  const fullUser = await UserModel.getUserById(user.id, true);
  sendToken(fullUser, 200, res, 'admin');
});

/* =========================================================
   GOOGLE AUTH
========================================================= */

export const googleAuth = catchAsyncErrors(async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return next(new ErrorHandler('Google credential required', 400));
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { 
      sub: googleId, 
      email, 
      name, 
      picture,
      given_name: firstName,
      family_name: lastName
    } = payload;

    console.log('✅ Google verified:', email);

    let user = await UserModel.getUserByProviderIdAndProvider(googleId, 'google');

    if (!user) {
      const existingUser = await UserModel.getUserByEmail(email);
      
      if (existingUser && existingUser.provider !== 'google') {
        return next(new ErrorHandler('Email registered with password. Use email/password login', 400));
      }

      user = await UserModel.createGoogleUser({
        full_name: name,
        name: name,
        first_name: firstName,
        last_name: lastName,
        email: email,
        provider_id: googleId,
        image_icon: picture,
        usertype: UserModel.USER_TYPES.USER,
        status: 1,
        public_permision: 1
      });

      console.log('✅ Google user created:', user.email);
    }

    if (user.status !== 1) {
      return next(new ErrorHandler('Account inactive. Contact admin', 403));
    }

    if (user.usertype?.toLowerCase() === 'admin') {
      return next(new ErrorHandler('Admin must use admin portal', 403));
    }

    const fullUser = await UserModel.getUserById(user.id, false);
    sendToken(fullUser, 200, res, 'user');

  } catch (error) {
    console.error('❌ Google auth error:', error);
    return next(new ErrorHandler('Google authentication failed', 401, error));
  }
});

/* =========================================================
   ADMIN GOOGLE AUTH
========================================================= */

export const adminGoogleAuth = catchAsyncErrors(async (req, res, next) => {
  const { credential, isAdminLogin } = req.body;

  if (!credential) {
    return next(new ErrorHandler('Google credential required', 400));
  }

  if (!isAdminLogin) {
    return next(new ErrorHandler('Admin endpoint only', 403));
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

      if (existingUser) {
        const usertype = existingUser.usertype?.toLowerCase();

        if (usertype !== 'admin') {
          return next(new ErrorHandler('Not registered as admin', 403));
        }

        if (existingUser.provider !== 'google') {
          return next(new ErrorHandler('Admin uses email/password login', 400));
        }
      } else {
        return next(new ErrorHandler('Google account not registered as admin', 403));
      }
    }

    if (user.usertype?.toLowerCase() !== 'admin') {
      return next(new ErrorHandler('Admin access required', 403));
    }

    if (user.status !== 1) {
      return next(new ErrorHandler('Account inactive', 403));
    }

    const fullUser = await UserModel.getUserById(user.id, true);
    sendToken(fullUser, 200, res, 'admin');
  } catch (error) {
    console.error('❌ Admin Google auth error:', error);
    return next(new ErrorHandler('Google authentication failed', 401, error));
  }
});

/* =========================================================
   VERIFY ADMIN TOKEN
========================================================= */

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

    if (user.usertype?.toLowerCase() !== 'admin') {
      return next(new ErrorHandler('Admin only', 403));
    }

    if (user.status !== 1) {
      return next(new ErrorHandler('Account deactivated', 401));
    }

    const safeUser = sanitizeUser(user);

    res.status(200).json({
      success: true,
      message: 'Token valid',
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
    if (error.name === 'TokenExpiredError') message = 'Token expired';
    else if (error.name === 'JsonWebTokenError') message = 'Invalid signature';
    
    return next(new ErrorHandler(message, 401, error));
  }
});

/* =========================================================
   LOGOUT
========================================================= */

export const logout = catchAsyncErrors(async (req, res, next) => {
  try {
    jwtLogout(res);
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: new Date(0),
      maxAge: 0
    };
    
    res.cookie('userToken', '', cookieOptions);
    res.cookie('adminToken', '', cookieOptions);
    res.cookie('refreshToken', '', cookieOptions);
    
    if (req.user) {
      console.log(`✅ Logout: ${req.user.email}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      clearStorage: true,
      clearSessionStorage: true,
      clearAll: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    res.clearCookie('userToken', { path: '/' });
    res.clearCookie('adminToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    
    res.status(200).json({
      success: true,
      message: 'Logged out',
      clearStorage: true,
      clearAll: true
    });
  }
});
// ... (previous code continues)

/* =========================================================
   PROFILE MANAGEMENT
========================================================= */

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

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const updateData = { ...req.body };

  delete updateData.password;
  delete updateData.email;
  delete updateData.usertype;
  delete updateData.status;
  delete updateData.public_permision;

  const currentUser = await UserModel.getUserById(userId, true);

  if (!currentUser) {
    return next(new ErrorHandler('User not found', 404));
  }

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
   PUBLIC USER ROUTES
========================================================= */

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

export const getPublicUserById = catchAsyncErrors(async (req, res, next) => {
  const user = await UserModel.getUserById(req.params.id, false);

  if (!user || user.status !== 1 || user.public_permision !== 1) {
    return next(new ErrorHandler('User not found or not publicly accessible', 404));
  }

  if (user.usertype.toLowerCase() !== UserModel.USER_TYPES.USER.toLowerCase()) {
    return next(new ErrorHandler('Access denied', 403));
  }

  res.status(200).json({
    success: true,
    user: user
  });
});

/* =========================================================
   ADMIN USER MANAGEMENT
========================================================= */

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

export const getAdminUsersByType = catchAsyncErrors(async (req, res, next) => {
  const { usertype } = req.params;
  const { search, status, page, limit, orderBy, order } = req.query;

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

export const updateAdminUser = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;
  const updateData = { ...req.body };

  const existingUser = await UserModel.getUserById(userId, true);
  if (!existingUser) {
    return next(new ErrorHandler('User not found', 404));
  }

  delete updateData.email;
  delete updateData.password;

  if (req.file) {
    if (existingUser.image_icon && !existingUser.image_icon.startsWith('http')) {
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

export const deleteAdminUser = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;

  const user = await UserModel.getUserById(userId, true);
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  if (user.id === req.user.id) {
    return next(new ErrorHandler('You cannot delete your own account', 400));
  }

  if (user.image_icon && !user.image_icon.startsWith('http')) {
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

export const searchAdminUsers = catchAsyncErrors(async (req, res, next) => {
  const { q, usertype, page, limit, orderBy, order } = req.query;

  if (!q || q.trim().length < 2) {
    return next(new ErrorHandler('Search term must be at least 2 characters', 400));
  }

  const usersData = await UserModel.getUsers({
    search: q.trim(), 
    usertype, 
    orderBy, 
    order
  }, { page, limit }, true);

  res.status(200).json({
    success: true,
    ...usersData
  });
});

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