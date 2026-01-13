import ErrorHandler from '../utils/errorHandler.js';

const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 🧩 Wrong Postgres Supabase ID error
  if (err.code === '22P02') {
    error = new ErrorHandler('Invalid Supabase ID', 400);
  }

  // 🧩 Duplicate key (unique constraint) error
  if (err.code === '23505') {
    error = new ErrorHandler('Duplicate field value entered', 400);
  }

  // 🧩 Invalid JWT
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorHandler('Invalid Token, please login again', 401);
  }

  // 🧩 Expired JWT
  if (err.name === 'TokenExpiredError') {
    error = new ErrorHandler('Your session has expired, please login again', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};

export default errorMiddleware;