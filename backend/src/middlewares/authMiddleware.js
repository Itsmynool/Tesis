import jwt from 'jsonwebtoken';

// Function for middleware
export function authMiddleware(req, res, next) {
  // Check for token in the Authorization header
  const authHeader = req.headers.authorization;
  // If no token, deny access
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  // Extract token from header Bearer Token
  const token = authHeader.split(' ')[1];
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user to request
    req.user = decoded;
    /// Continue
    next();
  } catch (error) {
    // If error, deny access
    console.error('Token verification error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
