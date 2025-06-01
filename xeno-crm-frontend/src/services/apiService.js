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
    // DO NOT set Origin header - browsers handle this automatically
    // and will reject attempts to set it manually
    
    // Log all requests for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Headers sent:', config.headers);
    
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

// Utility function to make requests through the proxy
apiService.useProxy = (url, options = {}) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const proxyUrl = `${baseUrl}/proxy?url=${encodeURIComponent(url)}`;
  
  console.log(`Making proxied request to: ${url} via ${proxyUrl}`);
  return apiService(proxyUrl, options);
};

// Export the configured axios instance
export default apiService;
