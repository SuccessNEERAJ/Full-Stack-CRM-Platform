// routes/aiRoutes.js
import express from 'express';
const router = express.Router();
import { isAuthenticated } from '../middleware/auth.js';
import { 
  naturalLanguageToSegment, 
  generateMessageSuggestions, 
  generateCampaignSummary 
} from '../controllers/aiController.js';

// AI route for converting natural language to segment rules
router.post('/segment-rules', isAuthenticated, naturalLanguageToSegment);

// AI route for generating message suggestions
router.post('/message-suggestions', isAuthenticated, generateMessageSuggestions);

// AI route for generating campaign performance summary
router.get('/campaign-summary/:campaignId', isAuthenticated, generateCampaignSummary);

export default router;
