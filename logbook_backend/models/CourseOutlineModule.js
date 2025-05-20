const mongoose = require('mongoose');

const courseOutlineModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Ongoing'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CourseOutlineModule', courseOutlineModuleSchema); 