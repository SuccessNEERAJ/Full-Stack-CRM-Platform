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
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CampaignIcon from '@mui/icons-material/Campaign';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import apiService from '../../services/apiService';

const SegmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [segment, setSegment] = useState(null);
  const [audienceData, setAudienceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audienceLoading, setAudienceLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSegment = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(`/api/segments/${id}`);
        setSegment(response.data);
      } catch (error) {
        console.error('Failed to fetch segment details:', error);
        setError('Failed to load segment data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSegment();
  }, [id]);

  useEffect(() => {
    const fetchAudience = async () => {
      if (!segment) return;
      
      try {
        setAudienceLoading(true);
        const response = await apiService.get(`/api/segments/${id}/audience`);
        setAudienceData(response.data || []);
      } catch (error) {
        console.error('Failed to fetch segment audience:', error);
      } finally {
        setAudienceLoading(false);
      }
    };
    
    fetchAudience();
  }, [id, segment]);
  
  const handleBackClick = () => {
    navigate('/segments');
  };
  
  const handleEditClick = () => {
    navigate(`/segments/edit/${id}`);
  };
  
  const handleCreateCampaign = () => {
    navigate(`/campaigns/new?segmentId=${id}`);
  };
  
  const handleViewCustomer = (customerId) => {
    navigate(`/customers/${customerId}`);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatConditions = (conditions) => {
    if (!conditions) return 'No conditions';
    
    try {
      return JSON.stringify(conditions, null, 2);
    } catch (error) {
      return 'Invalid conditions format';
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
          Back to Segments
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
          Back to Segments
        </Button>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />}
            onClick={handleEditClick}
            sx={{ mr: 2 }}
          >
            Edit Segment
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary"
            startIcon={<CampaignIcon />}
            onClick={handleCreateCampaign}
          >
            Create Campaign
          </Button>
        </Box>
      </Box>
      
      {segment && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {segment.name}
              </Typography>
              
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Created on {formatDate(segment.createdAt)}
              </Typography>
              
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Segment Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Description
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body1">
                        {segment.description || 'No description'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={4} sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Audience Size
                      </Typography>
                    </Grid>
                    <Grid item xs={8} sx={{ mt: 2 }}>
                      <Chip 
                        label={`${audienceData.length} customers`} 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    Query Conditions
                    <Tooltip title="JSON query conditions">
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <CodeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}
                  >
                    <pre>{formatConditions(segment.conditions)}</pre>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audience Preview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {audienceLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : audienceData.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><Typography fontWeight={500}>Customer</Typography></TableCell>
                        <TableCell><Typography fontWeight={500}>Email</Typography></TableCell>
                        <TableCell><Typography fontWeight={500}>Phone</Typography></TableCell>
                        <TableCell><Typography fontWeight={500}>Actions</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {audienceData.slice(0, 10).map((customer) => (
                        <TableRow key={customer._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {`${customer.firstName} ${customer.lastName}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {customer.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {customer.phone || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewCustomer(customer._id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1">No customers match this segment criteria.</Typography>
              )}
              
              {audienceData.length > 10 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing 10 of {audienceData.length} customers in this segment
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default SegmentDetailPage;
