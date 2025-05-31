import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

// MUI components
import { 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Grid,
  LinearProgress,
  Divider,
  alpha,
  useTheme,
  CircularProgress
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CampaignIcon from '@mui/icons-material/Campaign';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import SegmentIcon from '@mui/icons-material/Segment';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import EmailIcon from '@mui/icons-material/Email';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const CampaignsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  
  // Statistics
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    successfulCampaigns: 0,
    totalAudience: 0,
    deliveryRate: 0,
    totalDeliveredCount: 0
  });
  
  // Track delivered count separately for easier access in the UI
  const [totalDeliveredCount, setTotalDeliveredCount] = useState(0);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await apiService.get(`/api/campaigns?_t=${timestamp}`);
      
      if (response.data) {
        // Initialize statistics counters
        let totalCampaignsCount = 0;
        let successfulCampaignsCount = 0;
        let totalAudienceCount = 0;
        let totalDeliveredCountLocal = 0; // Local variable for delivered count
        
        // Get segment names for each campaign
        const campaignsWithDetails = await Promise.all(
          response.data.map(async (campaign) => {
            try {
              // Ensure we have valid campaign data with proper ID
              const campaignId = campaign._id || campaign.id;
              
              // Get segment info
              let segmentName = 'Unknown Segment';
              let segmentColor = '#e0e0e0';
              
              if (campaign.segmentId) {
                try {
                  const segmentResponse = await apiService.get(`/api/segments/${campaign.segmentId}`);
                  segmentName = segmentResponse.data?.name || 'Unknown Segment';
                  // Generate consistent color for segment based on name
                  const hash = segmentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const hue = hash % 360;
                  segmentColor = `hsl(${hue}, 70%, 65%)`;
                } catch (segErr) {
                  console.error('Error fetching segment:', segErr);
                }
              } else if (campaign.segment?.id) {
                segmentName = campaign.segment.name || 'Unknown Segment';
                // Generate consistent color for segment
                const hash = segmentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const hue = hash % 360;
                segmentColor = `hsl(${hue}, 70%, 65%)`;
              }
              
              // Get delivery stats directly from campaign response or nested deliveryStats
              const sentCount = campaign.sentCount || campaign.deliveryStats?.sent || 0;
              const deliveredCount = campaign.deliveredCount || campaign.deliveryStats?.delivered || 0;
              const failedCount = campaign.failedCount || campaign.deliveryStats?.failed || 0;
              const totalAudience = campaign.audienceSize || campaign.totalAudience || 0;
              
              // Total attempted includes both delivered and failed (not sent)
              const attemptedDeliveries = deliveredCount + failedCount;
              const successRateValue = attemptedDeliveries > 0 
                ? (deliveredCount / attemptedDeliveries) * 100
                : 0;
              const successRate = successRateValue.toFixed(1) + '%';
              
              // Update statistics counters
              totalCampaignsCount++;
              totalAudienceCount += totalAudience;
              totalDeliveredCountLocal += deliveredCount;
              if (successRateValue >= 90) {
                successfulCampaignsCount++;
              }
              
              // Return formatted campaign object
              return {
                id: campaignId,
                name: campaign.name || 'Unnamed Campaign',
                segmentName: segmentName,
                segmentColor: segmentColor,
                segmentId: campaign.segmentId || campaign.segment?.id,
                totalAudience: totalAudience,
                sentCount: sentCount,
                deliveredCount: deliveredCount,
                failedCount: failedCount,
                successRateValue: successRateValue,
                successRate: successRate,
                launchedAt: campaign.launchedAt || campaign.createdAt || new Date().toISOString(),
                status: campaign.status || 'completed',
                subject: campaign.subject || 'No Subject',
                description: campaign.description || ''
              };
            } catch (error) {
              const campaignId = campaign._id || campaign.id || 'unknown';
              console.error(`Failed to get details for campaign ${campaignId}:`, error);
              
              // Calculate success rate based on actual delivery stats (fallback case)
              const sentCount = campaign.deliveryStats?.sent || 0;
              const deliveredCount = campaign.deliveryStats?.delivered || 0;
              const failedCount = campaign.deliveryStats?.failed || 0;
              const totalAudience = campaign.audienceSize || 0;
              
              // Calculate based on attempted deliveries
              const attemptedDeliveries = deliveredCount + failedCount;
              const successRateValue = attemptedDeliveries > 0 
                ? (deliveredCount / attemptedDeliveries) * 100
                : 0;
              const successRate = successRateValue.toFixed(1) + '%';
                
              return {
                id: campaignId,
                name: campaign.name || 'Unnamed Campaign',
                segmentName: 'Unknown Segment',
                segmentId: campaign.segmentId || campaign.segment?.id,
                totalAudience: totalAudience,
                sentCount: sentCount,
                deliveredCount: deliveredCount,
                failedCount: failedCount,
                successRate: successRate,
                launchedAt: campaign.launchedAt || campaign.createdAt || new Date().toISOString()
              };
            }
          })
        );
        
        setCampaigns(campaignsWithDetails);
        
        // Update stats after campaigns are processed
        setStats({
          totalCampaigns: totalCampaignsCount,
          successfulCampaigns: successfulCampaignsCount,
          totalAudience: totalAudienceCount,
          deliveryRate: totalAudienceCount > 0 ? (totalDeliveredCountLocal / totalAudienceCount * 100).toFixed(1) : 0,
          totalDeliveredCount: totalDeliveredCountLocal,
          // Add total attempted counts (delivered + failed)
          totalAttemptedCount: campaignsWithDetails.reduce((sum, campaign) => sum + (campaign.deliveredCount + campaign.failedCount), 0)
        });
        
        // Update the separate state for delivered count
        setTotalDeliveredCount(totalDeliveredCountLocal);
      } else {
        setCampaigns([]);
        setStats({
          totalCampaigns: 0,
          successfulCampaigns: 0,
          totalAudience: 0,
          deliveryRate: 0,
          totalDeliveredCount: 0
        });
        setTotalDeliveredCount(0);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh campaigns when component mounts and at regular intervals
  useEffect(() => {
    fetchCampaigns();
    
    // Set up an interval to refresh campaign data every 30 seconds
    // This ensures campaigns are updated when segments or customers change
    const refreshInterval = setInterval(() => {
      // Use the refresh key to trigger data refresh
      setRefreshKey(prevKey => prevKey + 1);
    }, 30000); // 30 seconds
    
    // Clean up the interval when component unmounts
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Refresh campaigns whenever refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      fetchCampaigns();
    }
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/new');
  };

  const handleViewCampaign = (campaignId) => {
    try {
      if (!campaignId) {
        console.error('Invalid campaign ID for viewing');
        toast.error('Could not view campaign: Invalid ID');
        return;
      }
      
      navigate(`/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Error navigating to campaign:', error);
      toast.error('Could not view campaign');
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  // Execute campaign deletion
  const handleDeleteConfirm = async () => {
    if (!campaignToDelete || !campaignToDelete.id) {
      console.error('No campaign selected for deletion');
      toast.error('Could not delete campaign: Invalid selection');
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.delete(`/api/campaigns/${campaignToDelete.id}`);
      
      if (response.status === 200 || response.status === 204) {
        // Success - remove campaign from state
        toast.success(`Campaign "${campaignToDelete.name}" deleted successfully`);
        
        // Update local state to remove the deleted campaign
        setCampaigns(prevCampaigns => 
          prevCampaigns.filter(campaign => campaign.id !== campaignToDelete.id)
        );

        // Refresh data
        handleRefresh();
      } else {
        console.error('Unexpected response from API:', response);
        toast.error('Could not delete campaign: Unexpected response from server');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Could not delete campaign: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getSuccessRate = (campaign) => {
    return campaign.successRate || '0.0%';
  };

  const getSuccessRateColor = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 90) return 'success';
    if (numRate >= 70) return 'primary';
    if (numRate >= 50) return 'warning';
    return 'error';
  };

  // Calculate percentage of change
  const getSuccessRateVariant = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 90) return 'success';
    if (numRate >= 70) return 'info';
    if (numRate >= 50) return 'warning';
    return 'error';
  };

  // Calculate performance status
  const getCampaignStatus = (campaign) => {
    const rate = parseFloat(campaign.successRate);
    if (rate >= 90) return { label: 'Excellent', color: 'success' };
    if (rate >= 70) return { label: 'Good', color: 'info' };
    if (rate >= 50) return { label: 'Average', color: 'warning' };
    return { label: 'Poor', color: 'error' };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 0.5 }}>
            Campaign Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, monitor, and manage your marketing campaigns
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateCampaign}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: theme.shadows[4],
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[6],
              transition: 'all 0.2s'
            }
          }}
        >
          Create Campaign
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            boxShadow: theme.shadows[3],
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[6]
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', mr: 2 }}>
                <CampaignIcon />
              </Avatar>
              <Typography variant="h6" color="text.secondary">Total Campaigns</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
              {loading ? <CircularProgress size={24} /> : campaigns.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto', pt: 1 }}>
              {loading ? '' : `Last campaign created on ${campaigns.length > 0 ? formatDate(campaigns[0].launchedAt) : 'N/A'}`}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            boxShadow: theme.shadows[3],
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[6]
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', mr: 2 }}>
                <PeopleAltIcon />
              </Avatar>
              <Typography variant="h6" color="text.secondary">Total Audience</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
              {loading ? <CircularProgress size={24} /> : 
                campaigns.reduce((sum, campaign) => sum + campaign.totalAudience, 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto', pt: 1 }}>
              {loading ? '' : 'Across all campaigns'}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            boxShadow: theme.shadows[3],
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[6]
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', mr: 2 }}>
                <SegmentIcon />
              </Avatar>
              <Typography variant="h6" color="text.secondary">Unique Segments</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
              {loading ? <CircularProgress size={24} /> : 
                new Set(campaigns.map(c => c.segmentId).filter(Boolean)).size}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto', pt: 1 }}>
              {loading ? '' : 'Used in campaigns'}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Campaigns Table Card */}
      <Card sx={{
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: theme.shadows[3]
      }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
          <Typography variant="h6" fontWeight="bold">
            All Campaigns
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading campaigns...
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Campaign</TableCell>
                  <TableCell>Segment</TableCell>
                  <TableCell>Audience</TableCell>
                  <TableCell>Sent Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((campaign) => {
                  const successRate = parseFloat(campaign.successRate);
                  const successColor = getSuccessRateColor(successRate);
                  const performanceStatus = getCampaignStatus(campaign);
                  
                  return (
                    <TableRow 
                      key={campaign.id}
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04)
                        },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1), 
                              color: 'primary.main',
                              width: 40, 
                              height: 40,
                              mr: 2,
                              fontSize: '1rem'
                            }}
                          >
                            <EmailIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {campaign.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {campaign.subject || 'No subject'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={campaign.segmentName} 
                          size="small"
                          sx={{ 
                            bgcolor: alpha(campaign.segmentColor, 0.1),
                            color: alpha(campaign.segmentColor, 0.8),
                            fontWeight: 'medium',
                            borderRadius: '16px',
                            '& .MuiChip-label': { px: 1.5 }
                          }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PeopleAltIcon color="action" fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
                          <Typography variant="body2">
                            {campaign.totalAudience.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">{formatDate(campaign.launchedAt)}</Typography>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="View details">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewCampaign(campaign.id)}
                              sx={{ mr: 1 }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete campaign">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(campaign)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {campaigns.length === 0 && !loading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 4, textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 60, height: 60, mb: 2 }}>
                  <CampaignIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight="medium">No campaigns found</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                  Get started by creating your first email campaign. You can target specific customer segments and track performance metrics.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateCampaign}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Create First Campaign
                </Button>
              </Box>
            )}
          </TableContainer>
        )}
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Delete Campaign
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <DialogContentText component="div">
            <Box sx={{ mb: 2 }}>
              Are you sure you want to delete the campaign <strong>"{campaignToDelete?.name}"</strong>? 
              This action cannot be undone.
            </Box>
            
            {campaignToDelete?.totalAudience > 0 && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: alpha(theme.palette.warning.main, 0.1), 
                borderRadius: 2, 
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <WarningAmberIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  This campaign was sent to <strong>{campaignToDelete.totalAudience.toLocaleString()} customers</strong> and has a delivery success rate of <strong>{campaignToDelete.successRate}</strong>.
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            variant="outlined" 
            onClick={handleDeleteCancel}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteConfirm}
            sx={{ borderRadius: 2 }}
          >
            Delete Campaign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampaignsPage;
