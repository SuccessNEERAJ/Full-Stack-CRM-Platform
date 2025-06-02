// utils/groqService.js
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure API keys for different AI features from environment variables
const API_KEYS = {
  segmentRules: process.env.GROQ_API_KEY_SEGMENT_RULES,
  messageSuggestions: process.env.GROQ_API_KEY_MESSAGE_SUGGESTIONS,
  campaignSummary: process.env.GROQ_API_KEY_CAMPAIGN_SUMMARY,
  customerTrends: process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_SEGMENT_RULES,
  segmentRecommendations: process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_MESSAGE_SUGGESTIONS,
  campaignSuggestions: process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_CAMPAIGN_SUMMARY
};

/**
 * Get Groq client for a specific feature
 * @param {string} feature - The AI feature to use ('segmentRules', 'messageSuggestions', or 'campaignSummary')
 * @returns {Groq} Groq client instance
 */
const getGroqClient = (feature) => {
  const apiKey = API_KEYS[feature];
  if (!apiKey) {
    throw new Error(`No API key configured for feature: ${feature}`);
  }
  return new Groq({ apiKey });
};

/**
 * Make a non-streaming request to Groq API
 * @param {string} feature - The AI feature to use
 * @param {string} prompt - The prompt to send to the AI
 * @param {object} options - Additional options for the AI request
 * @returns {Promise<string>} The AI response
 */
const askGroq = async (feature, prompt, options = {}) => {
  try {
    console.log(`Making Groq API request for ${feature}...`);
    const groq = getGroqClient(feature);
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 15000);
    });
    
    const apiPromise = groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: options.temperature || 0.7,
      max_completion_tokens: options.maxTokens || 1024,
      top_p: options.topP || 1,
      stream: false,
      stop: options.stop || null
    });
    
    // Race between API call and timeout
    const chatCompletion = await Promise.race([apiPromise, timeoutPromise]);
    console.log(`Received Groq API response for ${feature}`);
    
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error(`Error calling Groq API for ${feature}:`, error);
    
    // Return fallback content based on the feature
    if (feature === 'messageSuggestions') {
      console.log('Using fallback message suggestions');
      return JSON.stringify([
        {
          "message": "Hi {NAME}, thanks for being a valued customer! Enjoy 10% off your next purchase with code THANKS10.",
          "tone": "Grateful",
          "expectedResponse": "Increase customer engagement"
        },
        {
          "message": "Hello {NAME}! We've got some exciting new products we think you'll love. Check them out today!",
          "tone": "Exciting",
          "expectedResponse": "Drive traffic to new products"
        },
        {
          "message": "{NAME}, we value your business. Use code SPECIAL15 for 15% off your next order!",
          "tone": "Appreciative",
          "expectedResponse": "Boost conversion rates"
        }
      ]);
    }
    
    throw new Error(`AI service error: ${error.message}`);
  }
};

export {
  askGroq
};
