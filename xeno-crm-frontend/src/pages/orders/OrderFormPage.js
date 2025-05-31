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
  Snackbar,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

const OrderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  
  const [formData, setFormData] = useState({
    customerId: '',
    status: 'Pending',
    notes: '',
    items: [{ name: '', quantity: 1, price: 0 }],
    tax: 0
  });

  // Calculate subtotal and total based on items
  const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity) || 0), 0);
  const tax = parseFloat(formData.tax) || 0;
  const total = subtotal + tax;

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await apiService.get(`/api/customers?_t=${timestamp}`);
        
        if (response.data) {
          console.log('Fetched customers:', response.data);
          setCustomers(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };
    
    fetchCustomers();
  }, []);

  // Fetch order data if in edit mode
  useEffect(() => {
    const fetchOrder = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const response = await apiService.get(`/api/orders/${id}`);
        
        if (response.data) {
          setFormData({
            customerId: response.data.customer?._id || '',
            status: response.data.status || 'Pending',
            notes: response.data.notes || '',
            items: response.data.items?.length > 0 ? response.data.items : [{ name: '', quantity: 1, price: 0 }],
            tax: response.data.tax || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        setError('Failed to load order data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      return; // Keep at least one item
    }
    
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }

    if (formData.items.some(item => !item.name)) {
      setError('Please fill in all item names');
      return;
    }
    
    try {
      setSaving(true);
      console.log('Preparing order data with customer ID:', formData.customerId);
      
      // Prepare order data for API
      const orderData = {
        customerId: formData.customerId, // The ID of the customer
        customer: formData.customerId,   // For backward compatibility
        status: formData.status,
        items: formData.items.map(item => ({
          name: item.name,
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0
        })),
        amount: subtotal,
        tax: parseFloat(formData.tax) || 0,
        notes: formData.notes
      };
      
      console.log('Sending order data:', orderData);
      
      if (isEditMode) {
        // Update existing order
        const response = await apiService.put(`/api/orders/${id}`, orderData);
        console.log('Order update response:', response.data);
        toast.success('Order updated successfully');
      } else {
        // Create new order
        const response = await apiService.post('/api/orders', orderData);
        console.log('Order creation response:', response.data);
        toast.success('Order created successfully');
      }
      
      // Force a full page refresh to ensure the orders list is updated
      window.location.href = '/orders';
      
    } catch (error) {
      console.error('Failed to save order:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError(`Failed to save order: ${error.response.data.message || 'Unknown error'}`);
      } else {
        setError('Failed to save order. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };
  
  const handleBackClick = () => {
    navigate('/orders');
  };
  
  const handleCloseAlert = () => {
    setError(null);
  };
  
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toLocaleString()}`;
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
          {isEditMode ? 'Edit Order' : 'Create New Order'}
        </Typography>
        
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Back to Orders
        </Button>
      </Box>
      
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
      
      <Box component="form" onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Order Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Customer"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  margin="normal"
                  disabled={isEditMode} // Can't change customer in edit mode
                >
                  <MenuItem value="">Select a customer</MenuItem>
                  {customers.map((customer) => {
                    // Handle undefined names
                    const firstName = customer.firstName || '';
                    const lastName = customer.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim() || 'No Name';
                    
                    return (
                      <MenuItem key={customer._id} value={customer._id}>
                        {fullName}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  margin="normal"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Processing">Processing</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
            />
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Order Items
              </Typography>
              
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
              >
                Add Item
              </Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography fontWeight={500}>Item Name</Typography></TableCell>
                    <TableCell><Typography fontWeight={500}>Quantity</Typography></TableCell>
                    <TableCell><Typography fontWeight={500}>Price</Typography></TableCell>
                    <TableCell><Typography fontWeight={500}>Total</Typography></TableCell>
                    <TableCell><Typography fontWeight={500}>Actions</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          fullWidth
                          required
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          inputProps={{ min: 1 }}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          variant="standard"
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          inputProps={{ min: 0, step: '0.01' }}
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          variant="standard"
                          sx={{ width: '120px' }}
                        />
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.price * item.quantity || 0)}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                          disabled={formData.items.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tax Amount"
                    name="tax"
                    type="number"
                    inputProps={{ min: 0, step: '0.01' }}
                    value={formData.tax}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography variant="body1">Subtotal:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" fontWeight={500}>{formatCurrency(subtotal)}</Typography>
                      </Grid>
                      
                      <Grid item xs={6} sx={{ mt: 1 }}>
                        <Typography variant="body1">Tax:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ mt: 1, textAlign: 'right' }}>
                        <Typography variant="body1" fontWeight={500}>{formatCurrency(tax)}</Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="h6">Total:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={500}>{formatCurrency(total)}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button 
            type="submit" 
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            size="large"
          >
            {saving ? 'Saving...' : (isEditMode ? 'Update Order' : 'Create Order')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderFormPage;
