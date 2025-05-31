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
  Paper, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import LanguageIcon from '@mui/icons-material/Language';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';

const SegmentBuilderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If editing an existing segment
  const isEditMode = Boolean(id);
  
  // Form state
  const [segmentName, setSegmentName] = useState('');
  const [conditions, setConditions] = useState([]);
  const [logicType, setLogicType] = useState('AND'); // 'AND' or 'OR'
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [showNLPDialog, setShowNLPDialog] = useState(false);
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [nlpLoading, setNlpLoading] = useState(false);
  
  // Available fields and operators for conditions
  const fields = [
    { id: 'totalSpend', label: 'Total Spend (₹)', type: 'number' },
    { id: 'visits', label: 'Visit Count', type: 'number' },
    { id: 'lastActiveDate', label: 'Last Active Date', type: 'date' }
  ];
  
  const operators = {
    number: [
      { id: '$gt', label: 'Greater than' },
      { id: '$gte', label: 'Greater than or equal to' },
      { id: '$lt', label: 'Less than' },
      { id: '$lte', label: 'Less than or equal to' },
      { id: '$eq', label: 'Equal to' }
    ],
    date: [
      { id: '$gt', label: 'After' },
      { id: '$lt', label: 'Before' },
      { id: '$gte', label: 'On or after' },
      { id: '$lte', label: 'On or before' }
    ]
  };
  
  // Load segment data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchSegment = async () => {
        try {
          setLoading(true);
          const response = await apiService.get(`/api/segments/${id}`);
          
          if (response.data) {
            setSegmentName(response.data.name || '');
            setLogicType(response.data.logicType || 'AND');
            
            // Convert conditions from the database format to our UI format
            if (response.data.conditions && Object.keys(response.data.conditions).length > 0) {
              const parsedConditions = [];
              let counter = 1;
              
              // Process conditions from MongoDB query format to our UI format
              for (const [field, operators] of Object.entries(response.data.conditions)) {
                for (const [operator, value] of Object.entries(operators)) {
                  parsedConditions.push({
                    id: String(counter++),
                    field,
                    operator,
                    value: String(value)
                  });
                }
              }
              
              setConditions(parsedConditions.length > 0 ? parsedConditions : 
                [{ id: '1', field: 'totalSpend', operator: '$gt', value: '' }]);
            } else {
              setConditions([{ id: '1', field: 'totalSpend', operator: '$gt', value: '' }]);
            }
          }
        } catch (error) {
          console.error('Failed to fetch segment:', error);
          toast.error('Failed to load segment data');
          // Initialize with default condition on error
          setConditions([{ id: '1', field: 'totalSpend', operator: '$gt', value: '' }]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSegment();
    } else {
      // Initialize with one empty condition for new segments
      setConditions([{ id: '1', field: 'totalSpend', operator: '$gt', value: '' }]);
    }
  }, [isEditMode, id]);
  
  // Handle adding a new condition
  const handleAddCondition = () => {
    const newId = String(conditions.length + 1);
    setConditions([...conditions, { id: newId, field: 'totalSpend', operator: '$gt', value: '' }]);
  };
  
  // Handle removing a condition
  const handleRemoveCondition = (conditionId) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== conditionId));
    } else {
      toast.info('At least one condition is required');
    }
  };
  
  // Handle change to a condition
  const handleConditionChange = (conditionId, field, value) => {
    setConditions(conditions.map(c => {
      if (c.id === conditionId) {
        // If changing the field, also reset the operator to an appropriate one
        if (field === 'field') {
          const fieldType = fields.find(f => f.id === value)?.type || 'number';
          return { ...c, [field]: value, operator: operators[fieldType][0].id };
        }
        
        // Otherwise just update the specified field
        return { ...c, [field]: value };
      }
      return c;
    }));
  };
  
  // Preview audience size
  const handlePreviewAudience = async () => {
    if (!validateForm()) return;
    
    try {
      setPreviewLoading(true);
      
      // Build the MongoDB query from our conditions
      const query = buildQuery();
      console.log('Previewing audience with query:', query);
      
      // Always use the current rules from the form for preview, regardless of edit mode
      const response = await apiService.post('/api/segments/preview', {
        conditions: query
      });
      
      console.log('Segment preview response:', response.data);
      
      if (response.data && response.data.customers) {
        // Process the customers from the response
        const customers = response.data.customers || [];
        
        setAudiencePreview({
          count: response.data.count || customers.length || 0,
          sampleCustomers: customers.length > 0 ? 
            customers.map(customer => ({
              id: customer._id || 'unknown',
              name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer',
              email: customer.email || 'No email',
              totalSpend: parseFloat(customer.totalSpend || 0)
            })) : []
        });
      } else {
        // Handle empty response
        setAudiencePreview({
          count: 0,
          sampleCustomers: []
        });
      }
      
      toast.success('Audience preview loaded with real data');
    } catch (error) {
      console.error('Failed to preview audience:', error);
      toast.error('Failed to preview audience: ' + (error.response?.data?.message || error.message));
      setAudiencePreview({
        count: 0,
        sampleCustomers: []
      }); // Set empty preview on error instead of null
    } finally {
      setPreviewLoading(false);
    }
  };
  
  // Build MongoDB query from conditions
  const buildQuery = () => {
    if (conditions.length === 0) return {};
    
    const conditionQueries = conditions.map(c => {
      const { field, operator, value } = c;
      
      // Handle date conversions
      if (fields.find(f => f.id === field)?.type === 'date') {
        return { [field]: { [operator]: new Date(value) } };
      }
      
      // Handle numeric conversions
      return { [field]: { [operator]: Number(value) } };
    });
    
    if (conditionQueries.length === 1) return conditionQueries[0];
    
    return {
      [`$${logicType.toLowerCase()}`]: conditionQueries
    };
  };
  
  // Handle save segment
  const handleSaveSegment = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for API
      const query = buildQuery();
      const segmentData = {
        name: segmentName,
        conditions: query,
        logicType: logicType
      };
      
      console.log('Saving segment with data:', segmentData);
      
      let response;
      if (isEditMode) {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        // Update existing segment
        response = await apiService.put(`/api/segments/${id}?_t=${timestamp}`, segmentData);
        console.log('Segment update response:', response.data);
        toast.success('Segment updated successfully');
      } else {
        // Create new segment
        response = await apiService.post('/api/segments', segmentData);
        console.log('Segment creation response:', response.data);
        toast.success('Segment created successfully');
      }
      
      // Force a hard refresh of the segments page to ensure new data is loaded
      window.location.href = '/segments';
    } catch (error) {
      console.error('Failed to save segment:', error);
      if (error.response) {
        console.error('Error details:', error.response.data);
        toast.error(`Failed to ${isEditMode ? 'update' : 'create'} segment: ${error.response.data.message || 'Unknown error'}`);
      } else {
        toast.error(`Failed to ${isEditMode ? 'update' : 'create'} segment: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Validate form before preview or save
  const validateForm = () => {
    if (!segmentName.trim()) {
      toast.error('Segment name is required');
      return false;
    }
    
    for (const condition of conditions) {
      if (!condition.value) {
        toast.error('All condition values are required');
        return false;
      }
      
      // Validate numeric values
      if (fields.find(f => f.id === condition.field)?.type === 'number') {
        if (isNaN(Number(condition.value))) {
          toast.error('Invalid numeric value');
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Handle using AI to convert natural language to query
  const handleNaturalLanguageQuery = async () => {
    if (!naturalLanguage.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    try {
      setNlpLoading(true);
      console.log('Processing natural language query:', naturalLanguage);
      
      // Normalize query text for easier matching
      const query = naturalLanguage.toLowerCase();
      
      // Parse complex conditions
      const conditions = [];
      let conditionId = 1;
      let logicOp = 'AND'; // Default logical operator
      
      // Check if it's an AND or OR query
      if (query.includes(' or ')) {
        logicOp = 'OR';
      }
      
      // Split the query into segments for more precise analysis
      // This helps us associate operators with their correct fields
      const segments = query.split(/\s+and\s+|\s+or\s+/i);
      
      // Extract specific condition segments for each field type
      const spendSegment = segments.find(seg => 
        seg.includes('spend') || seg.includes('spent') || seg.includes('purchase'));
      const visitSegment = segments.find(seg => seg.includes('visit'));
      const activeSegment = segments.find(seg => 
        seg.includes('active') || seg.includes('inactive') || seg.includes('days'));
      
      // Process spending conditions if present
      if (spendSegment || query.includes('spent') || query.includes('spend') || query.includes('purchase')) {
        // Use the specific segment if available, otherwise use the full query
        const textToAnalyze = spendSegment || query;
        
        // Extract spend amount
        const spendMatch = textToAnalyze.match(/(?:spent|spend|purchase|than)\s*(?:\w+\s+)*?(\d+)/) || 
                          [null, '1000'];
        const spendAmount = spendMatch[1];
        
        // Determine operator specifically for the spend condition
        let operator = '$gt'; // Default is greater than for spend
        if (textToAnalyze.includes('less than') || textToAnalyze.includes('under') || 
            textToAnalyze.includes('below') || textToAnalyze.includes('at most')) {
          operator = '$lt';
        } else if (textToAnalyze.includes('more than') || textToAnalyze.includes('greater than') ||
                  textToAnalyze.includes('over') || textToAnalyze.includes('above') ||
                  textToAnalyze.includes('at least')) {
          operator = '$gt';
        } else if (textToAnalyze.includes('equal to') || textToAnalyze.includes('exactly')) {
          operator = '$eq';
        } else if (textToAnalyze.includes('greater than or equal') || 
                  textToAnalyze.includes('at least')) {
          operator = '$gte';
        } else if (textToAnalyze.includes('less than or equal') || 
                  textToAnalyze.includes('at most')) {
          operator = '$lte';
        }
        
        conditions.push({ 
          id: String(conditionId++), 
          field: 'totalSpend', 
          operator: operator, 
          value: spendAmount 
        });
        
        console.log(`Added spend condition: ${operator} ${spendAmount}`);
      }
      
      // Process visit conditions if present
      if (visitSegment || query.includes('visit')) {
        // Use the specific segment if available, otherwise use the full query
        const textToAnalyze = visitSegment || query;
        
        // Extract visit count
        const visitMatch = textToAnalyze.match(/(?:visit|visits|than)\s*(?:\w+\s+)*?(\d+)/) || 
                         textToAnalyze.match(/(\d+)\s*(?:\w+\s+)*?(?:visit|visits)/) || 
                         [null, '3'];
        const visitCount = visitMatch[1];
        
        // Determine operator specifically for the visit condition
        let operator = '$gt'; // Default is greater than
        if (textToAnalyze.includes('less than') || textToAnalyze.includes('fewer than') || 
            textToAnalyze.includes('below') || textToAnalyze.includes('under') ||
            textToAnalyze.includes('at most')) {
          operator = '$lt';
        } else if (textToAnalyze.includes('more than') || textToAnalyze.includes('greater than') ||
                  textToAnalyze.includes('over') || textToAnalyze.includes('above')) {
          operator = '$gt';
        } else if (textToAnalyze.includes('equal to') || textToAnalyze.includes('exactly')) {
          operator = '$eq';
        } else if (textToAnalyze.includes('greater than or equal') || 
                  textToAnalyze.includes('at least')) {
          operator = '$gte';
        } else if (textToAnalyze.includes('less than or equal') || 
                  textToAnalyze.includes('at most')) {
          operator = '$lte';
        }
        
        conditions.push({ 
          id: String(conditionId++), 
          field: 'visits', 
          operator: operator, 
          value: visitCount 
        });
        
        console.log(`Added visit condition: ${operator} ${visitCount}`);
      }
      
      // Process activity/date conditions if present
      if (activeSegment || query.includes('active') || query.includes('inactive') || query.includes('days')) {
        // Use the specific segment if available, otherwise use the full query
        const textToAnalyze = activeSegment || query;
        
        // Extract days
        const dayMatch = textToAnalyze.match(/(\d+)\s*(?:days?)/) || [null, '30'];
        const days = dayMatch[1];
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        const dateStr = cutoffDate.toISOString().split('T')[0];
        
        // Determine operator specifically for the date condition
        let operator = '$gt'; // active = lastActiveDate > cutoffDate
        if (textToAnalyze.includes('inactive') || 
            (textToAnalyze.includes('not') && textToAnalyze.includes('active')) ||
            textToAnalyze.includes('more than') || textToAnalyze.includes('longer than')) {
          operator = '$lt'; // inactive = lastActiveDate < cutoffDate
        }
        
        conditions.push({ 
          id: String(conditionId++), 
          field: 'lastActiveDate', 
          operator: operator, 
          value: dateStr
        });
        
        console.log(`Added activity condition: ${operator} ${dateStr}`);
      }
      
      // If we didn't detect any conditions, set a default one
      if (conditions.length === 0) {
        console.log('No specific conditions detected, using default');
        conditions.push({
          id: '1',
          field: 'totalSpend',
          operator: '$gt',
          value: '500'
        });
      }
      
      // Update state with parsed conditions
      setConditions(conditions);
      setLogicType(logicOp);
      
      console.log(`Created ${conditions.length} conditions with ${logicOp} logic`);
      
      toast.success('Query created from description');
    } catch (error) {
      console.error('Failed to process natural language query:', error);
      toast.error('Failed to process your request. Please try different wording.');
    } finally {
      setNlpLoading(false);
      setShowNLPDialog(false);
    }
  };
  
  // Get field type for a given field ID
  const getFieldType = (fieldId) => {
    return fields.find(f => f.id === fieldId)?.type || 'number';
  };
  
  // Get operators for a field type
  const getOperatorsForField = (fieldId) => {
    const fieldType = getFieldType(fieldId);
    return operators[fieldType] || [];
  };
  
  if (loading && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/segments')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEditMode ? 'Edit Segment' : 'Create New Segment'}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Segment Builder Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Segment Name"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g. High-Value Customers"
                  variant="outlined"
                  sx={{ mr: 2 }}
                />
                
                <Button 
                  variant="outlined" 
                  startIcon={<LanguageIcon />}
                  onClick={() => setShowNLPDialog(true)}
                >
                  Use AI
                </Button>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Match Customers with
                </Typography>
                
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Logic Type</InputLabel>
                  <Select
                    value={logicType}
                    onChange={(e) => setLogicType(e.target.value)}
                    label="Logic Type"
                  >
                    <MenuItem value="AND">ALL conditions (AND)</MenuItem>
                    <MenuItem value="OR">ANY condition (OR)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Conditions */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Conditions
                </Typography>
                
                {conditions.map((condition, index) => (
                  <Paper
                    key={condition.id}
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px solid #e0e0e0',
                      borderRadius: 1
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <InputLabel>Field</InputLabel>
                          <Select
                            value={condition.field}
                            onChange={(e) => handleConditionChange(condition.id, 'field', e.target.value)}
                            label="Field"
                          >
                            {fields.map(field => (
                              <MenuItem key={field.id} value={field.id}>
                                {field.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <InputLabel>Operator</InputLabel>
                          <Select
                            value={condition.operator}
                            onChange={(e) => handleConditionChange(condition.id, 'operator', e.target.value)}
                            label="Operator"
                          >
                            {getOperatorsForField(condition.field).map(op => (
                              <MenuItem key={op.id} value={op.id}>
                                {op.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        {getFieldType(condition.field) === 'date' ? (
                          <TextField
                            fullWidth
                            type="date"
                            value={condition.value}
                            onChange={(e) => handleConditionChange(condition.id, 'value', e.target.value)}
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                          />
                        ) : (
                          <TextField
                            fullWidth
                            type="number"
                            value={condition.value}
                            onChange={(e) => handleConditionChange(condition.id, 'value', e.target.value)}
                            variant="outlined"
                            placeholder="Enter value"
                            InputProps={{
                              startAdornment: condition.field === 'totalSpend' ? '₹' : undefined
                            }}
                          />
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton 
                          color="error" 
                          onClick={() => handleRemoveCondition(condition.id)}
                          disabled={conditions.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={handleAddCondition}
                  sx={{ mt: 1 }}
                >
                  Add Condition
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/segments')}
            >
              Cancel
            </Button>
            
            <Box>
              <Button 
                variant="outlined" 
                onClick={handlePreviewAudience} 
                disabled={previewLoading}
                sx={{ mr: 2 }}
              >
                {previewLoading ? <CircularProgress size={24} /> : 'Preview Audience'}
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleSaveSegment}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Segment' : 'Create Segment')}
              </Button>
            </Box>
          </Box>
        </Grid>
        
        {/* Preview Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1 }} />
                Audience Preview
              </Typography>
              
              {audiencePreview ? (
                <>
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {audiencePreview.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customers match these conditions
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      Matching Customers
                    </Typography>
                    {audiencePreview.sampleCustomers.length > 10 && (
                      <Typography variant="caption" color="text.secondary">
                        Showing all {audiencePreview.sampleCustomers.length} customers
                      </Typography>
                    )}
                  </Box>
                  
                  <Box
                    sx={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      pr: 1, // Add some padding for the scrollbar
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 4,
                        '&:hover': {
                          background: 'rgba(0,0,0,0.3)',
                        },
                      },
                    }}
                  >
                    {audiencePreview.sampleCustomers.map((customer, index) => (
                      <Box 
                        key={customer.id || index} 
                        sx={{ 
                          mb: 1,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'background.default',
                          '&:last-child': {
                            mb: 0
                          }
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {customer.email}
                        </Typography>
                        <Typography variant="body2">
                          Spent: ₹{customer.totalSpend.toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Preview your audience to see how many customers match these conditions
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={handlePreviewAudience}
                    disabled={previewLoading}
                  >
                    {previewLoading ? <CircularProgress size={24} /> : 'Preview Now'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Natural Language Dialog */}
      <Dialog open={showNLPDialog} onClose={() => setShowNLPDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Describe Your Audience</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Describe the customers you want to target in natural language, and AI will convert it to segment rules.
          </Alert>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={naturalLanguage}
            onChange={(e) => setNaturalLanguage(e.target.value)}
            placeholder="e.g. Customers who spent more than 10000 rupees and haven't visited in 90 days"
            variant="outlined"
            sx={{ mt: 1 }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Examples:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip 
                label="High spenders (>₹10K)" 
                onClick={() => setNaturalLanguage("Customers who spent more than 10000 rupees")}
                variant="outlined"
                size="small"
              />
              <Chip 
                label="Inactive users (90+ days)" 
                onClick={() => setNaturalLanguage("Customers who haven't been active for 90 days")}
                variant="outlined"
                size="small"
              />
              <Chip 
                label="Frequent shoppers" 
                onClick={() => setNaturalLanguage("Customers who visited more than 5 times")}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNLPDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleNaturalLanguageQuery} 
            variant="contained"
            disabled={nlpLoading}
          >
            {nlpLoading ? <CircularProgress size={24} /> : 'Generate Rules'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SegmentBuilderPage;
