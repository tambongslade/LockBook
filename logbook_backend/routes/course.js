const express = require('express');
const router = express.Router();
const { getCourseModules } = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.get('/:courseId/modules', authMiddleware, getCourseModules);

module.exports = router; 