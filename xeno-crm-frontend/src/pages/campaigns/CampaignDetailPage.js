import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  CircularProgress,
  IconButton,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SegmentIcon from '@mui/icons-material/Segment';
import EmailIcon from '@mui/icons-material/Email';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import InfoIcon from '@mui/icons-material/Info';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

// Campaign Summary component - shows the campaign statistics in a summarized format
const CampaignSummary = ({ campaign }) => {
  // No loading state needed for this simple component
  
  if (!campaign) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Typography>No campaign data available</Typography>
      </Box>
    );
  }

  // Calculate the success rate based on attempted deliveries (delivered + failed)
  const attemptedDeliveries = (campaign.deliveredCount || 0) + (campaign.failedCount || 0);
  const successRate = attemptedDeliveries > 0 
    ? ((campaign.deliveredCount || 0) / attemptedDeliveries * 100).toFixed(1) 
    : 0;

  return (
    <Card sx={{ bgcolor: '#f8f9fa', mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
            <Typography variant="h6" color="white">📊</Typography>
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>
              Campaign Summary
            </Typography>
            <Typography variant="body1">
              Your campaign "{campaign.name}" targeted {campaign.totalAudience} customers.
              {campaign.sentCount > 0 && ` ${campaign.sentCount} messages were sent successfully to the vendor.`}
              {campaign.deliveredCount > 0 && ` ${campaign.deliveredCount} messages were confirmed delivered to customers.`}
              {campaign.failedCount > 0 && ` Consider following up with the ${campaign.failedCount} customers who didn't receive the message.`}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Define fetchCampaignDetails outside of useEffect to avoid the dependency issue
  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      console.log('Attempting to fetch campaign details...');
      console.log('Campaign ID from URL parameters:', id);
      console.log('ID type:', typeof id);
      
      // Validate ID before making API call
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid campaign ID detected:', id);
        toast.error('Invalid campaign ID');
        navigate('/campaigns');
        return;
      }
      
      // Make sure the ID is properly formatted - MongoDB ObjectIds are 24 hex characters
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        console.error('Malformed campaign ID:', id);
        // If the ID is 'new', we shouldn't show an error since it's a valid route
        if (id !== 'new') {
          toast.error('Invalid campaign ID format');
          navigate('/campaigns');
        }
        return;
      }
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/campaigns/${id}?_t=${timestamp}`;
      console.log('API call URL:', url);
      
      const response = await apiService.get(url);
      console.log('Campaign details response:', response);
      
      // Validate that response contains logs specific to this campaign only
      // New response structure has campaign data nested inside a campaign object
      const campaignData = response.data?.campaign;
      console.log('Campaign data from API:', campaignData);
      
      if (campaignData?.logs) {
        // Defensive check to ensure all logs belong to current campaign
        const invalidLogs = campaignData.logs.filter(log => 
          log.campaignId && log.campaignId !== id);
          
        if (invalidLogs.length > 0) {
          console.warn(`Found ${invalidLogs.length} logs that don't belong to this campaign`);
          // Filter out any logs not belonging to this campaign (shouldn't happen with proper backend filtering)
          campaignData.logs = campaignData.logs.filter(log => 
            !log.campaignId || log.campaignId === id);
        }
      }
      
      if (campaignData) {
        // Get delivery stats from the new structure
        const { deliveryStats } = campaignData;
        console.log('Delivery stats:', deliveryStats);
        
        // Use the attempted count from the API or calculate if not available
        const attempted = deliveryStats?.attempted || 
                        ((deliveryStats?.delivered || 0) + (deliveryStats?.failed || 0));
        
        // Use success rate from API or calculate it
        const successRate = deliveryStats?.successRate || 
                          (attempted > 0 
                            ? ((deliveryStats?.delivered || 0) / attempted * 100).toFixed(1) + '%'
                            : '0.0%');
                            
        // Add calculated fields to campaign data
        const enrichedCampaignData = {
          ...campaignData,
          // Map new structure to old fields for backward compatibility
          deliveredCount: deliveryStats?.delivered || 0,
          failedCount: deliveryStats?.failed || 0,
          pendingCount: deliveryStats?.pending || 0,
          successRate: successRate
        };
        
        console.log('Enriched campaign data:', enrichedCampaignData);
        setCampaign(enrichedCampaignData);
      } else {
        console.error('Empty or invalid response data');
        toast.error('Failed to load campaign details');
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast.error('Failed to load campaign details: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Clear existing campaign data when the component mounts or ID changes
    setCampaign(null);
    
    // Exit early if ID is missing or invalid
    if (!id) {
      console.warn('No campaign ID provided');
      setLoading(false);
      return;
    }
    
    // Only fetch details if we have a valid ID
    fetchCampaignDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]); // Intentionally excluding fetchCampaignDetails to avoid infinite loop

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get theme from MUI for styling
  const theme = useTheme();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" color="error">Campaign not found</Typography>
        <Button variant="contained" onClick={() => navigate('/campaigns')} sx={{ mt: 2 }}>
          Back to Campaigns
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/campaigns')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Campaign Details
        </Typography>
      </Box>
      
      {/* Campaign Summary */}
      <CampaignSummary campaign={campaign} />
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Tabs Implementation */}
          <Box sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Campaign Details" />
              <Tab label="Delivery Logs" />
            </Tabs>
          </Box>
          
          {/* Campaign Details Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ boxShadow: theme.shadows[2], borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mb: 2 }}>
                      Campaign Information
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon color="primary" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Launched
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                              {formatDate(campaign.launchedAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SegmentIcon color="primary" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Target Segment
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                              {campaign.segment?.name || 'Unknown Segment'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon color="primary" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Audience Size
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                              {(campaign.audienceSize || 0).toLocaleString()} customers
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Delivery Success
                            </Typography>
                            <Typography variant="body1" fontWeight="500">
                              {campaign.deliveryStats?.successRate || '0.0%'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', boxShadow: theme.shadows[2], borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mb: 3 }}>
                      Delivery Results
                    </Typography>
                    
                    {/* Success rate progress bar */}
                    {(() => {
                      const attempted = (campaign.deliveryStats?.attempted) || 
                                      ((campaign.deliveryStats?.delivered || 0) + (campaign.deliveryStats?.failed || 0));
                      
                      // Use success rate from API or calculate it
                      const successRateValue = campaign.deliveryStats?.successRate ?
                        parseFloat(campaign.deliveryStats.successRate) : 
                        (attempted > 0 ? ((campaign.deliveryStats?.delivered || 0) / attempted * 100) : 0);
                        
                      let performanceStatus = { color: 'error', label: 'Poor' };
                      if (successRateValue >= 90) {
                        performanceStatus = { color: 'success', label: 'Excellent' };
                      } else if (successRateValue >= 70) {
                        performanceStatus = { color: 'info', label: 'Good' };
                      } else if (successRateValue >= 50) {
                        performanceStatus = { color: 'warning', label: 'Fair' };
                      }
                      
                      return (
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1">Success Rate</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={performanceStatus.label}
                                size="small"
                                color={performanceStatus.color}
                                variant="outlined"
                                sx={{ height: 24, fontSize: '0.75rem' }}
                              />
                              <Typography variant="h6" fontWeight="bold">
                                {successRateValue.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ 
                            width: '100%', 
                            bgcolor: alpha(theme.palette.grey[500], 0.1), 
                            borderRadius: 5, 
                            height: 8 
                          }}>
                            <Box sx={{ 
                              width: `${Math.min(100, successRateValue)}%`, 
                              bgcolor: theme.palette[performanceStatus.color].main, 
                              borderRadius: 5, 
                              height: 8,
                              transition: 'width 1s ease-in-out'
                            }} />
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Based on attempted deliveries ({attempted.toLocaleString()})
                          </Typography>
                        </Box>
                      );
                    })()}
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
                      {/* Sent Messages */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        minWidth: 120
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmailIcon sx={{ color: 'primary.main', mr: 1 }} />
                          <Typography variant="body2">Sent</Typography>
                          <Tooltip title="Number of messages accepted by the messaging vendor" arrow placement="top">
                            <InfoIcon sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.875rem' }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {((campaign.deliveryStats?.sent) || 0).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {/* Delivered Messages */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        p: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderRadius: 2,
                        minWidth: 120
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MarkEmailReadIcon sx={{ color: 'success.main', mr: 1 }} />
                          <Typography variant="body2">Delivered</Typography>
                          <Tooltip title="Messages confirmed delivered to recipients" arrow placement="top">
                            <InfoIcon sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.875rem' }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {((campaign.deliveryStats?.delivered) || 0).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {/* Failed Messages */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        p: 2,
                        bgcolor: alpha(theme.palette.error.main, 0.05),
                        borderRadius: 2,
                        minWidth: 120
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <ErrorOutlineIcon sx={{ color: 'error.main', mr: 1 }} />
                          <Typography variant="body2">Failed</Typography>
                          <Tooltip title="Messages that could not be delivered" arrow placement="top">
                            <InfoIcon sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.875rem' }} />
                          </Tooltip>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="error.main">
                          {((campaign.deliveryStats?.failed) || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ boxShadow: theme.shadows[2], borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mb: 2 }}>
                      Delivery Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MarkEmailReadIcon sx={{ color: 'success.main', mr: 1 }} />
                      <Typography variant="body1">
                        Successful
                      </Typography>
                    </Box>
                    {/* Calculate actual delivered percentage based on attempted deliveries */}
                    {(() => {
                      const delivered = campaign.deliveryStats?.delivered || 0;
                      const attempted = campaign.deliveryStats?.attempted || 
                                      ((campaign.deliveryStats?.delivered || 0) + (campaign.deliveryStats?.failed || 0));
                      const successPercentage = attempted > 0
                        ? ((delivered / attempted) * 100).toFixed(1)
                        : 0;
                      return (
                        <Typography variant="h4" fontWeight="bold" sx={{ ml: 4, mb: 2 }}>
                          {delivered.toLocaleString()} ({successPercentage}%)
                        </Typography>
                      );
                    })()} 
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ErrorOutlineIcon sx={{ color: 'error.main', mr: 1 }} />
                      <Typography variant="body1">
                        Failed
                      </Typography>
                    </Box>
                    {/* Calculate actual failed percentage based on attempted deliveries */}
                    {(() => {
                      const failed = campaign.deliveryStats?.failed || 0;
                      const attempted = campaign.deliveryStats?.attempted || 
                                      ((campaign.deliveryStats?.delivered || 0) + (campaign.deliveryStats?.failed || 0));
                      const failurePercentage = attempted > 0
                        ? ((failed / attempted) * 100).toFixed(1)
                        : 0;
                      return (
                        <Typography variant="h4" fontWeight="bold" sx={{ ml: 4 }}>
                          {failed.toLocaleString()} ({failurePercentage}%)
                        </Typography>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ boxShadow: theme.shadows[2], borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mb: 2 }}>
                      Delivery Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1">Total Audience: <strong>{(campaign.audienceSize || 0).toLocaleString()}</strong></Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EmailIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1">Messages Sent: <strong>{((campaign.deliveryStats?.sent) || 0).toLocaleString()}</strong></Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        Number of messages accepted by the messaging vendor
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MarkEmailReadIcon sx={{ color: 'success.main', mr: 1 }} />
                      <Typography variant="body1">Delivered: <strong>{((campaign.deliveryStats?.delivered) || 0).toLocaleString()}</strong></Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        Number of messages confirmed as delivered to recipients
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
                      <Typography variant="body1">Failed Delivery: <strong>{((campaign.deliveryStats?.failed) || 0).toLocaleString()}</strong></Typography>
                      <Tooltip title="Number of messages that failed to deliver">
                        <InfoOutlinedIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SegmentIcon sx={{ color: 'info.main', mr: 1 }} />
                      <Typography variant="body1">Target Segment: <strong>{campaign.segment?.name || campaign.segmentName || 'Unknown Segment'}</strong></Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          
          {/* Delivery Logs Tab */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ boxShadow: theme.shadows[2], borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mb: 2 }}>
                      Delivery Logs
                    </Typography>
                    
                    {(campaign.logs && campaign.logs.length > 0) ? (
                      <TableContainer component={Paper} elevation={0}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Customer</TableCell>
                              <TableCell>Contact</TableCell>
                              <TableCell align="center">Status</TableCell>
                              <TableCell>Delivery Time</TableCell>
                              <TableCell>Details</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {campaign.logs
                              // Add an extra filter to ensure logs are for this campaign only
                              .filter(log => !log.campaignId || log.campaignId === campaign.id.toString())
                              .map((log, index) => {
                              // Determine chip color and label based on status
                              let chipProps = {
                                label: 'Unknown',
                                color: 'default',
                                icon: null
                              };
                              
                              switch(log.status?.toLowerCase()) {
                                case 'delivered':
                                  chipProps = { 
                                    label: 'Delivered', 
                                    color: 'success',
                                    icon: <CheckCircleIcon fontSize="small" />
                                  };
                                  break;
                                case 'pending':
                                  chipProps = { 
                                    label: 'Pending', 
                                    color: 'warning',
                                    icon: <InfoOutlinedIcon fontSize="small" />
                                  };
                                  break;
                                case 'sent':
                                  chipProps = { 
                                    label: 'Sent', 
                                    color: 'primary',
                                    icon: <EmailIcon fontSize="small" />
                                  };
                                  break;
                                case 'bounced':
                                case 'failed':
                                  chipProps = { 
                                    label: log.status === 'bounced' ? 'Bounced' : 'Failed', 
                                    color: 'error',
                                    icon: <ErrorOutlineIcon fontSize="small" />
                                  };
                                  break;
                                default:
                                  break;
                              }
                              
                              return (
                                <TableRow key={index} hover>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Box sx={{ 
                                        width: 32, 
                                        height: 32, 
                                        borderRadius: '50%', 
                                        bgcolor: 'primary.light', 
                                        color: 'primary.contrastText',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 1.5
                                      }}>
                                        <PersonIcon fontSize="small" />
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" noWrap>
                                          {log.customer?.name || 'Unknown Customer'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          ID: {log.customer?.id?.toString().substring(0, 8) || 'N/A'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {log.customer?.email || log.customer?.phone || 'N/A'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    {chipProps.icon && (
                                      <Chip 
                                        icon={chipProps.icon}
                                        label={chipProps.label}
                                        color={chipProps.color}
                                        size="small"
                                        sx={{ 
                                          '& .MuiChip-label': { px: 1 },
                                          '& .MuiChip-icon': { ml: 0.5 }
                                        }}
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {log.timestamp ? formatDate(new Date(log.timestamp)) : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ maxWidth: 180 }}>
                                      <Tooltip title={log.details || 'No details available'} arrow placement="left">
                                        <Typography variant="body2" noWrap>
                                          {log.details || 'No details'}
                                        </Typography>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                        <MarkEmailUnreadIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.6, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No delivery logs available for this campaign
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Each campaign maintains its own isolated delivery records, even for customers who appear in multiple campaigns.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CampaignDetailPage;
