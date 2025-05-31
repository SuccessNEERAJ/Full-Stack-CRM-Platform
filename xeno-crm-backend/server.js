// server.js
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
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

// Super simple CORS setup - allow ANY origin (for debugging only)
app.use((req, res, next) => {
  // Set CORS headers - allow ALL origins (temporary debugging solution)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight request for 24 hours

  // Log ALL requests for debugging
  console.log(`CORS REQUEST: ${req.method} ${req.url} from ${req.headers.origin || 'unknown origin'}`);
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request');
    return res.status(204).end();
  }
  
  next();
});

// Debug route to test CORS - can be accessed by frontend to verify connectivity
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'CORS is working correctly',
    user: req.user ? req.user.email : 'not authenticated',
    time: new Date().toISOString()
  });
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic session configuration - simplified for stability
const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'xenocrmsecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
};

// Only use MongoDB store in production if MONGO_URI is available
if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
  try {
    sessionOptions.store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60 // 1 day in seconds
    });
    console.log('Using MongoDB session store');
  } catch (err) {
    console.error('Failed to create MongoDB session store:', err.message);
    console.log('Falling back to memory store');
  }
}

// Configure cookie for cross-origin in production
if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true; // Secure cookies require HTTPS
  sessionOptions.cookie.sameSite = 'none'; // Required for cross-origin cookies
  sessionOptions.cookie.httpOnly = true; // Prevent client-side JS from reading cookie
}

// Always enable these for proper cross-origin functionality
sessionOptions.proxy = true; // Trust the reverse proxy
sessionOptions.cookie.path = '/'; // Available on all paths

// Apply session middleware BEFORE passport initialization
app.use(session(sessionOptions));

// Log session configuration
console.log(`Session configuration: ${process.env.NODE_ENV === 'production' ? 'MongoDB Store' : 'Memory Store'}`);
console.log(`Cookie secure: ${process.env.NODE_ENV === 'production'}`);
console.log(`Cookie sameSite: ${process.env.NODE_ENV === 'production' ? 'none' : 'lax'}`);

// Debug middleware to log session before passport
app.use((req, res, next) => {
  console.log('Session before passport:', req.session.id || 'no session id');
  next();
});

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware to verify passport session
app.use((req, res, next) => {
  console.log('User after passport:', req.user ? `${req.user.email} (${req.user._id})` : 'not authenticated');
  next();
});

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
