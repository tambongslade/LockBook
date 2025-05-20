const mongoose = require('mongoose');

const logbookEntrySchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  delegate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: [true, 'Session Outcome status is required'],
    enum: ['Lecture Held', 'Cancelled', 'Postponed', 'Other'],
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  teacherComments: {
    type: String,
    trim: true,
    default: ''
  },
  coveredSubtopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subtopic'
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewTimestamp: {
    type: Date
  },
  reviewStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Needs Correction'],
    default: 'Pending'
  },
  reviewRemarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LogbookEntry', logbookEntrySchema); 