const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOutlineModule'
  }],
  currentModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOutlineModule'
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Create a compound index to ensure one progress record per student per course
courseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);

module.exports = CourseProgress; 