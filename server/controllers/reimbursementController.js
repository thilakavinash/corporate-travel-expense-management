const Reimbursement = require('../models/Reimbursement');
const TravelRequest = require('../models/TravelRequest');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { notifyRole, notifyEmployee } = require('../services/notificationService');
const { createAuditLog } = require('../services/auditService');
const mongoose = require('mongoose');

// @desc    Create reimbursement claim
// @route   POST /api/reimbursements
// @access  Private (Employee only)
const createReimbursement = async (req, res) => {
  try {
    const { travelRequestId } = req.body;
    const employeeId = req.user._id;

    // Verify travel request exists and belongs to employee
    const travelRequest = await TravelRequest.findOne({
      _id: travelRequestId,
      employeeId,
    });

    if (!travelRequest) {
      return res.status(404).json({
        message: 'Travel request not found or does not belong to you',
      });
    }

    // Verify travel request is approved
    if (travelRequest.status !== 'approved') {
      return res.status(400).json({
        message: 'You can only create reimbursement claims for approved travel requests',
      });
    }

    // Check for duplicate active claims
    const existingClaim = await Reimbursement.findOne({
      employeeId,
      travelRequestId,
      status: { $in: ['pending', 'approved', 'paid'] },
    });

    if (existingClaim) {
      return res.status(400).json({
        message: 'Reimbursement claim already exists for this travel request',
      });
    }

    // Find approved expenses for this travel request
    const approvedExpenses = await Expense.find({
      travelRequestId,
      employeeId,
      status: 'approved',
    });

    if (approvedExpenses.length === 0) {
      return res.status(400).json({
        message: 'No approved expenses found for this travel request. Cannot create reimbursement claim.',
      });
    }

    // Calculate total from approved expenses
    const totalAmount = approvedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Create reimbursement claim
    const reimbursement = await Reimbursement.create({
      employeeId,
      travelRequestId,
      totalAmount,
      status: 'pending',
    });

    // Log reimbursement creation
    createAuditLog({
      actorId: req.user.id,
      action: 'reimbursement_created',
      entityType: 'Reimbursement',
      entityId: reimbursement._id,
      description: 'Reimbursement claim created',
      metadata: {
        totalAmount,
        travelRequestId,
        employeeId,
      },
      req,
    });

    // Populate for response
    await reimbursement.populate([
      { path: 'employeeId', select: 'firstName lastName email employeeId department' },
      { path: 'travelRequestId', select: 'destination purpose startDate endDate' },
    ]);

    // Notify Finance of new reimbursement claim
    notifyRole(
      'finance',
      'reimbursement_submitted',
      'New Reimbursement Claim',
      `A new reimbursement claim of ₹${totalAmount.toFixed(2)} requires review.`,
      'reimbursement',
      reimbursement._id
    );

    res.status(201).json({
      success: true,
      reimbursement,
      approvedExpenses,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error creating reimbursement claim',
    });
  }
};

// @desc    Get reimbursements based on role
// @route   GET /api/reimbursements
// @access  Private
const getReimbursements = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    let reimbursements;

    if (role === 'employee') {
      // Employees see only their own claims
      reimbursements = await Reimbursement.find({ employeeId: userId })
        .populate('employeeId', 'firstName lastName email employeeId department')
        .populate('travelRequestId', 'destination purpose startDate endDate')
        .populate('processedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (role === 'finance' || role === 'admin') {
      // Finance and Admin see all claims
      reimbursements = await Reimbursement.find()
        .populate('employeeId', 'firstName lastName email employeeId department')
        .populate('travelRequestId', 'destination purpose startDate endDate')
        .populate('processedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else {
      // Managers cannot view reimbursements
      return res.status(403).json({
        message: 'You do not have permission to view reimbursements',
      });
    }

    res.status(200).json({
      success: true,
      reimbursements,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error fetching reimbursements',
    });
  }
};

// @desc    Get single reimbursement
// @route   GET /api/reimbursements/:id
// @access  Private
const getReimbursementById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, _id: userId } = req.user;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reimbursement ID' });
    }

    const reimbursement = await Reimbursement.findById(id)
      .populate('employeeId', 'firstName lastName email employeeId department')
      .populate('travelRequestId', 'destination purpose startDate endDate')
      .populate('processedBy', 'firstName lastName email');

    if (!reimbursement) {
      return res.status(404).json({
        message: 'Reimbursement claim not found',
      });
    }

    // Authorization check
    if (role === 'employee' && reimbursement.employeeId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You can only view your own reimbursement claims',
      });
    }

    if (role === 'manager') {
      return res.status(403).json({
        message: 'Managers do not have permission to view reimbursements',
      });
    }

    // Get approved expenses for this travel request
    const approvedExpenses = await Expense.find({
      travelRequestId: reimbursement.travelRequestId._id,
      employeeId: reimbursement.employeeId._id,
      status: 'approved',
    });

    res.status(200).json({
      success: true,
      reimbursement,
      approvedExpenses,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error fetching reimbursement',
    });
  }
};

// @desc    Get employee's own claims
// @route   GET /api/reimbursements/my-claims
// @access  Private (Employee only)
const getMyReimbursements = async (req, res) => {
  try {
    const reimbursements = await Reimbursement.find({ employeeId: req.user._id })
      .populate('employeeId', 'firstName lastName email employeeId department')
      .populate('travelRequestId', 'destination purpose startDate endDate')
      .populate('processedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reimbursements,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error fetching your reimbursements',
    });
  }
};

// @desc    Approve reimbursement claim
// @route   PUT /api/reimbursements/:id/approve
// @access  Private (Finance only)
const approveReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const { role, _id: financeId } = req.user;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reimbursement ID' });
    }

    // Finance-only check
    if (role !== 'finance') {
      return res.status(403).json({
        message: 'Only Finance users can approve reimbursement claims',
      });
    }

    const reimbursement = await Reimbursement.findById(id);

    if (!reimbursement) {
      return res.status(404).json({
        message: 'Reimbursement claim not found',
      });
    }

    // Validate status transition
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot approve claim with status '${reimbursement.status}'. Only pending claims can be approved.`,
      });
    }

    // Update reimbursement
    reimbursement.status = 'approved';
    reimbursement.processedBy = financeId;
    reimbursement.processedAt = new Date();
    reimbursement.comments = comments || '';

    await reimbursement.save();

    // Log reimbursement approval
    createAuditLog({
      actorId: req.user.id,
      action: 'reimbursement_approved',
      entityType: 'Reimbursement',
      entityId: reimbursement._id,
      description: 'Reimbursement approved by Finance',
      metadata: {
        totalAmount: reimbursement.totalAmount,
        employeeId: reimbursement.employeeId,
      },
      req,
    });

    // Notify employee of reimbursement approval
    notifyEmployee(
      reimbursement.employeeId,
      'reimbursement_approved',
      'Reimbursement Approved',
      `Your reimbursement claim of ₹${reimbursement.totalAmount.toFixed(2)} has been approved.`,
      'reimbursement',
      reimbursement._id
    );

    // Populate for response
    await reimbursement.populate([
      { path: 'employeeId', select: 'firstName lastName email employeeId department' },
      { path: 'travelRequestId', select: 'destination purpose startDate endDate' },
      { path: 'processedBy', select: 'firstName lastName email' },
    ]);

    res.status(200).json({
      success: true,
      reimbursement,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error approving reimbursement claim',
    });
  }
};

// @desc    Reject reimbursement claim
// @route   PUT /api/reimbursements/:id/reject
// @access  Private (Finance only)
const rejectReimbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const { role, _id: financeId } = req.user;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reimbursement ID' });
    }

    // Finance-only check
    if (role !== 'finance') {
      return res.status(403).json({
        message: 'Only Finance users can reject reimbursement claims',
      });
    }

    // Require rejection comment
    if (!comments || comments.trim() === '') {
      return res.status(400).json({
        message: 'Rejection comment is required',
      });
    }

    const reimbursement = await Reimbursement.findById(id);

    if (!reimbursement) {
      return res.status(404).json({
        message: 'Reimbursement claim not found',
      });
    }

    // Validate status transition
    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot reject claim with status '${reimbursement.status}'. Only pending claims can be rejected.`,
      });
    }

    // Update reimbursement
    reimbursement.status = 'rejected';
    reimbursement.processedBy = financeId;
    reimbursement.processedAt = new Date();
    reimbursement.comments = comments;

    await reimbursement.save();

    // Log reimbursement rejection
    createAuditLog({
      actorId: req.user.id,
      action: 'reimbursement_rejected',
      entityType: 'Reimbursement',
      entityId: reimbursement._id,
      description: 'Reimbursement rejected by Finance',
      metadata: {
        totalAmount: reimbursement.totalAmount,
        employeeId: reimbursement.employeeId,
      },
      req,
    });

    // Notify employee of reimbursement rejection
    notifyEmployee(
      reimbursement.employeeId,
      'reimbursement_rejected',
      'Reimbursement Rejected',
      `Your reimbursement claim of ₹${reimbursement.totalAmount.toFixed(2)} has been rejected. Reason: ${comments}`,
      'reimbursement',
      reimbursement._id
    );

    // Populate for response
    await reimbursement.populate([
      { path: 'employeeId', select: 'firstName lastName email employeeId department' },
      { path: 'travelRequestId', select: 'destination purpose startDate endDate' },
      { path: 'processedBy', select: 'firstName lastName email' },
    ]);

    res.status(200).json({
      success: true,
      reimbursement,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error rejecting reimbursement claim',
    });
  }
};

// @desc    Mark reimbursement as paid
// @route   PUT /api/reimbursements/:id/mark-paid
// @access  Private (Finance only)
const markReimbursementPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const { role, _id: financeId } = req.user;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid reimbursement ID' });
    }

    // Finance-only check
    if (role !== 'finance') {
      return res.status(403).json({
        message: 'Only Finance users can mark reimbursement claims as paid',
      });
    }

    const reimbursement = await Reimbursement.findById(id);

    if (!reimbursement) {
      return res.status(404).json({
        message: 'Reimbursement claim not found',
      });
    }

    // Validate status transition
    if (reimbursement.status !== 'approved') {
      return res.status(400).json({
        message: `Cannot mark claim with status '${reimbursement.status}' as paid. Only approved claims can be marked as paid.`,
      });
    }

    // Update reimbursement
    reimbursement.status = 'paid';
    reimbursement.processedBy = financeId;
    reimbursement.processedAt = new Date();
    // Preserve existing comments unless new comment provided
    if (comments && comments.trim() !== '') {
      reimbursement.comments = comments;
    }

    await reimbursement.save();

    // Log reimbursement payment
    createAuditLog({
      actorId: req.user.id,
      action: 'reimbursement_paid',
      entityType: 'Reimbursement',
      entityId: reimbursement._id,
      description: 'Reimbursement marked as paid by Finance',
      metadata: {
        totalAmount: reimbursement.totalAmount,
        employeeId: reimbursement.employeeId,
      },
      req,
    });

    // Notify employee that reimbursement has been paid
    notifyEmployee(
      reimbursement.employeeId,
      'reimbursement_paid',
      'Reimbursement Paid',
      `Your reimbursement claim of ₹${reimbursement.totalAmount.toFixed(2)} has been marked as paid.`,
      'reimbursement',
      reimbursement._id
    );

    // Populate for response
    await reimbursement.populate([
      { path: 'employeeId', select: 'firstName lastName email employeeId department' },
      { path: 'travelRequestId', select: 'destination purpose startDate endDate' },
      { path: 'processedBy', select: 'firstName lastName email' },
    ]);

    res.status(200).json({
      success: true,
      reimbursement,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error marking reimbursement as paid',
    });
  }
};

module.exports = {
  createReimbursement,
  getReimbursements,
  getReimbursementById,
  getMyReimbursements,
  approveReimbursement,
  rejectReimbursement,
  markReimbursementPaid,
};
