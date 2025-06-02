// models/Campaign.js
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for query performance
  },
  name: {
    type: String,
    required: true
  },
  segmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Segment',
    required: true
  },
  audienceSize: {
    type: Number,
    default: 0
  },
  deliveryStats: {
    sent: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    }
  },
  launchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Check if model already exists before registering it
// This prevents OverwriteModelError when the model is imported with different casing
const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);

export default Campaign;
