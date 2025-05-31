import axios from 'axios';

// Create an axios instance with improved CORS config
const apiService = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true, // Critical for cross-domain cookies
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  // Additional CORS-related settings
  timeout: 10000, // 10 second timeout
  // Do not send cookies for cross-domain requests by default
  xsrfCookieName: null,
  xsrfHeaderName: null
});

// Add a request interceptor
apiService.interceptors.request.use(
  (config) => {
    // You can add any request modifications here
    return config;
  },
  (error) => {
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

// Export the configured axios instance
export default apiService;
