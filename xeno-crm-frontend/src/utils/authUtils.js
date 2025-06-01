/**
 * Authentication utilities for handling JWT tokens
 */

// Store the JWT token in localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('xeno_auth_token', token);
    return true;
  }
  return false;
};

// Get the JWT token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('xeno_auth_token');
};

// Remove the JWT token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem('xeno_auth_token');
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
