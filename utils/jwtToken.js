// utils/jwtToken.js - PRODUCTION READY
import jwt from 'jsonwebtoken';

// ==================== TOKEN CONFIGURATION ====================

const TOKEN_CONFIG = {
  user: {
    secret: process.env.JWT_USER_SECRET || process.env.JWT_SECRET || 'user_secret_key_change_in_production',
    expire: process.env.JWT_USER_EXPIRE || '7d',
    cookieName: 'userToken',
    cookieExpire: 7 * 24 * 60 * 60 * 1000
  },
  admin: {
    secret: process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'admin_secret_key_change_in_production',
    expire: process.env.JWT_ADMIN_EXPIRE || '1d',
    cookieName: 'adminToken',
    cookieExpire: 24 * 60 * 60 * 1000
  }
};

// ==================== CORE FUNCTIONS ====================

const generateToken = (payload, userType = 'user') => {
  const config = TOKEN_CONFIG[userType];
  if (!config?.secret) throw new Error(`Invalid user type: ${userType}`);
  return jwt.sign(payload, config.secret, { expiresIn: config.expire });
};

const verifyJWT = (token, userType) => {
  const config = TOKEN_CONFIG[userType];
  if (!config?.secret) throw new Error(`Invalid user type: ${userType}`);
  return jwt.verify(token, config.secret);
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

// ==================== RESPONSE HANDLING ====================

const sendToken = (user, statusCode, res, userType = 'user') => {
  try {
    if (!user?.id || !user?.email) {
      throw new Error('Invalid user data');
    }

    if (!['user', 'admin'].includes(userType)) {
      throw new Error(`Invalid userType: ${userType}`);
    }

    const config = TOKEN_CONFIG[userType];
    if (!config?.secret) throw new Error('Token configuration error');

    const payload = {
      id: user.id,
      email: user.email,
      usertype: user.usertype,
      name: user.name || user.full_name,
      userType: userType,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = generateToken(payload, userType);

    const isDev = process.env.NODE_ENV === 'development';
    const cookieOptions = {
      expires: new Date(Date.now() + config.cookieExpire),
      httpOnly: true,
      secure: !isDev,
      sameSite: isDev ? 'Lax' : 'None',
      path: '/'
    };

    res.cookie(config.cookieName, token, cookieOptions);

    // Clear opposite token
    const oppositeType = userType === 'user' ? 'admin' : 'user';
    res.clearCookie(TOKEN_CONFIG[oppositeType].cookieName, cookieOptions);

    // Safe user object
    const safeUser = {
      id: user.id,
      usertype: user.usertype,
      full_name: user.full_name,
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      mobile_phone: user.mobile_phone,
      image_icon: user.image_icon,
      status: user.status,
      provider: user.provider,
      salutation: user.salutation,
      nationality: user.nationality,
      country: user.country,
      city: user.city,
      created_at: user.created_at,
      last_login: user.last_login,
      about: user.about
    };

    // Agent fields
    if (user.usertype === 'agents') {
      Object.assign(safeUser, {
        department: user.department,
        rera_brn: user.rera_brn,
        orn_number: user.orn_number,
        licence: user.licence
      });
    }

    // Developer fields
    if (user.usertype === 'developer') {
      safeUser.website = user.website;
    }

    return res.status(statusCode).json({
      success: true,
      message: 'Authentication successful',
      token,
      userType,
      user: safeUser
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ==================== MIDDLEWARE ====================

const verifyToken = (allowedTypes = ['user']) => {
  return async (req, res, next) => {
    try {
      let token = null;
      let tokenType = null;
      let decoded = null;

      // Strategy 1: Authorization header
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];

        for (const type of allowedTypes) {
          try {
            decoded = verifyJWT(token, type);
            tokenType = type;
            break;
          } catch {
            continue;
          }
        }
      }

      // Strategy 2: Cookies
      if (!tokenType && req.cookies) {
        for (const type of allowedTypes) {
          const cookieToken = req.cookies[TOKEN_CONFIG[type].cookieName];
          
          if (cookieToken) {
            try {
              decoded = verifyJWT(cookieToken, type);
              token = cookieToken;
              tokenType = type;
              break;
            } catch {
              continue;
            }
          }
        }
      }

      // No valid token
      if (!tokenType || !decoded) {
        return res.status(401).json({
          success: false,
          message: 'Please login to access this resource',
          error: 'NO_VALID_TOKEN'
        });
      }

      // Invalid payload
      if (!decoded.id || !decoded.email) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token data',
          error: 'INVALID_TOKEN_PAYLOAD'
        });
      }

      // Set user in request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        usertype: decoded.usertype,
        name: decoded.name,
        userType: tokenType
      };

      next();

    } catch (error) {
      let message = 'Authentication failed';
      let errorCode = 'AUTH_ERROR';

      if (error.name === 'TokenExpiredError') {
        message = 'Session expired. Please login again.';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please login again.';
        errorCode = 'INVALID_TOKEN';
      }

      return res.status(401).json({
        success: false,
        message,
        error: errorCode
      });
    }
  };
};

const verifyUserToken = () => verifyToken(['user']);
const verifyAdminToken = () => verifyToken(['admin']);
const verifyAnyToken = () => verifyToken(['user', 'admin']);

// ==================== LOGOUT ====================

const logout = (res) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const clearOptions = {
      httpOnly: true,
      secure: !isDev,
      sameSite: isDev ? 'Lax' : 'None',
      path: '/'
    };

    Object.keys(TOKEN_CONFIG).forEach(type => {
      res.clearCookie(TOKEN_CONFIG[type].cookieName, clearOptions);
    });

    return true;
  } catch {
    return false;
  }
};

// ==================== UTILITY FUNCTIONS ====================

const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return true;
    return Math.floor(Date.now() / 1000) > decoded.exp;
  } catch {
    return true;
  }
};

const getTokenExpiry = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return null;
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

const getTokenTimeRemaining = (token) => {
  try {
    const expiry = getTokenExpiry(token);
    if (!expiry) return 0;
    return expiry.getTime() - Date.now();
  } catch {
    return 0;
  }
};

// ==================== EXPORTS ====================

export {
  TOKEN_CONFIG,
  sendToken,
  verifyToken,
  verifyUserToken,
  verifyAdminToken,
  verifyAnyToken,
  logout,
  generateToken,
  verifyJWT,
  decodeToken,
  isTokenExpired,
  getTokenExpiry,
  getTokenTimeRemaining
};