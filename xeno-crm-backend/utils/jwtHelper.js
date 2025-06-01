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

export { generateToken, verifyToken };

