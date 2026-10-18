const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserManager,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Get all users with filtering
router.get('/', getUsers);

// Get user by ID with summary
router.get('/:id', getUserById);

// Create new user
router.post('/', createUser);

// Update user
router.put('/:id', updateUser);

// Update user status (activate/deactivate)
router.put('/:id/status', updateUserStatus);

// Update user's manager
router.put('/:id/manager', updateUserManager);

module.exports = router;
