const express = require('express');
const router = express.Router();
const { getCoursesProgress } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protected routes
router.get('/courses/progress', authMiddleware, adminMiddleware, getCoursesProgress);

module.exports = router; 