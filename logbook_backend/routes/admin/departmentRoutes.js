const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../../middleware/auth');
const {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../../controllers/admin/departmentController');

// Apply auth and admin middleware to all routes in this file
router.use(auth);
router.use(isAdmin);

// Routes
router.route('/')
  .get(getAllDepartments)
  .post(createDepartment);

router.route('/:id')
  .put(updateDepartment)
  .delete(deleteDepartment);

module.exports = router; 