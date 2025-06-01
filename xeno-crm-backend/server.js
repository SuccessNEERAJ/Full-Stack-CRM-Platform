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

// ULTRA permissive CORS setup for debugging - CHANGE THIS BEFORE PRODUCTION RELEASE
app.use(cors({
  // Allow all origins
  origin: function (origin, callback) {
    callback(null, true);
  },
  // Essential settings for cross-domain cookies
  credentials: true,
  exposedHeaders: ['Set-Cookie'],
  
  // Handle the preflight request for ANY headers the browser might send
  allowedHeaders: ['*'], // Allow any headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  maxAge: 86400 // 24 hours in seconds
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Origin: ${req.headers.origin || 'Unknown'}`);
  next();
});

// Custom middleware for logging and OPTIONS handling
app.use((req, res, next) => {
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

// CORS proxy middleware - simple implementation without path-to-regexp issues
import fetch from 'node-fetch';

// Create a simpler CORS proxy route without complex patterns
app.get('/proxy', async (req, res) => {
  try {
    // Get the URL from query parameter instead of path parameter
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing URL parameter. Use ?url=https://example.com' });
    }
    
    console.log(`CORS Proxy request for: ${targetUrl}`);
    
    // Forward all headers except host and connection
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key !== 'host' && key !== 'connection') {
        headers[key] = value;
      }
    }
    
    // Make the request to the target URL
    const response = await fetch(targetUrl, {
      method: 'GET', // For now, only support GET
      headers
    });
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      // Skip CORS headers from original response
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.header(key, value);
      }
    });
    
    // Send the response
    const responseBody = await response.text();
    res.status(response.status).send(responseBody);
    
  } catch (error) {
    console.error('CORS Proxy error:', error);
    res.status(500).json({
      error: 'CORS Proxy error',
      message: error.message
    });
  }
});

// Handle OPTIONS preflight for the proxy
app.options('/proxy', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).end();
});

// Comprehensive session configuration for cross-domain authentication
const sessionOptions = {
  name: 'xeno.sid', // Explicit session name
  secret: process.env.SESSION_SECRET || 'xenocrmsecret',
  resave: false,
  saveUninitialized: true,
  rolling: true, // Refresh session with each response
  proxy: true, // Trust the reverse proxy
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for better persistence
    path: '/', // Available on all paths
    httpOnly: true, // Prevent client-side JS from reading cookie
    // These are critical for cross-domain cookies:
    secure: true, // Always use secure cookies in production and development
    sameSite: 'none' // Always use 'none' for cross-origin cookies
  }
};

// Debug cookie configuration
console.log('Cookie configuration:', {
  name: sessionOptions.name,
  secure: sessionOptions.cookie.secure,
  sameSite: sessionOptions.cookie.sameSite,
  httpOnly: sessionOptions.cookie.httpOnly,
  domain: sessionOptions.cookie.domain || 'not set'
});

// Only use MongoDB store in production if MONGO_URI is available
if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
  try {
    sessionOptions.store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60, // 1 day in seconds
      touchAfter: 1 * 3600, // Only update session once per hour (minimal writes)
      crypto: {
        secret: process.env.SESSION_SECRET || 'xenocrmsecret'
      }
    });
    console.log('Using MongoDB session store with crypto');
  } catch (err) {
    console.error('Failed to create MongoDB session store:', err.message);
    console.log('Falling back to memory store');
  }
}

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
