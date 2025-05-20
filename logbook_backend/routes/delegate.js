const express = require('express');
const router = express.Router();
const { getTodaySchedule } = require('../controllers/delegateController');
const authMiddleware = require('../middleware/authMiddleware');
const delegateMiddleware = require('../middleware/delegateMiddleware');

// Protected routes
router.get('/dashboard/today', authMiddleware, delegateMiddleware, getTodaySchedule);

module.exports = router; 