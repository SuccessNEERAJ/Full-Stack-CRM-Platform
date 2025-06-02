import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount or when token changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        console.log('Checking authentication status...');
        
        // Check for token in localStorage
        const token = localStorage.getItem('xeno_auth_token');
        console.log('Token in localStorage when checking auth:', token ? `${token.substring(0, 15)}...` : 'No token found');
        
        // If no token, clear auth state
        if (!token) {
          console.log('No token in localStorage, clearing auth state');
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // Make sure the Authorization header is set
        apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Set Authorization header for current request:', `Bearer ${token.substring(0, 15)}...`);
        
        // Add a timeout to prevent infinite loading if the server doesn't respond
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth request timed out')), 10000);
        });
        
        // Get current user info from the backend
        const authPromise = apiService.get('/api/auth/current_user');
        
        // Race between the auth request and the timeout
        const response = await Promise.race([authPromise, timeoutPromise]);
        console.log('Auth response:', response.data);
        
        if (response.data && response.data.isAuthenticated) {
          console.log('User is authenticated:', response.data.user);
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          console.log('User is not authenticated despite token');
          // Token might be invalid, remove it
          localStorage.removeItem('xeno_auth_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        // Check if it's a network error or timeout
        if (error.message === 'Auth request timed out' || error.message.includes('Network Error')) {
          console.log('Network issue detected - will try to use existing token');
          // Don't clear auth state on network errors - the token might still be valid
          // Just set loading to false and let the user try again
          toast.error('Network connection issue. Please check your internet connection.');
        } else {
          // For other errors, clear auth state
          localStorage.removeItem('xeno_auth_token');
          setUser(null);
          setIsAuthenticated(false);
          toast.error('Authentication error. Please log in again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
    
    // Set up an interval to periodically check auth status (every 5 minutes)
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Login with Google OAuth (redirect to backend auth route)
  const loginWithGoogle = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.get('/api/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  // Function to update user data
  const updateUserData = (userData) => {
    setUser(userData);
  };

  // Authentication context value
  const value = {
    user,
    isAuthenticated,
    loading,
    loginWithGoogle,
    logout,
    updateUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
