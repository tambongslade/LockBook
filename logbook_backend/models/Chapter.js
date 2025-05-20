const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Chapter title is required.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Chapter order is required.']
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOutlineModule',
    required: true
  },
  subtopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subtopic'
  }]
  // Note: Chapter status ('Pending', 'Completed') will be calculated dynamically
  // or updated via controller logic when subtopics change.
}, {
  timestamps: true
});

// Index for faster querying by module
chapterSchema.index({ module: 1, order: 1 });

module.exports = mongoose.model('Chapter', chapterSchema); 