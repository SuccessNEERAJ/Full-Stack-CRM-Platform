// routes/authRoutes.js
import express from 'express';
import passport from 'passport';
import mongoose from 'mongoose';
import { getProfile, updateProfile } from '../controllers/userController.js';
const router = express.Router();

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Log successful authentication
    console.log('Authentication successful for user:', req.user?.email);
    console.log('Session ID after auth:', req.session.id);
    
    // Force session save to ensure it's stored before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
      }
      
      // Set additional headers for CORS and cache control
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // Add session ID as query parameter for debugging
      // Ensure we don't have double slashes in the URL
      const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      const redirectUrl = `${baseUrl}/dashboard?auth=success&sid=${req.session.id}&t=${Date.now()}`;
      console.log('Redirecting to:', redirectUrl);
      
      // Redirect to frontend
      res.redirect(redirectUrl);
    });
  }
);

// @route   GET /api/auth/current_user
// @desc    Get current user
// @access  Private
router.get('/current_user', (req, res) => {
  // Debug headers and session info
  console.log('Current user request headers:', {
    origin: req.headers.origin,
    referer: req.headers.referer,
    cookie: req.headers.cookie ? 'Present' : 'Absent'
  });
  
  console.log('Session ID in current_user:', req.session.id || 'no session id');
  console.log('Session exists:', req.session ? 'true' : 'false');
  console.log('User in session:', req.user ? req.user.email : 'No user');
  
  // Explicitly force the session cookie to be sent again with the response
  req.session.touch();
  
  // Set cache control headers to prevent caching
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  if (req.user) {
    // User is authenticated
    res.json({
      isAuthenticated: true,
      user: {
        id: req.user._id,
        displayName: req.user.displayName,
        email: req.user.email,
        profileImage: req.user.profileImage
      },
      sessionId: req.session.id,
      timestamp: new Date().toISOString()
    });
  } else {
    // User is not authenticated
    res.json({ 
      isAuthenticated: false,
      message: 'No user session found',
      sessionId: req.session.id,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  });
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateProfile);

// Test authentication endpoint - ONLY FOR DEVELOPMENT/TESTING
// DO NOT USE IN PRODUCTION
if (process.env.NODE_ENV !== 'production') {
  /**
   * @route   POST /api/auth/test-login
   * @desc    Create a test user session for API testing
   * @access  Public (development only)
   */
  router.post('/test-login', async (req, res) => {
    try {
      // Create a test user that matches the User model schema
      const testUser = {
        _id: new mongoose.Types.ObjectId('123456789abcdef123456789'), // Proper MongoDB ObjectId
        googleId: 'test-google-id-123456789',  // Required by User schema
        displayName: 'API Test User',
        firstName: 'API',
        lastName: 'Test User',
        email: 'test@example.com',
        profileImage: 'https://via.placeholder.com/150',
        lastLogin: new Date()
      };
      
      // Check if we need to get a real user from the database for better compatibility
      const existingUsers = await mongoose.model('User').find().limit(1);
      const userToUse = existingUsers.length > 0 ? existingUsers[0] : testUser;
      
      console.log('Using test user for authentication:', userToUse._id);
      
      // Log in the test user using Passport's req.login method
      req.login(userToUse, (err) => {
        if (err) {
          console.error('Test login error:', err);
          return res.status(500).json({ success: false, message: 'Test login failed', error: err.message });
        }
        
        console.log('Test user authenticated for API testing');
        return res.json({ 
          success: true, 
          message: 'Test user authenticated successfully',
          user: {
            id: userToUse._id,
            displayName: userToUse.displayName,
            email: userToUse.email
          }
        });
      });
    } catch (error) {
      console.error('Error in test login:', error);
      return res.status(500).json({ success: false, message: 'Server error during test login', error: error.message });
    }
  });
  
  // Endpoint to check if test auth is working
  router.get('/test-auth-check', (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ 
        isAuthenticated: true, 
        user: req.user,
        message: 'Test authentication is working correctly'
      });
    } else {
      return res.json({ 
        isAuthenticated: false, 
        message: 'Not authenticated - test login required'
      });
    }
  });
}

export default router;
