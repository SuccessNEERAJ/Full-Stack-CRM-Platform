// routes/aiRoutes.js
import express from 'express';
const router = express.Router();
import { requireAuth } from '../middleware/authMiddleware.js';
import { 
  naturalLanguageToSegment, 
  generateMessageSuggestions, 
  generateCampaignSummary,
  getDashboardInsights
} from '../controllers/aiController.js';

// AI route for converting natural language to segment rules
router.post('/segment-rules', requireAuth, naturalLanguageToSegment);

// AI route for generating message suggestions
router.post('/message-suggestions', requireAuth, generateMessageSuggestions);

// AI route for generating campaign performance summary
router.get('/campaign-summary/:campaignId', requireAuth, generateCampaignSummary);

// AI route for dashboard insights
router.get('/insights', requireAuth, getDashboardInsights);

export default router;
