// routes/segmentRoutes.js
import express from 'express';
const router = express.Router();
import { 
  createSegment, 
  previewAudience, 
  getSegments, 
  getSegmentById,
  updateSegment,
  deleteSegment 
} from '../controllers/segmentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

// Apply requireAuth middleware to all routes
router.use(requireAuth);

// GET all segments
router.get('/', getSegments);

// GET a single segment
router.get('/:id', getSegmentById);

// PUT update a segment
router.put('/:id', updateSegment);

// DELETE a segment
router.delete('/:id', deleteSegment);

// POST a new segment
router.post('/', createSegment);

// GET audience preview for a segment
router.get('/:id/audience-preview', previewAudience);

// POST endpoint to preview audience for new segments before saving
router.post('/preview', async (req, res) => {
  try {
    const { conditions, logicType } = req.body;
    
    if (!conditions) {
      return res.status(400).json({ message: "Conditions are required" });
    }
    
    // IMPORTANT: Always enforce user isolation first and foremost
    // This ensures that no matter what other conditions are applied,
    // we ONLY ever get customers belonging to the current user
    const userFilter = { userId: req.user._id };
    
    // Construct a MongoDB query that properly respects both tenant isolation
    // and the segment's conditions
    let finalQuery;
    
    // Check if conditions has $or operator (indicating OR logic)
    if (conditions.$or || logicType === 'OR') {
      // For OR logic, we need a more complex query structure
      const conditionArray = conditions.$or || [
        // If no $or but logicType is OR, convert conditions to an array with one condition
        conditions
      ];
      
      // Apply tenant isolation to each condition in the OR array
      finalQuery = {
        $and: [
          userFilter, // Always enforce user isolation as the first condition
          { $or: conditionArray }
        ]
      };
    } else {
      // For AND logic, we can simply combine all conditions with userId
      finalQuery = {
        ...userFilter,   // First ensure user isolation
        ...conditions    // Then add segment conditions
      };
    }
    
    console.log(`Segment preview query for user ${req.user._id}:`, JSON.stringify(finalQuery, null, 2));
    
    // Find customers matching the conditions with tenant isolation
    const { default: Customer } = await import('../models/Customer.js');
    const matchedCustomers = await Customer.find(finalQuery);
    
    console.log(`Found ${matchedCustomers.length} customers matching the provided conditions for user ${req.user._id}`);
    
    res.status(200).json({
      count: matchedCustomers.length,
      customers: matchedCustomers
    });
  } catch (err) {
    console.error('Error previewing audience:', err);
    res.status(400).json({ message: err.message });
  }
});

// Add additional endpoint for audience count with proper tenant isolation
router.get('/:id/audience-count', async (req, res) => {
  try {
    // Only fetch segments that belong to the authenticated user
    const { default: Segment } = await import('../models/Segment.js');
    const segment = await Segment.findOne({
      _id: req.params.id,
      userId: req.user._id  // Enforce tenant isolation
    });
    
    if (!segment) {
      return res.status(404).json({ message: "Segment not found or you don't have access to it" });
    }
    
    // IMPORTANT: Always enforce user isolation first and foremost
    const userFilter = { userId: req.user._id };
    
    // Segment conditions from the database
    const segmentConditions = segment.conditions || {};
    
    // Construct a MongoDB query that properly respects both tenant isolation
    // and the segment's conditions and logic type
    let finalQuery;
    
    if (segment.logicType === 'OR' && Object.keys(segmentConditions).length > 0) {
      // For OR logic, we need a more complex query structure
      finalQuery = {
        $and: [
          userFilter, // Always enforce user isolation as the first condition
          { $or: Object.entries(segmentConditions).map(([key, value]) => ({ [key]: value })) }
        ]
      };
    } else {
      // For AND logic, we can simply combine all conditions with userId
      finalQuery = {
        ...userFilter,   // First ensure user isolation
        ...segmentConditions  // Then add segment conditions
      };
    }
    
    console.log(`Segment audience count query for user ${req.user._id}:`, JSON.stringify(finalQuery, null, 2));
    
    const { default: Customer } = await import('../models/Customer.js');
    const count = await Customer.countDocuments(finalQuery);
    console.log(`Found ${count} customers in segment ${req.params.id} for user ${req.user._id}`);
    
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error getting audience count:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add additional endpoint for audience with proper tenant isolation
router.get('/:id/audience', async (req, res) => {
  try {
    // Only fetch segments that belong to the authenticated user
    const { default: Segment } = await import('../models/Segment.js');
    const segment = await Segment.findOne({
      _id: req.params.id,
      userId: req.user._id  // Enforce tenant isolation
    });
    
    if (!segment) {
      return res.status(404).json({ message: "Segment not found or you don't have access to it" });
    }
    
    // IMPORTANT: Always enforce user isolation first and foremost
    const userFilter = { userId: req.user._id };
    
    // Segment conditions from the database
    const segmentConditions = segment.conditions || {};
    
    // Construct a MongoDB query that properly respects both tenant isolation
    // and the segment's conditions and logic type
    let finalQuery;
    
    if (segment.logicType === 'OR' && Object.keys(segmentConditions).length > 0) {
      // For OR logic, we need a more complex query structure
      finalQuery = {
        $and: [
          userFilter, // Always enforce user isolation as the first condition
          { $or: Object.entries(segmentConditions).map(([key, value]) => ({ [key]: value })) }
        ]
      };
    } else {
      // For AND logic, we can simply combine all conditions with userId
      finalQuery = {
        ...userFilter,   // First ensure user isolation
        ...segmentConditions  // Then add segment conditions
      };
    }
    
    console.log(`Segment audience query for user ${req.user._id}:`, JSON.stringify(finalQuery, null, 2));
    
    const { default: Customer } = await import('../models/Customer.js');
    const customers = await Customer
      .find(finalQuery)
      .limit(10); // Limit to 10 customers for preview
    
    console.log(`Found ${customers.length} sample customers in segment ${req.params.id} for user ${req.user._id}`);
    
    res.status(200).json(customers);
  } catch (err) {
    console.error('Error getting audience:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
