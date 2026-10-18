const User = require('../models/User');
const TravelRequest = require('../models/TravelRequest');
const Expense = require('../models/Expense');
const Reimbursement = require('../models/Reimbursement');
const { createAuditLog } = require('../services/auditService');
const mongoose = require('mongoose');

// @desc    Get all users with filtering
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const { role, department, status, search } = req.query;

    // Build filter
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (department) {
      filter.department = department;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('managerId', 'firstName lastName email employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching users'
    });
  }
};

// @desc    Get user by ID with summary
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUserById = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'firstName lastName email employeeId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get summary statistics
    const travelRequestCount = await TravelRequest.countDocuments({ employeeId: user._id });
    const expenseCount = await Expense.countDocuments({ employeeId: user._id });
    const reimbursementCount = await Reimbursement.countDocuments({ employeeId: user._id });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        statistics: {
          travelRequests: travelRequestCount,
          expenses: expenseCount,
          reimbursements: reimbursementCount,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching user'
    });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      employeeId,
      managerId,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role || !department || !employeeId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if employeeId already exists
    const employeeIdExists = await User.findOne({ employeeId });
    if (employeeIdExists) {
      return res.status(400).json({ message: 'Employee ID already registered' });
    }

    // Validate role
    const validRoles = ['employee', 'manager', 'finance', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate manager assignment for employees
    if (role === 'employee' && managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(400).json({ message: 'Manager not found' });
      }
      if (manager.role !== 'manager') {
        return res.status(400).json({ message: 'Assigned user must be a manager' });
      }
      if (!manager.isActive) {
        return res.status(400).json({ message: 'Cannot assign to inactive manager' });
      }
      if (managerId === req.user.id) {
        return res.status(400).json({ message: 'Cannot assign to yourself' });
      }
    }

    // Non-employee roles should not have managerId
    if (role !== 'employee' && managerId) {
      return res.status(400).json({ message: 'Only employees can have a manager' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      department,
      employeeId,
      managerId: role === 'employee' ? managerId : null,
      isActive: true,
    });

    // Log user creation
    createAuditLog({
      actorId: req.user.id,
      action: 'user_created',
      entityType: 'User',
      entityId: user._id,
      description: `User created - ${firstName} ${lastName} (${role})`,
      metadata: {
        role,
        department,
        employeeId,
        managerId: role === 'employee' ? managerId : null,
      },
      req,
    });

    // Return user without password
    const userWithoutPassword = await User.findById(user._id).select('-password').populate('managerId', 'firstName lastName email employeeId');

    res.status(201).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      message: error.message || 'Error creating user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const {
      firstName,
      lastName,
      email,
      role,
      department,
      employeeId,
      managerId,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent updating _id, createdAt, updatedAt, password
    const allowedUpdates = ['firstName', 'lastName', 'email', 'role', 'department', 'employeeId', 'managerId'];
    const updateData = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Email uniqueness check (if changing email)
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      updateData.email = email.toLowerCase();
    }

    // EmployeeId uniqueness check (if changing employeeId)
    if (employeeId && employeeId !== user.employeeId) {
      const employeeIdExists = await User.findOne({ employeeId });
      if (employeeIdExists) {
        return res.status(400).json({ message: 'Employee ID already registered' });
      }
    }

    // Validate role change
    if (role && role !== user.role) {
      const validRoles = ['employee', 'manager', 'finance', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Prevent demoting a manager who has subordinates
      if (user.role === 'manager' && role !== 'manager') {
        const subordinateCount = await User.countDocuments({ managerId: user._id });
        if (subordinateCount > 0) {
          return res.status(400).json({
            message: 'Cannot change role while this user has subordinates assigned. Reassign subordinates first.'
          });
        }
      }
    }

    // Validate manager assignment
    if (managerId !== undefined) {
      if (role === 'employee' || (role === undefined && user.role === 'employee')) {
        if (managerId) {
          const manager = await User.findById(managerId);
          if (!manager) {
            return res.status(400).json({ message: 'Manager not found' });
          }
          if (manager.role !== 'manager') {
            return res.status(400).json({ message: 'Assigned user must be a manager' });
          }
          if (!manager.isActive) {
            return res.status(400).json({ message: 'Cannot assign to inactive manager' });
          }
          if (managerId === req.user.id) {
            return res.status(400).json({ message: 'Cannot assign to yourself' });
          }
          updateData.managerId = managerId;
        } else {
          updateData.managerId = null;
        }
      } else {
        updateData.managerId = null;
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('managerId', 'firstName lastName email employeeId');

    // Log user update
    const changedFields = Object.keys(updateData);
    createAuditLog({
      actorId: req.user.id,
      action: 'user_updated',
      entityType: 'User',
      entityId: user._id,
      description: `User updated - ${changedFields.join(', ')}`,
      metadata: {
        changedFields,
        role: updatedUser.role,
        department: updatedUser.department,
      },
      req,
    });

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      message: error.message || 'Error updating user'
    });
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating the current admin
    if (!isActive && user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Prevent deactivating the only admin
    if (!isActive && user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot deactivate the only active admin account' });
      }
    }

    user.isActive = isActive;
    await user.save();

    // Log user activation/deactivation
    const action = isActive ? 'user_activated' : 'user_deactivated';
    createAuditLog({
      actorId: req.user.id,
      action,
      entityType: 'User',
      entityId: user._id,
      description: `User ${isActive ? 'activated' : 'deactivated'}`,
      metadata: {
        isActive,
        role: user.role,
        employeeId: user.employeeId,
      },
      req,
    });

    const userWithoutPassword = await User.findById(user._id).select('-password').populate('managerId', 'firstName lastName email employeeId');

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: error.message || 'Error updating user status'
    });
  }
};

// @desc    Update user's manager
// @route   PUT /api/users/:id/manager
// @access  Private (Admin only)
const updateUserManager = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const { managerId } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only employees can have managers
    if (user.role !== 'employee') {
      return res.status(400).json({ message: 'Only employees can be assigned a manager' });
    }

    // If assigning a manager
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(400).json({ message: 'Manager not found' });
      }
      if (manager.role !== 'manager') {
        return res.status(400).json({ message: 'Assigned user must be a manager' });
      }
      if (!manager.isActive) {
        return res.status(400).json({ message: 'Cannot assign to inactive manager' });
      }
      if (managerId === req.user.id) {
        return res.status(400).json({ message: 'Cannot assign to yourself' });
      }
      if (managerId === user._id.toString()) {
        return res.status(400).json({ message: 'Cannot assign employee to themselves' });
      }
      user.managerId = managerId;
    } else {
      // Remove manager assignment
      user.managerId = null;
    }

    await user.save();

    // Log manager assignment
    createAuditLog({
      actorId: req.user.id,
      action: 'manager_assigned',
      entityType: 'User',
      entityId: user._id,
      description: `Manager ${managerId ? 'assigned' : 'removed'} for employee`,
      metadata: {
        employeeId: user.employeeId,
        previousManagerId: user.managerId, // This will be the old value before update
        newManagerId: managerId,
      },
      req,
    });

    const userWithoutPassword = await User.findById(user._id).select('-password').populate('managerId', 'firstName lastName email employeeId');

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update user manager error:', error);
    res.status(500).json({
      message: error.message || 'Error updating user manager'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserManager,
};
