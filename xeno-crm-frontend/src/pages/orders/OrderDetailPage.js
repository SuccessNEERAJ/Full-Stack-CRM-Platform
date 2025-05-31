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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import apiService from '../../services/apiService';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/api/orders/${id}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        setError('Failed to load order data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id]);
  
  const handleBackClick = () => {
    navigate('/orders');
  };
  
  const handleEditClick = () => {
    navigate(`/orders/edit/${id}`);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
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
          Back to Orders
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
          Back to Orders
        </Button>
        
        <Button 
          variant="outlined" 
          startIcon={<EditIcon />}
          onClick={handleEditClick}
        >
          Edit Order
        </Button>
      </Box>
      
      {order && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">
                  Order #{order._id.toString().slice(-6)}
                </Typography>
                <Chip 
                  label={order.status || 'Pending'} 
                  color={getStatusColor(order.status)}
                  size="medium"
                />
              </Box>
              
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {formatDate(order.createdAt)}
              </Typography>
              
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Customer Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {order.customer ? (
                    <>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {`${order.customer.firstName} ${order.customer.lastName}`}
                      </Typography>
                      <Typography variant="body2">
                        {order.customer.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.customer.phone || 'No phone number'}
                      </Typography>
                      
                      <Button 
                        sx={{ mt: 2 }}
                        size="small"
                        onClick={() => navigate(`/customers/${order.customer._id}`)}
                      >
                        View Customer Profile
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body1">Customer information not available</Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body1">
                        {formatCurrency(order.amount || 0)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tax
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ mt: 1, textAlign: 'right' }}>
                      <Typography variant="body1">
                        {formatCurrency(order.tax || 0)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        Total
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {formatCurrency((order.amount || 0) + (order.tax || 0))}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {order.items && order.items.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><Typography fontWeight={500}>Item</Typography></TableCell>
                        <TableCell><Typography fontWeight={500}>Quantity</Typography></TableCell>
                        <TableCell><Typography fontWeight={500}>Unit Price</Typography></TableCell>
                        <TableCell align="right"><Typography fontWeight={500}>Total</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">{item.name}</Typography>
                            {item.description && (
                              <Typography variant="caption" color="text.secondary">
                                {item.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1">No items in this order</Typography>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default OrderDetailPage;
