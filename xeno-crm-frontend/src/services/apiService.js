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
    console.log('Default Authorization header set globally');
  } else {
    delete apiService.defaults.headers.common['Authorization'];
  }
};

// Initialize headers
updateAuthHeader();

// Add a request interceptor to include JWT token
apiService.interceptors.request.use(
  (config) => {
    // Add JWT token to Authorization header if available
    const token = getAuthToken();
    console.log('JWT token available:', token ? 'Yes (length: ' + token.length + ')' : 'No');
    
    if (token) {
      // Explicitly set the Authorization header
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
      console.log('Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.warn('No JWT token found in localStorage');
    }
    
    // Log all requests for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Headers being sent:', JSON.stringify(config.headers));
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiService.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (redirect to login)
    if (error.response && error.response.status === 401) {
      // If not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
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
