const Department = require('../../models/Department');

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Private/Admin
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}).sort('name');
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error fetching departments' });
  }
};

// @desc    Create a department
// @route   POST /api/admin/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    const departmentExists = await Department.findOne({ name });
    if (departmentExists) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = new Department({ name });
    const createdDepartment = await department.save();
    res.status(201).json(createdDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error creating department' });
  }
};

// @desc    Update a department
// @route   PUT /api/admin/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if another department with the new name already exists
    const departmentExists = await Department.findOne({ name, _id: { $ne: id } });
    if (departmentExists) {
      return res.status(400).json({ message: 'Another department with this name already exists' });
    }

    department.name = name;
    const updatedDepartment = await department.save();
    res.json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Server error updating department' });
  }
};

// @desc    Delete a department
// @route   DELETE /api/admin/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Optional: Add checks here to prevent deletion if courses/users reference it?
    // Example: const coursesExist = await Course.exists({ department: id });
    // if (coursesExist) return res.status(400).json({ message: 'Cannot delete department with associated courses'});

    await department.deleteOne(); // Use deleteOne() on the document
    res.json({ message: 'Department removed' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Server error deleting department' });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
}; 