const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const adminMiddleware = require('../../middleware/adminMiddleware');
const {
  getAllModules,
  getModule,
  createModule,
  updateModule,
  deleteModule
} = require('../../controllers/admin/courseOutlineModuleController');

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Course outline module routes
router.get('/', getAllModules);
router.get('/:id', getModule);
router.post('/', createModule);
router.put('/:id', updateModule);
router.delete('/:id', deleteModule);

module.exports = router; 