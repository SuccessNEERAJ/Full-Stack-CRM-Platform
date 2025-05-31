// scripts/fixCampaignStats.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Campaign from '../models/Campaign.js';
import DeliveryLog from '../models/DeliveryLog.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for campaign stats fix'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixCampaignStats() {
  try {
    console.log('Starting campaign statistics fix...');
    
    // Get all campaigns
    const campaigns = await Campaign.find();
    console.log(`Found ${campaigns.length} campaigns to check`);
    
    // Process each campaign
    for (const campaign of campaigns) {
      console.log(`Processing campaign: ${campaign._id} - ${campaign.name}`);
      
      // Get delivery logs for this campaign
      const logs = await DeliveryLog.find({ campaignId: campaign._id });
      console.log(`Found ${logs.length} delivery logs for campaign ${campaign._id}`);
      
      // Count success and failed logs
      const successCount = logs.filter(log => log.status === 'success').length;
      const failedCount = logs.filter(log => log.status === 'failed').length;
      
      // Check if stats need updating
      const currentSent = campaign.deliveryStats?.sent || 0;
      const currentFailed = campaign.deliveryStats?.failed || 0;
      
      if (currentSent !== successCount || currentFailed !== failedCount) {
        console.log(`Updating campaign ${campaign._id} stats:`);
        console.log(`  Current: sent=${currentSent}, failed=${currentFailed}`);
        console.log(`  New: sent=${successCount}, failed=${failedCount}`);
        
        // Update campaign stats
        await Campaign.findByIdAndUpdate(
          campaign._id,
          {
            $set: {
              'deliveryStats.sent': successCount,
              'deliveryStats.failed': failedCount
            }
          }
        );
        
        console.log(`Campaign ${campaign._id} stats updated successfully`);
      } else {
        console.log(`Campaign ${campaign._id} stats are already correct`);
      }
    }
    
    console.log('Campaign statistics fix completed successfully');
  } catch (error) {
    console.error('Error fixing campaign stats:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the fix function
fixCampaignStats();
