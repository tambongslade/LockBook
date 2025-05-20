const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
  // Add other fields if needed later, e.g., capacity, type
}, {
  timestamps: true
});

module.exports = mongoose.model('Hall', hallSchema); 