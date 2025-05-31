import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

const CustomerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    notes: ''
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const response = await apiService.get(`/api/customers/${id}`);
        
        if (response.data) {
          setFormData({
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            address: response.data.address || '',
            company: response.data.company || '',
            notes: response.data.notes || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error);
        setError('Failed to load customer data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [id, isEditMode]);
  
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
      
      if (isEditMode) {
        // Update existing customer
        await apiService.put(`/api/customers/${id}`, formData);
        toast.success('Customer updated successfully');
      } else {
        // Create new customer
        await apiService.post('/api/customers', formData);
        toast.success('Customer created successfully');
      }
      
      // Force a hard refresh of the customers page to ensure new data is loaded
      // This is more reliable than just navigating back
      window.location.href = '/customers';
      
    } catch (error) {
      console.error('Failed to save customer:', error);
      setError('Failed to save customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleBackClick = () => {
    navigate('/customers');
  };
  
  const handleCloseAlert = () => {
    setSuccess(false);
    setError(null);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          {isEditMode ? 'Edit Customer' : 'Add New Customer'}
        </Typography>
        
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Back to Customers
        </Button>
      </Box>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="success">
          Customer {isEditMode ? 'updated' : 'created'} successfully!
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
      
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
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
                  required
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
              required
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
            />
            
            <TextField
              fullWidth
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
            />
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? 'Saving...' : 'Save Customer'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerFormPage;
