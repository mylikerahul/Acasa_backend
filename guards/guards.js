// backend/guards/guards.js
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/user/user.model.js'; // Ensure this path is correct
import ErrorHandler from '../utils/errorHandler.js';
import catchAsyncErrors from '../middleware/catchAsyncErrors.js';

const TOKEN_CONFIG = {
  user: {
    secret: process.env.JWT_USER_SECRET || 'user_secret_key_change_in_production',
    cookieName: 'userToken'
  },
  admin: {
    secret: process.env.JWT_ADMIN_SECRET || 'admin_secret_key_change_in_production',
    cookieName: 'adminToken'
  }
};

/**
 * Generic authentication - supports both user and admin
 */
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  // console.log('🔍 isAuthenticated middleware started'); // Keep for debugging if needed
  // console.log('📋 Headers:', req.headers.authorization?.substring(0, 50));
  // console.log('🍪 Cookies:', req.cookies ? Object.keys(req.cookies) : 'none');

  let token = null;
  let tokenType = null;

  // STRATEGY 1: Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    // console.log('📦 Token from header found');

    // Try admin secret first, then user secret
    for (const type of ['admin', 'user']) {
      try {
        const decoded = jwt.verify(token, TOKEN_CONFIG[type].secret);
        tokenType = type;
        // console.log(`✅ Token verified as ${type}`);
        
        const user = await UserModel.getUserById(decoded.id);
        if (!user) {
          return next(new ErrorHandler('User not found', 404));
        }
        if (user.status !== 1) { // Assuming 1 means active
          return next(new ErrorHandler('Your account is inactive', 403));
        }
        
        req.user = user;
        req.tokenType = tokenType;
        // console.log('✅ User authenticated:', user.email);
        return next();
        
      } catch (err) {
        // console.log(`❌ Verification failed as ${type}:`, err.message);
        continue;
      }
    }
  }

  // STRATEGY 2: Check cookies
  if (!token && req.cookies) {
    for (const type of ['admin', 'user']) {
      const cookieToken = req.cookies[TOKEN_CONFIG[type].cookieName];
      if (cookieToken) {
        try {
          const decoded = jwt.verify(cookieToken, TOKEN_CONFIG[type].secret);
          // console.log(`✅ Token verified from ${type} cookie`);
          
          const user = await UserModel.getUserById(decoded.id);
          if (!user) {
            return next(new ErrorHandler('User not found', 404));
          }
          if (user.status !== 1) {
            return next(new ErrorHandler('Your account is inactive', 403));
          }
          
          req.user = user;
          req.tokenType = type;
          // console.log('✅ User authenticated from cookie:', user.email);
          return next();
          
        } catch (err) {
          // console.log(`❌ Cookie verification failed as ${type}:`, err.message);
          continue;
        }
      }
    }
  }

  // console.log('❌ No valid token found');
  return next(new ErrorHandler('Please login to access this resource', 401));
});

/**
 * Admin-only middleware
 */
export const isAdmin = catchAsyncErrors(async (req, res, next) => {
  // console.log('🔍 isAdmin middleware checking...');
  
  if (!req.user) {
    // console.log('❌ No user in request');
    return next(new ErrorHandler('Please login first', 401));
  }

  const usertype = req.user.usertype?.toLowerCase();
  // console.log('👤 User type:', usertype);
  
  if (usertype !== 'admin') {
    // console.log('❌ User is not admin');
    return next(new ErrorHandler('Access denied. Admin only', 403));
  }

  // console.log('✅ Admin access granted');
  next();
});

/**
 * Role-based authorization
 */
export const authorizeRoles = (...roles) => {
  return catchAsyncErrors(async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler('Please login first', 401));
    }

    const usertype = req.user.usertype?.toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());

    if (!normalizedRoles.includes(usertype)) {
      return next(new ErrorHandler(`Access denied. Required role: ${roles.join(' or ')}`, 403));
    }

    next();
  });
};