const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['100', '200', '300', '400', '500']
  },
  day: {
    type: String,
    required: true,
    enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  timeSlot: {
    type: String,
    required: true,
    // Optional: Add a regex if you want to enforce format, e.g., /\d{2}:\d{2}-\d{2}:\d{2}/
  },
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema, 'scheduleentries'); 