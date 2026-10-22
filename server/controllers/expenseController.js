const Expense = require('../models/Expense');
const TravelRequest = require('../models/TravelRequest');
const User = require('../models/User');
const { notifyRole, notifyEmployee } = require('../services/notificationService');
const { createAuditLog } = require('../services/auditService');
const mongoose = require('mongoose');

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private (Employee only)
const createExpense = async (req, res) => {
  try {
    const {
      travelRequestId,
      category,
      description,
      amount,
      date,
    } = req.body;

    // Validation
    if (!travelRequestId || !category || !description || amount === undefined || amount === null || amount === '' || !date) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate category
    const validCategories = ['transport', 'accommodation', 'food', 'miscellaneous'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid expense category' });
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Get travel request to verify it's approved and belongs to employee
    const travelRequest = await TravelRequest.findById(travelRequestId);

    if (!travelRequest) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    // Verify travel request belongs to authenticated employee
    if (travelRequest.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only create expenses for your own travel requests' });
    }

    // Verify travel request is approved
    if (travelRequest.status !== 'approved') {
      return res.status(400).json({ message: 'You can only create expenses for approved travel requests' });
    }

    // Create expense
    const expense = await Expense.create({
      travelRequestId,
      employeeId: req.user.id,
      category,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      receiptUrl: req.file ? (req.file.path || req.file.secure_url) : '',
      status: 'pending',
    });

    // Log expense creation
    createAuditLog({
      actorId: req.user.id,
      action: 'expense_created',
      entityType: 'Expense',
      entityId: expense._id,
      description: `Expense created - ${category}`,
      metadata: {
        category,
        amount: parseFloat(amount),
        travelRequestId,
      },
      req,
    });

    // Populate for response
    const populatedExpense = await Expense.findById(expense._id)
      .populate('travelRequestId', 'destination purpose startDate endDate')
      .populate('employeeId', 'firstName lastName email employeeId');

    // Notify Finance of new expense
    notifyRole(
      'finance',
      'expense_submitted',
      'New Expense Submitted',
      `A new ${category} expense of ₹${parseFloat(amount).toFixed(2)} requires review.`,
      'expense',
      expense._id
    );

    res.status(201).json({
      success: true,
      expense: populatedExpense,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error during expense creation' });
  }
};

// @desc    Get expenses (filtered by role)
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { status } = req.query;
    const user = await User.findById(req.user.id);

    let filter = {};

    if (user.role === 'employee') {
      // Employees see only their own expenses
      filter.employeeId = req.user.id;
    } else if (user.role === 'finance' || user.role === 'admin') {
      // Finance and Admin see all expenses
      // No filter needed
    } else {
      // Managers cannot view expenses
      return res.status(403).json({ message: 'Not authorized to view expenses' });
    }

    if (status) {
      filter.status = status;
    }

    const expenses = await Expense.find(filter)
      .populate('travelRequestId', 'destination purpose startDate endDate status')
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('financeApproval.approvedBy', 'firstName lastName email employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    const expense = await Expense.findById(req.params.id)
      .populate('travelRequestId', 'destination purpose startDate endDate status')
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('financeApproval.approvedBy', 'firstName lastName email employeeId');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const user = await User.findById(req.user.id);

    // Access control
    if (user.role === 'employee' && expense.employeeId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this expense' });
    }

    if (user.role === 'manager') {
      return res.status(403).json({ message: 'Not authorized to view expenses' });
    }

    res.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error fetching expense' });
  }
};

// @desc    Approve expense
// @route   PUT /api/expenses/:id/approve
// @access  Private (Finance only)
const approveExpense = async (req, res) => {
  try {
    const { comments } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    // Verify user is finance
    if (req.user.role !== 'finance') {
      return res.status(403).json({ message: 'Only Finance users can approve expenses' });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if expense is already finalized
    if (expense.status !== 'pending') {
      return res.status(400).json({ message: 'Expense has already been processed' });
    }

    // Update approval
    expense.status = 'approved';
    expense.financeApproval.approvedBy = req.user.id;
    expense.financeApproval.approvedAt = new Date();
    expense.financeApproval.comments = comments || '';

    await expense.save();

    // Log expense approval
    createAuditLog({
      actorId: req.user.id,
      action: 'expense_approved',
      entityType: 'Expense',
      entityId: expense._id,
      description: 'Expense approved by Finance',
      metadata: {
        category: expense.category,
        amount: expense.amount,
        employeeId: expense.employeeId,
      },
      req,
    });

    // Notify employee of expense approval
    notifyEmployee(
      expense.employeeId,
      'expense_approved',
      'Expense Approved',
      `Your ${expense.category} expense of ₹${expense.amount.toFixed(2)} has been approved.`,
      'expense',
      expense._id
    );

    // Populate for response
    const populatedExpense = await Expense.findById(expense._id)
      .populate('travelRequestId', 'destination purpose startDate endDate status')
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('financeApproval.approvedBy', 'firstName lastName email employeeId');

    res.json({
      success: true,
      expense: populatedExpense,
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ message: 'Server error during approval' });
  }
};

// @desc    Reject expense
// @route   PUT /api/expenses/:id/reject
// @access  Private (Finance only)
const rejectExpense = async (req, res) => {
  try {
    const { comments } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    // Verify user is finance
    if (req.user.role !== 'finance') {
      return res.status(403).json({ message: 'Only Finance users can reject expenses' });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if expense is already finalized
    if (expense.status !== 'pending') {
      return res.status(400).json({ message: 'Expense has already been processed' });
    }

    // Update rejection
    expense.status = 'rejected';
    expense.financeApproval.approvedBy = req.user.id;
    expense.financeApproval.approvedAt = new Date();
    expense.financeApproval.comments = comments || '';

    await expense.save();

    // Log expense rejection
    createAuditLog({
      actorId: req.user.id,
      action: 'expense_rejected',
      entityType: 'Expense',
      entityId: expense._id,
      description: 'Expense rejected by Finance',
      metadata: {
        category: expense.category,
        amount: expense.amount,
        employeeId: expense.employeeId,
      },
      req,
    });

    // Notify employee of expense rejection
    notifyEmployee(
      expense.employeeId,
      'expense_rejected',
      'Expense Rejected',
      `Your ${expense.category} expense of ₹${expense.amount.toFixed(2)} has been rejected. ${comments ? `Reason: ${comments}` : ''}`,
      'expense',
      expense._id
    );

    // Populate for response
    const populatedExpense = await Expense.findById(expense._id)
      .populate('travelRequestId', 'destination purpose startDate endDate status')
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('financeApproval.approvedBy', 'firstName lastName email employeeId');

    res.json({
      success: true,
      expense: populatedExpense,
    });
  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({ message: 'Server error during rejection' });
  }
};

// @desc    Get expenses for a travel request
// @route   GET /api/expenses/travel/:travelId
// @access  Private
const getExpensesByTravelRequest = async (req, res) => {
  try {
    const { travelId } = req.params;
    const user = await User.findById(req.user.id);

    // Verify travel request exists and belongs to user
    const travelRequest = await TravelRequest.findById(travelId);

    if (!travelRequest) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    // Access control
    if (user.role === 'employee' && travelRequest.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view these expenses' });
    }

    if (user.role === 'manager') {
      return res.status(403).json({ message: 'Not authorized to view expenses' });
    }

    const expenses = await Expense.find({ travelRequestId: travelId })
      .populate('travelRequestId', 'destination purpose startDate endDate status')
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('financeApproval.approvedBy', 'firstName lastName email employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error('Get expenses by travel request error:', error);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  approveExpense,
  rejectExpense,
  getExpensesByTravelRequest,
};
