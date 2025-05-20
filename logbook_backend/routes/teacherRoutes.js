const express = require('express');
const router = express.Router();
const { auth, isTeacher } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

// Apply auth middleware to all routes
router.use(auth);
router.use(isTeacher);

// Get a simple list of courses assigned to the teacher via timetable
router.get('/my-courses', teacherController.getMyCourses);

// Get course progress for all courses taught by the teacher
router.get('/courses/progress', teacherController.getCoursesProgress);

// Get modules for a specific course
router.get('/courses/:courseId/modules', teacherController.getCourseModules);

// Get details for a specific course (including modules)
router.get('/courses/:courseId/details', teacherController.getCourseDetailsForTeacher);

// Get pending logbook entries for review
router.get('/review/pending', teacherController.getPendingLogbookEntries);

// Get specific logbook entry for review
router.get('/logbook/:entryId', teacherController.getLogbookEntryForReview);

// Review a logbook entry
router.put('/logbook/:entryId/review', teacherController.reviewLogbookEntry);

// Get all logbook entries associated with the teacher's courses
router.get('/logbooks/history', teacherController.getLogbookHistory);

// --- Course Outline Management Routes ---

// Create a new module
router.post('/outline/modules', teacherController.createModule);

// Create a new chapter
router.post('/outline/chapters', teacherController.createChapter);

// Create a new subtopic
router.post('/outline/subtopics', teacherController.createSubtopic);

// Toggle subtopic completion status
router.patch('/outline/subtopics/:subtopicId/toggle', teacherController.toggleSubtopicCompletion);

// Get full course outline structure
router.get('/outline/course/:courseId', teacherController.getCourseOutline);

// --- Update Outline Items ---
router.patch('/outline/modules/:moduleId', teacherController.updateModule);
router.patch('/outline/chapters/:chapterId', teacherController.updateChapter);
router.patch('/outline/subtopics/:subtopicId', teacherController.updateSubtopic);

// --- Delete Outline Items ---
router.delete('/outline/modules/:moduleId', teacherController.deleteModule);
router.delete('/outline/chapters/:chapterId', teacherController.deleteChapter);
router.delete('/outline/subtopics/:subtopicId', teacherController.deleteSubtopic);

module.exports = router; 