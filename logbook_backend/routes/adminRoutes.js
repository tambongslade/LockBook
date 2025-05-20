console.log("[DEBUG] Loading adminRoutes.js...");
const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth.js');
const Course = require('../models/Course');
const User = require('../models/User');
const LogbookEntry = require('../models/LogbookEntry');
const { getAllLogbookHistory, getCoursesWithProgress, exportCoursesProgressReport } = require('../controllers/adminController');

// Apply authentication and admin check middleware using correct names
router.use(auth);
router.use(isAdmin);

// Get all users
router.get('/users', async (req, res) => {
  // --- VERY FIRST LOG --- 
  console.log(`[Admin Route /users] REQUEST RECEIVED. Query Params: ${JSON.stringify(req.query)}`);
  // --- END LOG --- 
  try {
    const { search, role } = req.query;
    let finalQuery = {}; // Start with empty query

    // Prepare role filter if role is valid
    let roleFilter = null;
    if (role) {
      const validRoles = ['ADMIN', 'TEACHER', 'DELEGATE', 'STUDENT'];
      const upperCaseRole = role.toUpperCase();
      if (validRoles.includes(upperCaseRole)) {
        roleFilter = { role: upperCaseRole };
        console.log(`[Admin Route /users] Prepared role filter:`, roleFilter);
      } else {
        console.warn(`[Admin Route /users] Invalid role requested: "${role}"`);
      }
    }

    // Prepare search filter if search is provided
    let searchFilter = null;
    if (search) {
      console.log(`[Admin Route /users] Search term received: "${search}"`);
      const searchRegex = new RegExp(search, 'i');
      searchFilter = {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      };
      console.log(`[Admin Route /users] Prepared search filter:`, searchFilter);
    }

    // Combine filters explicitly
    if (roleFilter && searchFilter) {
      // Both role and search provided: combine with $and
      finalQuery = { $and: [roleFilter, searchFilter] };
      console.log('[Admin Route /users] Combining Role and Search with $and');
    } else if (roleFilter) {
      // Only role provided
      finalQuery = roleFilter;
      console.log('[Admin Route /users] Applying only Role filter');
    } else if (searchFilter) {
      // Only search provided
      finalQuery = searchFilter;
      console.log('[Admin Route /users] Applying only Search filter');
    } else {
      // Neither provided (fetch all, respecting potential future base filters)
      console.log('[Admin Route /users] Applying no specific role/search filters');
    }

    console.log('[Admin Route /users] Final Mongoose query:', JSON.stringify(finalQuery));

    const users = await User.find(finalQuery)
      .populate('department', 'name')
      .select('-password')
      .limit(20)
      .sort({ firstName: 1, lastName: 1 });

    console.log(`[Admin Route /users] Found ${users.length} users matching criteria.`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// GET all logbook entries (for admin history)
router.get('/logbooks/history', getAllLogbookHistory);

// GET course progress report data
router.get('/courses/progress', getCoursesWithProgress);

// GET export course progress report as Excel
router.get('/courses/progress/export', exportCoursesProgressReport);

module.exports = router; 