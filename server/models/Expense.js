const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  travelRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TravelRequest',
    required: [true, 'Travel request ID is required'],
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required'],
  },
  category: {
    type: String,
    enum: ['transport', 'accommodation', 'food', 'miscellaneous'],
    required: [true, 'Please provide expense category'],
  },
  description: {
    type: String,
    required: [true, 'Please provide expense description'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide expense amount'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  date: {
    type: Date,
    required: [true, 'Please provide expense date'],
  },
  receiptUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  financeApproval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
expenseSchema.index({ employeeId: 1 });
expenseSchema.index({ travelRequestId: 1 });
expenseSchema.index({ status: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
