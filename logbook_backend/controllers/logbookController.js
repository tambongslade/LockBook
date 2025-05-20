const LogbookEntry = require('../models/LogbookEntry');
const TimetableEntry = require('../models/TimetableEntry');
const CourseOutlineModule = require('../models/CourseOutlineModule');
const { parseISO, isWithinInterval, addMinutes } = require('date-fns');

const updateModuleStatuses = async (courseId) => {
  try {
    // Find all logbook entries for this course
    const logbookEntries = await LogbookEntry.find({ course: courseId });
    
    // Aggregate all unique covered module IDs
    const coveredModuleIds = [...new Set(
      logbookEntries.flatMap(entry => entry.coveredModules)
    )];

    // Find all modules for this course
    const courseModules = await CourseOutlineModule.find({ course: courseId });

    // Update each module's status
    const updatePromises = courseModules.map(async (module) => {
      const isCovered = coveredModuleIds.some(id => id.equals(module._id));
      if (isCovered) {
        module.status = 'Completed';
        return module.save();
      }
      return null;
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating module statuses:', error);
    // Don't throw the error - we don't want to fail the logbook entry creation
    // if the status update fails
  }
};

const createLogbookEntry = async (req, res) => {
  try {
    const {
      courseId,
      timetableEntryId,
      selectedModuleIds,
      remarks,
      attendanceDetails
    } = req.body;

    const delegateId = req.user._id;

    // Fetch the timetable entry
    const timetableEntry = await TimetableEntry.findById(timetableEntryId);
    if (!timetableEntry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    // Get current time and parse timetable times
    const currentTime = new Date();
    const startTime = parseISO(timetableEntry.startTime);
    const endTime = parseISO(timetableEntry.endTime);
    
    // Get grace period from environment variable (default to 60 minutes)
    const gracePeriodMinutes = parseInt(process.env.LOGBOOK_GRACE_MINUTES) || 60;
    const endTimeWithGrace = addMinutes(endTime, gracePeriodMinutes);

    // Check if current time is within the allowed window
    const isWithinWindow = isWithinInterval(currentTime, {
      start: startTime,
      end: endTimeWithGrace
    });

    if (!isWithinWindow) {
      return res.status(400).json({ 
        message: 'Logbook entry window closed',
        details: {
          currentTime,
          allowedStart: startTime,
          allowedEnd: endTimeWithGrace
        }
      });
    }

    // Create new logbook entry
    const logbookEntry = new LogbookEntry({
      delegate: delegateId,
      course: courseId,
      timetableEntry: timetableEntryId,
      coveredModules: selectedModuleIds,
      remarks,
      attendanceDetails,
      status: 'Pending Review'
    });

    await logbookEntry.save();

    // Update module statuses after successful logbook entry creation
    await updateModuleStatuses(courseId);

    res.status(201).json({
      message: 'Logbook entry created successfully',
      logbookEntry
    });

  } catch (error) {
    console.error('Error creating logbook entry:', error);
    res.status(500).json({ 
      message: 'Error creating logbook entry',
      error: error.message 
    });
  }
};

module.exports = {
  createLogbookEntry
}; 