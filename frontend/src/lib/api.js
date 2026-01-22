/**
 * API Client Utility
 * Centralized API client for making requests to the backend server
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Simple cache for GET requests to reduce API calls
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - increased to reduce quota usage

// Log API URL in development (only once)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 API Client configured:', API_URL);
}

// Clean up old localStorage token and cache data (migrated to cookies)
// Run this once on app load to remove old localStorage storage
if (typeof window !== 'undefined') {
  // Remove old token storage from localStorage (now using cookies)
  const oldTokenKeys = ['idToken', 'refreshToken', 'user'];
  let cleaned = false;
  
  oldTokenKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleaned = true;
    }
  });
  
  // Remove old admin cache and admin info from localStorage (now using cookies)
  // Find all adminAuth_ and adminInfo_ keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('adminAuth_') || key.startsWith('adminInfo_'))) {
      localStorage.removeItem(key);
      cleaned = true;
    }
  }
  
  // Remove other app-related localStorage data that shouldn't be there
  // These might be from old code, browser extensions, or other sources
  const keysToRemove = [
    'calendar-tasks',
    'kanban-columns',
    'reports-data',
    'currentCompanyId',
    'userLocationInfo',
    'scheduleStart',
    'scheduleEnd',
    'siteVisitCount',
    'systemStyle',
    'wallpaper',
    'weather_cloud_pos',
    'websdk_ng_cache_parameter',
    'websdk_ng_global_parameter',
    'websdk_ng_install_id',
    'informationReadFilter',
    'isDockMode',
    'shownToastIds',
    'advertisementVideoUrl',
    'auth_migration_v1_completed'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleaned = true;
    }
  });
  
  if (cleaned && process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaned up old localStorage data (tokens, cache, and app data now using cookies or removed)');
  }
}

/**
 * Get auth token from cookies (HttpOnly cookies are more secure)
 * Note: HttpOnly cookies cannot be read by JavaScript, so we rely on the browser
 * to automatically send them with requests. For API calls, we don't need to manually
 * add the token - the browser will send it automatically via cookies.
 * 
 * However, for backward compatibility with Authorization header, we try to get from cookie
 * if available (non-HttpOnly cookie for user info), but tokens are HttpOnly.
 */
function getAuthToken() {
  // Tokens are now in HttpOnly cookies, so we can't read them from JavaScript
  // The browser will automatically send them with requests
  // Return null - the backend will read from cookies
  return null;
}

/**
 * Get user info from cookie (non-HttpOnly cookie for frontend access)
 */
function getUserFromCookie() {
  if (typeof window !== 'undefined') {
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'user' && value) {
          try {
            const user = JSON.parse(decodeURIComponent(value));
            return user;
          } catch (e) {
            console.warn('⚠️ Failed to parse user cookie:', e);
            return null;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Error reading cookies:', e);
    }
  }
  return null;
}

/**
 * Get admin cache from cookie
 */
function getAdminCacheFromCookie(userId) {
  if (typeof window !== 'undefined') {
    try {
      const cookies = document.cookie.split(';');
      const cookieName = `adminAuth_${userId}`;
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === cookieName && value) {
          try {
            return JSON.parse(decodeURIComponent(value));
          } catch (e) {
            console.warn('⚠️ Failed to parse admin cache cookie:', e);
            return null;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Error reading admin cache cookie:', e);
    }
  }
  return null;
}

/**
 * Set admin cache in cookie
 */
function setAdminCacheInCookie(userId, cacheData) {
  if (typeof window !== 'undefined') {
    try {
      const cookieName = `adminAuth_${userId}`;
      const cookieValue = encodeURIComponent(JSON.stringify(cacheData));
      // Set cookie with 10 minute expiration (same as cache duration)
      const expires = new Date();
      expires.setTime(expires.getTime() + 10 * 60 * 1000); // 10 minutes
      document.cookie = `${cookieName}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('⚠️ Error setting admin cache cookie:', e);
    }
  }
}

/**
 * Remove admin cache from cookie
 */
function removeAdminCacheFromCookie(userId) {
  if (typeof window !== 'undefined') {
    try {
      const cookieName = `adminAuth_${userId}`;
      // Set cookie with past expiration to delete it
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch (e) {
      console.warn('⚠️ Error removing admin cache cookie:', e);
    }
  }
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
      if (typeof window !== 'undefined') {
        // Check if user cookie exists - if it does, don't auto-logout (might be temporary issue)
        const user = getUserFromCookie();
        
        if (!user) {
          // No user cookie - definitely logged out
          error.message = 'Your session has expired. Please log in again.';
          
          // Only redirect if we're on a protected route
          if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/client')) {
            // Call logout to clear any remaining cookies
            try {
              await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
              });
            } catch (e) {
              // Ignore logout errors
            }
            
            // Redirect after delay
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        } else {
          // User cookie exists but API returned 401 - might be:
          // 1. Token expired but cookie still there
          // 2. Backend issue
          // 3. Timing issue with cookie setting
          // Don't auto-logout, just show error
          console.warn('⚠️ API returned 401 but user cookie exists. This might be a temporary authentication issue.');
          error.message = 'Authentication failed. Please try again or refresh the page.';
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
    // Check cache first (skip cache if explicitly disabled)
    if (!options.skipCache) {
      const cached = requestCache.get(endpoint);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    // Tokens are in HttpOnly cookies - browser sends them automatically
    // Include credentials to send cookies with request
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include', // Important: Send cookies with request
        headers: {
          'Content-Type': 'application/json',
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
    // Tokens are in HttpOnly cookies - browser sends them automatically
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include', // Important: Send cookies with request
        headers: {
          'Content-Type': 'application/json',
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
    // Tokens are in HttpOnly cookies - browser sends them automatically
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        credentials: 'include', // Important: Send cookies with request
        headers: {
          'Content-Type': 'application/json',
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
    // Tokens are in HttpOnly cookies - browser sends them automatically
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        credentials: 'include', // Important: Send cookies with request
        headers: {
          'Content-Type': 'application/json',
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
    // Tokens are in HttpOnly cookies - browser sends them automatically
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include', // Important: Send cookies with request
        headers: {
          'Content-Type': 'application/json',
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
    // Tokens are in HttpOnly cookies - browser sends them automatically
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include', // Important: Send cookies with request
        headers: {
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
  },

  /**
   * Logout - Clear authentication cookies
   * @returns {Promise} Logout response
   */
  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      return handleResponse(response);
    } catch (error) {
      // Cookies are cleared by backend, no need to clear localStorage
      throw error;
    }
  }
};

// Export helper functions
export { 
  getUserFromCookie, 
  getAdminCacheFromCookie, 
  setAdminCacheInCookie, 
  removeAdminCacheFromCookie 
};

export default api;
