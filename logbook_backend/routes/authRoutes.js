const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { auth, isAdmin } = require('../middleware/auth');

// Login route
router.post('/login', (req, res, next) => {
  console.log('Login route hit');
  console.log('Request body:', req.body);
  next();
}, login);

// Register route (only admins can register new users)
router.post('/register', auth, isAdmin, register);

// GET /me route to fetch current user
router.get('/me', auth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, user data missing.' });
  }
  res.json(req.user);
});

// Optional: Add the test routes if needed
// router.get('/test', auth, (req, res) => { res.json({ message: 'Protected', user: req.user }); });
// router.get('/admin-test', auth, isAdmin, (req, res) => { res.json({ message: 'Admin Only', user: req.user }); });

module.exports = router; 