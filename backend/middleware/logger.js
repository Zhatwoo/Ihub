// Custom logging middleware
// Extends morgan with custom logging

export const requestLogger = (req, res, next) => {
  // TODO: Add custom request logging if needed
  // Morgan is already handling basic logging
  next();
};

export const errorLogger = (err, req, res, next) => {
  // TODO: Add custom error logging
  console.error(`Error on ${req.method} ${req.path}:`, err);
  next(err);
};
