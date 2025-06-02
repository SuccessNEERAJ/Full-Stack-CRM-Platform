// controllers/aiController.js
import { askGroq } from '../utils/groqService.js';
import Segment from '../models/Segment.js';
import Campaign from '../models/Campaign.js';
import DeliveryLog from '../models/DeliveryLog.js';
import Customer from '../models/Customer.js';

/**
 * Convert natural language to MongoDB segment rules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const naturalLanguageToSegment = async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }
    
    // Create a prompt for the AI to convert natural language to MongoDB query
    const prompt = `
      Convert the following natural language customer segment description into a MongoDB query object.
      
      Natural language description: "${description}"
      
      The MongoDB query should work with these customer fields:
      - name (String)
      - email (String)
      - phone (String)
      - totalSpend (Number)
      - visits (Number)
      - lastActiveDate (Date)
      
      For date comparisons, use proper MongoDB date operators.
      For numeric comparisons, use proper MongoDB numeric operators.
      
      Return ONLY the valid JSON MongoDB query object and nothing else. The format should be a JavaScript object that can be directly parsed by JSON.parse().
      
      Examples:
      - "Customers who spent more than 10000 rupees" → { "totalSpend": { "$gt": 10000 } }
      - "People who haven't visited in 90 days" → { "lastActiveDate": { "$lt": new Date(new Date().setDate(new Date().getDate() - 90)) } }
      - "Customers who visited more than 5 times and spent less than 5000" → { "$and": [ { "visits": { "$gt": 5 } }, { "totalSpend": { "$lt": 5000 } } ] }
      
      Use appropriate MongoDB operators ($gt, $lt, $gte, $lte, $and, $or, etc.) based on the description.
    `;
    
    // Call Groq API to convert natural language to MongoDB query
    const queryText = await askGroq('segmentRules', prompt, { temperature: 0.2 });
    
    // Clean up the response - ensure we get a valid JSON object
    const cleanedQueryText = queryText.replace(/```json|```javascript|```js|```/g, '').trim();
    
    let queryObject;
    try {
      queryObject = JSON.parse(cleanedQueryText);
    } catch (error) {
      console.error("Failed to parse AI response as JSON:", cleanedQueryText);
      return res.status(500).json({ 
        message: "AI couldn't generate a valid query. Please try rephrasing.",
        rawResponse: cleanedQueryText
      });
    }
    
    res.status(200).json({
      naturalLanguage: description,
      query: queryObject
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Generate message suggestions for a campaign
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateMessageSuggestions = async (req, res) => {
  try {
    console.log('Received message suggestions request:', req.body);
    const { campaignObjective, segmentId } = req.body;
    
    if (!campaignObjective) {
      return res.status(400).json({ message: "Campaign objective is required" });
    }
    
    let segmentInfo = "";
    let segmentName = "";
    
    if (segmentId) {
      try {
        const segment = await Segment.findById(segmentId);
        if (segment) {
          segmentName = segment.name || 'Target Segment';
          segmentInfo = `\nTarget audience: ${segmentName}\nAudience characteristics: ${JSON.stringify(segment.conditions)}`;
          console.log(`Found segment: ${segmentName}`);
        } else {
          console.log(`Segment not found for ID: ${segmentId}`);
        }
      } catch (segmentError) {
        console.error('Error fetching segment:', segmentError);
        // Continue without segment info
      }
    }
    
    // Get a random tone to encourage variety in suggestions
    const tones = [
      'professional', 'casual', 'friendly', 'urgent', 'exclusive', 'appreciative', 
      'exciting', 'informative', 'persuasive', 'personal', 'direct', 'humorous'
    ];
    
    // Randomly select 3 different tones to request
    const shuffledTones = tones.sort(() => 0.5 - Math.random());
    const selectedTones = shuffledTones.slice(0, 3).join(', ');
    
    // Add a timestamp to ensure different results each time
    const timestamp = new Date().toISOString();
    
    // Create a prompt for the AI to generate message suggestions
    const prompt = `
      Generate 3 unique, personalized marketing message templates for a CRM campaign with the following objective:
      
      Objective: "${campaignObjective}"${segmentInfo}
      
      Each message should:
      1. Include a {NAME} placeholder for personalization
      2. Be under 160 characters (SMS-friendly)
      3. Have a clear call-to-action
      4. Be conversational and engaging
      5. Use one of these tones: ${selectedTones}
      
      Make these messages COMPLETELY DIFFERENT from any previous suggestions. Current time is ${timestamp}.
      
      Return the 3 messages in JSON format with the following structure:
      [
        {
          "message": "Hi {NAME}, [message content]",
          "tone": "[professional/casual/urgent/etc]",
          "expectedResponse": "[what this message aims to achieve]"
        },
        ...
      ]
      
      The messages should vary in tone and approach while targeting the same objective.
    `;
    
    try {
      console.log('Calling Groq API for message suggestions...');
      // Call Groq API to generate message suggestions
      const suggestionsText = await askGroq('messageSuggestions', prompt, { temperature: 0.8 });
      
      // Clean up the response - ensure we get a valid JSON array
      const cleanedSuggestionsText = suggestionsText.replace(/```json|```javascript|```js|```/g, '').trim();
      console.log('Received suggestions from Groq API');
      
      let suggestions;
      try {
        suggestions = JSON.parse(cleanedSuggestionsText);
        console.log('Successfully parsed suggestions JSON');
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", cleanedSuggestionsText);
        console.log('Using fallback suggestions due to JSON parse error');
        
        // Provide fallback suggestions from a larger pool to ensure variety
        const fallbackPool = [
          {
            message: `Hi {NAME}, thanks for being a valued customer! Enjoy 10% off your next purchase with code THANKS10.`,
            tone: "Grateful",
            expectedResponse: "Increase customer engagement"
          },
          {
            message: `Hello {NAME}! We've got some exciting new products we think you'll love. Check them out today!`,
            tone: "Exciting",
            expectedResponse: "Drive traffic to new products"
          },
          {
            message: `{NAME}, we value your business. Use code SPECIAL15 for 15% off your next order!`,
            tone: "Appreciative",
            expectedResponse: "Boost conversion rates"
          },
          {
            message: `{NAME}, don't miss out! Our limited-time sale ends tomorrow. Shop now and save 20% on everything!`,
            tone: "Urgent",
            expectedResponse: "Create urgency and immediate action"
          },
          {
            message: `Exclusive offer for {NAME}: Join our VIP program today and get free shipping on all orders for a year!`,
            tone: "Exclusive",
            expectedResponse: "Increase loyalty program signups"
          },
          {
            message: `{NAME}, we noticed you haven't visited in a while. We miss you! Come back and enjoy 15% off your next purchase.`,
            tone: "Personal",
            expectedResponse: "Re-engage inactive customers"
          },
          {
            message: `{NAME}, your feedback matters! Complete our quick survey and get a ₹500 voucher as our thanks.`,
            tone: "Appreciative",
            expectedResponse: "Increase survey participation"
          },
          {
            message: `Hey {NAME}! Your friends are loving our new collection. Come see what the buzz is about and get 10% off today!`,
            tone: "Friendly",
            expectedResponse: "Generate social proof and interest"
          },
          {
            message: `{NAME}, happy birthday month! Celebrate with a special gift from us: 25% off any item of your choice.`,
            tone: "Celebratory",
            expectedResponse: "Increase birthday month purchases"
          }
        ];
        
        // Randomly select 3 different suggestions each time
        suggestions = fallbackPool.sort(() => 0.5 - Math.random()).slice(0, 3);
      }
      
      res.status(200).json({
        objective: campaignObjective,
        suggestions
      });
    } catch (groqError) {
      console.error('Error with Groq API call:', groqError);
      
      // Use the same fallback pool as above but select different suggestions
      const fallbackPool = [
        {
          message: `Hi {NAME}, thanks for being a valued customer! Enjoy 10% off your next purchase with code THANKS10.`,
          tone: "Grateful",
          expectedResponse: "Increase customer engagement"
        },
        {
          message: `Hello {NAME}! We've got some exciting new products we think you'll love. Check them out today!`,
          tone: "Exciting",
          expectedResponse: "Drive traffic to new products"
        },
        {
          message: `{NAME}, we value your business. Use code SPECIAL15 for 15% off your next order!`,
          tone: "Appreciative",
          expectedResponse: "Boost conversion rates"
        },
        {
          message: `{NAME}, don't miss out! Our limited-time sale ends tomorrow. Shop now and save 20% on everything!`,
          tone: "Urgent",
          expectedResponse: "Create urgency and immediate action"
        },
        {
          message: `Exclusive offer for {NAME}: Join our VIP program today and get free shipping on all orders for a year!`,
          tone: "Exclusive",
          expectedResponse: "Increase loyalty program signups"
        },
        {
          message: `{NAME}, we noticed you haven't visited in a while. We miss you! Come back and enjoy 15% off your next purchase.`,
          tone: "Personal",
          expectedResponse: "Re-engage inactive customers"
        },
        {
          message: `{NAME}, your feedback matters! Complete our quick survey and get a ₹500 voucher as our thanks.`,
          tone: "Appreciative",
          expectedResponse: "Increase survey participation"
        },
        {
          message: `Hey {NAME}! Your friends are loving our new collection. Come see what the buzz is about and get 10% off today!`,
          tone: "Friendly",
          expectedResponse: "Generate social proof and interest"
        },
        {
          message: `{NAME}, happy birthday month! Celebrate with a special gift from us: 25% off any item of your choice.`,
          tone: "Celebratory",
          expectedResponse: "Increase birthday month purchases"
        }
      ];
      
      // Randomly select 3 different suggestions each time
      const randomFallbackSuggestions = fallbackPool.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      res.status(200).json({
        objective: campaignObjective,
        suggestions: randomFallbackSuggestions
      });
    }
  } catch (error) {
    console.error('Unexpected error in generateMessageSuggestions:', error);
    res.status(500).json({ 
      message: "Failed to generate message suggestions. Using fallback options.",
      error: error.message 
    });
  }
};

/**
 * Generate a human-readable summary of campaign performance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateCampaignSummary = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    if (!campaignId) {
      return res.status(400).json({ message: "Campaign ID is required" });
    }
    
    // Get campaign details
    const campaign = await Campaign.findById(campaignId)
      .populate('segmentId', 'name conditions');
    
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    // Get delivery logs for the campaign
    const logs = await DeliveryLog.find({ campaignId });
    
    // Calculate basic metrics
    const totalAudience = logs.length;
    const successCount = logs.filter(log => log.status === 'success').length;
    const failedCount = logs.filter(log => log.status === 'failed').length;
    const successRate = totalAudience > 0 ? (successCount / totalAudience * 100).toFixed(1) : 0;
    
    // Get additional metrics based on customer data
    const customerIds = logs.map(log => log.customerId);
    const customers = await Customer.find({ _id: { $in: customerIds } });
    
    const avgSpend = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0) / customers.length;
    const highValueCustomers = customers.filter(c => c.totalSpend > 10000).length;
    const highValueSuccessful = logs
      .filter(log => log.status === 'success')
      .filter(log => customers.find(c => c._id.toString() === log.customerId.toString() && c.totalSpend > 10000))
      .length;
    const highValueRate = highValueCustomers > 0 ? (highValueSuccessful / highValueCustomers * 100).toFixed(1) : 0;
    
    // Create a prompt for the AI to generate a campaign summary
    const prompt = `
      Generate a human-readable, insightful summary of the following campaign performance data:
      
      Campaign Name: ${campaign.name}
      Segment Name: ${campaign.segmentId?.name || 'Not specified'}
      Launch Date: ${new Date(campaign.launchedAt).toLocaleDateString()}
      
      Performance Metrics:
      - Total audience: ${totalAudience}
      - Messages delivered successfully: ${successCount}
      - Failed deliveries: ${failedCount}
      - Success rate: ${successRate}%
      - Average customer spend: ₹${avgSpend.toFixed(2)}
      - High-value customers (>₹10K spend): ${highValueCustomers}
      - High-value customers success rate: ${highValueRate}%
      
      Provide 3-4 sentences of actionable insights based on these metrics. Focus on performance highlights, areas for improvement, and suggestions for future campaigns. Keep the tone professional but conversational.
    `;
    
    // Call Groq API to generate campaign summary
    const summary = await askGroq('campaignSummary', prompt, { temperature: 0.7 });
    
    res.status(200).json({
      campaignId,
      name: campaign.name,
      metrics: {
        totalAudience,
        successCount,
        failedCount,
        successRate: `${successRate}%`,
        avgSpend: `₹${avgSpend.toFixed(2)}`,
        highValueCustomers,
        highValueRate: `${highValueRate}%`
      },
      summary: summary.trim()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get AI-powered insights for the dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardInsights = async (req, res) => {
  try {
    console.log('Generating dashboard insights from real-time data');
    
    // Fetch actual data from the database for generating insights
    // Filter by the current user's ID for tenant isolation
    const userId = req.user._id;
    console.log(`Generating insights for user ID: ${userId}`);
    
    const customers = await Customer.find({ userId }).sort({ createdAt: -1 }).limit(100);
    const segments = await Segment.find({ userId }).sort({ createdAt: -1 }).limit(20);
    const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 }).limit(10);
    
    console.log(`Found ${customers.length} customers, ${segments.length} segments, ${campaigns.length} campaigns`);
    
    // If there's no data at all, return empty insights
    if (customers.length === 0 && segments.length === 0 && campaigns.length === 0) {
      return res.status(200).json({
        customerTrends: null,
        segmentRecommendations: null,
        campaignSuggestions: null,
        message: "Not enough data to generate insights. Add customers, segments, and campaigns to see AI insights."
      });
    }
    
    // Prepare data summaries to feed into the AI
    const customerSummary = customers.length > 0 ? {
      count: customers.length,
      averageSpend: customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0) / customers.length,
      topCustomers: customers
        .sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0))
        .slice(0, 5)
        .map(c => ({ name: `${c.firstName} ${c.lastName}`, spend: c.totalSpend || 0 }))
    } : null;
    
    const segmentSummary = segments.length > 0 ? {
      count: segments.length,
      types: segments.map(s => ({ name: s.name, conditions: s.conditions }))
    } : null;
    
    const campaignSummary = campaigns.length > 0 ? {
      count: campaigns.length,
      recent: campaigns.slice(0, 5).map(c => ({
        name: c.name, 
        audience: c.audienceSize || 0,
        deliveryStats: c.deliveryStats || { sent: 0, delivered: 0 }
      }))
    } : null;
    
    // Generate insights based on available data
    let insights = {
      customerTrends: null,
      segmentRecommendations: null,
      campaignSuggestions: null,
      timestamp: new Date().toISOString()
    };
    
    // If we have customer data, generate customer trends
    if (customerSummary) {
      // Create a prompt for the Groq API to analyze customer data
      const customerPrompt = `
        Analyze this customer data and provide insights:
        ${JSON.stringify(customerSummary)}
        
        Provide 3-4 specific, actionable insights about customer trends based on this data.
        Format the response as a JSON array of strings, each containing one insight.
        Be specific, data-driven, and business-oriented in your insights.
      `;
      
      try {
        const customerInsightsText = await askGroq('customerTrends', customerPrompt, { temperature: 0.4 });
        const cleanedCustomerInsights = customerInsightsText.replace(/```json|```javascript|```js|```/g, '').trim();
        
        try {
          insights.customerTrends = JSON.parse(cleanedCustomerInsights);
        } catch (parseError) {
          console.error("Failed to parse customer insights as JSON:", cleanedCustomerInsights);
          insights.customerTrends = [cleanedCustomerInsights];
        }
      } catch (error) {
        console.error('Error generating customer trends:', error);
      }
    }
    
    // If we have segment data, generate segment recommendations
    if (segmentSummary) {
      // Create a prompt for the Groq API to analyze segment data
      const segmentPrompt = `
        Based on these customer segments:
        ${JSON.stringify(segmentSummary)}
        
        Recommend 2-3 new customer segments that might be valuable for targeted marketing.
        For each recommendation, include:
        - A name for the segment
        - A brief description of the customer characteristics
        - The business value of targeting this segment
        
        Format the response as a JSON array of objects with keys: name, description, businessValue.
      `;
      
      try {
        const segmentInsightsText = await askGroq('segmentRecommendations', segmentPrompt, { temperature: 0.5 });
        const cleanedSegmentInsights = segmentInsightsText.replace(/```json|```javascript|```js|```/g, '').trim();
        
        try {
          insights.segmentRecommendations = JSON.parse(cleanedSegmentInsights);
        } catch (parseError) {
          console.error("Failed to parse segment recommendations as JSON:", cleanedSegmentInsights);
          insights.segmentRecommendations = [{ name: "Custom Segment", description: cleanedSegmentInsights }];
        }
      } catch (error) {
        console.error('Error generating segment recommendations:', error);
      }
    }
    
    // If we have campaign data, generate campaign suggestions
    if (campaignSummary) {
      // Create a prompt for the Groq API to generate campaign suggestions
      const campaignPrompt = `
        Based on these previous campaigns:
        ${JSON.stringify(campaignSummary)}
        
        Suggest 2-3 new marketing campaign ideas that could drive business growth.
        For each suggestion, include:
        - A catchy campaign name
        - The campaign objective
        - Target audience characteristics
        - Expected outcome
        
        Format the response as a JSON array of objects with keys: name, objective, audience, expectedOutcome.
      `;
      
      try {
        const campaignSuggestionsText = await askGroq('campaignSuggestions', campaignPrompt, { temperature: 0.6 });
        const cleanedCampaignSuggestions = campaignSuggestionsText.replace(/```json|```javascript|```js|```/g, '').trim();
        
        try {
          insights.campaignSuggestions = JSON.parse(cleanedCampaignSuggestions);
        } catch (parseError) {
          console.error("Failed to parse campaign suggestions as JSON:", cleanedCampaignSuggestions);
          insights.campaignSuggestions = [{ name: "Growth Campaign", objective: cleanedCampaignSuggestions }];
        }
      } catch (error) {
        console.error('Error generating campaign suggestions:', error);
      }
    }
    
    console.log('Successfully generated dashboard insights');
    res.status(200).json(insights);
    
  } catch (error) {
    console.error('Error generating dashboard insights:', error);
    res.status(500).json({ 
      message: error.message,
      customerTrends: null,
      segmentRecommendations: null,
      campaignSuggestions: null
    });
  }
};

export {
  naturalLanguageToSegment,
  generateMessageSuggestions,
  generateCampaignSummary,
  getDashboardInsights
};
