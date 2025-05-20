const User = require('../../models/User');
const bcrypt = require('bcryptjs'); // Needed for potential password updates

// @desc    Get all users
// @route   GET /api/admin/users
// @route   GET /api/admin/users?role=DELEGATE (or other role)
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      // Ensure role query is treated case-insensitively or matches DB casing (UPPERCASE)
      filter.role = req.query.role.toUpperCase(); 
    }

    // Exclude password field, sort by creation date
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).populate('department', 'name'); 
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Get single user by ID
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('department');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    // Check if user already exists (optional but good practice)
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists.'});
    }

    // Create user (password hashing is handled by pre-save hook in model)
    const user = new User(req.body);
    await user.save();
    
    // Return user data without password
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ message: 'Error creating user', error: error.message });
  }
};

// Update user details (excluding password)
const updateUser = async (req, res) => {
  try {
    // Explicitly remove password and role from update data if they exist
    // Role changes should likely have a dedicated endpoint/logic
    const { password, role, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData, // Only update fields other than password/role
      { new: true, runValidators: true }
    ).select('-password').populate('department');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
};

// Update user role (Dedicated endpoint often better, but implementing here based on frontend)
const updateUserRole = async (req, res) => {
    try {
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ message: 'Role is required.' });
      }
      // Add validation for allowed roles if needed
      const allowedRoles = ['ADMIN', 'TEACHER', 'DELEGATE'];
      if (!allowedRoles.includes(role.toUpperCase())) {
           return res.status(400).json({ message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` });
      }
      
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: role.toUpperCase() }, // Update only the role
        { new: true, runValidators: true }
      ).select('-password').populate('department');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(400).json({ message: 'Error updating user role', error: error.message });
    }
  };

// Change user password
const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) { // Add basic validation
      return res.status(400).json({ message: 'New password is required and must be at least 6 characters long.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword; // Assign plain text, pre-save hook will hash
    await user.save();
    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error("Error updating password:", error);
    res.status(400).json({ message: 'Error updating password', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  changePassword,
  deleteUser
};