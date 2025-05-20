const ScheduleEntry = require('../../models/ScheduleEntry');

// Get all schedule entries (optionally filter by semester)
exports.getAllScheduleEntries = async (req, res) => {
  try {
    const filter = req.query.semester ? { semester: req.query.semester } : {};
    const entries = await ScheduleEntry.find(filter)
      .populate('course', 'code title') // Populate course code and title
      .populate('hall', 'name')         // Populate hall name
      .populate('teacher', 'firstName lastName'); // Populate teacher name
    res.json(entries);
  } catch (error) {
    console.error("Error fetching schedule entries:", error);
    res.status(500).json({ message: 'Error fetching schedule entries', error: error.message });
  }
};

// Get single schedule entry by ID
exports.getScheduleEntry = async (req, res) => {
  try {
    const entry = await ScheduleEntry.findById(req.params.id)
      .populate('course', 'code title')
      .populate('hall', 'name')
      .populate('teacher', 'firstName lastName');
      
    if (!entry) {
      return res.status(404).json({ message: 'Schedule entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error("Error fetching schedule entry:", error);
    res.status(500).json({ message: 'Error fetching schedule entry', error: error.message });
  }
};

// Create a new schedule entry
exports.createScheduleEntry = async (req, res) => {
  try {
    // Basic validation (more can be added)
    const { semester, course, day, timeSlot, hall, teacher } = req.body;
    if (!semester || !course || !day || !timeSlot || !hall) {
        return res.status(400).json({ message: 'Missing required fields (semester, course, day, timeSlot, hall)' });
    }
    
    // Ensure teacher is null if not provided or empty string
    const entryData = { ...req.body, teacher: teacher || null };

    const newEntry = new ScheduleEntry(entryData);
    await newEntry.save();
    // Populate the newly created entry before sending back
    const populatedEntry = await ScheduleEntry.findById(newEntry._id)
        .populate('course', 'code title')
        .populate('hall', 'name')
        .populate('teacher', 'firstName lastName');
        
    res.status(201).json(populatedEntry);
  } catch (error) {
    console.error("Error creating schedule entry:", error);
     // Handle potential duplicate key error if index is used
     if (error.code === 11000) {
        return res.status(400).json({ message: 'Duplicate schedule entry detected for this course/time.', error: error.message });
    }
    res.status(400).json({ message: 'Error creating schedule entry', error: error.message });
  }
};

// Update an existing schedule entry
exports.updateScheduleEntry = async (req, res) => {
  try {
    const { teacher, ...updateData } = req.body; // Handle teacher separately
    const entryData = { ...updateData, teacher: teacher || null };

    const updatedEntry = await ScheduleEntry.findByIdAndUpdate(
      req.params.id,
      entryData,
      { new: true, runValidators: true } // Return updated doc, run schema validators
    )
    .populate('course', 'code title')
    .populate('hall', 'name')
    .populate('teacher', 'firstName lastName');
    
    if (!updatedEntry) {
      return res.status(404).json({ message: 'Schedule entry not found' });
    }
    res.json(updatedEntry);
  } catch (error) {
    console.error("Error updating schedule entry:", error);
     if (error.code === 11000) {
        return res.status(400).json({ message: 'Update failed due to potential duplicate schedule entry.', error: error.message });
    }
    res.status(400).json({ message: 'Error updating schedule entry', error: error.message });
  }
};

// Delete a schedule entry
exports.deleteScheduleEntry = async (req, res) => {
  try {
    const deletedEntry = await ScheduleEntry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: 'Schedule entry not found' });
    }
    res.json({ message: 'Schedule entry deleted successfully' });
  } catch (error) {
    console.error("Error deleting schedule entry:", error);
    res.status(500).json({ message: 'Error deleting schedule entry', error: error.message });
  }
}; 