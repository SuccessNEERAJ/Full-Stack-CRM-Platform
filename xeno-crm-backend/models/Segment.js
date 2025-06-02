// models/Segment.js
import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
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
  conditions: {
    type: Object, // Stores MongoDB filter query as JSON
    required: true
  },
  logicType: {
    type: String,
    enum: ['AND', 'OR'],
    default: 'AND'
  }
}, {
  timestamps: true
});

const Segment = mongoose.model('Segment', segmentSchema);

export default Segment;
