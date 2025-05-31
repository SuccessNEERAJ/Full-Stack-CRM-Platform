import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Paper,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await apiService.get(`/api/orders?_t=${timestamp}`);
      if (response.data) {
        setOrders(response.data.map(order => {
          // Handle undefined customer names
          let customerName = 'Unknown';
          if (order.customer) {
            const firstName = order.customer.firstName || '';
            const lastName = order.customer.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            customerName = fullName || 'Unknown';
          }
          
          return {
            id: order._id,
            customerName: customerName,
            customerId: order.customer?._id,
            amount: order.amount || 0,
            status: order.status || 'Pending',
            createdAt: order.createdAt
          };
        }));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAddOrder = () => {
    navigate('/orders/new');
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };
  
  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  };
  
  // Execute order deletion
  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    
    try {
      setLoading(true);
      const response = await apiService.delete(`/api/orders/${orderToDelete.id}`);
      
      if (response.status === 200) {
        toast.success('Order deleted successfully');
        // Remove the deleted order from the state
        setOrders(orders.filter(o => o.id !== orderToDelete.id));
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Delete failed: ${error.response.data.message}`);
      } else {
        toast.error('Failed to delete order. Please try again.');
      }
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.id.toString().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Orders
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddOrder}
        >
          Add Order
        </Button>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search orders by customer name or order ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          variant="outlined"
        />
      </Box>
      
      <Card>
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Typography fontWeight={500}>Order ID</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Customer</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Amount</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Status</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Date</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={500}>
                        #{order.id.toString().slice(-6)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {formatCurrency(order.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status} 
                        size="small"
                        color={getStatusColor(order.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewOrder(order.id)}
                          title="View Order"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(order)}
                          color="error"
                          title="Delete Order"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No orders found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete order #{orderToDelete?.id?.toString().slice(-6)} for {orderToDelete?.customerName}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersPage;
