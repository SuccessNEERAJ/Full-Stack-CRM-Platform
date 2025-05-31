// server.js
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Import routes
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import segmentRoutes from './routes/segmentRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Import auth middleware
import { isAuthenticated } from './middleware/auth.js';

// Initialize environment variables and database connection
dotenv.config();
connectDB();

// Initialize passport configuration
import './config/passport.js';

const app = express();

// Setup CORS with credentials support
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'xenocrmsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/customers', isAuthenticated, customerRoutes);
app.use('/api/orders', isAuthenticated, orderRoutes);
app.use('/api/segments', isAuthenticated, segmentRoutes);
app.use('/api/campaigns', isAuthenticated, campaignRoutes);
app.use('/api/ai', isAuthenticated, aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'CRM API is running' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
