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

// More permissive CORS configuration for debugging
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true); // Allow any origin during debugging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log CORS requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Do not use app.options('*', cors()) as it causes path-to-regexp errors

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`Request from origin: ${req.headers.origin} to ${req.method} ${req.url}`);
  next();
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
  sessionOptions.cookie.secure = true;
  sessionOptions.cookie.sameSite = 'none';
}

// Apply session middleware
app.use(session(sessionOptions));

// Log session configuration
console.log(`Session configuration: ${process.env.NODE_ENV === 'production' ? 'MongoDB Store' : 'Memory Store'}`);
console.log(`Cookie secure: ${process.env.NODE_ENV === 'production'}`);
console.log(`Cookie sameSite: ${process.env.NODE_ENV === 'production' ? 'none' : 'lax'}`);


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
