// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  email: {
    type: String,
    required: true
  },
  phone: String,
  company: String,
  position: String,
  profileImage: String,
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
