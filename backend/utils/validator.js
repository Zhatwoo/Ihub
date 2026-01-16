// Validator utility
// Common validation functions

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  // TODO: Implement phone validation based on requirements
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

export const isValidId = (id) => {
  // TODO: Validate ID format (Firebase ID, UUID, etc.)
  return id && typeof id === 'string' && id.length > 0;
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // TODO: Implement input sanitization
  return input.trim();
};
