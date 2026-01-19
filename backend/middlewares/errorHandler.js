// Error handling middleware
// Centralized error handling

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send error response
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  });
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 Not Found handler
export const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.method} ${req.path} not found`, 404);
  next(error);
};
