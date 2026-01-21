/**
 * API Client Utility
 * Centralized API client for making requests to the backend server
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Simple cache for GET requests to reduce API calls
const requestCache = new Map();
const CACHE_DURATION = 60 * 1000; // 60 seconds - increased to reduce quota usage

// Log API URL in development (only once)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 API Client configured:', API_URL);
}

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('idToken');
  }
  return null;
}

/**
 * Handle API response and errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = {
        error: 'Network error',
        message: response.statusText || 'Request failed'
      };
    }
    
    // Throw error with proper message
    const errorMessage = error.message || error.error || 'Request failed';
    const apiError = new Error(errorMessage);
    apiError.response = { data: error, status: response.status };
    throw apiError;
  }
  return response.json();
}

/**
 * API client with common HTTP methods
 */
export const api = {
  /**
   * GET request with caching
   * @param {string} endpoint - API endpoint (e.g., '/api/rooms')
   * @param {Object} options - Additional fetch options
   * @returns {Promise} JSON response
   */
  get: async (endpoint, options = {}) => {
    // Check cache first (skip cache if explicitly disabled)
    if (!options.skipCache) {
      const cached = requestCache.get(endpoint);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      });
      const data = await handleResponse(response);
      
      // Cache successful response
      requestCache.set(endpoint, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      // Handle network errors (backend not running, CORS, etc.)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_URL}. Please make sure the backend is running on port 5000.`);
      }
      throw error;
    }
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise} JSON response
   */
  post: async (endpoint, data, options = {}) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });
      return handleResponse(response);
    } catch (error) {
      // Handle network errors (backend not running, CORS, etc.)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_URL}. Please make sure the backend is running on port 5000.`);
      }
      throw error;
    }
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise} JSON response
   */
  put: async (endpoint, data, options = {}) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });
      return handleResponse(response);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_URL}. Please make sure the backend is running on port 5000.`);
      }
      throw error;
    }
  },

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise} JSON response
   */
  patch: async (endpoint, data, options = {}) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });
      return handleResponse(response);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_URL}. Please make sure the backend is running on port 5000.`);
      }
      throw error;
    }
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise} JSON response
   */
  delete: async (endpoint, options = {}) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      });
      return handleResponse(response);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_URL}. Please make sure the backend is running on port 5000.`);
      }
      throw error;
    }
  },

  /**
   * Upload file - POST request with FormData
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - FormData object containing file
   * @param {Object} options - Additional fetch options
   * @returns {Promise} JSON response
   */
  upload: async (endpoint, formData, options = {}) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
        ...options
      });
      return handleResponse(response);
    } catch (error) {
      // Handle network errors (backend not running, CORS, etc.)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend server at ${API_URL}. Please make sure the backend is running on port 5000.`);
      }
      throw error;
    }
  },

  /**
   * Health check - Test backend connection
   * @returns {Promise} Health status
   */
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default api;
