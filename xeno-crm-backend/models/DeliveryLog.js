// models/DeliveryLog.js
import mongoose from 'mongoose';

const deliveryLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'pending',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  vendorMessageId: {
    type: String,
    sparse: true  // Vendor's reference ID
  },
  vendorResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}  // Store raw vendor responses
  },
  deliveredAt: Date,
  failureReason: String
}, {
  timestamps: true
});

const DeliveryLog = mongoose.models.DeliveryLog || mongoose.model('DeliveryLog', deliveryLogSchema);

export default DeliveryLog;
