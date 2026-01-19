// Rate limiting middleware
// TODO: Implement rate limiting using express-rate-limit

export const rateLimiter = (req, res, next) => {
  // TODO: Implement rate limiting logic
  // For now, just pass through
  next();
};

export const authRateLimiter = (req, res, next) => {
  // TODO: Stricter rate limiting for authentication endpoints
  next();
};

export const uploadRateLimiter = (req, res, next) => {
  // TODO: Rate limiting for upload endpoints
  next();
};
