const mongoose = require('mongoose');

// Define allowed values based on observed data
const ALLOWED_SEMESTERS = ['1st', '2nd']; // Or use 1, 2 if preferred
const ALLOWED_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; // From user spec (added MON)
const ALLOWED_TIMESLOTS = [
    '07:00-09:00',
    '09:00-11:00',
    '11:00-13:00',
    '13:00-15:00',
    '15:00-17:00',
    '17:00-19:00'
];

const scheduleEntrySchema = new mongoose.Schema({
  semester: {
    type: String,
    required: true,
    enum: ALLOWED_SEMESTERS
  },
  course: { // References the Course model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // Check this matches mongoose.model('Course', ...)
    required: true
  },
  day: {
    type: String,
    required: true,
    enum: ALLOWED_DAYS
  },
  timeSlot: { // Changed from time_slot to match camelCase convention
    type: String,
    required: true,
    enum: ALLOWED_TIMESLOTS
  },
  hall: { // References the Hall model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall', // Check this matches mongoose.model('Hall', ...)
    required: true
  },
  teacher: { // References the User model
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Check this matches mongoose.model('User', ...)
    required: false // Optional
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ScheduleEntry', scheduleEntrySchema); 