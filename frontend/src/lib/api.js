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
    const token = localStorage.getItem('idToken');
    if (!token) {
      console.warn('⚠️ No authentication token found in localStorage. User may need to log in again.');
    }
    return token;
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
    
    // Handle 401 Unauthorized - token missing or expired
    if (response.status === 401) {
      // Clear invalid token from localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('idToken');
        if (!token) {
          // Token was already missing - user needs to log in
          error.message = 'Please log in to continue. No authentication token found.';
        } else {
          // Token exists but is invalid/expired - clear it
          console.warn('⚠️ Authentication token expired or invalid. Please log in again.');
          localStorage.removeItem('idToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          error.message = 'Your session has expired. Please log in again.';
        }
        
        // Redirect to login if we're in the browser
        if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/client')) {
          // Small delay to allow error message to show
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      }
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
    // Never cache dashboard or requests endpoints
    const noCacheEndpoints = ['/api/admin/private-office/dashboard', '/api/admin/private-office/requests'];
    const shouldSkipCache = options.skipCache || noCacheEndpoints.some(ep => endpoint.includes(ep));
    
    // Check cache first (skip cache if explicitly disabled or for no-cache endpoints)
    if (!shouldSkipCache) {
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
      
      // Cache successful response (unless it's a no-cache endpoint)
      if (!noCacheEndpoints.some(ep => endpoint.includes(ep))) {
        requestCache.set(endpoint, {
          data,
          timestamp: Date.now()
        });
      }
      
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
