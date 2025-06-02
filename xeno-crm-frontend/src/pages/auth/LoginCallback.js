import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import { setAuthToken } from '../../utils/authUtils';
import { updateAuthHeader } from '../../services/apiService';

const LoginCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing login...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processLoginCallback = () => {
      try {
        // Extract token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const authSuccess = urlParams.get('auth') === 'success';
        
        console.log('Login callback processing:', {
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          authSuccess,
          fullUrl: window.location.href
        });
        
        if (!token) {
          console.error('No token found in URL');
          setStatus('Login failed');
          setError('No authentication token received');
          return;
        }
        
        if (!authSuccess) {
          console.error('Auth not successful');
          setStatus('Login failed');
          setError('Authentication was not successful');
          return;
        }
        
        // Store token in localStorage using the utility function
        const tokenStored = setAuthToken(token);
        console.log('Token stored in localStorage:', tokenStored ? 'Success' : 'Failed', token.substring(0, 15) + '...');
        
        // Update API headers
        updateAuthHeader();
        
        setStatus('Login successful! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (error) {
        console.error('Error processing login callback:', error);
        setStatus('Login failed');
        setError(error.message);
      }
    };
    
    processLoginCallback();
  }, [navigate]);
  
  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          mt: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <CircularProgress sx={{ mb: 3 }} />
        <Typography variant="h5" component="h1" gutterBottom>
          {status}
        </Typography>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default LoginCallback;
