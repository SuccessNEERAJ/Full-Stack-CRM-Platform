import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  CircularProgress,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import apiService from '../../services/apiService';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/api/customers/${id}`);
        setCustomer(response.data);
      } catch (error) {
        console.error('Failed to fetch customer details:', error);
        setError('Failed to load customer data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [id]);
  
  const handleBackClick = () => {
    navigate('/customers');
  };
  
  const handleEditClick = () => {
    navigate(`/customers/edit/${id}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Typography color="error" variant="h6" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Back to Customers
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Back to Customers
        </Button>
        
        <Button 
          variant="outlined" 
          startIcon={<EditIcon />}
          onClick={handleEditClick}
        >
          Edit Customer
        </Button>
      </Box>
      
      {customer && (
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {`${customer.firstName} ${customer.lastName}`}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {customer.email}
            </Typography>
            
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {customer.email}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4} sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ mt: 2 }}>
                    <Typography variant="body1">
                      {customer.phone || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4} sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ mt: 2 }}>
                    <Typography variant="body1">
                      {customer.address || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4} sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Active
                    </Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ mt: 2 }}>
                    <Typography variant="body1">
                      {customer.lastActive ? new Date(customer.lastActive).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4} sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Spend
                    </Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ mt: 2 }}>
                    <Typography variant="body1" fontWeight="bold">
                      ₹{(customer.totalSpend || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4} sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Segments
                    </Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ mt: 2 }}>
                    {customer.segments && customer.segments.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {customer.segments.map(segment => (
                          <Chip 
                            key={segment.id}
                            label={segment.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body1">No segments</Typography>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {customer.orders && customer.orders.length > 0 ? (
                <List>
                  {customer.orders.map(order => (
                    <ListItem 
                      key={order.id}
                      button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      divider
                    >
                      <ListItemText
                        primary={`Order #${order.id}`}
                        secondary={`Date: ${new Date(order.date).toLocaleDateString()} • Amount: ₹${order.amount.toLocaleString()}`}
                      />
                      <Chip 
                        label={order.status}
                        size="small"
                        color={
                          order.status === 'Completed' ? 'success' : 
                          order.status === 'Pending' ? 'warning' : 
                          'default'
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">No recent orders</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CustomerDetailPage;
