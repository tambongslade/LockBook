const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Subtopic title is required.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Subtopic order is required.']
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster querying by chapter
subtopicSchema.index({ chapter: 1, order: 1 });

module.exports = mongoose.model('Subtopic', subtopicSchema); 