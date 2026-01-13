import { body } from 'express-validator';
import catchAsyncErrors from '#middleware/catchAsyncErrors.js';
import ErrorHandler from '#utils/errorHandler.js';

export const validateAdminProfile = catchAsyncErrors(async (req, res, next) => {
  const { age, pinCode, email, gender } = req.body;
  
  // Validate age
  if (age && (isNaN(age) || age < 18 || age > 100)) {
    return next(new ErrorHandler('Age must be between 18 and 100', 400));
  }
  
  // Validate pin code format (example for Indian pin codes)
  if (pinCode && !/^\d{6}$/.test(pinCode)) {
    return next(new ErrorHandler('Pin code must be 6 digits', 400));
  }
  
  // Validate email format
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new ErrorHandler('Invalid email format', 400));
  }
  
  // Validate gender
  if (gender && !['male', 'female', 'other'].includes(gender.toLowerCase())) {
    return next(new ErrorHandler('Gender must be male, female or other', 400));
  }
  
  next();
});

// Alternative using express-validator (more comprehensive)
export const validateAdminProfileWithExpressValidator = [
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail(),
  body('age').optional().isInt({ min: 18, max: 100 }),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('pinCode').optional().isPostalCode('IN'), // For Indian pin codes
  body('timezone').optional().isTimezone(),
  body('street').optional().isLength({ max: 100 }),
  body('city').optional().isLength({ max: 50 }),
  body('state').optional().isLength({ max: 50 }),
  body('country').optional().isLength({ max: 50 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorHandler(errors.array()[0].msg, 400));
    }
    next();
  }
];