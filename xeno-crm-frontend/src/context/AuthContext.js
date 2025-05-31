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

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        // Get current user info from the backend
        const response = await apiService.get('/api/auth/current_user');
        
        if (response.data.isAuthenticated) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
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
