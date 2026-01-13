/**
 * Custom Error Handler Class
 * Extends the built-in Error class for better error handling
 */
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Static method to create a 400 Bad Request error
   * @param {string} message - Error message
   * @returns {ErrorHandler} ErrorHandler instance
   */
  static badRequest(message = 'Bad Request') {
    return new ErrorHandler(message, 400);
  }

  /**
   * Static method to create a 401 Unauthorized error
   * @param {string} message - Error message
   * @returns {ErrorHandler} ErrorHandler instance
   */
  static unauthorized(message = 'Unauthorized') {
    return new ErrorHandler(message, 401);
  }

  /**
   * Static method to create a 403 Forbidden error
   * @param {string} message - Error message
   * @returns {ErrorHandler} ErrorHandler instance
   */
  static forbidden(message = 'Forbidden') {
    return new ErrorHandler(message, 403);
  }

  /**
   * Static method to create a 404 Not Found error
   * @param {string} message - Error message
   * @returns {ErrorHandler} ErrorHandler instance
   */
  static notFound(message = 'Resource not found') {
    return new ErrorHandler(message, 404);
  }

  /**
   * Static method to create a 409 Conflict error
   * @param {string} message - Error message
   * @returns {ErrorHandler} ErrorHandler instance
   */
  static conflict(message = 'Conflict') {
    return new ErrorHandler(message, 409);
  }

  /**
   * Static method to create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @returns {ErrorHandler} ErrorHandler instance
   */
  static unprocessableEntity(message = 'Validation failed') {
    return new ErrorHandler(message, 422);
  }

  /**
   * Static method to create a 500 Internal Server Error
   * @param {string} message - Error message
   * @returns {ErrorHandler} ErrorHandler instance
   */
  static internalServerError(message = 'Internal Server Error') {
    return new ErrorHandler(message, 500);
  }

  /**
   * Convert error to JSON format for API responses
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      status: this.status,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

// ES6 default export
export default ErrorHandler;

// Named exports for convenience
export {
  ErrorHandler
};