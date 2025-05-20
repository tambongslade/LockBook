const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');

// Register route (only admins can register new users)
router.post('/register', auth, isAdmin, register);

// Login route (public)
router.post('/login', login);

// Add the /me route
// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', auth, (req, res) => {
  // req.user should be attached by the auth middleware
  if (!req.user) {
    // This case might not be reachable if auth middleware handles it
    return res.status(401).json({ message: 'Not authorized, user data missing.' });
  }
  // Return user data (ensure password is not sent - check if middleware already removed it)
  res.json(req.user);
});

// Protected test route
router.get('/test', auth, (req, res) => {
  res.json({ message: 'Protected route accessed successfully', user: req.user });
});

// Admin-only test route
router.get('/admin-test', auth, isAdmin, (req, res) => {
  res.json({ message: 'Admin route accessed successfully', user: req.user });
});

module.exports = router; 