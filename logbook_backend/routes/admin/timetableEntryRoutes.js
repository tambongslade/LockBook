const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const adminMiddleware = require('../../middleware/adminMiddleware');
const {
  getAllTimetableEntries,
  getTimetableEntry,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry
} = require('../../controllers/admin/timetableEntryController');

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Timetable entry routes
router.get('/', getAllTimetableEntries);
router.get('/:id', getTimetableEntry);
router.post('/', createTimetableEntry);
router.put('/:id', updateTimetableEntry);
router.delete('/:id', deleteTimetableEntry);

module.exports = router; 