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
import { requireAuth } from '../middleware/authMiddleware.js';

// Protected campaign management routes (require authentication)
router.post('/', requireAuth, launchCampaign);
router.get('/', requireAuth, getCampaigns);
router.get('/:id', requireAuth, getCampaignDetails);
router.delete('/:id', requireAuth, deleteCampaign);

// Delivery receipt API endpoint (for vendor callbacks)
router.post('/delivery-receipt', validateVendorWebhook, updateDeliveryStatus);

// Test endpoint to simulate vendor callbacks (development only)
router.post('/simulate-callback/:logId', simulateDeliveryCallback);

export default router;
