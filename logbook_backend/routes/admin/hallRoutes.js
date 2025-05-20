const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../../middleware/auth');
const { getAllHalls } = require('../../controllers/admin/hallController');

// Apply auth and admin middleware
router.use(auth, isAdmin);

// Routes
router.get('/', getAllHalls); // GET /api/admin/halls

// Add POST, PUT, DELETE later if needed

module.exports = router; 