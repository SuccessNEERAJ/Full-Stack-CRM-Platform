// services/vendorService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const VENDOR_API_URL = process.env.VENDOR_API_URL || 'https://api.dummy-messaging-vendor.com/v1';
const VENDOR_API_KEY = process.env.VENDOR_API_KEY || 'your-api-key';
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:5000/api/campaigns/delivery-receipt';

class VendorService {
  constructor() {
    this.client = axios.create({
      baseURL: VENDOR_API_URL,
      headers: {
        'Authorization': `Bearer ${VENDOR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Send a message to a customer via the vendor API
   * @param {Object} params Message parameters
   * @returns {Promise<Object>} Vendor response
   */
  async sendMessage(params) {
    try {
      const { recipient, message, logId } = params;
      
      // In a real implementation, you'd use proper phone/email formatting
      const payload = {
        to: recipient.phone || recipient.email,
        body: message,
        callback_url: `${CALLBACK_URL}?logId=${logId}`, // Pass logId as query param
        reference_id: logId // Your reference to match callbacks
      };
      
      console.log(`Sending message to ${payload.to}: ${message.substring(0, 50)}...`);
      
      // For simulation purposes, we'll randomly succeed/fail with 90/10 ratio
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.9) {
        // Simulate success response
        return {
          success: true,
          message_id: `vendor-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: 'accepted'
        };
      } else if (process.env.NODE_ENV === 'development') {
        // Simulate failure
        throw new Error('Vendor API simulation: Message rejected');
      }
      
      // In production, make the actual API call
      const response = await this.client.post('/messages', payload);
      return response.data;
    } catch (error) {
      console.error('Vendor API error:', error.message);
      throw error;
    }
  }

  /**
   * Validate a delivery receipt from the vendor
   * @param {Object} receipt The receipt payload from the vendor
   * @returns {Boolean} Whether the receipt is valid
   */
  validateReceipt(receipt) {
    // In a real implementation, you'd verify signatures, API keys, etc.
    // For now, we'll do basic validation
    return receipt && receipt.message_id && 
           (receipt.status === 'delivered' || receipt.status === 'failed');
  }
  
  /**
   * Simulate a vendor delivery callback
   * This is only for development testing
   * @param {string} logId The log ID to update
   * @param {boolean} success Whether to simulate success or failure
   * @returns {Promise<Object>} The simulated callback response
   */
  async simulateCallback(logId, success = true) {
    try {
      const status = success ? 'delivered' : 'failed';
      const messageId = `vendor-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const payload = {
        message_id: messageId,
        reference_id: logId,
        status,
        timestamp: new Date().toISOString()
      };
      
      if (!success) {
        payload.reason = 'Recipient unavailable';
      }
      
      // Call our own callback endpoint
      const response = await axios.post(CALLBACK_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Vendor-Signature': 'test-signature'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error simulating callback:', error);
      throw error;
    }
  }
}

export default new VendorService();
