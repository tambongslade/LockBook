const express = require('express');
const router = express.Router();
const { auth, isDelegate } = require('../middleware/auth');
// Remove model imports if they are only used in controller now
// const ScheduleEntry = require('../models/ScheduleEntry'); 
// const Course = require('../models/Course');
// const LogbookEntry = require('../models/LogbookEntry');
const delegateController = require('../controllers/delegateController'); // Import the controller

// Apply auth middleware
router.use(auth, isDelegate); // Apply both globally for delegate routes

// Helper function to map full day name to abbreviation
const mapDayToAbbreviation = (fullDayName) => {
  const map = {
    "Sunday": "SUN", // Add SUN if needed, check ScheduleEntry enum
    "Monday": "MON",
    "Tuesday": "TUE",
    "Wednesday": "WED",
    "Thursday": "THU",
    "Friday": "FRI",
    "Saturday": "SAT"
  };
  return map[fullDayName]; // Returns undefined if not found
};

// --- Routes --- 

// Get today's schedule for the delegate's department/level
router.get('/dashboard/today', delegateController.getTodaySchedule);

// Get courses for a specific day and time slot for the delegate's DEPARTMENT
router.get('/courses/by-time', delegateController.getCoursesByTime);

// Submit a new logbook entry - Changed path to /logbook/new
router.post('/logbook/new', delegateController.createLogbookEntry);

// Get all logbook entries submitted by the logged-in delegate
router.get('/logbooks/my-entries', delegateController.getMyLogbookEntries);

// --- ADD NEW ROUTE ---
// Get logbook entries needing correction for the delegate
router.get('/logbooks/corrections', delegateController.getLogbookCorrections);
// --- END ADD NEW ROUTE ---

// Get full course outline for a specific course
router.get('/outline/course/:courseId', delegateController.getCourseOutlineForDelegate);

// Update a specific logbook entry (e.g., add covered topics, remarks)
router.put('/logbooks/:entryId', delegateController.updateLogbookEntryForDelegate);

// Get a specific logbook entry by ID (owned by delegate)
router.get('/logbooks/:entryId', delegateController.getLogbookEntryById);

// --- END NEW ROUTES ---

module.exports = router; 