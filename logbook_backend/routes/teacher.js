const express = require('express');
const router = express.Router();
const { 
  getPendingLogbookEntries,
  getLogbookEntryForReview,
  reviewLogbookEntry,
  getCoursesProgress
} = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware');
const teacherMiddleware = require('../middleware/teacherMiddleware');

// Protected routes
router.get('/review/pending', authMiddleware, teacherMiddleware, getPendingLogbookEntries);
router.get('/logbook/entries/:entryId/review', authMiddleware, teacherMiddleware, getLogbookEntryForReview);
router.patch('/logbook/entries/:entryId/review', authMiddleware, teacherMiddleware, reviewLogbookEntry);
router.get('/courses/progress', authMiddleware, teacherMiddleware, getCoursesProgress);

module.exports = router; 