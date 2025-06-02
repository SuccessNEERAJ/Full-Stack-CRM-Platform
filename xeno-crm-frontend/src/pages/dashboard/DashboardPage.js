import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import apiService, { updateAuthHeader } from '../../services/apiService';
import { setAuthToken } from '../../utils/authUtils';

// MUI components
import { 
  Box, 
  Typography, 
  Grid, 
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  IconButton,
  Paper,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha,
  Snackbar,
  Alert
} from '@mui/material';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SegmentIcon from '@mui/icons-material/Segment';
import CampaignIcon from '@mui/icons-material/Campaign';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [authProcessing, setAuthProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSegments: 0,
    totalCampaigns: 0,
    recentCampaigns: [],
    // Add additional data for campaign metrics
    campaignStats: {
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalAudience: 0
    },
    // Historical data for growth calculation
    previousPeriod: {
      customers: 0,
      segments: 0,
      campaigns: 0
    },
    // For notifications
    recentActivities: [],
    // AI insights from Groq API
    aiInsights: {
      customerTrends: null,
      segmentRecommendations: null,
      campaignSuggestions: null,
      loaded: false
    }
  });
  
  // Growth data will be calculated based on real data
  const [growthData, setGrowthData] = useState({
    customers: '0%',
    segments: '0%',
    campaigns: '0%'
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        // Check if we have a token in the URL (for initial login)
        const params = new URLSearchParams(location.search);
        const tokenFromUrl = params.get('token');
        // Get token from localStorage if not in URL
        const storedToken = localStorage.getItem('xeno_auth_token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        
        // Prepare headers
        const headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
        
        // Add Authorization header from any available token source
        // Priority: URL token > localStorage token
        if (tokenFromUrl && params.get('auth') === 'success') {
          console.log('Using token from URL for initial data fetch');
          headers['Authorization'] = `Bearer ${tokenFromUrl}`;
          // Also save the token to localStorage for future use
          localStorage.setItem('xeno_auth_token', tokenFromUrl);
        } else if (storedToken) {
          console.log('Using stored token for data fetch');
          headers['Authorization'] = `Bearer ${storedToken}`;
        } else {
          console.log('No token available for data fetch - this may cause authentication issues');
        }
        
        console.log('Dashboard data fetch - Headers:', JSON.stringify(headers));
        
        // Use fetch API with proper error handling
        let customersRes, segmentsRes, campaignsRes, historicalDataRes, aiInsightsRes;
        
        try {
          // Fetch customers with improved error handling
          const customersResponse = await fetch(`${apiUrl}/api/customers?_t=${timestamp}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
          
          if (!customersResponse.ok) {
            console.error('Customers API error:', customersResponse.status, customersResponse.statusText);
            throw new Error(`Customers API returned ${customersResponse.status}`);
          }
          
          const customersData = await customersResponse.json();
          console.log('Customers data received:', customersData.length || 0, 'customers');
          customersRes = { data: customersData };
          
          // Fetch segments with improved error handling
          const segmentsResponse = await fetch(`${apiUrl}/api/segments?_t=${timestamp}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
          
          if (!segmentsResponse.ok) {
            console.error('Segments API error:', segmentsResponse.status, segmentsResponse.statusText);
            throw new Error(`Segments API returned ${segmentsResponse.status}`);
          }
          
          const segmentsData = await segmentsResponse.json();
          console.log('Segments data received:', segmentsData.length || 0, 'segments');
          segmentsRes = { data: segmentsData };
          
          // Fetch campaigns with improved error handling
          const campaignsResponse = await fetch(`${apiUrl}/api/campaigns?_t=${timestamp}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
          
          if (!campaignsResponse.ok) {
            console.error('Campaigns API error:', campaignsResponse.status, campaignsResponse.statusText);
            throw new Error(`Campaigns API returned ${campaignsResponse.status}`);
          }
          
          const campaignsData = await campaignsResponse.json();
          console.log('Campaigns data received:', campaignsData.length || 0, 'campaigns');
          campaignsRes = { data: campaignsData };
          
          // Fetch historical data (might not exist)
          try {
            const historicalResponse = await fetch(`${apiUrl}/api/stats/historical?_t=${timestamp}`, {
              method: 'GET',
              headers: headers,
              credentials: 'include'
            });
            
            if (historicalResponse.ok) {
              historicalDataRes = { data: await historicalResponse.json() };
            } else {
              console.log('Historical data API returned status:', historicalResponse.status);
              historicalDataRes = { data: null };
            }
          } catch (error) {
            console.log('Historical data not available:', error.message);
            historicalDataRes = { data: null };
          }
          
          // Fetch AI insights using Groq API integration
          try {
            const aiInsightsResponse = await fetch(`${apiUrl}/api/ai/insights?_t=${timestamp}`, {
              method: 'GET',
              headers: headers,
              credentials: 'include'
            });
            
            if (aiInsightsResponse.ok) {
              aiInsightsRes = { data: await aiInsightsResponse.json() };
              console.log('AI insights data received');
            } else {
              console.error('AI insights API error:', aiInsightsResponse.status);
              aiInsightsRes = { data: null };
            }
          } catch (error) {
            console.log('AI insights not available:', error.message);
            aiInsightsRes = { data: null };
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setNotification({
            open: true,
            message: `Error fetching dashboard data: ${error.message}`,
            severity: 'error'
          });
          throw error;
        }
        
        const customers = customersRes.data || [];
        const segments = segmentsRes.data || [];
        const campaigns = campaignsRes.data || [];
        
        // Calculate campaign stats
        let totalSent = 0;        // Messages accepted by messaging vendor
        let totalDelivered = 0;   // Messages confirmed as delivered to recipient
        let totalFailed = 0;      // Messages that failed to deliver
        let totalOpened = 0;      // Messages that were opened by recipient
        let totalClicked = 0;     // Messages with links that were clicked
        let totalAudience = 0;    // Total intended audience size
        let totalAttempted = 0;   // Total delivery attempts (delivered + failed)
        
        // Process campaign data to ensure we have accurate delivery stats
        const processedCampaigns = campaigns.map(campaign => {
          // Extract all available stats - supporting both old and new data structure
          const campaignId = campaign._id || campaign.id;
          
          // Get stats from either format
          const sentCount = campaign.deliveryStats?.sent || campaign.sentCount || 0;
          const deliveredCount = campaign.deliveryStats?.delivered || campaign.deliveredCount || 0;
          const failedCount = campaign.deliveryStats?.failed || campaign.failedCount || 0;
          const openedCount = campaign.deliveryStats?.opened || campaign.openedCount || 0;
          const clickedCount = campaign.deliveryStats?.clicked || campaign.clickedCount || 0;
          const audienceSize = campaign.audienceSize || campaign.totalAudience || 0;
          
          // Add to totals for overall statistics
          totalSent += sentCount;
          totalDelivered += deliveredCount;
          totalFailed += failedCount;
          totalOpened += openedCount;
          totalClicked += clickedCount;
          totalAudience += audienceSize;
          totalAttempted += (deliveredCount + failedCount);
          
          return {
            id: campaignId,
            name: campaign.name,
            sentCount: sentCount,
            deliveredCount: deliveredCount,
            failedCount: failedCount,
            openedCount: openedCount,
            clickedCount: clickedCount,
            audienceSize: audienceSize,
            // Calculate success rate for this campaign specifically
            successRate: (deliveredCount + failedCount) > 0 ? 
              (deliveredCount / (deliveredCount + failedCount) * 100).toFixed(1) : '0.0',
            date: campaign.launchedAt || campaign.createdAt || new Date().toISOString()
          };
        });
        
        // Sort by date (newest first)
        const sortedCampaigns = processedCampaigns.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        // Calculate growth rates based on historical data if available
        let growth = {
          customers: '0%',
          segments: '0%',
          campaigns: '0%'
        };
        
        let previousPeriod = {
          customers: 0,
          segments: 0,
          campaigns: 0
        };
        
        // Try to calculate growth rates if historical data is available
        if (historicalDataRes?.data) {
          const historical = historicalDataRes.data;
          
          // Previous period data
          previousPeriod = {
            customers: historical.previousCustomers || 0,
            segments: historical.previousSegments || 0,
            campaigns: historical.previousCampaigns || 0
          };
          
          // Calculate growth percentages
          const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const growthRate = ((current - previous) / previous) * 100;
            return (growthRate >= 0 ? '+' : '') + growthRate.toFixed(1) + '%';
          };
          
          growth = {
            customers: calculateGrowth(customers.length, previousPeriod.customers),
            segments: calculateGrowth(segments.length, previousPeriod.segments),
            campaigns: calculateGrowth(campaigns.length, previousPeriod.campaigns)
          };
        } else {
          // If no historical data, use current data as a baseline
          previousPeriod = {
            customers: customers.length,
            segments: segments.length,
            campaigns: campaigns.length
          };
        }
        
        // Get recent activities for notifications
        const recentActivities = [];
        
        // Add recent campaigns to activities
        sortedCampaigns.slice(0, 5).forEach(campaign => {
          recentActivities.push({
            type: 'campaign',
            id: campaign.id,
            title: `Campaign "${campaign.name}" launched`,
            date: campaign.date,
            details: `Sent to ${campaign.audienceSize} customers`
          });
        });
        
        // Add recent segments if available (last 5)
        const sortedSegments = [...segments].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        ).slice(0, 5);
        
        sortedSegments.forEach(segment => {
          recentActivities.push({
            type: 'segment',
            id: segment._id || segment.id,
            title: `Segment "${segment.name}" created`,
            date: segment.createdAt || new Date().toISOString(),
            details: `Contains ${segment.customerCount || 0} customers`
          });
        });
        
        // Add recent customers if available (last 5)
        const sortedCustomers = [...customers].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        ).slice(0, 5);
        
        sortedCustomers.forEach(customer => {
          recentActivities.push({
            type: 'customer',
            id: customer._id || customer.id,
            title: `New customer added`,
            date: customer.createdAt || new Date().toISOString(),
            details: `${customer.firstName} ${customer.lastName} (${customer.email})`
          });
        });
        
        // Sort all activities by date
        recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Process AI insights if available
        let processedAiInsights = {
          customerTrends: null,
          segmentRecommendations: null,
          campaignSuggestions: null,
          loaded: false
        };
        
        if (aiInsightsRes?.data) {
          const insights = aiInsightsRes.data;
          console.log('Processing AI insights from Groq API');
          
          processedAiInsights = {
            customerTrends: insights.customerTrends || null,
            segmentRecommendations: insights.segmentRecommendations || null,
            campaignSuggestions: insights.campaignSuggestions || null,
            // Any additional insights from Groq
            growthPredictions: insights.growthPredictions || null,
            loaded: true
          };
          
          console.log('AI insights loaded successfully');
        } else {
          console.log('No AI insights available');
        }
        
        // Set state with all the calculated data
        setStats({
          totalCustomers: customers.length,
          totalSegments: segments.length,
          totalCampaigns: campaigns.length,
          recentCampaigns: sortedCampaigns.slice(0, 3),
          campaignStats: {
            totalSent,
            totalDelivered,
            totalFailed,
            totalAttempted,
            totalOpened,
            totalClicked,
            totalAudience
          },
          previousPeriod,
          recentActivities: recentActivities.slice(0, 10), // Keep only the 10 most recent activities
          aiInsights: processedAiInsights
        });
        
        // Set growth data separately
        setGrowthData(growth);
        
        if (customers.length === 0 && segments.length === 0 && campaigns.length === 0) {
          console.log('Warning: No data retrieved from API endpoints. User might need to add initial data.');
          
          // Show notification to user if no data is available
          setNotification({
            open: true,
            message: 'No customer, segment, or campaign data found. Create your first entries to populate the dashboard.',
            severity: 'info'
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle navigation to campaign details
  const handleCampaignClick = (campaignId) => {
    navigate(`/campaigns/${campaignId}`);
  };

  // Handle auth redirect and JWT token storage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('auth') === 'success') {
      console.log('Auth success detected. Processing authentication...');
      setAuthProcessing(true);
      
      // Check for JWT token in URL parameters
      const token = params.get('token');
      if (token) {
        console.log('JWT token found in URL:', token.substring(0, 20) + '...');
        
        // Try to store the token in localStorage
        try {
          localStorage.setItem('xeno_auth_token', token);
          console.log('Attempted to store token in localStorage');
        } catch (e) {
          console.error('Failed to store token in localStorage:', e);
        }
        
        // Try using the native fetch API instead of axios
        console.log('Using native fetch API with JWT token');
        
        // First verify authentication
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('Making API call to verify token using fetch...');
        
        // Create headers object with the token
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
        
        // Log the headers being sent
        console.log('Headers being sent:', JSON.stringify(headers));
        
        // Use fetch for authentication verification
        fetch(`${apiUrl}/api/auth/current_user`, {
          method: 'GET',
          headers: headers,
          credentials: 'include'
        })
        .then(response => {
          console.log('Response status:', response.status);
          console.log('Response headers:', JSON.stringify([...response.headers.entries()]));
          return response.json();
        })
        .then(data => {
          console.log('Authentication verified:', data);
          
          // If authentication is successful, fetch customers data
          console.log('Fetching customers data with token...');
          return fetch(`${apiUrl}/api/customers?_t=${Date.now()}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
        })
        .then(response => response.json())
        .then(customers => {
          console.log('Customers fetched successfully:', customers.length);
          setStats(prevStats => ({
            ...prevStats,
            totalCustomers: customers.length
          }));
          
          // Fetch campaigns data
          console.log('Fetching campaigns data with token...');
          return fetch(`${apiUrl}/api/campaigns?_t=${Date.now()}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
          });
        })
        .then(response => response.json())
        .then(campaigns => {
          console.log('Campaigns fetched successfully:', campaigns.length);
          setStats(prevStats => ({
            ...prevStats,
            totalCampaigns: campaigns.length,
            recentCampaigns: campaigns.slice(0, 5)
          }));
          
          // Clear the URL parameters to prevent re-processing on refresh
          // but keep the user on the dashboard page
          navigate('/dashboard', { replace: true });
          
          // Update auth processing state
          setAuthProcessing(false);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error in authentication or data fetching:', err);
          setAuthProcessing(false);
          setLoading(false);
          
          // Show error notification
          setNotification({
            open: true,
            message: 'Authentication failed. Please try again.',
            severity: 'error'
          });
        });
      } else {
        console.warn('No JWT token found in URL parameters');
        // Try the old session-based approach as fallback
        apiService.get('/api/auth/current_user')
          .then(response => {
            console.log('Session check response:', response.data);
            navigate('/dashboard', { replace: true });
            setAuthProcessing(false);
          })
          .catch(err => {
            console.error('Authentication failed:', err);
            setAuthProcessing(false);
            // Redirect to login if authentication failed
            navigate('/login');
          });
      }
    }
  }, [location, navigate]);
  
  // Load data when component mounts
  useEffect(() => {
    // No animation code needed
  }, [stats]);

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1">Loading dashboard data...</Typography>
      </Box>
    );
  }
  
  // Fallback content if stats are missing
  const hasData = stats && 
    (stats.totalCustomers !== undefined || 
     stats.totalSegments !== undefined || 
     stats.totalCampaigns !== undefined);
     
  if (!hasData) {
    console.error('Dashboard data is missing or incomplete:', stats);
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Dashboard Data Issue
        </Typography>
        <Typography variant="body1" paragraph>
          We're having trouble loading your dashboard data. This might be due to authentication issues or server connectivity problems.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mr: 2 }}
        >
          Reload Page
        </Button>
        <Button 
          variant="outlined"
          onClick={() => navigate('/login')}
        >
          Return to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Notification Snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your customers and campaigns today.
        </Typography>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
            '&:hover': {
              boxShadow: `0px 8px 30px ${alpha(theme.palette.primary.main, 0.2)}`,
              transform: 'translateY(-5px)',
              transition: 'all 0.3s ease'
            },
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 100,
              height: 100,
              background: `linear-gradient(45deg, transparent 49%, ${alpha(theme.palette.primary.light, 0.2)} 50%, ${alpha(theme.palette.primary.light, 0.2)} 100%)`,
              borderRadius: '0 0 0 100%',
              zIndex: 0
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 48,
                    height: 48,
                    mr: 2
                  }}
                >
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="700">
                    {stats.totalCustomers.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <ArrowUpwardIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      {growthData.customers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      this month
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                  Total Customers
                </Typography>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={() => navigate('/customers')}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                  }}
                >
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: `0px 4px 20px ${alpha(theme.palette.secondary.main, 0.1)}`,
            '&:hover': {
              boxShadow: `0px 8px 30px ${alpha(theme.palette.secondary.main, 0.2)}`,
              transform: 'translateY(-5px)',
              transition: 'all 0.3s ease'
            },
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 100,
              height: 100,
              background: `linear-gradient(45deg, transparent 49%, ${alpha(theme.palette.secondary.light, 0.2)} 50%, ${alpha(theme.palette.secondary.light, 0.2)} 100%)`,
              borderRadius: '0 0 0 100%',
              zIndex: 0
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    width: 48,
                    height: 48,
                    mr: 2
                  }}
                >
                  <SegmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="700">
                    {stats.totalSegments}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <ArrowUpwardIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      {growthData.segments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      this month
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                  Total Segments
                </Typography>
                <IconButton 
                  size="small" 
                  color="secondary" 
                  onClick={() => navigate('/segments')}
                  sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.15) }
                  }}
                >
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: `0px 4px 20px ${alpha(theme.palette.info.main, 0.1)}`,
            '&:hover': {
              boxShadow: `0px 8px 30px ${alpha(theme.palette.info.main, 0.2)}`,
              transform: 'translateY(-5px)',
              transition: 'all 0.3s ease'
            },
            transition: 'all 0.3s ease'
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 100,
              height: 100,
              background: `linear-gradient(45deg, transparent 49%, ${alpha(theme.palette.info.light, 0.2)} 50%, ${alpha(theme.palette.info.light, 0.2)} 100%)`,
              borderRadius: '0 0 0 100%',
              zIndex: 0
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    width: 48,
                    height: 48,
                    mr: 2
                  }}
                >
                  <CampaignIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="700">
                    {stats.totalCampaigns}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <ArrowUpwardIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      {growthData.campaigns}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      this month
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                  Total Campaigns
                </Typography>
                <IconButton 
                  size="small" 
                  color="info" 
                  onClick={() => navigate('/campaigns')}
                  sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.15) }
                  }}
                >
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Analytics and Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Campaigns */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            mb: 3, 
            overflow: 'hidden',
            boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                  <MailOutlineIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Recent Campaigns
                </Typography>
              }
              action={
                <Button 
                  variant="outlined" 
                  size="small"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/campaigns')}
                  sx={{ borderRadius: '8px', fontWeight: 500 }}
                >
                  View All
                </Button>
              }
              sx={{ bgcolor: alpha(theme.palette.primary.light, 0.05) }}
            />
            <Divider />
            {stats.recentCampaigns.length > 0 ? (
              <List sx={{ p: 0 }}>
                {stats.recentCampaigns.map((campaign, index) => {
                  // Calculate success rate
                  const total = campaign.sentCount + campaign.failedCount;
                  const successRate = total > 0 ? Math.round((campaign.sentCount / total) * 100) : 0;
                  
                  // Determine status color
                  let statusColor = 'success.main';
                  if (successRate < 60) statusColor = 'error.main';
                  else if (successRate < 90) statusColor = 'warning.main';
                  
                  return (
                    <React.Fragment key={campaign.id || index}>
                      <ListItem 
                        button 
                        onClick={() => handleCampaignClick(campaign.id)}
                        sx={{ 
                          p: 2.5, 
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              width: 40,
                              height: 40,
                              mr: 2
                            }}
                          >
                            <CampaignIcon fontSize="small" />
                          </Avatar>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {campaign.name}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', mt: 0.5, alignItems: 'center', gap: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                {parseFloat(growthData.customers) >= 0 ? (
                                  <>
                                    <ArrowUpwardIcon sx={{ color: 'success.main', mr: 0.5, fontSize: 16 }} />
                                    <Typography variant="caption" color="success.main" fontWeight="bold">
                                      {growthData.customers} this month
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5, fontSize: 16 }} />
                                    <Typography variant="caption" color="error.main" fontWeight="bold">
                                      {growthData.customers} this month
                                    </Typography>
                                  </>
                                )}
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ErrorOutlineIcon sx={{ fontSize: 14, color: 'error.main', mr: 0.5 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {campaign.failedCount} failed
                                </Typography>
                              </Box>
                              
                              <Chip 
                                label={`${successRate}% success`} 
                                size="small" 
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(theme.palette[statusColor.split('.')[0]][statusColor.split('.')[1]], 0.1),
                                  color: statusColor,
                                  fontWeight: 600
                                }} 
                              />
                            </Box>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <InfoOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {new Date(campaign.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                      {index < stats.recentCampaigns.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, textAlign: 'center' }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}>
                  <MailOutlineIcon sx={{ fontSize: 30, color: theme.palette.primary.main }} />
                </Box>
                <Typography variant="h6" gutterBottom>No recent campaigns</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Launch your first campaign to see it here</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/campaigns/new')}
                >
                  Create Campaign
                </Button>
              </Box>
            )}
          </Card>
          
          {/* Performance Metrics */}
          <Card sx={{ 
            boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                  Campaign Performance
                </Typography>
              }
              sx={{ bgcolor: alpha(theme.palette.success.light, 0.05) }}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                   <Box sx={{ textAlign: 'center', p: 2 }}>
                    {/* Calculate real delivery rate */}
                    {(() => {
                      // Calculate delivery rate as delivered / (delivered + failed) to get actual success rate
                      // This matches what happens in real email/SMS delivery systems
                      const deliveryRate = stats.campaignStats.totalAttempted > 0 ?
                        (stats.campaignStats.totalDelivered / stats.campaignStats.totalAttempted) * 100 : 0;
                      
                      // Color mapping based on rate
                      const rateColor = deliveryRate > 90 ? 'success.main' : 
                                       deliveryRate > 75 ? 'primary.main' : 
                                       deliveryRate > 50 ? 'warning.main' : 'error.main';
                      
                      return (
                        <>
                          <Typography variant="h3" color={rateColor} fontWeight={700}>
                            {deliveryRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Average Delivery Rate</Typography>
                          <Tooltip title={`${stats.campaignStats.totalDelivered} delivered out of ${stats.campaignStats.totalAttempted} attempted`} arrow>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(deliveryRate, 100)} 
                              sx={{ 
                                mt: 1, 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: rateColor
                                }
                              }} 
                            />
                          </Tooltip>
                        </>
                      );
                    })()} 
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    {/* Calculate real open rate */}
                    {(() => {
                      const openRate = stats.campaignStats.totalDelivered > 0 ?
                        (stats.campaignStats.totalOpened / stats.campaignStats.totalDelivered) * 100 : 0;
                      
                      // Color mapping based on rate
                      const rateColor = openRate > 25 ? 'success.main' : 
                                       openRate > 15 ? 'secondary.main' : 
                                       openRate > 10 ? 'warning.main' : 'error.main';
                      
                      return (
                        <>
                          <Typography variant="h3" color={rateColor} fontWeight={700}>
                            {openRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Average Open Rate</Typography>
                          <Tooltip title={`${stats.campaignStats.totalOpened} opened out of ${stats.campaignStats.totalDelivered} delivered`} arrow>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(openRate, 100)} 
                              sx={{ 
                                mt: 1, 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: rateColor
                                }
                              }} 
                            />
                          </Tooltip>
                        </>
                      );
                    })()}
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    {/* Calculate real click rate */}
                    {(() => {
                      const clickRate = stats.campaignStats.totalOpened > 0 ?
                        (stats.campaignStats.totalClicked / stats.campaignStats.totalOpened) * 100 : 0;
                        
                      // Color mapping based on rate
                      const rateColor = clickRate > 15 ? 'success.main' : 
                                       clickRate > 10 ? 'info.main' : 
                                       clickRate > 5 ? 'warning.main' : 'error.main';
                      
                      return (
                        <>
                          <Typography variant="h3" color={rateColor} fontWeight={700}>
                            {clickRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Average Click Rate</Typography>
                          <Tooltip title={`${stats.campaignStats.totalClicked} clicked out of ${stats.campaignStats.totalOpened} opened`} arrow>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(clickRate, 100)} 
                              sx={{ 
                                mt: 1, 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: rateColor
                                }
                              }} 
                            />
                          </Tooltip>
                        </>
                      );
                    })()}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Actions & Tips */}
        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Card sx={{ 
            mb: 3, 
            overflow: 'hidden',
            boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`
          }}>
            <CardHeader 
              title={
                <Typography variant="h6" fontWeight={600}>Quick Actions</Typography>
              }
              sx={{ bgcolor: alpha(theme.palette.primary.light, 0.05) }}
            />
            <Divider />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={<SegmentIcon />}
                  onClick={() => navigate('/segments/new')}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  Create New Segment
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary"
                  fullWidth
                  size="large"
                  startIcon={<CampaignIcon />}
                  onClick={() => navigate('/campaigns/new')}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
                  }}
                >
                  Launch New Campaign
                </Button>
                <Button 
                  variant="contained" 
                  color="info"
                  fullWidth
                  size="large"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/customers/new')}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.2)}`
                  }}
                >
                  Add New Customer
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          {/* AI Tips */}
          <Card sx={{ 
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0px 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.2)} 0%, ${alpha(theme.palette.primary.light, 0.2)} 100%)`
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 140,
              height: 140,
              background: `linear-gradient(45deg, transparent 49%, ${alpha(theme.palette.secondary.light, 0.3)} 50%, ${alpha(theme.palette.secondary.light, 0.3)} 100%)`,
              borderRadius: '0 0 0 100%',
              zIndex: 0
            }} />
            <CardHeader 
              title={
                <Typography variant="h6" fontWeight={600}>AI Insights</Typography>
              }
              sx={{ position: 'relative', zIndex: 1 }}
            />
            <Divider />
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              {/* Show insights only when there's enough data */}
              {stats.totalCampaigns >= 3 && stats.totalCustomers >= 10 ? (
                <>
                  {/* Campaign Performance Insight */}
                  <Box sx={{ mb: 2 }}>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`
                    }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>📊 Campaign Performance</Typography>
                      <Typography variant="body2">
                        {stats.campaignStats.totalDelivered > 0 ?
                          `Your average delivery rate is ${(stats.campaignStats.totalDelivered / Math.max(1, stats.campaignStats.totalAudience) * 100).toFixed(1)}%. ${stats.campaignStats.totalOpened > 0 ? `Open rate: ${(stats.campaignStats.totalOpened / Math.max(1, stats.campaignStats.totalDelivered) * 100).toFixed(1)}%.` : ''}`
                          : 'Launch campaigns to see performance metrics here.'
                        }
                      </Typography>
                    </Paper>
                  </Box>
                  
                  {/* Segment Recommendations */}
                  <Box sx={{ mb: 2 }}>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`
                    }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>⚡ Segment Insight</Typography>
                      <Typography variant="body2">
                        {stats.totalSegments > 0 ?
                          `You have ${stats.totalSegments} segment${stats.totalSegments !== 1 ? 's' : ''} with a total of ${stats.totalCustomers} customers. Creating targeted segments can improve campaign performance.`
                          : 'Create customer segments to better target your campaigns.'
                        }
                      </Typography>
                    </Paper>
                  </Box>
                  
                  {/* Activity Overview */}
                  <Box>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`
                    }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>🔍 Recent Activity</Typography>
                      <Typography variant="body2">
                        {stats.recentActivities.length > 0 ?
                          `You have ${stats.recentActivities.length} recent ${stats.recentActivities.length === 1 ? 'activity' : 'activities'} in the system. The most recent is "${stats.recentActivities[0]?.title || 'Activity'}" from ${new Date(stats.recentActivities[0]?.date || Date.now()).toLocaleDateString()}.`
                          : 'No recent activities detected. Create campaigns or add customers to see activity.'
                        }
                      </Typography>
                    </Paper>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 48, color: alpha(theme.palette.info.main, 0.7), mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Not enough data for insights</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto', mb: 3 }}>
                    Add more customers, create segments, and launch campaigns to see AI-driven insights here.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/campaigns/create')}
                    startIcon={<CampaignIcon />}
                    sx={{ mr: 1 }}
                  >
                    Create Campaign
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate('/customers/new')}
                    startIcon={<PeopleIcon />}
                  >
                    Add Customer
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
