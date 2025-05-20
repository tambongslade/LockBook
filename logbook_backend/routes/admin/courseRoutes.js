const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../../middleware/auth');
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../../controllers/admin/courseController');

// Apply consistent auth and admin middleware to all routes
router.use(auth, isAdmin);

// Course routes
router.get('/', getAllCourses);
router.get('/:id', getCourse);
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

module.exports = router; 