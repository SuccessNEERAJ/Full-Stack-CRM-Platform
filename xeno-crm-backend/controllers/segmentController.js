// controllers/segmentController.js
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';

const createSegment = async (req, res) => {
  try {
    // Add the authenticated user ID to the segment data
    const segmentData = {
      ...req.body,
      userId: req.user._id // req.user is set by the authentication middleware
    };
    
    // Create segment with stronger write concern
    const segment = await Segment.create(segmentData);
    
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
    // Only fetch segments that belong to the authenticated user
    const segment = await Segment.findOne({ 
      _id: req.params.id,
      userId: req.user._id
    });

    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }

    // Make sure we have valid conditions
    if (!segment.conditions || Object.keys(segment.conditions).length === 0) {
      // If no conditions, return all customers for this user (up to a limit)
      const allCustomers = await Customer.find({ userId: req.user._id }).limit(100);
      return res.status(200).json({
        count: allCustomers.length,
        customers: allCustomers
      });
    }

    // IMPORTANT: Always enforce user isolation first and foremost
    // This ensures that no matter what other conditions are applied,
    // we ONLY ever get customers belonging to the current user
    const userFilter = { userId: req.user._id };
    
    // Segment conditions from the database
    const segmentConditions = segment.conditions || {};
    
    // Construct a MongoDB query that properly respects both tenant isolation
    // and the segment's conditions and logic type
    let finalQuery;
    
    if (segment.logicType === 'OR' && Object.keys(segmentConditions).length > 0) {
      // For OR logic, we need a more complex query structure:
      // We use $and to combine the userId requirement with the $or of segment conditions
      finalQuery = {
        $and: [
          userFilter, // Always enforce user isolation as the first condition
          { $or: Object.entries(segmentConditions).map(([key, value]) => ({ [key]: value })) }
        ]
      };
    } else {
      // For AND logic, we can simply combine all conditions with userId
      finalQuery = {
        ...userFilter,        // First ensure user isolation
        ...segmentConditions  // Then add segment conditions 
      };
    }
    
    console.log(`Segment preview query for user ${req.user._id}:`, JSON.stringify(finalQuery, null, 2));
    const matchedCustomers = await Customer.find(finalQuery);
    
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
  // Only fetch segments belonging to the authenticated user
  try {
    const segments = await Segment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
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
    const segment = await Segment.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
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
    
    const updatedSegment = await Segment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
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
