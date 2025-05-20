const CourseOutlineModule = require('../../models/CourseOutlineModule');

// Get all modules
exports.getAllModules = async (req, res) => {
  try {
    const modules = await CourseOutlineModule.find().populate('course');
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching modules', error: error.message });
  }
};

// Get single module
exports.getModule = async (req, res) => {
  try {
    const module = await CourseOutlineModule.findById(req.params.id).populate('course');
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching module', error: error.message });
  }
};

// Create module
exports.createModule = async (req, res) => {
  try {
    const module = new CourseOutlineModule(req.body);
    await module.save();
    const populatedModule = await CourseOutlineModule.findById(module._id).populate('course');
    res.status(201).json(populatedModule);
  } catch (error) {
    res.status(400).json({ message: 'Error creating module', error: error.message });
  }
};

// Update module
exports.updateModule = async (req, res) => {
  try {
    const module = await CourseOutlineModule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('course');
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(400).json({ message: 'Error updating module', error: error.message });
  }
};

// Delete module
exports.deleteModule = async (req, res) => {
  try {
    const module = await CourseOutlineModule.findByIdAndDelete(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting module', error: error.message });
  }
}; 