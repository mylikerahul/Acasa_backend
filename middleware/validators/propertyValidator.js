import { body, query, param, validationResult } from 'express-validator';
import { ErrorHandler } from '../../utils/errorHandler.js';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return next(new ErrorHandler(errorMessages, 400));
  }
  next();
};

export const validateProperty = [
  body('property_name')
    .notEmpty().withMessage('Property name is required')
    .trim()
    .isLength({ max: 191 }).withMessage('Property name must be less than 191 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('bedroom')
    .notEmpty().withMessage('Bedrooms is required'),
  
  body('city')
    .notEmpty().withMessage('City is required'),
  
  body('community')
    .notEmpty().withMessage('Community is required'),
  
  handleValidationErrors
];

export const validatePropertyUpdate = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid property ID'),
  
  body('property_name')
    .optional()
    .trim()
    .isLength({ max: 191 }).withMessage('Property name must be less than 191 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  handleValidationErrors
];

export const validatePropertyFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];