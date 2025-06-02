// models/Customer.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for query performance
  },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  company: String,
  notes: String,
  totalSpend: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  lastActive: Date,
}, {
  timestamps: true,
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
