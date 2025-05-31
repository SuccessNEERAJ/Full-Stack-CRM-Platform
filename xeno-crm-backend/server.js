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

// Create a simple CORS options object with production domains or localhost
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://full-stack-crm-platform.vercel.app', 'https://xeno-crm.vercel.app']
      : ['http://localhost:3000'];
      
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware with our options
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration with MongoDB store for production
app.use(session({
  secret: process.env.SESSION_SECRET || 'xenocrmsecret',
  resave: false,
  saveUninitialized: true, // Changed to true to ensure cookie is always sent
  proxy: true, // Trust the reverse proxy for HTTPS
  store: process.env.NODE_ENV === 'production'
    ? MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 24 * 60 * 60, // 1 day in seconds
        autoRemove: 'native',
        touchAfter: 24 * 3600 // time period in seconds between session updates
      })
    : null, // Use default memory store in development
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'none', // Always use 'none' for cross-site
    httpOnly: true, // Prevent client-side JS from reading the cookie
    path: '/', // Ensure cookie is available for all paths
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined // Specify domain in production
  }
}));

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
