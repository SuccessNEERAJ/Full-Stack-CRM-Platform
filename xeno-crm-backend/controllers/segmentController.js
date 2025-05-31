// controllers/segmentController.js
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';

const createSegment = async (req, res) => {
  try {
    // Create segment with stronger write concern
    const segment = await Segment.create(req.body);
    
    // Verify the segment was created by reading it back
    const verifiedSegment = await Segment.findById(segment._id);
    
    if (!verifiedSegment) {
      return res.status(500).json({ message: 'Segment creation could not be verified' });
    }
    
    res.status(201).json(verifiedSegment);
  } catch (err) {
    console.error('Error creating segment:', err);
    res.status(400).json({ message: err.message });
  }
};

const previewAudience = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);

    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }

    // Make sure we have valid conditions
    if (!segment.conditions || Object.keys(segment.conditions).length === 0) {
      // If no conditions, return all customers (up to a limit)
      const allCustomers = await Customer.find().limit(100);
      return res.status(200).json({
        count: allCustomers.length,
        customers: allCustomers
      });
    }

    // Find customers matching the segment conditions
    const matchedCustomers = await Customer.find(segment.conditions);
    
    console.log(`Found ${matchedCustomers.length} customers for segment ${req.params.id}`);

    res.status(200).json({
      count: matchedCustomers.length,
      customers: matchedCustomers || [] // Ensure customers is always an array
    });
  } catch (err) {
    console.error('Error in previewAudience:', err);
    res.status(400).json({ message: err.message });
  }
};

// Get all segments
const getSegments = async (req, res) => {
  try {
    const segments = await Segment.find().sort({ createdAt: -1 });
    
    // Ensure dates are properly formatted
    const formattedSegments = segments.map(segment => {
      // Convert to plain object
      const segmentObj = segment.toObject();
      
      // Ensure createdAt and updatedAt are proper Date objects if they exist
      if (segmentObj.createdAt) {
        // Keep the original date but ensure it's a valid Date object
        segmentObj.createdAt = new Date(segmentObj.createdAt).toISOString();
      }
      
      if (segmentObj.updatedAt) {
        segmentObj.updatedAt = new Date(segmentObj.updatedAt).toISOString();
      }
      
      return segmentObj;
    });
    
    console.log('Fetched segments with formatted dates:', formattedSegments.map(s => ({ 
      id: s._id, 
      name: s.name, 
      createdAt: s.createdAt 
    })));
    
    res.status(200).json(formattedSegments);
  } catch (err) {
    console.error('Error fetching segments:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get segment by ID
const getSegmentById = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    res.status(200).json(segment);
  } catch (err) {
    console.error('Error fetching segment:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update segment by ID
const updateSegment = async (req, res) => {
  try {
    console.log('Updating segment:', req.params.id, req.body);
    
    const updatedSegment = await Segment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedSegment) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    console.log('Segment updated successfully:', updatedSegment);
    res.status(200).json(updatedSegment);
  } catch (err) {
    console.error('Error updating segment:', err);
    res.status(400).json({ message: err.message });
  }
};

// Delete segment by ID
const deleteSegment = async (req, res) => {
  try {
    console.log(`Attempting to delete segment ${req.params.id}`);
    
    // Check if this segment is used in any campaigns
    // Import Campaign dynamically to avoid circular dependencies
    const { default: Campaign } = await import('../models/Campaign.js');
    const associatedCampaigns = await Campaign.countDocuments({ segmentId: req.params.id });
    
    if (associatedCampaigns > 0) {
      return res.status(400).json({ 
        message: `Cannot delete segment with ${associatedCampaigns} associated campaigns. Delete the campaigns first.` 
      });
    }
    
    // Delete the segment
    const deletedSegment = await Segment.findByIdAndDelete(req.params.id);
    
    if (!deletedSegment) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    console.log(`Segment ${req.params.id} deleted successfully`);
    res.status(200).json({ message: 'Segment deleted successfully' });
  } catch (err) {
    console.error('Error deleting segment:', err);
    res.status(500).json({ message: err.message });
  }
};

export {
  createSegment,
  previewAudience,
  getSegments,
  getSegmentById,
  updateSegment,
  deleteSegment
};
