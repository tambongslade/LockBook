const TimetableEntry = require('../models/TimetableEntry');
const ScheduleEntry = require('../models/ScheduleEntry');
const Course = require('../models/Course');
const LogbookEntry = require('../models/LogbookEntry');
const CourseOutlineModule = require('../models/CourseOutlineModule');
const Chapter = require('../models/Chapter');
const Subtopic = require('../models/Subtopic');

// Helper function to get day abbreviation from number (0-6 Sun-Sat)
const getDayAbbreviation = (dayIndex) => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[dayIndex];
};

// Helper function to get day name from number (0-6)
const getDayName = (dayIndex) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

const getTodaySchedule = async (req, res) => {
  try {
    const delegate = req.user;
    const currentDayIndex = new Date().getDay(); 
    const currentDayAbbr = getDayAbbreviation(currentDayIndex);
    const delegateLevelString = delegate.level?.toString();
    const delegateDepartmentId = delegate.department;

    console.log(`[Delegate Controller /getTodaySchedule] Fetching schedule for: Day=${currentDayAbbr}`);

    // Find entries only by day first
    const entriesForDay = await TimetableEntry.find({
      day: currentDayAbbr 
    })
    // Populate course with department and level needed for filtering
    .populate({ 
        path: 'course', 
        select: 'code name department level' // Ensure department and level are selected
    })
    .populate('teacher', 'firstName lastName') 
    .populate('hall', 'name')
    .sort({ startTime: 1 });
    
    console.log(`[Delegate Controller /getTodaySchedule] Found ${entriesForDay.length} entries for ${currentDayAbbr}. Filtering by Dept=${delegateDepartmentId}, Level=${delegateLevelString}...`); 

    // Filter in code based on populated course data
    const filteredSchedule = entriesForDay.filter(entry => {
        // Handle cases where course might not be populated correctly
        if (!entry.course) return false; 
        
        // Check department (ObjectId comparison requires .equals())
        const departmentMatch = entry.course.department?.equals(delegateDepartmentId);
        // Check level (ensure consistent type, course.level is Number, delegateLevelString is String)
        const levelMatch = entry.course.level?.toString() === delegateLevelString;
        
        // --- Turn on verbose logging --- 
        console.log(`  [Filter Check] Entry Course: ${entry.course.code}, Dept: ${entry.course.department}, Level: ${entry.course.level} -> DeptMatch: ${departmentMatch}, LevelMatch: ${levelMatch}`); 
        // --- End logging ---
        
        return departmentMatch && levelMatch;
    });

    console.log(`[Delegate Controller /getTodaySchedule] Found ${filteredSchedule.length} entries after filtering.`);

    // --- Log the data being sent --- 
    console.log('[Delegate Controller /getTodaySchedule] Sending data:', JSON.stringify(filteredSchedule, null, 2));
    // --- End Log ---

    res.json(filteredSchedule);

  } catch (error) {
    console.error('Error fetching today\'s schedule:', error);
    res.status(500).json({ message: 'Error fetching schedule' });
  }
};

// Helper function (can be kept here or moved to a utils file)
const mapDayToAbbreviation = (fullDayName) => {
  const map = {
    "Sunday": "SUN",
    "Monday": "MON",
    "Tuesday": "TUE",
    "Wednesday": "WED",
    "Thursday": "THU",
    "Friday": "FRI",
    "Saturday": "SAT"
  };
  return map[fullDayName];
};

// Get courses for a specific day and time slot for the delegate's DEPARTMENT
const getCoursesByTime = async (req, res) => {
  try {
    const { day: fullDayName, time } = req.query;
    const userDepartmentId = req.user?.department;

    console.log(`[Delegate Controller /getCoursesByTime] Request - Day: ${fullDayName}, Time: ${time}, User Dept: ${userDepartmentId}`);

    if (!fullDayName || !time) {
      return res.status(400).json({ message: 'Day and time query parameters are required.' });
    }
    if (!userDepartmentId) {
        console.warn('[Delegate Controller /getCoursesByTime] User department not found in request token.');
        return res.status(400).json({ message: 'User department not found in token.' });
    }

    const dayAbbreviation = mapDayToAbbreviation(fullDayName);
    if (!dayAbbreviation) {
        console.warn(`[Delegate Controller /getCoursesByTime] Invalid day name received: ${fullDayName}`);
        return res.status(400).json({ message: 'Invalid day name provided.' });
    }

    // Step 1: Find courses in the delegate's department
    console.log(`[Delegate Controller /getCoursesByTime] Finding courses for department ID: ${userDepartmentId}`);
    const departmentCourses = await Course.find({ department: userDepartmentId }).select('_id');
    const departmentCourseIds = departmentCourses.map(course => course._id);

    if (departmentCourseIds.length === 0) {
        console.log(`[Delegate Controller /getCoursesByTime] No courses found for department ${userDepartmentId}.`);
        return res.json([]);
    }
    console.log(`[Delegate Controller /getCoursesByTime] Found ${departmentCourseIds.length} courses in department.`);

    // Step 2: Query ScheduleEntry using the correct fields and department course IDs
    const query = {
      day: dayAbbreviation,
      timeSlot: time,
      course: { $in: departmentCourseIds }
    };
    console.log('[Delegate Controller /getCoursesByTime] Executing ScheduleEntry.find() with query:', query);

    const entries = await ScheduleEntry.find(query)
                                       .populate('course', 'title code department');

    console.log(`[Delegate Controller /getCoursesByTime] Found ${entries.length} ScheduleEntry documents matching criteria.`);

    const courses = entries.map(entry => entry.course).filter(course => course != null);
    console.log(`[Delegate Controller /getCoursesByTime] Mapped to ${courses.length} course objects.`);
    if (courses.length > 0) {
       console.log('[Delegate Controller /getCoursesByTime] Final course IDs being sent:', courses.map(c => c._id));
    }

    res.json(courses);

  } catch (error) {
    console.error('[Delegate Controller /getCoursesByTime] Error fetching courses by time:', error);
    res.status(500).json({ message: 'Error fetching courses for the selected time slot.' });
  }
};

// Submit a new logbook entry
const createLogbookEntry = async (req, res) => {
  try {
    const { courseId, dayOfWeek, timeSlot, status, remarks, coveredSubtopics } = req.body; // Add coveredSubtopics
    const delegateId = req.user._id;

    console.log(`[Delegate Controller /createLogbookEntry] Received submission: Course=${courseId}, Day=${dayOfWeek}, Time=${timeSlot}, Status=${status}`);

    // Basic validation
    if (!courseId || !dayOfWeek || !timeSlot || !status) {
      return res.status(400).json({ message: 'Missing required fields (courseId, dayOfWeek, timeSlot, status).' });
    }

    // Optional: Validate if the course exists
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
        return res.status(404).json({ message: 'Course not found.' });
    }

    // Optional: Check if an entry for this exact slot already exists for this delegate
    // This might need adjustment depending on whether multiple entries are allowed per slot
    const existingEntry = await LogbookEntry.findOne({
        delegate: delegateId,
        dayOfWeek: dayOfWeek,
        timeSlot: timeSlot,
        course: courseId
    });

    if (existingEntry) {
        console.warn(`[Delegate Controller /createLogbookEntry] Duplicate entry attempt for delegate ${delegateId}, course ${courseId}, slot ${dayOfWeek} ${timeSlot}`);
        // Decide whether to block or allow update? For now, let's block creation.
        return res.status(409).json({ message: 'A logbook entry for this course and time slot already exists.' });
    }

    // Create new logbook entry
    const newLogbookEntry = new LogbookEntry({
      course: courseId,
      delegate: delegateId,
      dayOfWeek: dayOfWeek,
      timeSlot: timeSlot,
      status: status,
      remarks: remarks || '',
      coveredSubtopics: coveredSubtopics || [] // Include covered subtopics
    });

    await newLogbookEntry.save();
    const populatedEntry = await LogbookEntry.findById(newLogbookEntry._id)
                                            .populate('course', 'title code department')
                                            .populate('delegate', 'firstName lastName email')
                                            .populate('coveredSubtopics', 'title'); // Populate subtopic titles
    res.status(201).json({ message: 'Logbook entry created successfully!', entry: populatedEntry });

  } catch (error) {
    console.error('[Delegate Controller /createLogbookEntry] Error submitting logbook entry:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to submit logbook entry.' });
  }
};

// Get all logbook entries submitted by the logged-in delegate
const getMyLogbookEntries = async (req, res) => {
  try {
    const delegateId = req.user._id;
    console.log(`[Delegate Controller /getMyLogbookEntries] Fetching entries for delegate ID: ${delegateId}`);

    const entries = await LogbookEntry.find({ delegate: delegateId })
      .populate('course', 'title code')
      .populate('coveredSubtopics', 'title') // Populate subtopic titles
      .sort({ createdAt: -1 });

    console.log(`[Delegate Controller /getMyLogbookEntries] Found ${entries.length} entries.`);
    res.json(entries);

  } catch (error) {
    console.error('[Delegate Controller /getMyLogbookEntries] Error fetching delegate logbook entries:', error);
    res.status(500).json({ message: 'Failed to fetch submitted logbook entries.' });
  }
};

// Get the full course outline (Modules -> Chapters -> Subtopics) for a course
const getCourseOutlineForDelegate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const delegateId = req.user._id;
    const delegateDepartmentId = req.user.department;

    // 1. Verify the course exists and belongs to the delegate's department
    const course = await Course.findOne({ 
      _id: courseId, 
      department: delegateDepartmentId 
    });

    if (!course) {
      // Course not found or delegate not authorized for this course's department
      return res.status(403).json({ message: 'Course not found or you are not authorized for this course department.' });
    }

    // 2. Fetch the outline structure with nested population (same as teacher controller)
    const outline = await CourseOutlineModule.find({ course: courseId })
      .sort('order')
      .populate({
        path: 'chapters',
        options: { sort: { 'order': 1 } },
        populate: {
          path: 'subtopics',
          options: { sort: { 'order': 1 } }
          // select: 'title description completed order' // Optional field selection
        }
      });
      // .select('title description status order'); // Optional field selection

    if (!outline) {
      return res.json([]); // Return empty if no outline defined yet
    }

    console.log(`[Delegate Controller /getCourseOutline] Fetched outline for course ${courseId} for delegate ${delegateId}`);
    res.json(outline);

  } catch (error) {
    console.error('[Delegate Controller /getCourseOutline] Error fetching course outline:', error);
    res.status(500).json({ message: 'Error fetching course outline', error: error.message });
  }
};

// Update a specific logbook entry (owned by the delegate)
const updateLogbookEntryForDelegate = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { status, remarks, coveredSubtopics } = req.body; // Allow updating these fields
    const delegateId = req.user._id;

    // Find the logbook entry and verify ownership
    const logbookEntry = await LogbookEntry.findOne({ _id: entryId, delegate: delegateId });

    if (!logbookEntry) {
      return res.status(404).json({ message: 'Logbook entry not found or you do not own this entry.' });
    }
    
    // Check if the entry requires correction before allowing update (optional but good practice)
    if (logbookEntry.reviewStatus !== 'Needs Correction') {
       // return res.status(403).json({ message: 'This entry cannot be edited unless marked for correction.' });
       console.warn(`[Delegate Controller] Attempting to update entry ${entryId} which is ${logbookEntry.reviewStatus}. Allowing for now.`);
    }

    // Update fields if they are provided in the request
    if (status !== undefined) logbookEntry.status = status; // Check for undefined to allow empty string?
    if (remarks !== undefined) logbookEntry.remarks = remarks;
    if (coveredSubtopics !== undefined) logbookEntry.coveredSubtopics = coveredSubtopics;
    
    // --- Reset review status upon delegate update ---
    logbookEntry.reviewStatus = 'Pending'; 
    logbookEntry.reviewRemarks = ''; // Clear teacher remarks
    logbookEntry.reviewedBy = undefined; // Clear reviewer
    logbookEntry.reviewTimestamp = undefined; // Clear timestamp
    // --- End Reset ---

    await logbookEntry.save();

    // Populate the updated entry for the response
    const populatedEntry = await LogbookEntry.findById(logbookEntry._id)
                                            .populate('course', 'title code')
                                            .populate('delegate', 'firstName lastName')
                                            .populate('coveredSubtopics', 'title'); 
                                            
    console.log(`[Delegate Controller /updateLogbookEntry] Updated entry ${entryId}`);
    res.json({ message: 'Logbook entry updated successfully!', entry: populatedEntry });

  } catch (error) {
    console.error('[Delegate Controller /updateLogbookEntry] Error updating logbook entry:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update logbook entry.' });
  }
};

// Get a specific logbook entry by ID (owned by the delegate)
const getLogbookEntryById = async (req, res) => {
  try {
    const { entryId } = req.params;
    const delegateId = req.user._id;

    // Find the logbook entry and verify ownership
    const logbookEntry = await LogbookEntry.findOne({ _id: entryId, delegate: delegateId })
                                          .populate('course', 'title code')
                                          .populate('coveredSubtopics', '_id title'); // Populate necessary fields

    if (!logbookEntry) {
      return res.status(404).json({ message: 'Logbook entry not found or you do not own this entry.' });
    }

    console.log(`[Delegate Controller /getLogbookEntryById] Fetched entry ${entryId} for delegate ${delegateId}`);
    res.json(logbookEntry);

  } catch (error) {
    console.error('[Delegate Controller /getLogbookEntryById] Error fetching logbook entry:', error);
    res.status(500).json({ message: 'Failed to fetch logbook entry.' });
  }
};

// Get logbook entries marked as 'Needs Correction' for the delegate
const getLogbookCorrections = async (req, res) => {
  try {
    const delegateId = req.user._id;
    console.log(`[Delegate Controller /getLogbookCorrections] Fetching entries needing correction for delegate ID: ${delegateId}`);

    const correctionEntries = await LogbookEntry.find({ 
      delegate: delegateId, 
      reviewStatus: 'Needs Correction' 
    })
      .populate('course', 'title code')
      .populate('coveredSubtopics', 'title') 
      .sort({ reviewTimestamp: -1 }); // Sort by when correction was requested

    console.log(`[Delegate Controller /getLogbookCorrections] Found ${correctionEntries.length} entries.`);
    res.json(correctionEntries);

  } catch (error) {
    console.error('[Delegate Controller /getLogbookCorrections] Error fetching entries needing correction:', error);
    res.status(500).json({ message: 'Failed to fetch entries needing correction.' });
  }
};

module.exports = {
  getTodaySchedule,
  getCoursesByTime,
  createLogbookEntry,
  getMyLogbookEntries,
  getLogbookCorrections,
  getCourseOutlineForDelegate,
  updateLogbookEntryForDelegate,
  getLogbookEntryById
}; 