const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../../middleware/auth');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
  changePassword
} = require('../../controllers/admin/userController');

// Apply consistent auth and admin middleware to all routes
router.use(auth, isAdmin);

// User routes
router.get('/', getAllUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);
router.put('/:id/password', changePassword);

module.exports = router; 