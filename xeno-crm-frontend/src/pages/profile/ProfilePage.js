import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Avatar, 
  Grid, 
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: ''
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await apiService.get('/api/auth/profile');
        
        if (response.data) {
          setFormData({
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            company: response.data.company || '',
            position: response.data.position || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // First check if we need to create a backend API route for this
      try {
        // Try to use the auth profile update endpoint
        const response = await apiService.put('/api/auth/profile', formData);
        
        if (response.data) {
          // Update local user data if available in context
          if (updateUserData) {
            updateUserData(response.data);
          }
          
          setSuccess(true);
          toast.success('Profile updated successfully!');
        }
      } catch (error) {
        // Fallback to the users endpoint if auth profile doesn't exist
        if (user && user._id) {
          const response = await apiService.put(`/api/users/${user._id}`, formData);
          
          if (response.data) {
            // Update local user data if available in context
            if (updateUserData) {
              updateUserData(response.data);
            }
            
            setSuccess(true);
            toast.success('Profile updated successfully!');
          }
        } else {
          throw new Error('User ID not available');
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile. Please try again.');
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCloseAlert = () => {
    setSuccess(false);
    setError(null);
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="success">
          Profile updated successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  src={user?.profileImage || ''}
                  alt={user?.displayName || 'User'} 
                  sx={{ width: 150, height: 150, mb: 2 }}
                />
                <Typography variant="h6">
                  {user?.displayName || 'User Profile'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user?.email || ''}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Account created on {new Date(user?.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box component="form" onSubmit={handleSubmit}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    disabled={false}
                  />
                  
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    margin="normal"
                  />
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Company Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Position"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      type="submit" 
                      variant="contained"
                      disabled={saving}
                      startIcon={saving && <CircularProgress size={20} />}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProfilePage;
