const TimetableEntry = require('../../models/TimetableEntry');

// Get all timetable entries
exports.getAllTimetableEntries = async (req, res) => {
  try {
    const entries = await TimetableEntry.find()
      .populate('course')
      .populate('lecturer');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetable entries', error: error.message });
  }
};

// Get single timetable entry
exports.getTimetableEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id)
      .populate('course')
      .populate('lecturer');
    if (!entry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetable entry', error: error.message });
  }
};

// Create timetable entry
exports.createTimetableEntry = async (req, res) => {
  try {
    const entry = new TimetableEntry(req.body);
    await entry.save();
    const populatedEntry = await TimetableEntry.findById(entry._id)
      .populate('course')
      .populate('lecturer');
    res.status(201).json(populatedEntry);
  } catch (error) {
    res.status(400).json({ message: 'Error creating timetable entry', error: error.message });
  }
};

// Update timetable entry
exports.updateTimetableEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('course')
    .populate('lecturer');
    
    if (!entry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(400).json({ message: 'Error updating timetable entry', error: error.message });
  }
};

// Delete timetable entry
exports.deleteTimetableEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting timetable entry', error: error.message });
  }
}; 