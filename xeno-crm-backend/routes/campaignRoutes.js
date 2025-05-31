// routes/campaignRoutes.js
import express from 'express';
const router = express.Router();
import { 
  launchCampaign, 
  updateDeliveryStatus, 
  getCampaigns, 
  getCampaignDetails,
  deleteCampaign,
  simulateDeliveryCallback
} from '../controllers/campaignController.js';
import { validateVendorWebhook } from '../middleware/vendorAuthMiddleware.js';

// Campaign management routes
router.post('/', launchCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaignDetails);
router.delete('/:id', deleteCampaign);

// Delivery receipt API endpoint (for vendor callbacks)
router.post('/delivery-receipt', validateVendorWebhook, updateDeliveryStatus);

// Test endpoint to simulate vendor callbacks (development only)
router.post('/simulate-callback/:logId', simulateDeliveryCallback);

export default router;
