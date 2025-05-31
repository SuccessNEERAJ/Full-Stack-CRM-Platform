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
    const { conditions } = req.body;
    
    if (!conditions) {
      return res.status(400).json({ message: "Conditions are required" });
    }
    
    console.log('Previewing audience with conditions:', JSON.stringify(conditions));
    
    // Find customers matching the conditions
    const { default: Customer } = await import('../models/Customer.js');
    const matchedCustomers = await Customer.find(conditions);
    
    console.log(`Found ${matchedCustomers.length} customers matching the provided conditions`);
    
    res.status(200).json({
      count: matchedCustomers.length,
      customers: matchedCustomers
    });
  } catch (err) {
    console.error('Error previewing audience:', err);
    res.status(400).json({ message: err.message });
  }
});

// Add additional endpoint for audience count
router.get('/:id/audience-count', async (req, res) => {
  try {
    const { default: Segment } = await import('../models/Segment.js');
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }
    
    const { default: Customer } = await import('../models/Customer.js');
    const count = await Customer.countDocuments(segment.conditions);
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error getting audience count:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add additional endpoint for audience
router.get('/:id/audience', async (req, res) => {
  try {
    const { default: Segment } = await import('../models/Segment.js');
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }
    
    const { default: Customer } = await import('../models/Customer.js');
    const customers = await Customer
      .find(segment.conditions)
      .limit(10); // Limit to 10 customers for preview
    
    res.status(200).json(customers);
  } catch (err) {
    console.error('Error getting audience:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
