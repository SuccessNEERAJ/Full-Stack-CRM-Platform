// models/Segment.js
import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
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
