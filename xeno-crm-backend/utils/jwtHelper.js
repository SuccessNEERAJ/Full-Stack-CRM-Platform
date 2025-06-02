import jwt from 'jsonwebtoken';

// Secret key for JWT signing - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'xeno-jwt-secret-key';

// Generate a JWT token for a user
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      displayName: user.displayName
    },
    JWT_SECRET,
    { expiresIn: '30d' } // Token expires in 30 days
  );
};

// Verify a JWT token with enhanced validation
const verifyToken = (token) => {
  if (!token) {
    return { valid: false, error: 'No token provided' };
  }
  
  try {
    // Verify the token signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Additional validation to ensure token has required user fields
    if (!decoded.id) {
      return { valid: false, error: 'Invalid token: missing user ID' };
    }
    
    if (!decoded.email) {
      return { valid: false, error: 'Invalid token: missing user email' };
    }
    
    // Log the verified token information for debugging
    console.log(`Token verified for user: ${decoded.email}, ID: ${decoded.id}`);
    
    // Map the decoded.id to _id for consistency with MongoDB ObjectId
    decoded._id = decoded.id;
    
    return { valid: true, decoded };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return { valid: false, error: error.message };
  }
};

export { generateToken, verifyToken };

