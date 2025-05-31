import React from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper,
  Grid,
  useTheme
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const LoginPage = () => {
  const theme = useTheme();
  const { isAuthenticated, loginWithGoogle, loading } = useAuth();
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !loading) {
    return <Navigate to="/" />;
  }
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: theme.palette.background.default
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            py: 4,
            px: 6,
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome to Xeno CRM
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to access your customer relationship management dashboard
            </Typography>
          </Box>
          
          <Grid container justifyContent="center">
            <Grid item xs={12} md={8}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<GoogleIcon />}
                onClick={loginWithGoogle}
                sx={{
                  py: 1.5,
                  bgcolor: '#fff',
                  color: '#757575',
                  border: '1px solid #ddd',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  }
                }}
              >
                Sign in with Google
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
