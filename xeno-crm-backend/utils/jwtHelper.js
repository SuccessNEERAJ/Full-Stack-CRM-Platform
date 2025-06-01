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

// Verify a JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Middleware to check if request has a valid JWT token
const requireAuth = (req, res, next) => {
  // First check if user is already authenticated via session
  if (req.user) {
    return next();
  }

  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];
  
  // Verify the token
  const { valid, decoded, error } = verifyToken(token);
  
  if (!valid) {
    return res.status(401).json({ error: 'Invalid or expired token', details: error });
  }
  
  // Set the user on the request object
  req.user = decoded;
  next();
};

export { generateToken, verifyToken, requireAuth };
