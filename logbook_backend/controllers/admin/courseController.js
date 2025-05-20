const Course = require('../../models/Course');

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('department');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
};

// Get single course
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('department');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
};

// Create course
exports.createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    const populatedCourse = await Course.findById(course._id).populate('department');
    res.status(201).json(populatedCourse);
  } catch (error) {
    res.status(400).json({ message: 'Error creating course', error: error.message });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: 'Error updating course', error: error.message });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
}; 