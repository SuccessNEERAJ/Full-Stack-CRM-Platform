import axios from 'axios';
import { getAuthToken } from '../utils/authUtils';

// Create an axios instance with improved CORS config
const apiService = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true, // Keep this for backward compatibility
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  // Additional settings
  timeout: 10000, // 10 second timeout
  xsrfCookieName: null,
  xsrfHeaderName: null
});

// Set default headers function - can be called anytime to update headers
export const updateAuthHeader = () => {
  const token = getAuthToken();
  if (token) {
    apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Default Authorization header set globally:', `Bearer ${token.substring(0, 15)}...`);
    return true;
  } else {
    delete apiService.defaults.headers.common['Authorization'];
    console.log('Removed Authorization header - no token available');
    return false;
  }
};

// Initialize headers
updateAuthHeader();

// Add a request interceptor to include JWT token
apiService.interceptors.request.use(
  (config) => {
    // Always check for fresh token on each request
    const token = getAuthToken();
    console.log('JWT token available:', token ? 'Yes (length: ' + token.length + ')' : 'No');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`Adding Authorization header to ${config.url}: Bearer ${token.substring(0, 15)}...`);
      
      // Log all request headers for debugging
      console.log('Request headers:', JSON.stringify(config.headers));
    } else {
      console.log(`No token available for request to ${config.url}`);
      
      // If token is missing and this is an authenticated endpoint, we should redirect to login
      if (!config.url.includes('/auth/') && !config.url.includes('/login')) {
        console.warn('Attempting to access protected endpoint without token - may need to redirect to login');
        
        // Add a flag to indicate this request is likely to fail authentication
        config._noAuth = true;
      }
      
      // Try to get token directly from localStorage as a fallback
      const fallbackToken = localStorage.getItem('xeno_auth_token');
      if (fallbackToken) {
        config.headers['Authorization'] = `Bearer ${fallbackToken}`;
        console.log(`Using fallback token for ${config.url}: Bearer ${fallbackToken.substring(0, 15)}...`);
      }
    }
    
    // Ensure content type is set
    config.headers['Content-Type'] = 'application/json';
    
    // Log all requests for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor with enhanced token handling
apiService.interceptors.response.use(
  (response) => {
    // Verify the response contains the correct user context
    // This helps detect potential tenant isolation issues
    if (response.headers && response.headers['x-user-id']) {
      const responseUserId = response.headers['x-user-id'];
      const currentToken = getAuthToken();
      
      if (currentToken) {
        try {
          // Verify user ID from token matches response
          const tokenData = JSON.parse(atob(currentToken.split('.')[1]));
          if (tokenData.id && tokenData.id !== responseUserId) {
            console.error('User ID mismatch detected! Token user:', tokenData.id, 'Response user:', responseUserId);
            // This indicates a potential tenant isolation issue - force refresh auth
            localStorage.removeItem('xeno_auth_token');
            window.location.href = '/login?error=tenant_isolation_error';
            return Promise.reject(new Error('Authentication error: User context mismatch'));
          }
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
    }
    
    return response;
  },
  (error) => {
    // Enhanced error handling
    console.error('API Error:', error.message, error.response?.status);
    
    // Handle authentication errors (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      console.warn('Authentication error detected - clearing invalid token');
      
      // Clear the invalid token
      localStorage.removeItem('xeno_auth_token');
      
      // If not already on the login page, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?error=session_expired';
        return Promise.reject(new Error('Session expired'));
      }
    }
    
    // Handle forbidden errors (403) which might indicate tenant isolation issues
    if (error.response && error.response.status === 403) {
      console.warn('Possible tenant isolation issue detected');
      
      // If not already on the login page, redirect to login with specific error
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?error=access_denied';
        return Promise.reject(new Error('Access denied - possible tenant isolation issue'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Utility function to make requests through the proxy
apiService.useProxy = (url, options = {}) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const proxyUrl = `${baseUrl}/proxy?url=${encodeURIComponent(url)}`;
  
  console.log(`Making proxied request to: ${url} via ${proxyUrl}`);
  return apiService(proxyUrl, options);
};

// Export the configured axios instance
export default apiService;
