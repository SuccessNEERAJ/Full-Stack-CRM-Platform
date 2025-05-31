import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton, 
  Grid, 
  Divider, 
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

const NewCampaignPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const segmentIdFromUrl = queryParams.get('segmentId');
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select Audience', 'Create Message', 'Review & Launch'];
  
  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState(segmentIdFromUrl || '');
  const [message, setMessage] = useState('');
  const [segments, setSegments] = useState([]);
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  
  // Fetch available segments
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        setSegmentsLoading(true);
        
        // Fetch segments from API
        const response = await apiService.get('/api/segments');
        
        if (response.data && Array.isArray(response.data)) {
          // Get audience counts for each segment
          const segmentsWithAudience = await Promise.all(
            response.data.map(async segment => {
              try {
                // Get audience count for this segment
                const countResponse = await apiService.get(`/api/segments/${segment._id}/audience-count`);
                return {
                  id: segment._id,
                  name: segment.name,
                  audienceSize: countResponse.data?.count || 0
                };
              } catch (error) {
                console.error(`Failed to get audience count for segment ${segment._id}`, error);
                return {
                  id: segment._id,
                  name: segment.name,
                  audienceSize: 0
                };
              }
            })
          );
          
          setSegments(segmentsWithAudience);
        } else {
          setSegments([]);
        }
      } catch (error) {
        console.error('Failed to fetch segments:', error);
        toast.error('Failed to load segments');
      } finally {
        setSegmentsLoading(false);
      }
    };

    fetchSegments();
  }, []);
  
  // Preview audience when segment changes
  useEffect(() => {
    if (selectedSegmentId) {
      previewAudience();
    } else {
      setAudiencePreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegmentId]);
  
  // Handle next step
  const handleNext = () => {
    if (activeStep === 0 && !validateStepOne()) return;
    if (activeStep === 1 && !validateStepTwo()) return;
    
    if (activeStep === steps.length - 1) {
      handleLaunchCampaign();
    } else {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Validate step one
  const validateStepOne = () => {
    if (!campaignName.trim()) {
      toast.error('Campaign name is required');
      return false;
    }
    
    if (!selectedSegmentId) {
      toast.error('Please select a target segment');
      return false;
    }
    
    return true;
  };
  
  // Validate step two
  const validateStepTwo = () => {
    if (!message.trim()) {
      toast.error('Message content is required');
      return false;
    }
    
    if (!message.includes('{NAME}')) {
      toast.warning('Consider adding {NAME} for personalization');
    }
    
    return true;
  };
  
  // Preview audience for the selected segment
  const previewAudience = async () => {
    if (!selectedSegmentId) return;
    
    try {
      setPreviewLoading(true);
      
      // Fetch complete audience data from API
      const audienceResponse = await apiService.get(`/api/segments/${selectedSegmentId}/audience`);
      const countResponse = await apiService.get(`/api/segments/${selectedSegmentId}/audience-count`);
      
      // Find the selected segment from our list
      const segment = segments.find(s => s.id === selectedSegmentId);
      
      // Ensure we have accurate audience count data
      const accurateCount = countResponse.data?.count || 
                           (Array.isArray(audienceResponse.data) ? audienceResponse.data.length : 0) || 
                           segment?.audienceSize || 
                           0;
      
      // Format audience data
      setAudiencePreview({
        count: accurateCount,
        sampleCustomers: Array.isArray(audienceResponse.data) 
          ? audienceResponse.data.slice(0, 10).map(customer => ({
              id: customer._id,
              name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer',
              email: customer.email || 'No email provided',
              phone: customer.phone || 'No phone provided',
              totalSpend: customer.totalSpend || 0
            }))
          : []
      });
      
      console.log('Audience preview loaded:', {
        segmentId: selectedSegmentId,
        count: accurateCount,
        sampleSize: Array.isArray(audienceResponse.data) ? audienceResponse.data.length : 0
      });
    } catch (error) {
      console.error('Failed to preview audience:', error);
      toast.error('Failed to load audience preview');
    } finally {
      setPreviewLoading(false);
    }
  };
  
  // Get AI-suggested messages
  const getAiMessageSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      
      // Get segment info for context
      const selectedSegment = segments.find(s => s.id === selectedSegmentId);
      const segmentName = selectedSegment?.name || '';
      
      console.log('Fetching AI message suggestions for segment:', segmentName);
      
      // Call the real AI endpoint for message suggestions
      const objective = `Create an engaging message for our ${segmentName} segment to promote our products and services`;
      
      const response = await apiService.post('/api/ai/message-suggestions', {
        campaignObjective: objective,
        segmentId: selectedSegmentId
      });
      
      if (response.data && response.data.suggestions) {
        console.log('Received AI message suggestions:', response.data.suggestions);
        setAiSuggestions(response.data.suggestions);
      } else {
        // Fallback to some default suggestions if the API fails
        console.log('No suggestions received from API, using defaults');
        const defaultSuggestions = [
          {
            message: `Hi {NAME}, thanks for being a customer! Enjoy 10% off your next purchase with code THANKS10.`,
            tone: "Grateful",
            expectedResponse: "Increase customer engagement"
          },
          {
            message: `Hello {NAME}! We've got some exciting new products we think you'll love. Check them out today!`,
            tone: "Exciting",
            expectedResponse: "Drive traffic to new products"
          },
          {
            message: `{NAME}, we value your business. Use code SPECIAL15 for 15% off your next order!`,
            tone: "Appreciative",
            expectedResponse: "Boost conversion rates"
          }
        ];
        setAiSuggestions(defaultSuggestions);
      }
    } catch (error) {
      console.error('Failed to get message suggestions:', error);
      toast.error('Failed to generate message suggestions: ' + (error.response?.data?.message || error.message));
      
      // Set fallback suggestions in case of error
      const fallbackSuggestions = [
        {
          message: `Hi {NAME}, thanks for choosing us! Here's a special offer just for you.`,
          tone: "Friendly",
          expectedResponse: "Increase engagement"
        },
        {
          message: `Hello {NAME}! Check out our latest products and promotions, we think you'll love them.`,
          tone: "Informative",
          expectedResponse: "Drive website traffic"
        },
        {
          message: `{NAME}, as a valued customer, enjoy free shipping on your next order with code FREESHIP.`,
          tone: "Appreciative",
          expectedResponse: "Boost sales"
        }
      ];
      setAiSuggestions(fallbackSuggestions);
    } finally {
      setSuggestionsLoading(false);
    }
  };
  
  // Apply an AI-suggested message
  const applyAiSuggestion = (suggestion) => {
    setMessage(suggestion.message);
    toast.success('Message template applied');
  };
  
  // Launch the campaign
  const handleLaunchCampaign = async () => {
    try {
      setLoading(true);
      
      // Prepare campaign data
      const campaignData = {
        name: campaignName,
        segmentId: selectedSegmentId,
        message: message,
        audienceSize: audiencePreview?.count || 0,
        launchedAt: new Date().toISOString(),
        status: 'Active'
      };
      
      // Send to API to create campaign
      await apiService.post('/api/campaigns', campaignData);
      
      toast.success('Campaign launched successfully!');
      
      // Force a hard refresh of the campaigns page to ensure new data is loaded
      window.location.href = '/campaigns';
    } catch (error) {
      console.error('Failed to launch campaign:', error);
      toast.error('Failed to launch campaign');
    } finally {
      setLoading(false);
    }
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Campaign Details
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Campaign Name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. June Discount Campaign"
                    margin="normal"
                    required
                  />
                  
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Target Segment</InputLabel>
                    <Select
                      value={selectedSegmentId}
                      onChange={(e) => setSelectedSegmentId(e.target.value)}
                      label="Target Segment"
                      disabled={segmentsLoading}
                    >
                      {segments.map(segment => (
                        <MenuItem key={segment.id} value={segment.id}>
                          {segment.name} ({segment.audienceSize} customers)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ mr: 1 }} />
                    Audience Preview
                  </Typography>
                  
                  {previewLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : audiencePreview ? (
                    <>
                      <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          {audiencePreview.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Customers will receive this campaign
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Sample Recipients
                      </Typography>
                      
                      {audiencePreview.sampleCustomers.map(customer => (
                        <Box 
                          key={customer.id} 
                          sx={{ 
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: 'background.default'
                          }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {customer.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                      ))}
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        Select a segment to preview audience
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Compose Message
                    </Typography>
                    
                    <Button 
                      variant="outlined" 
                      startIcon={<AutoAwesomeIcon />}
                      onClick={getAiMessageSuggestions}
                      disabled={suggestionsLoading || !selectedSegmentId}
                    >
                      {suggestionsLoading ? <CircularProgress size={24} /> : 'Get AI Suggestions'}
                    </Button>
                  </Box>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Use {'{NAME}'} in your message to personalize it with the customer's name.
                  </Alert>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    label="Message Content"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi {NAME}, here's 10% off on your next order!"
                    margin="normal"
                    required
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Message Preview:
                    </Typography>
                    
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                      <Typography>
                        {message.replace('{NAME}', 'Rahul')}
                      </Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <MessageIcon sx={{ mr: 1 }} />
                    AI Message Suggestions
                  </Typography>
                  
                  {suggestionsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : aiSuggestions.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {aiSuggestions.map((suggestion, index) => (
                        <Paper 
                          key={index} 
                          variant="outlined" 
                          sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                          onClick={() => applyAiSuggestion(suggestion)}
                        >
                          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Chip size="small" label={`Tone: ${suggestion.tone}`} color="primary" variant="outlined" />
                            <Button size="small" onClick={(e) => { e.stopPropagation(); applyAiSuggestion(suggestion); }}>
                              Use
                            </Button>
                          </Box>
                          <Typography variant="body2">
                            {suggestion.message}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        Click "Get AI Suggestions" to generate message templates based on your audience
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Campaign Summary
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Campaign Name
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {campaignName}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Target Segment
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {segments.find(s => s.id === selectedSegmentId)?.name || ''}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Audience Size
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {audiencePreview?.count || 0} customers
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Expected Delivery Rate
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          ~90% (based on historical data)
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Message Template
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {message}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Alert severity="warning" sx={{ mt: 3 }}>
                    After launching, delivery will begin immediately. You'll be able to view delivery statistics once the campaign is complete.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/campaigns')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Create Campaign
        </Typography>
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
      
      {getStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={activeStep === 0 ? () => navigate('/campaigns') : handleBack}
          disabled={loading}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading}
        >
          {loading && <CircularProgress size={24} sx={{ mr: 1 }} />}
          {activeStep === steps.length - 1 ? 'Launch Campaign' : 'Continue'}
        </Button>
      </Box>
    </Box>
  );
};

export default NewCampaignPage;
