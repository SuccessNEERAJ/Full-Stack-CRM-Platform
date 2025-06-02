// models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true  // Index for query performance
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  items: [{
    name: String,
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 }
  }],
  amount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
