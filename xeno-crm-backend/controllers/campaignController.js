// controllers/campaignController.js
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import DeliveryLog from '../models/DeliveryLog.js';
import vendorService from '../services/vendorService.js';
import mongoose from 'mongoose';

// In-memory queue to simulate a message broker for batch processing
let deliveryUpdateQueue = [];

// Batch processing interval (5 seconds)
const BATCH_INTERVAL = 5000;

// Process delivery status update queue
setInterval(async () => {
  try {
    if (deliveryUpdateQueue.length === 0) return;
    
    const update = deliveryUpdateQueue.shift();
    console.log(`Processing delivery status update for log ${update.logId}: ${update.status}`);
    
    // Update delivery log
    const updatedLog = await DeliveryLog.findByIdAndUpdate(
      update.logId,
      {
        status: update.status,
        vendorMessageId: update.messageId,
        failureReason: update.reason,
        deliveryData: update.rawData,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedLog) {
      console.error(`Failed to update delivery log ${update.logId}: Log not found`);
      return;
    }
    
    // Increment campaign success or failure counter based on status
    if (updatedLog.campaignId) {
      // Fetch the campaign to update stats
      const campaign = await Campaign.findById(updatedLog.campaignId);
      
      if (!campaign) {
        console.error(`Campaign not found: ${updatedLog.campaignId}`);
        return;
      }
      
      // Initialize deliveryStats if not present
      if (!campaign.deliveryStats) {
        await Campaign.findByIdAndUpdate(updatedLog.campaignId, {
          deliveryStats: { sent: 0, delivered: 0, failed: 0 }
        });
      }
      
      // Update the appropriate counter based on status
      if (update.status === 'delivered') {
        await Campaign.findByIdAndUpdate(
          updatedLog.campaignId,
          { $inc: { 'deliveryStats.delivered': 1 } }
        );
        console.log(`Incremented delivered count for campaign ${updatedLog.campaignId}`);
      } else if (update.status === 'failed') {
        await Campaign.findByIdAndUpdate(
          updatedLog.campaignId,
          { $inc: { 'deliveryStats.failed': 1 } }
        );
        console.log(`Incremented failed count for campaign ${updatedLog.campaignId}`);
      }
    }
    
    console.log(`Updated delivery log ${update.logId} with status: ${update.status}`);
  } catch (error) {
    console.error('Error processing delivery update:', error);
  }
}, BATCH_INTERVAL);

// Helper function to send message via vendor
async function sendMessageToVendor(log, customer, message) {
  try {
    // Call vendor service
    const vendorResponse = await vendorService.sendMessage({
      recipient: {
        phone: customer.phone,
        email: customer.email
      },
      message,
      logId: log._id
    });
    
    // If we get here, the message was accepted by the vendor
    // Update log with initial vendor response
    await DeliveryLog.findByIdAndUpdate(log._id, {
      status: 'sent',
      vendorMessageId: vendorResponse.message_id,
      vendorResponse
    });
    
    // Update campaign stats for sent messages
    await Campaign.findByIdAndUpdate(
      log.campaignId,
      { $inc: { 'deliveryStats.sent': 1 } }
    );
    
    console.log(`Message to ${customer.email || customer.phone} accepted by vendor`);
  } catch (error) {
    console.error(`Failed to send message to customer ${log.customerId}:`, error.message);
    
    // Update log with failure
    await DeliveryLog.findByIdAndUpdate(log._id, {
      status: 'failed',
      failureReason: error.message
    });
    
    // Update campaign stats for failed messages
    await Campaign.findByIdAndUpdate(
      log.campaignId,
      { $inc: { 'deliveryStats.failed': 1 } }
    );
  }
}

// Launch a new campaign targeting a specific segment
const launchCampaign = async (req, res) => {
  try {
    const { name, segmentId, message } = req.body;

    // Validate input
    if (!name || !segmentId) {
      return res.status(400).json({ message: "Name and segmentId are required" });
    }

    // Validate that segmentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(segmentId)) {
      return res.status(400).json({ message: "Invalid segment ID format" });
    }

    // Make sure the segment belongs to the current user
    const segment = await Segment.findOne({
      _id: segmentId,
      userId: req.user._id
    });
    
    if (!segment) {
      return res.status(404).json({ message: "Segment not found or you don't have access to it" });
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
    
    console.log(`Campaign audience query for user ${req.user._id}:`, JSON.stringify(finalQuery, null, 2));
    const matchedCustomers = await Customer.find(finalQuery);
    console.log(`Found ${matchedCustomers.length} customers matching segment criteria`);

    // Create the campaign with audience size information and userId for tenant isolation
    const campaign = await Campaign.create({
      name,
      segmentId,
      userId: req.user._id,  // Add user ID for tenant isolation
      audienceSize: matchedCustomers.length,
      deliveryStats: {
        sent: 0,
        failed: 0
      },
      launchedAt: new Date()
    });

    // Create delivery logs with pending status and send messages asynchronously
    const pendingLogs = await Promise.all(matchedCustomers.map(async (customer) => {
      // Get customer name
      const firstName = customer.firstName || '';
      const lastName = customer.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Valued Customer';
      
      // Create personalized message if provided
      const personalizedMessage = message
        ? message.replace('{NAME}', fullName)
        : `Hi ${fullName}, here's 10% off on your next order!`;
      
      console.log(`Creating pending delivery log for customer: ${fullName} (${customer._id})`);
      
      // Create delivery log entry with pending status
      return DeliveryLog.create({
        campaignId: campaign._id,
        customerId: customer._id,
        message: personalizedMessage,
        status: 'pending'
      });
    }));
    
    // Start asynchronous message sending (don't await)
    pendingLogs.forEach(async (log) => {
      try {
        const customer = await Customer.findById(log.customerId);
        if (customer) {
          // This happens asynchronously and doesn't block the API response
          sendMessageToVendor(log, customer, log.message);
        }
      } catch (err) {
        console.error(`Error starting message delivery for log ${log._id}:`, err);
      }
    });
    
    // Return success response immediately without waiting for message processing
    res.status(201).json({
      id: campaign._id,
      name: campaign.name,
      audienceSize: matchedCustomers.length,
      message: "Campaign created and messages queued for delivery"
    });
  } catch (err) {
    console.error('Error launching campaign:', err);
    res.status(500).json({ message: err.message });
  }
};

// Handle delivery receipt callbacks from the vendor
const updateDeliveryStatus = async (req, res) => {
  try {
    console.log('Received delivery receipt from vendor:', req.body);
    
    // Validate the callback
    if (!vendorService.validateReceipt(req.body)) {
      return res.status(400).json({ message: 'Invalid receipt format' });
    }
    
    // Get log ID from query parameter or reference_id in body
    const logId = req.query.logId || req.body.reference_id;
    if (!logId) {
      return res.status(400).json({ message: 'Missing log ID reference' });
    }
    
    // Map vendor status to our status
    const vendorStatus = req.body.status;
    const status = vendorStatus === 'delivered' ? 'delivered' : 'failed';
    
    // Add to batch processing queue
    deliveryUpdateQueue.push({
      logId,
      status,
      messageId: req.body.message_id,
      reason: req.body.reason || req.body.error_message,
      rawData: req.body
    });
    
    res.status(200).json({ message: 'Delivery status update queued for processing' });
  } catch (err) {
    console.error('Error processing delivery receipt:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Simulate a delivery callback (for testing only)
const simulateDeliveryCallback = async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }
    
    const { logId } = req.params;
    const { success = true } = req.body;
    
    if (!logId || !mongoose.isValidObjectId(logId)) {
      return res.status(400).json({ message: 'Valid log ID is required' });
    }
    
    // Find the log to ensure it exists and preload campaign
    const log = await DeliveryLog.findById(logId);
    if (!log) {
      return res.status(404).json({ message: 'Delivery log not found' });
    }
    
    // Make sure the log is currently in sent status (not already delivered or failed)
    if (log.status === 'delivered' || log.status === 'failed') {
      return res.status(400).json({ 
        message: `Cannot update log that is already in ${log.status} status`,
        currentStatus: log.status
      });
    }
    
    // Generate a simulated vendor message ID
    const messageId = `vendor-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Add to batch processing queue directly instead of making an HTTP request
    deliveryUpdateQueue.push({
      logId,
      status: success ? 'delivered' : 'failed',
      messageId,
      reason: success ? undefined : 'Recipient unavailable',
      rawData: {
        message_id: messageId,
        reference_id: logId,
        status: success ? 'delivered' : 'failed',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`Added ${success ? 'successful' : 'failed'} delivery update to queue for log ${logId}`);
    
    res.status(200).json({
      message: `Simulated ${success ? 'successful' : 'failed'} delivery callback`,
      logId,
      campaignId: log.campaignId,
      status: success ? 'delivered' : 'failed'
    });
  } catch (err) {
    console.error('Error simulating delivery callback:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all campaigns with delivery statistics
const getCampaigns = async (req, res) => {
  try {
    console.log('Fetching all campaigns with segment information');
    
    // Find all campaigns belonging to the current user and sort by most recent first
    const campaigns = await Campaign.find({ userId: req.user._id })
      .sort({ launchedAt: -1 })
      .populate('segmentId', 'name conditions');
      
    console.log(`Found ${campaigns.length} campaigns, checking segment data:`);
    campaigns.forEach(camp => {
      console.log(`Campaign: ${camp._id}, Name: ${camp.name}, Segment: ${camp.segmentId?._id || 'None'}, Audience: ${camp.audienceSize || 0}`);
    });
    
    // Format campaign data for frontend
    const formattedCampaigns = campaigns.map(campaign => {
      // If segmentId is populated, extract the name, otherwise use 'Unknown Segment'
      const segmentName = campaign.segmentId?.name || 'Unknown Segment';
      
      // Get the delivery stats
      const sentCount = campaign.deliveryStats?.sent || 0;
      const failedCount = campaign.deliveryStats?.failed || 0;
      const audienceSize = campaign.audienceSize || 0;
      
      // Calculate success rate
      const successRate = audienceSize > 0
        ? ((sentCount / audienceSize) * 100).toFixed(1) + '%'
        : '0.0%';
      
      console.log(`API - Campaign ${campaign._id}: ${sentCount}/${audienceSize} = ${successRate}`);
      
      return {
        id: campaign._id,
        name: campaign.name,
        segmentName: segmentName,
        segmentId: campaign.segmentId?._id || null,
        audienceSize: audienceSize,
        deliveryStats: {
          sent: sentCount,
          failed: failedCount
        },
        successRate: successRate,
        launchedAt: campaign.launchedAt
      };
    });
    
    console.log('Successfully processed campaign statistics');
    res.status(200).json(formattedCampaigns);
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get details of a specific campaign
const getCampaignDetails = async (req, res) => {
  try {
    // Validate campaign ID
    if (!req.params.id || req.params.id === 'undefined') {
      console.error('Invalid campaign ID provided:', req.params.id);
      return res.status(400).json({ message: 'Invalid campaign ID provided' });
    }
    
    console.log(`Fetching details for campaign ${req.params.id}`);
    
    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(req.params.id)) {
      console.error('Invalid campaign ID format:', req.params.id);
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }
    
    // Fetch campaign with populated segment data, restricted to the current user
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user._id  // Filter by the authenticated user ID for tenant isolation
    }).populate('segmentId', 'name conditions logicType');
    
    if (!campaign) {
      console.error(`Campaign not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    console.log('Found campaign:', {
      id: campaign._id,
      name: campaign.name,
      segmentId: campaign.segmentId?._id,
      segmentName: campaign.segmentId?.name || 'Unknown Segment'
    });
    
    // Get delivery logs with customer information - explicitly filtered by campaign ID
    // This ensures logs from one campaign don't interfere with logs from another campaign
    // even when they share the same customers
    const logs = await DeliveryLog.find({ campaignId: campaign._id })
      .populate('customerId', 'firstName lastName email phone totalSpend');
    
    console.log(`Found ${logs.length} delivery logs for campaign`);
    
    // Use 'delivered' instead of 'success' to match the status used elsewhere in the application
    const successCount = logs.filter(log => log.status === 'delivered').length;
    // Keeping initial failedCount calculation (without bounced) for backward compatibility
    const initialFailedCount = logs.filter(log => log.status === 'failed').length;
    
    // Process logs to handle updated customer model
    const processedLogs = logs.map(log => {
      const customer = log.customerId;
      
      // Handle possibly undefined customer or missing name fields
      let customerData = null;
      if (customer) {
        // Create full name from firstName and lastName
        const firstName = customer.firstName || '';
        const lastName = customer.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Customer';
        
        customerData = {
          id: customer._id,
          name: fullName,
          email: customer.email,
          phone: customer.phone,
          totalSpend: customer.totalSpend
        };
      } else {
        customerData = { id: 'unknown', name: 'Unknown Customer' };
      }
      
      return {
        id: log._id,
        status: log.status,
        customer: customerData,
        timestamp: log.createdAt
      };
    });
    
    // Get audience size from campaign or fallback to logs length
    const totalAudience = campaign.audienceSize || logs.length;
    
    // Use stored delivery stats or calculate from logs
    // We need to correctly track three different statuses:
    // 1. sent: Messages accepted by the vendor API
    // 2. delivered: Messages confirmed as delivered to recipient
    // 3. failed: Messages that failed at either send or delivery stage
    // Use stored delivery stats or calculate from logs
    // We ensure all metrics are properly tracked:
    // 1. sent: Messages accepted by the messaging system
    // 2. delivered: Messages confirmed as delivered to recipient
    // 3. failed: Messages that failed at either send or delivery stage
    // 4. pending: Messages that are still waiting to be processed
    
    // First, check for the actual status counts in the logs
    const sentCount = logs.filter(log => log.status === 'sent').length;
    const deliveredCount = logs.filter(log => log.status === 'delivered').length;
    const failedCount = logs.filter(log => log.status === 'failed' || log.status === 'bounced').length;
    
    // Use the calculated counts or fallback to stored stats
    const campaignSentCount = campaign.deliveryStats?.sent || sentCount || 0;
    const campaignDeliveredCount = campaign.deliveryStats?.delivered || deliveredCount || 0;
    const campaignFailedCount = campaign.deliveryStats?.failed || failedCount || initialFailedCount || 0;
    
    // Calculate success rate based on attempted deliveries (delivered + failed)
    // This correctly accounts for messages that have completed the delivery process
    // and ensures each campaign maintains isolated metrics even for shared customers
    const attemptedDeliveries = campaignDeliveredCount + campaignFailedCount;
    const successRate = attemptedDeliveries > 0 ? 
      (campaignDeliveredCount / attemptedDeliveries * 100).toFixed(1) + '%' : '0.0%';
      
    // Calculate pending count - messages that haven't been processed yet
    const pendingCount = totalAudience - (campaignSentCount + campaignDeliveredCount + campaignFailedCount);
      
    // Add campaign ID to each log entry to ensure frontend can verify campaign isolation
    const logsWithCampaignId = processedLogs.map(log => ({
      ...log,
      campaignId: campaign._id.toString() // Explicitly add campaign ID to each log for verification
    }));
    
    // Make sure segment data is properly formatted for the frontend
    const segmentData = campaign.segmentId 
      ? {
          id: campaign.segmentId._id,
          name: campaign.segmentId.name || 'Unknown Segment',
          conditions: campaign.segmentId.conditions || {}
        }
      : { name: 'Unknown Segment' };
    
    // Calculate metrics for console.log and response
    const metrics = {
      id: campaign._id,
      name: campaign.name,
      segmentData,
      totalAudience: totalAudience,
      sentCount: campaignSentCount,
      deliveredCount: campaignDeliveredCount,
      failedCount: campaignFailedCount,
      attemptedCount: attemptedDeliveries,
      pendingCount: pendingCount, 
      successRate: successRate,
      launchedAt: campaign.launchedAt || campaign.createdAt,
      logsCount: logsWithCampaignId.length
    };

    console.log('Sending campaign details response with:', metrics);

    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.name,
        description: campaign.description,
        content: campaign.content,
        subject: campaign.subject,
        segment: segmentData,
        status: campaign.status,
        createdAt: campaign.createdAt,
        launchedAt: campaign.launchedAt,
        audienceSize: totalAudience,
        deliveryStats: {
          sent: campaignSentCount,
          delivered: campaignDeliveredCount,
          failed: campaignFailedCount,
          attempted: attemptedDeliveries,
          pending: pendingCount,
          successRate: successRate
        },
        logs: logsWithCampaignId
      }
    });
  } catch (err) {
    console.error('Error fetching campaign details:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a campaign
const deleteCampaign = async (req, res) => {
  try {
    // Validate the campaign ID
    if (!req.params.id || req.params.id === 'undefined') {
      console.error('Invalid campaign ID provided:', req.params.id);
      return res.status(400).json({ message: 'Invalid campaign ID provided' });
    }
    
    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(req.params.id)) {
      console.error('Invalid campaign ID format:', req.params.id);
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }
    
    // Check if campaign exists and belongs to the current user
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user._id  // Filter by the authenticated user ID for tenant isolation
    });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or you do not have access to it' });
    }
    
    // Delete all delivery logs associated with this campaign first
    // Use a more specific query to avoid issues with undefined values
    const campaignId = req.params.id;
    await DeliveryLog.deleteMany({ campaignId: campaignId });
    console.log(`Deleted all delivery logs for campaign ${campaignId}`);
    
    // Delete the campaign
    const deletedCampaign = await Campaign.findByIdAndDelete(campaignId);
    
    console.log(`Campaign ${campaignId} deleted successfully`);
    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    res.status(500).json({ message: err.message });
  }
};

export { 
  launchCampaign,
  updateDeliveryStatus,
  getCampaigns,
  getCampaignDetails,
  deleteCampaign,
  simulateDeliveryCallback
};
