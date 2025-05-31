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
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  alpha,
  useTheme,
  Avatar,
  Grid,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CategoryIcon from '@mui/icons-material/Category';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SortIcon from '@mui/icons-material/Sort';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

const SegmentsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState(null);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await apiService.get(`/api/segments?_t=${timestamp}`);
      
      // Fetch campaigns to count how many use each segment
      const campaignsResponse = await apiService.get(`/api/campaigns?_t=${timestamp}`);
      const campaigns = campaignsResponse.data || [];
      
      // Count campaigns per segment
      const campaignCountsBySegment = {};
      campaigns.forEach(campaign => {
        if (campaign.segmentId) {
          campaignCountsBySegment[campaign.segmentId] = (campaignCountsBySegment[campaign.segmentId] || 0) + 1;
        }
      });
      
      // Total campaigns count
      const totalCampaigns = campaigns.length;
      
      if (response.data) {
        // Get audience sizes for each segment
        const segmentsWithAudience = await Promise.all(
          response.data.map(async (segment) => {
            try {
              const audienceResponse = await apiService.get(`/api/segments/${segment._id}/audience-count?_t=${timestamp}`);
              
              // Store the date as an ISO string without trying to convert it first
              let createdDate = segment.createdAt;
              
              // Get campaign count for this segment
              const campaignCount = campaignCountsBySegment[segment._id] || 0;
              
              return {
                id: segment._id,
                name: segment.name || 'Unnamed Segment',
                audienceSize: audienceResponse.data.count || 0,
                campaignCount: campaignCount,
                conditions: segment.conditions,
                createdAt: createdDate
              };
            } catch (audienceError) {
              console.error(`Failed to fetch audience for segment ${segment._id}:`, audienceError);
              
              // Store the date as an ISO string without trying to convert it first
              let createdDate = segment.createdAt;
              
              return {
                id: segment._id,
                name: segment.name || 'Unnamed Segment',
                audienceSize: 0,
                campaignCount: campaignCountsBySegment[segment._id] || 0,
                conditions: segment.conditions,
                createdAt: createdDate
              };
            }
          })
        );
        
        console.log('Segments with audience and campaign counts:', segmentsWithAudience);
        setSegments(segmentsWithAudience);
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error);
      setError('Failed to load segments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleCreateSegment = () => {
    navigate('/segments/new');
  };

  const handleEditSegment = (segmentId) => {
    navigate(`/segments/edit/${segmentId}`);
  };

  const handleViewSegment = (segmentId) => {
    // Navigate to segment details page
    navigate(`/segments/${segmentId}`);
  };

  const handleCreateCampaign = (segmentId) => {
    navigate(`/campaigns/new?segmentId=${segmentId}`);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (segment) => {
    setSegmentToDelete(segment);
    setDeleteDialogOpen(true);
  };
  
  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSegmentToDelete(null);
  };
  
  // Execute segment deletion
  const handleDeleteConfirm = async () => {
    if (!segmentToDelete) return;
    
    try {
      setLoading(true);
      const response = await apiService.delete(`/api/segments/${segmentToDelete.id}`);
      
      if (response.status === 200) {
        toast.success('Segment deleted successfully');
        // Remove the deleted segment from the state
        setSegments(segments.filter(s => s.id !== segmentToDelete.id));
      }
    } catch (error) {
      console.error('Failed to delete segment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Delete failed: ${error.response.data.message}`);
      } else {
        toast.error('Failed to delete segment. Please try again.');
      }
    } finally {
      setDeleteDialogOpen(false);
      setSegmentToDelete(null);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      console.log('Formatting date from:', dateString, typeof dateString);
      
      // Handle ISO strings directly
      let date;
      if (typeof dateString === 'string') {
        // Try to parse the date string
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        console.log('Unknown date format:', dateString);
        return 'Invalid date format';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateString);
        return 'Invalid date';
      }
      
      // Format the date
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      console.log('Formatted date:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 1 }}>
            Customer Segments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage audience segments for targeted campaigns
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSegment}
          sx={{ 
            py: 1.2, 
            px: 3, 
            borderRadius: 2,
            fontWeight: 600,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          Create Segment
        </Button>
      </Box>
      
      {/* Segments Statistics */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 2, 
              height: '100%',
              boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: `0px 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 40,
                    height: 40
                  }}
                >
                  <CategoryIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {segments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Segments
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 2, 
              height: '100%',
              boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: `0px 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    width: 40,
                    height: 40
                  }}
                >
                  <PeopleAltIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {segments.reduce((total, segment) => total + segment.audienceSize, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Audience
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 2, 
              height: '100%',
              boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: `0px 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    width: 40,
                    height: 40
                  }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {segments.length > 0 ? Math.round(segments.reduce((total, segment) => total + segment.audienceSize, 0) / segments.length).toLocaleString() : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Segment Size
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 2, 
              height: '100%',
              boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: `0px 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    width: 40,
                    height: 40
                  }}
                >
                  <CampaignIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {segments.reduce((total, segment) => total + segment.campaignCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Campaigns Created
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* Segments Table */}
      <Card sx={{ 
        overflow: 'hidden', 
        boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
        borderRadius: 2
      }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: alpha(theme.palette.primary.light, 0.05),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`
        }}>
          <Typography variant="h6" fontWeight={600}>
            All Segments
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Filter Segments">
              <IconButton size="small" sx={{ 
                bgcolor: alpha(theme.palette.text.secondary, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.text.secondary, 0.15) }
              }}>
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Sort Segments">
              <IconButton size="small" sx={{ 
                bgcolor: alpha(theme.palette.text.secondary, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.text.secondary, 0.15) }
              }}>
                <SortIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Search Segments">
              <IconButton size="small" sx={{ 
                bgcolor: alpha(theme.palette.text.secondary, 0.08),
                '&:hover': { bgcolor: alpha(theme.palette.text.secondary, 0.15) }
              }}>
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <TableContainer>
          {loading ? (
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <CircularProgress size={40} />
              </Box>
              <Typography align="center" color="text.secondary">
                Loading segments...
              </Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.light, 0.02) }}>
                <TableRow>
                  <TableCell sx={{ py: 2 }}><Typography fontWeight={600}>Segment Name</Typography></TableCell>
                  <TableCell sx={{ py: 2 }}><Typography fontWeight={600}>Audience Size</Typography></TableCell>
                  <TableCell sx={{ py: 2 }}><Typography fontWeight={600}>Created</Typography></TableCell>
                  <TableCell sx={{ py: 2 }}><Typography fontWeight={600}>Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow 
                    key={segment.id} 
                    hover
                    sx={{ 
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.875rem',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            mr: 2
                          }}
                        >
                          {segment.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {segment.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip 
                        label={`${segment.audienceSize.toLocaleString()} customers`} 
                        size="small" 
                        color="primary" 
                        sx={{ 
                          fontWeight: 500,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          border: 'none'
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(segment.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewSegment(segment.id)}
                            sx={{ 
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit Segment">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditSegment(segment.id)}
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Create Campaign">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCreateCampaign(segment.id)}
                            sx={{ 
                              bgcolor: alpha(theme.palette.secondary.main, 0.1),
                              color: theme.palette.secondary.main,
                              '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) }
                            }}
                          >
                            <CampaignIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Segment">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(segment)}
                            sx={{ 
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              color: theme.palette.error.main,
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!loading && segments.length === 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              py: 6, 
              px: 2,
              textAlign: 'center' 
            }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mb: 2
                }}
              >
                <CategoryIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                No segments found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                Create your first customer segment to target specific groups of customers with tailored campaigns.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateSegment}
              >
                Create Segment
              </Button>
            </Box>
          )}
        </TableContainer>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
          }
        }}
        maxWidth="sm"
      >
        <DialogTitle sx={{ 
          pb: 1, 
          pt: 2.5,
          fontWeight: 600
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Confirm Deletion
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ color: 'text.primary', mb: 1 }}>
            Are you sure you want to delete segment <Typography component="span" fontWeight={600}>"{segmentToDelete?.name}"</Typography>? 
          </DialogContentText>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone and all associated data will be permanently removed.
          </Typography>
          {segmentToDelete?.audienceSize > 0 && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <InfoOutlinedIcon color="warning" fontSize="small" />
              <Typography variant="body2" color="warning.dark">
                This segment is currently targeting <strong>{segmentToDelete.audienceSize.toLocaleString()}</strong> customers.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{ 
              borderRadius: 1,
              fontWeight: 500,
              px: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            sx={{ 
              borderRadius: 1,
              fontWeight: 500,
              px: 2,
              boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
            }}
          >
            Delete Segment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SegmentsPage;
