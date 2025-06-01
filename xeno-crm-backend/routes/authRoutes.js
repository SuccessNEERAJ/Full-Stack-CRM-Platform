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

// Import JWT helper
import { generateToken, verifyToken } from '../utils/jwtHelper.js';

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Double-check user is in session and has been serialized
    if (!req.user) {
      console.error('No user object after Google authentication');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }
    
    console.log('User authenticated:', req.user.email);
    
    // Generate JWT token
    const token = generateToken(req.user);
    console.log('JWT token generated for user:', req.user.email);
    
    // Force the session to be saved before redirection
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
      }
      
      // Log session details for debugging
      console.log('Session ID after auth:', req.session.id);
      console.log('Session user after auth:', req.session.passport?.user);
      
      // Set very explicit cookie settings as headers
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
      
      // Ensure CORS headers are set correctly for the redirect
      res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      // Ensure we don't have double slashes in the URL
      const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      
      // Add JWT token to the redirect URL
      const redirectUrl = `${baseUrl}/dashboard?auth=success&token=${encodeURIComponent(token)}&t=${Date.now()}&user=${encodeURIComponent(req.user?.email || 'unknown')}`;
      console.log('Redirecting to:', redirectUrl);
      
      // Redirect to frontend with JWT token
      res.redirect(redirectUrl);
    });
  }
);

// verifyToken is already imported at the top of the file

// @route   GET /api/auth/current_user
// @desc    Get current user
// @access  Private
router.get('/current_user', (req, res) => {
  // Debug headers and session info
  console.log('Current user request headers:', {
    origin: req.headers.origin,
    referer: req.headers.referer,
    authorization: req.headers.authorization ? `Present (starts with: ${req.headers.authorization.substring(0, 15)}...)` : 'Absent',
    cookie: req.headers.cookie ? 'Present' : 'Absent'
  });
  
  // Log all headers for debugging
  console.log('All request headers:', JSON.stringify(req.headers));
  
  // Set explicit CORS headers to ensure the cookies can be sent/received
  res.header('Access-Control-Allow-Origin', req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Set cache control headers to prevent caching
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  // Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  let jwtUser = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { valid, decoded } = verifyToken(token);
    
    if (valid) {
      console.log('Valid JWT token found for user:', decoded.email);
      jwtUser = decoded;
    } else {
      console.log('Invalid JWT token');
    }
  }
  
  // First check if user is authenticated via session
  if (req.user) {
    console.log('User authenticated via session:', req.user.email);
    
    // User is authenticated via session
    return res.json({
      isAuthenticated: true,
      user: {
        id: req.user._id,
        displayName: req.user.displayName,
        email: req.user.email,
        profileImage: req.user.profileImage
      },
      authMethod: 'session',
      timestamp: new Date().toISOString()
    });
  } 
  // Then check if user is authenticated via JWT
  else if (jwtUser) {
    console.log('User authenticated via JWT:', jwtUser.email);
    
    // User is authenticated via JWT
    return res.json({
      isAuthenticated: true,
      user: {
        id: jwtUser.id,
        email: jwtUser.email,
        displayName: jwtUser.displayName
      },
      authMethod: 'jwt',
      timestamp: new Date().toISOString()
    });
  } 
  // No authentication
  else {
    console.log('No authentication found');
    
    return res.json({ 
      isAuthenticated: false,
      message: 'Not authenticated',
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
