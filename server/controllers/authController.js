const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpire } = require('../config/config');
const { createAuditLog } = require('../services/auditService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire,
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, department, employeeId } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !department || !employeeId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });

    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (userExists.employeeId === employeeId) {
        return res.status(400).json({ message: 'Employee ID already registered' });
      }
    }

    // Create user (role defaults to 'employee')
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      department,
      employeeId,
      role: 'employee', // Force employee role for public registration
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Log failed login attempt
      createAuditLog({
        actorId: null, // Unknown user
        action: 'login_failed',
        entityType: 'User',
        entityId: null,
        description: 'Failed login attempt - user not found',
        metadata: { email: email.substring(0, 3) + '***' }, // Partial email for identification
        req,
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      // Log failed login due to inactive account
      createAuditLog({
        actorId: user._id,
        action: 'login_failed',
        entityType: 'User',
        entityId: user._id,
        description: 'Failed login attempt - account inactive',
        metadata: { email: email.substring(0, 3) + '***' },
        req,
      });
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Log failed login due to invalid password
      createAuditLog({
        actorId: user._id,
        action: 'login_failed',
        entityType: 'User',
        entityId: user._id,
        description: 'Failed login attempt - invalid password',
        metadata: { email: email.substring(0, 3) + '***' },
        req,
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Log successful login
    createAuditLog({
      actorId: user._id,
      action: 'login_success',
      entityType: 'User',
      entityId: user._id,
      description: 'User logged in successfully',
      metadata: { role: user.role, department: user.department },
      req,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        managerId: user.managerId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
