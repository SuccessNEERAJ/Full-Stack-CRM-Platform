// middleware/authMiddleware.js
import { verifyToken } from '../utils/jwtHelper.js';

// Middleware to protect routes - checks for valid JWT token or session authentication
export const requireAuth = (req, res, next) => {
  // First check if user is already authenticated via session
  if (req.user) {
    console.log('User authenticated via session:', req.user.email);
    return next();
  }

  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid Authorization header found');
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];
  
  // Verify the token
  const { valid, decoded, error } = verifyToken(token);
  
  if (!valid) {
    console.log('Invalid JWT token:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Set the user on the request object
  req.user = decoded;
  console.log('User authenticated via JWT:', decoded.email);
  next();
};
