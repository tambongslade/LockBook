const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  console.log(`[Auth Middleware] Path: ${req.path}`); // Log path
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('[Auth Middleware] Token received:', token ? 'Yes' : 'No'); // Log token presence
    
    if (!token) {
      console.log('[Auth Middleware] Denied: No token');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('[Auth Middleware] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth Middleware] Token decoded:', decoded);
    
    const user = await User.findById(decoded.userId).select('-password');
    console.log('[Auth Middleware] User found in DB:', user ? user.email : 'Not Found'); // Log user found

    if (!user) {
      console.log('[Auth Middleware] Denied: User not found in DB');
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user; // Attach user
    console.log(`[Auth Middleware] User attached to req.user. Role: ${req.user.role}. Proceeding...`);
    next(); // Proceed to next middleware/route handler
  } catch (error) {
    console.error('[Auth Middleware] Error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  // Log the user object received by the middleware
  console.log(`[isAdmin Middleware] Path: ${req.path}. Checking user: ${req.user?.email}, Role: ${req.user?.role}`);
  // Compare against uppercase 'ADMIN' consistent with the schema
  if (req.user && req.user.role === 'ADMIN') { 
    console.log('[isAdmin Middleware] Access Granted.');
    next();
  } else {
    console.error(`[isAdmin Middleware] Access Denied. Required: ADMIN, User Role: ${req.user?.role}`);
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  console.log(`[isTeacher Middleware] Path: ${req.path}. Checking user: ${req.user?.email}, Role: ${req.user?.role}`);
  if (req.user && req.user.role === 'TEACHER') { 
    console.log('[isTeacher Middleware] Access Granted.');
    next();
  } else {
    console.error(`[isTeacher Middleware] Access Denied. Required: TEACHER, User Role: ${req.user?.role}`);
    res.status(403).json({ message: 'Access denied. Teacher privileges required.' });
  }
};

// Middleware to check if user is a delegate
const isDelegate = (req, res, next) => {
  console.log(`[isDelegate Middleware] Path: ${req.path}. Checking user: ${req.user?.email}, Role: ${req.user?.role}`);
  if (req.user && req.user.role === 'DELEGATE') { 
    console.log('[isDelegate Middleware] Access Granted.');
    next();
  } else {
    console.error(`[isDelegate Middleware] Access Denied. Required: DELEGATE, User Role: ${req.user?.role}`);
    res.status(403).json({ message: 'Access denied. Delegate privileges required.' });
  }
};

module.exports = {
  auth,
  isAdmin,
  isTeacher,
  isDelegate
}; 