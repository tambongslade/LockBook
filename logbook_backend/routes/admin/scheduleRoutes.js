const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../../middleware/auth');
const {
    getAllScheduleEntries,
    getScheduleEntry,
    createScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry
} = require('../../controllers/admin/scheduleController');

// Apply auth and admin middleware to all schedule routes
router.use(auth, isAdmin);

// Routes
router.get('/', getAllScheduleEntries);      // GET /api/admin/schedule?semester=1st
router.post('/', createScheduleEntry);     // POST /api/admin/schedule
router.get('/:id', getScheduleEntry);       // GET /api/admin/schedule/:id
router.put('/:id', updateScheduleEntry);     // PUT /api/admin/schedule/:id
router.delete('/:id', deleteScheduleEntry); // DELETE /api/admin/schedule/:id

module.exports = router; 