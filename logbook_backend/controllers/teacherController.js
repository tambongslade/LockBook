const LogbookEntry = require('../models/LogbookEntry');
const ScheduleEntry = require('../models/ScheduleEntry');
const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const User = require('../models/User');
const CourseOutlineModule = require('../models/CourseOutlineModule');
const Chapter = require('../models/Chapter');
const Subtopic = require('../models/Subtopic');

const getPendingLogbookEntries = async (req, res) => {
  try {
    const teacherId = req.user._id;
    console.log(`[Teacher Controller] Fetching pending entries for teacher ID: ${teacherId}`);

    // Find all schedule entries where this teacher is assigned
    console.log('[Teacher Controller] Finding schedule entries for teacher...');
    const scheduleEntries = await ScheduleEntry.find({ teacher: teacherId });
    console.log(`[Teacher Controller] Found ${scheduleEntries.length} schedule entries for this teacher.`);

    if (scheduleEntries.length === 0) {
      console.log('[Teacher Controller] Teacher not assigned to any schedule entries. Returning empty list.');
      return res.json([]); // No need to proceed if teacher has no scheduled courses
    }

    // Extract unique course IDs from the teacher's schedule entries
    const courseIds = [...new Set(scheduleEntries.map(entry => entry.course.toString()))];
    console.log(`[Teacher Controller] Teacher is associated with course IDs: ${courseIds.join(', ')}`);

    // Find pending logbook entries for these courses
    console.log('[Teacher Controller] Finding logbook entries with reviewStatus: Pending...');
    const pendingEntries = await LogbookEntry.find({
      course: { $in: courseIds },
      reviewStatus: 'Pending'
    })
    .populate({ path: 'course', select: 'title code' })
    .populate({ path: 'delegate', select: 'firstName lastName email' })
    .sort({ createdAt: -1 });

    console.log(`[Teacher Controller] Found ${pendingEntries.length} pending logbook entries.`);
    res.json(pendingEntries);
  } catch (error) {
    console.error('Error fetching pending logbook entries:', error);
    res.status(500).json({ 
      message: 'Error fetching pending logbook entries',
      error: error.message 
    });
  }
};

const getLogbookEntryForReview = async (req, res) => {
  try {
    const { entryId } = req.params;
    const teacherId = req.user._id;

    // Find the logbook entry
    console.log(`[Teacher Controller] Finding logbook entry by ID: ${entryId}`);
    const logbookEntry = await LogbookEntry.findById(entryId)
      .populate({ path: 'course', select: 'title code' })
      .populate({ path: 'delegate', select: 'firstName lastName email' })
      .populate({ path: 'coveredSubtopics', select: 'title' });

    if (!logbookEntry) {
      console.log(`[Teacher Controller] Logbook entry not found: ${entryId}`);
      return res.status(404).json({ message: 'Logbook entry not found' });
    }
    console.log("[Teacher Controller] Logbook entry found.");

    // Verify teacher is authorized for this course
    console.log(`[Teacher Controller] Verifying teacher ${teacherId} is authorized for course ${logbookEntry.course?._id}`);
    const isAuthorized = await ScheduleEntry.exists({
      course: logbookEntry.course?._id,
      teacher: teacherId
    });

    if (!isAuthorized) {
      console.log(`[Teacher Controller] Teacher ${teacherId} NOT authorized for course ${logbookEntry.course?._id}`);
      return res.status(403).json({ message: 'Not authorized to review this entry' });
    }
    console.log(`[Teacher Controller] Teacher ${teacherId} IS authorized.`);

    // Log the object before sending
    console.log("[Teacher Controller] Logbook entry data being sent:", JSON.stringify(logbookEntry, null, 2));

    res.json(logbookEntry);
  } catch (error) {
    console.error('Error fetching logbook entry for review:', error);
    res.status(500).json({ 
      message: 'Error fetching logbook entry for review',
      error: error.message 
    });
  }
};

const reviewLogbookEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { reviewStatus, reviewRemarks } = req.body; 
    const teacherId = req.user._id;

    if (!['Approved', 'Needs Correction'].includes(reviewStatus)) {
      return res.status(400).json({ message: 'Invalid review status provided.' });
    }

    const logbookEntry = await LogbookEntry.findById(entryId);

    if (!logbookEntry) {
      return res.status(404).json({ message: 'Logbook entry not found' });
    }
    
    // Prevent re-reviewing if not pending? (Optional)
    if (logbookEntry.reviewStatus !== 'Pending') {
      // return res.status(400).json({ message: `Entry already reviewed with status: ${logbookEntry.reviewStatus}` });
      console.warn(`[Teacher Controller] Attempting to re-review entry ${entryId} which is already ${logbookEntry.reviewStatus}. Allowing for now.`);
    }

    // Verify teacher is authorized for this course
    const isAuthorized = await ScheduleEntry.exists({
      course: logbookEntry.course,
      teacher: teacherId
    });

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to review this entry' });
    }

    const previousStatus = logbookEntry.reviewStatus; // Store previous status

    // Update the review status fields
    logbookEntry.reviewStatus = reviewStatus;
    logbookEntry.reviewRemarks = reviewRemarks || '';
    logbookEntry.reviewedBy = teacherId;
    logbookEntry.reviewTimestamp = new Date();

    await logbookEntry.save();
    console.log(`[Teacher Controller] Logbook entry ${entryId} review status updated to ${reviewStatus}.`);

    // --- Add Logic to update Subtopic.completed on Approval ---
    if (reviewStatus === 'Approved' && previousStatus !== 'Approved') { // Only run on new approval
      if (logbookEntry.coveredSubtopics && logbookEntry.coveredSubtopics.length > 0) {
        console.log(`[Teacher Controller] Updating ${logbookEntry.coveredSubtopics.length} subtopics to completed for approved entry ${entryId}.`);
        try {
          const updateResult = await Subtopic.updateMany(
            { _id: { $in: logbookEntry.coveredSubtopics } },
            { $set: { completed: true } }
          );
          console.log(`[Teacher Controller] Subtopic update result for entry ${entryId}:`, updateResult);
           // Optional: Trigger recalculation or notification if needed immediately
        } catch (subtopicUpdateError) {
          console.error(`[Teacher Controller] Failed to update subtopics to completed for entry ${entryId}:`, subtopicUpdateError);
          // Continue even if subtopic update fails? Or rollback? For now, just log.
        }
      } else {
         console.log(`[Teacher Controller] Approved entry ${entryId} had no coveredSubtopics listed.`);
      }
    }
    // --- End Subtopic Update Logic ---

    // Populate the response
    const updatedEntry = await LogbookEntry.findById(entryId)
      .populate({ path: 'course', select: 'title code' })
      .populate({ path: 'delegate', select: 'firstName lastName email' })
      // .populate({ path: 'coveredModules', select: 'title' }) // Check if needed
      .populate({ path: 'reviewedBy', select: 'firstName lastName' })
      .populate({ path: 'coveredSubtopics', select: 'title' }); 

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error reviewing logbook entry:', error);
    res.status(500).json({ 
      message: 'Error reviewing logbook entry',
      error: error.message 
    });
  }
};

const getCoursesProgress = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Find all unique courses taught by this teacher
    const courseIds = await ScheduleEntry.find({ teacher: teacherId })
      .distinct('course');

    // Get course details and calculate progress for each course
    const coursesWithProgress = await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await Course.findById(courseId)
          .select('title code description status');
        
        const progress = await Course.calculateProgress(courseId);

        return {
          _id: course._id,
          title: course.title,
          code: course.code,
          description: course.description,
          status: course.status,
          progress
        };
      })
    );

    res.json(coursesWithProgress);
  } catch (error) {
    console.error('Error fetching courses progress:', error);
    res.status(500).json({ 
      message: 'Error fetching courses progress',
      error: error.message 
    });
  }
};

// Get course modules for a specific course
const getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user._id;

    // Verify the teacher teaches this course
    const course = await Course.findOne({ _id: courseId, teacher: teacherId });
    if (!course) {
      return res.status(403).json({ message: 'You do not have access to this course' });
    }

    const modules = await CourseOutlineModule.find({ course: courseId })
      .sort({ order: 1 });

    res.json(modules);
  } catch (error) {
    console.error('Error fetching course modules:', error);
    res.status(500).json({ message: 'Error fetching course modules' });
  }
};

// Get list of courses assigned to the teacher via timetable
const getMyCourses = async (req, res) => {
  console.log(`[TeacherController] Entered getMyCourses for user: ${req.user?.email}, ID: ${req.user?._id}`);
  try {
    const teacherId = req.user._id;
    console.log(`[TeacherController getMyCourses] Using teacherId: ${teacherId}`);

    // Find all schedule entries for this teacher
    const scheduleEntries = await ScheduleEntry.find({ teacher: teacherId });
    console.log(`[TeacherController getMyCourses] Found ${scheduleEntries.length} schedule entries for teacher ${teacherId}:`, scheduleEntries);

    // Extract unique course IDs from the found entries
    const courseIds = scheduleEntries.map(entry => entry.course);
    const uniqueCourseIds = [...new Set(courseIds.map(id => id.toString()))];
      
    console.log(`[TeacherController] Found distinct course IDs from timetable:`, uniqueCourseIds);

    if (!uniqueCourseIds || uniqueCourseIds.length === 0) {
      console.log(`[TeacherController] No courses found in timetable for teacher ID: ${teacherId}`);
      return res.json([]);
    }

    // Fetch full course details for the found IDs
    const courses = await Course.find({
      '_id': { $in: uniqueCourseIds }
    }).select('title code description status department level');

    console.log(`[TeacherController] Found ${courses.length} course documents.`);
    res.json(courses);

  } catch (error) {
    console.error('[TeacherController] Error fetching teacher courses:', error);
    res.status(500).json({ 
      message: 'Error fetching teacher courses',
      error: error.message 
    });
  }
};

// Get details for a specific course the teacher is assigned to
const getCourseDetailsForTeacher = async (req, res) => {
  console.log(`[TeacherController] Entered getCourseDetailsForTeacher for user: ${req.user?.email}, Course ID: ${req.params.courseId}`);
  try {
    const teacherId = req.user._id;
    const { courseId } = req.params;

    // 1. Verify the teacher is associated with this course via ScheduleEntry
    const isTeachingCourse = await ScheduleEntry.exists({ 
      teacher: teacherId, 
      course: courseId 
    });

    if (!isTeachingCourse) {
      console.log(`[TeacherController] Access Denied: Teacher ${teacherId} not associated with course ${courseId}`);
      return res.status(403).json({ message: 'You are not assigned to teach this course.' });
    }

    // 2. Fetch Course Details
    const course = await Course.findById(courseId)
      .populate('department', 'name'); // Populate department name if needed

    if (!course) {
      console.log(`[TeacherController] Course not found: ${courseId}`);
      return res.status(404).json({ message: 'Course not found' });
    }

    // 3. Fetch Course Modules (can reuse existing logic or fetch here)
    const modules = await CourseOutlineModule.find({ course: courseId })
      .sort({ order: 1 });
      
    console.log(`[TeacherController] Found course details and ${modules.length} modules for course ${courseId}`);

    // Combine and send response
    res.json({ course, modules });

  } catch (error) {
    console.error('[TeacherController] Error fetching course details for teacher:', error);
    res.status(500).json({ 
      message: 'Error fetching course details',
      error: error.message 
    });
  }
};

// --- Add Controller for Logbook History ---
const getLogbookHistory = async (req, res) => {
  try {
    const teacherId = req.user._id;
    console.log(`[Teacher Controller] Fetching logbook history for teacher ID: ${teacherId}`);

    // Find schedule entries for the teacher
    const scheduleEntries = await ScheduleEntry.find({ teacher: teacherId });

    if (scheduleEntries.length === 0) {
      console.log('[Teacher Controller] Teacher not assigned to any schedule entries. Returning empty history.');
      return res.json([]);
    }

    // Extract unique course IDs
    const courseIds = [...new Set(scheduleEntries.map(entry => entry.course.toString()))];
    console.log(`[Teacher Controller] History: Teacher associated with course IDs: ${courseIds.join(', ')}`);

    // Find ALL logbook entries for these courses
    const logbookHistory = await LogbookEntry.find({
      course: { $in: courseIds }
      // No status filter here - fetch all statuses
    })
    .populate({ path: 'course', select: 'title code' })
    .populate({ path: 'delegate', select: 'firstName lastName email' })
    .populate({ path: 'reviewedBy', select: 'firstName lastName' }) // Populate who reviewed it
    .sort({ createdAt: -1 }); // Sort by newest first

    console.log(`[Teacher Controller] Found ${logbookHistory.length} logbook entries for history.`);
    res.json(logbookHistory);

  } catch (error) {
    console.error('Error fetching logbook history:', error);
    res.status(500).json({ 
      message: 'Error fetching logbook history',
      error: error.message 
    });
  }
};
// --- End Added Controller ---

// --- Course Outline Management ---

// Create a new Module for a Course
const createModule = async (req, res) => {
  try {
    const { courseId, title, description, order } = req.body;
    const teacherId = req.user._id;

    // TODO: Verify teacher is assigned to this course (optional but recommended)
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // TODO: Add validation to ensure teacher is assigned to this course via ScheduleEntry

    const newModule = new CourseOutlineModule({
      title,
      description,
      order,
      course: courseId,
      status: 'Pending' // Initial status
    });

    await newModule.save();

    // Optionally add module ref to Course model if needed (depends on schema)
    // await Course.findByIdAndUpdate(courseId, { $push: { modules: newModule._id } });

    res.status(201).json(newModule);
  } catch (error) {
    console.error('Error creating course module:', error);
    res.status(500).json({ message: 'Error creating course module', error: error.message });
  }
};

// Create a new Chapter within a Module
const createChapter = async (req, res) => {
  try {
    const { moduleId, title, description, order } = req.body;
    const teacherId = req.user._id;

    // TODO: Verify teacher owns the module/course (optional but recommended)
    const parentModule = await CourseOutlineModule.findById(moduleId);
    if (!parentModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // TODO: Add validation here like in createModule

    const newChapter = new Chapter({
      title,
      description,
      order,
      module: moduleId
    });

    await newChapter.save();

    // Add chapter reference to the parent module
    parentModule.chapters.push(newChapter._id);
    await parentModule.save();

    res.status(201).json(newChapter);
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ message: 'Error creating chapter', error: error.message });
  }
};

// Create a new Subtopic within a Chapter
const createSubtopic = async (req, res) => {
  try {
    const { chapterId, title, description, order } = req.body;
    const teacherId = req.user._id;

    // TODO: Verify teacher owns the chapter/module/course (optional but recommended)
    const parentChapter = await Chapter.findById(chapterId);
    if (!parentChapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    // TODO: Add validation here like in createModule/createChapter

    const newSubtopic = new Subtopic({
      title,
      description,
      order,
      chapter: chapterId,
      completed: false // Initial status
    });

    await newSubtopic.save();

    // Add subtopic reference to the parent chapter
    parentChapter.subtopics.push(newSubtopic._id);
    await parentChapter.save();

    res.status(201).json(newSubtopic);
  } catch (error) {
    console.error('Error creating subtopic:', error);
    res.status(500).json({ message: 'Error creating subtopic', error: error.message });
  }
};

// Toggle the completion status of a Subtopic
const toggleSubtopicCompletion = async (req, res) => {
  try {
    const { subtopicId } = req.params;
    // Optional: Get the desired completed status from the request body
    // const { completed } = req.body; 
    const teacherId = req.user._id;

    const subtopic = await Subtopic.findById(subtopicId);
    if (!subtopic) {
      return res.status(404).json({ message: 'Subtopic not found' });
    }

    // TODO: Verify teacher owns the subtopic/chapter/module/course

    // Toggle the completed status
    subtopic.completed = !subtopic.completed;
    // Or set it based on request body if provided: subtopic.completed = completed;
    await subtopic.save();

    // --- Update Parent Statuses ---
    const parentChapter = await Chapter.findById(subtopic.chapter).populate('subtopics');
    if (!parentChapter) {
        console.error(`Consistency Error: Chapter ${subtopic.chapter} not found for subtopic ${subtopic._id}`);
        // Still return success for the subtopic toggle, but log the error
        return res.json(subtopic); 
    }

    const allSubtopicsCompleted = parentChapter.subtopics.every(st => st.completed);
    const anySubtopicStarted = parentChapter.subtopics.some(st => st.completed); // Check if any work has started

    // Update parent Module status
    const parentModule = await CourseOutlineModule.findById(parentChapter.module).populate({
        path: 'chapters',
        populate: {
            path: 'subtopics',
            model: 'Subtopic', // Explicitly specify model if needed
            select: 'completed' // Only need completion status
        }
    });

    if (!parentModule) {
        console.error(`Consistency Error: Module ${parentChapter.module} not found for chapter ${parentChapter._id}`);
        // Still return success, but log error
        return res.json(subtopic); 
    }

    // Determine Module status based on its chapters and their subtopics
    let allChaptersCompleted = true;
    let anyChapterStarted = false;
    for (const chap of parentModule.chapters) {
        if (!chap.subtopics || chap.subtopics.length === 0) {
            // Treat chapters with no subtopics as 'completed' for module status calculation, or 'pending'? Let's assume completed.
            continue; 
        }
        const allSubsComplete = chap.subtopics.every(st => st.completed);
        if (!allSubsComplete) {
            allChaptersCompleted = false;
        }
        if (chap.subtopics.some(st => st.completed)){
             anyChapterStarted = true;
        }
        // Optimization: if one chapter isn't complete, the module can't be 'Completed'
        // if (!allChaptersCompleted && anyChapterStarted) break; 
    }

    if (allChaptersCompleted) {
        parentModule.status = 'Completed';
    } else if (anyChapterStarted) {
        parentModule.status = 'Ongoing';
    } else {
        parentModule.status = 'Pending';
    }

    await parentModule.save();
    // --- End Status Update ---

    res.json(subtopic); // Return the updated subtopic

  } catch (error) {
    console.error('Error toggling subtopic completion:', error);
    res.status(500).json({ message: 'Error toggling subtopic completion', error: error.message });
  }
};

// Get the full course outline (Modules -> Chapters -> Subtopics)
const getCourseOutline = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user._id;

    // 1. Verify the teacher is associated with this course (reuse logic if possible)
    const isTeachingCourse = await ScheduleEntry.exists({
      teacher: teacherId,
      course: courseId
    });

    if (!isTeachingCourse) {
      return res.status(403).json({ message: 'You are not assigned to teach this course.' });
    }

    // 2. Fetch the outline structure with nested population
    const outline = await CourseOutlineModule.find({ course: courseId })
      .sort('order') // Sort modules by order
      .populate({
        path: 'chapters',
        options: { sort: { 'order': 1 } }, // Sort chapters by order
        populate: {
          path: 'subtopics',
          options: { sort: { 'order': 1 } } // Sort subtopics by order
          // Select specific fields if needed to reduce payload size:
          // select: 'title description completed order' 
        }
      });
      // Optionally select fields for modules too: .select('title description status order');

    if (!outline) {
      // This case might mean the course exists but has no outline modules yet
      return res.json([]); 
    }

    res.json(outline);

  } catch (error) {
    console.error('Error fetching course outline:', error);
    res.status(500).json({ message: 'Error fetching course outline', error: error.message });
  }
};

// --- Update Outline Items ---

const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description, order } = req.body;
    const teacherId = req.user._id;

    // TODO: Verify teacher owns this module/course

    const updatedModule = await CourseOutlineModule.findByIdAndUpdate(
      moduleId,
      { title, description, order },
      { new: true, runValidators: true } // Return the updated doc, run schema validators
    );

    if (!updatedModule) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json(updatedModule);
  } catch (error) {
    console.error('Error updating module:', error);
    // Handle potential validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating module', error: error.message });
  }
};

const updateChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { title, description, order } = req.body;
    const teacherId = req.user._id;

    // TODO: Verify teacher owns this chapter/module/course

    const updatedChapter = await Chapter.findByIdAndUpdate(
      chapterId,
      { title, description, order },
      { new: true, runValidators: true }
    );

    if (!updatedChapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    res.json(updatedChapter);
  } catch (error) {
    console.error('Error updating chapter:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating chapter', error: error.message });
  }
};

const updateSubtopic = async (req, res) => {
  try {
    const { subtopicId } = req.params;
    const { title, description, order } = req.body;
    const teacherId = req.user._id;

    // TODO: Verify teacher owns this subtopic/chapter/module/course

    // Note: This only updates text fields/order. Completion is handled by toggleSubtopicCompletion
    const updatedSubtopic = await Subtopic.findByIdAndUpdate(
      subtopicId,
      { title, description, order }, 
      { new: true, runValidators: true }
    );

    if (!updatedSubtopic) {
      return res.status(404).json({ message: 'Subtopic not found' });
    }

    res.json(updatedSubtopic);
  } catch (error) {
    console.error('Error updating subtopic:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating subtopic', error: error.message });
  }
};

// --- Delete Outline Items ---

const deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const teacherId = req.user._id;

    // TODO: Verify teacher owns this module/course

    const moduleToDelete = await CourseOutlineModule.findById(moduleId).populate('chapters');
    if (!moduleToDelete) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // 1. Delete all associated Subtopics for all Chapters within the Module
    const chapterIds = moduleToDelete.chapters.map(ch => ch._id);
    await Subtopic.deleteMany({ chapter: { $in: chapterIds } });

    // 2. Delete all associated Chapters
    await Chapter.deleteMany({ module: moduleId });

    // 3. Delete the Module itself
    await CourseOutlineModule.findByIdAndDelete(moduleId);

    // Note: We are not removing the module ref from the Course model here,
    // assuming it's not strictly necessary or handled elsewhere.

    // Note: Status recalculation for the overall course is not handled here.

    res.status(200).json({ message: 'Module and its contents deleted successfully' });

  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Error deleting module', error: error.message });
  }
};

const deleteChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const teacherId = req.user._id;

    // TODO: Verify teacher owns this chapter/module/course

    const chapterToDelete = await Chapter.findById(chapterId);
    if (!chapterToDelete) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    // 1. Delete all associated Subtopics
    await Subtopic.deleteMany({ chapter: chapterId });

    // 2. Remove chapter reference from parent Module
    await CourseOutlineModule.findByIdAndUpdate(chapterToDelete.module, {
      $pull: { chapters: chapterId }
    });

    // 3. Delete the Chapter itself
    await Chapter.findByIdAndDelete(chapterId);

    // Note: Status recalculation for the parent Module is not handled here.
    // Could potentially trigger a recalculation if needed.

    res.status(200).json({ message: 'Chapter and its subtopics deleted successfully' });

  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ message: 'Error deleting chapter', error: error.message });
  }
};

const deleteSubtopic = async (req, res) => {
  try {
    const { subtopicId } = req.params;
    const teacherId = req.user._id;

    // TODO: Verify teacher owns this subtopic/chapter/module/course

    const subtopicToDelete = await Subtopic.findById(subtopicId);
    if (!subtopicToDelete) {
      return res.status(404).json({ message: 'Subtopic not found' });
    }

    // 1. Remove subtopic reference from parent Chapter
    await Chapter.findByIdAndUpdate(subtopicToDelete.chapter, {
      $pull: { subtopics: subtopicId }
    });

    // 2. Delete the Subtopic itself
    await Subtopic.findByIdAndDelete(subtopicId);

    // Note: Status recalculation for parent Chapter/Module is not handled here.
    // Could potentially trigger a recalculation if needed.

    res.status(200).json({ message: 'Subtopic deleted successfully' });

  } catch (error) {
    console.error('Error deleting subtopic:', error);
    res.status(500).json({ message: 'Error deleting subtopic', error: error.message });
  }
};

module.exports = {
  getPendingLogbookEntries,
  getLogbookEntryForReview,
  reviewLogbookEntry,
  getCoursesProgress,
  getCourseModules,
  getMyCourses,
  getCourseDetailsForTeacher,
  getLogbookHistory,
  createModule,
  createChapter,
  createSubtopic,
  toggleSubtopicCompletion,
  getCourseOutline,
  updateModule,
  updateChapter,
  updateSubtopic,
  deleteModule,
  deleteChapter,
  deleteSubtopic
}; 