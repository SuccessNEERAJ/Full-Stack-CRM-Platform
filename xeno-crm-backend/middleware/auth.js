// middleware/auth.js
// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // If not authenticated, return unauthorized status
  res.status(401).json({ message: 'Authentication required' });
};
