const CourseOutlineModule = require('../models/CourseOutlineModule');

const getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;

    const modules = await CourseOutlineModule.find({ course: courseId })
      .sort({ order: 1 });

    res.json(modules);
  } catch (error) {
    console.error('Error fetching course modules:', error);
    res.status(500).json({ message: 'Error fetching course modules' });
  }
};

module.exports = {
  getCourseModules
}; 