// middleware/auth.js
import { verifyToken } from '../utils/jwtHelper.js';

// Middleware to check if user is authenticated via session or JWT
export const isAuthenticated = (req, res, next) => {
  // Log all headers for debugging
  console.log('Auth middleware - Request headers:', JSON.stringify(req.headers));
  
  // First check if user is already authenticated via session
  if (req.isAuthenticated()) {
    console.log('User authenticated via session');
    return next();
  }
  
  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'Not present');
  
  if (!authHeader) {
    console.log('No Authorization header found');
    return res.status(401).json({ error: 'Authentication required - No Authorization header' });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Authorization header does not start with Bearer');
    return res.status(401).json({ error: 'Authentication required - Invalid Authorization format' });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];
  console.log('JWT token extracted:', token ? `${token.substring(0, 15)}...` : 'No token');
  
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
