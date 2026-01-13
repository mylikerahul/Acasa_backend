// E:/MKPandey/Project/Acasa/backend/middleware/validators/projectValidator.js

import { body, validationResult } from 'express-validator';
import ErrorHandler from '../../utils/errorHandler.js';

export const validateProject = [ // <-- यह एक array of middleware है
  body('ProjectName').notEmpty().withMessage('Project name is required'),
  body('project_slug').optional().isSlug().withMessage('Invalid slug format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return next(new ErrorHandler(errorMessages, 400));
    }
    next();
  }
];

export const validateProjectUpdate = [ // <-- यह भी एक array of middleware है
  // Add actual validation rules here, otherwise it's just the error handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return next(new ErrorHandler(errorMessages, 400));
    }
    next();
  }
];

export const validateProjectContact = [ // <-- यह भी एक array of middleware है
  body('project_id').notEmpty().isInt().withMessage('Valid project ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return next(new ErrorHandler(errorMessages, 400));
    }
    next();
  }
];