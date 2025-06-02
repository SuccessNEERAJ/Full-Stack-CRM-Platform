/**
 * Authentication utilities for handling JWT tokens
 */

// Store the JWT token in localStorage
export const setAuthToken = (token) => {
  if (!token) {
    console.error('Attempted to store empty token');
    return false;
  }
  
  try {
    // Ensure we're storing a string
    const tokenString = String(token);
    console.log(`Storing token (length: ${tokenString.length})`);
    
    // Store in localStorage
    localStorage.setItem('xeno_auth_token', tokenString);
    
    // Verify it was stored correctly
    const storedToken = localStorage.getItem('xeno_auth_token');
    const success = !!storedToken && storedToken === tokenString;
    console.log(`Token storage ${success ? 'successful' : 'failed'}. Token value: ${storedToken ? storedToken.substring(0, 20) + '...' : 'null'}`);
    
    return success;
  } catch (error) {
    console.error('Error storing auth token:', error);
    return false;
  }
};

// Get the JWT token from localStorage
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem('xeno_auth_token');
    if (token) {
      console.log(`Token retrieved from localStorage (length: ${token.length})`);
      // Validate token format (simple check)
      if (token.split('.').length !== 3) {
        console.warn('Retrieved token does not appear to be valid JWT format');
      }
      return token;
    } else {
      console.log('No token found in localStorage');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// Remove the JWT token from localStorage
export const removeAuthToken = () => {
  try {
    localStorage.removeItem('xeno_auth_token');
    console.log('Auth token removed from localStorage');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Check if a token exists and is not expired
export const hasValidToken = () => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // JWT tokens are in format: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return false;
    
    // Decode the base64 payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check if token is expired
    const currentTime = Date.now() / 1000;
    return decodedPayload.exp > currentTime;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

// Parse user info from token
export const getUserFromToken = () => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Error parsing user from token:', error);
    return null;
  }
};
