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

const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await apiService.get(`/api/customers?_t=${timestamp}`);
      if (response.data) {
        // Transform API data to match our component's expected format
        const formattedCustomers = response.data.map(customer => {
          // Handle undefined first/last names
          const firstName = customer.firstName || '';
          const lastName = customer.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || 'No Name';
          
          return {
            id: customer._id,
            name: fullName,
            email: customer.email || 'No Email',
            phone: customer.phone || 'N/A',
            totalSpend: customer.totalSpend || 0,
            visits: customer.visits || 0,
            lastActiveDate: customer.lastActive || customer.createdAt
          };
        });
        setCustomers(formattedCustomers);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = () => {
    // Navigate to customer creation form
    navigate('/customers/new');
  };

  const handleViewCustomer = (customerId) => {
    // Navigate to customer details page
    navigate(`/customers/${customerId}`);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };
  
  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };
  
  // Execute customer deletion
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    try {
      setLoading(true);
      const response = await apiService.delete(`/api/customers/${customerToDelete.id}`);
      
      if (response.status === 200) {
        toast.success('Customer deleted successfully');
        // Remove the deleted customer from the state
        setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Delete failed: ${error.response.data.message}`);
      } else {
        toast.error('Failed to delete customer. Please try again.');
      }
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
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

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Customers
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          Add Customer
        </Button>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search customers by name or email"
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
                  <TableCell><Typography fontWeight={500}>Customer</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Contact</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Total Spend</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Visits</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Last Active</Typography></TableCell>
                  <TableCell><Typography fontWeight={500}>Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={500}>
                        {customer.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {customer.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {formatCurrency(customer.totalSpend)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.visits} 
                        size="small" 
                        color={customer.visits > 5 ? "primary" : "default"} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(customer.lastActiveDate)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewCustomer(customer.id)}
                          title="View Customer"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(customer)}
                          color="error"
                          title="Delete Customer"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
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
            Are you sure you want to delete customer "{customerToDelete?.name}"? 
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

export default CustomersPage;
