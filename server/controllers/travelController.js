const TravelRequest = require('../models/TravelRequest');
const User = require('../models/User');
const { notifyManager, notifyEmployee } = require('../services/notificationService');
const { createAuditLog } = require('../services/auditService');
const mongoose = require('mongoose');

// @desc    Create new travel request
// @route   POST /api/travel-requests
// @access  Private (Employee only)
const createTravelRequest = async (req, res) => {
  try {
    const {
      travelType,
      purpose,
      destination,
      startDate,
      endDate,
      estimatedBudget,
      additionalNotes,
    } = req.body;

    // Validation
    if (!travelType || !purpose || !destination || !startDate || !endDate || estimatedBudget === undefined || estimatedBudget === null || estimatedBudget === '') {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (parseFloat(estimatedBudget) <= 0) {
      return res.status(400).json({ message: 'Budget must be greater than zero' });
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    if (start < now) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }

    // Get employee with manager
    const employee = await User.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (!employee.managerId) {
      return res.status(400).json({ message: 'You must have an assigned manager to create a travel request' });
    }

    // Create travel request
    const travelRequest = await TravelRequest.create({
      employeeId: req.user.id,
      managerId: employee.managerId,
      travelType,
      purpose,
      destination,
      startDate: start,
      endDate: end,
      estimatedBudget,
      additionalNotes: additionalNotes || '',
      status: 'pending',
    });

    // Log travel request creation
    createAuditLog({
      actorId: req.user.id,
      action: 'travel_created',
      entityType: 'TravelRequest',
      entityId: travelRequest._id,
      description: `Travel request created for ${destination}`,
      metadata: {
        travelType,
        destination,
        estimatedBudget,
        employeeId: employee.employeeId,
      },
      req,
    });

    // Populate for response
    const populatedRequest = await TravelRequest.findById(travelRequest._id)
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('managerId', 'firstName lastName email employeeId')
      .populate('managerApproval.approvedBy', 'firstName lastName email employeeId');

    // Notify manager of new travel request
    notifyManager(
      req.user.id,
      'travel_request_submitted',
      'New Travel Request',
      `A new travel request from ${employee.firstName} ${employee.lastName} is awaiting your approval.`,
      'travelRequest',
      travelRequest._id
    );

    res.status(201).json({
      success: true,
      travelRequest: populatedRequest,
    });
  } catch (error) {
    console.error('Create travel request error:', error);
    res.status(500).json({ message: 'Server error during travel request creation' });
  }
};

// @desc    Get travel requests (filtered by role)
// @route   GET /api/travel-requests
// @access  Private
const getTravelRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const user = await User.findById(req.user.id);

    let filter = {};

    if (user.role === 'employee') {
      // Employees see only their own requests
      filter.employeeId = req.user.id;
    } else if (user.role === 'manager') {
      // Managers see requests assigned to them
      filter.managerId = req.user.id;
    } else if (user.role === 'finance' || user.role === 'admin') {
      // Finance and Admin see all requests
      // No filter needed
    }

    if (status) {
      filter.status = status;
    }

    const travelRequests = await TravelRequest.find(filter)
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('managerId', 'firstName lastName email employeeId')
      .populate('managerApproval.approvedBy', 'firstName lastName email employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      travelRequests,
    });
  } catch (error) {
    console.error('Get travel requests error:', error);
    res.status(500).json({ message: 'Server error fetching travel requests' });
  }
};

// @desc    Get single travel request
// @route   GET /api/travel-requests/:id
// @access  Private
const getTravelRequestById = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid travel request ID' });
    }

    const travelRequest = await TravelRequest.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('managerId', 'firstName lastName email employeeId')
      .populate('managerApproval.approvedBy', 'firstName lastName email employeeId');

    if (!travelRequest) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    const user = await User.findById(req.user.id);

    // Access control
    if (user.role === 'employee' && travelRequest.employeeId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    if (user.role === 'manager' && travelRequest.managerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    // Admin can view any request (already handled by role middleware)

    res.json({
      success: true,
      travelRequest,
    });
  } catch (error) {
    console.error('Get travel request error:', error);
    res.status(500).json({ message: 'Server error fetching travel request' });
  }
};

// @desc    Manager approve/reject travel request
// @route   PUT /api/travel-requests/:id/manager-approve
// @access  Private (Manager only)
const managerApproveRequest = async (req, res) => {
  try {
    const { status, comments } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Please provide valid approval status (approved or rejected)' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid travel request ID' });
    }

    const travelRequest = await TravelRequest.findById(req.params.id);

    if (!travelRequest) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    // Check if request is assigned to this manager
    if (travelRequest.managerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }

    // Check if request is already finalized
    if (travelRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update approval
    travelRequest.managerApproval.status = status;
    travelRequest.managerApproval.approvedBy = req.user.id;
    travelRequest.managerApproval.approvedAt = new Date();
    travelRequest.managerApproval.comments = comments || '';
    travelRequest.status = status;

    await travelRequest.save();

    // Log approval/rejection
    const action = status === 'approved' ? 'travel_approved' : 'travel_rejected';
    createAuditLog({
      actorId: req.user.id,
      action,
      entityType: 'TravelRequest',
      entityId: travelRequest._id,
      description: `Travel request ${status} by manager`,
      metadata: {
        status,
        destination: travelRequest.destination,
        employeeId: travelRequest.employeeId,
      },
      req,
    });

    // Notify employee of approval/rejection
    const notificationType = status === 'approved' ? 'travel_request_approved' : 'travel_request_rejected';
    const notificationTitle = status === 'approved' ? 'Travel Request Approved' : 'Travel Request Rejected';
    const notificationMessage = status === 'approved'
      ? `Your travel request to ${travelRequest.destination} has been approved.`
      : `Your travel request to ${travelRequest.destination} has been rejected. ${comments ? `Reason: ${comments}` : ''}`;

    notifyEmployee(
      travelRequest.employeeId,
      notificationType,
      notificationTitle,
      notificationMessage,
      'travelRequest',
      travelRequest._id
    );

    // Populate for response
    const populatedRequest = await TravelRequest.findById(travelRequest._id)
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('managerId', 'firstName lastName email employeeId')
      .populate('managerApproval.approvedBy', 'firstName lastName email employeeId');

    res.json({
      success: true,
      travelRequest: populatedRequest,
    });
  } catch (error) {
    console.error('Manager approve error:', error);
    res.status(500).json({ message: 'Server error during approval' });
  }
};

// @desc    Cancel travel request
// @route   PUT /api/travel-requests/:id/cancel
// @access  Private (Employee only)
const cancelTravelRequest = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid travel request ID' });
    }

    const travelRequest = await TravelRequest.findById(req.params.id);

    if (!travelRequest) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    // Check if request belongs to this employee
    if (travelRequest.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    // Check if request can be cancelled
    if (travelRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    travelRequest.status = 'cancelled';
    await travelRequest.save();

    // Log cancellation
    createAuditLog({
      actorId: req.user.id,
      action: 'travel_cancelled',
      entityType: 'TravelRequest',
      entityId: travelRequest._id,
      description: 'Travel request cancelled by employee',
      metadata: {
        destination: travelRequest.destination,
        employeeId: travelRequest.employeeId,
      },
      req,
    });

    // Populate for response
    const populatedRequest = await TravelRequest.findById(travelRequest._id)
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('managerId', 'firstName lastName email employeeId')
      .populate('managerApproval.approvedBy', 'firstName lastName email employeeId');

    res.json({
      success: true,
      travelRequest: populatedRequest,
    });
  } catch (error) {
    console.error('Cancel travel request error:', error);
    res.status(500).json({ message: 'Server error during cancellation' });
  }
};

module.exports = {
  createTravelRequest,
  getTravelRequests,
  getTravelRequestById,
  managerApproveRequest,
  cancelTravelRequest,
};
