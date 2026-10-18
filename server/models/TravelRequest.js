const mongoose = require('mongoose');

const travelRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required'],
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Manager ID is required'],
  },
  travelType: {
    type: String,
    enum: ['domestic', 'international'],
    required: [true, 'Please specify travel type'],
  },
  purpose: {
    type: String,
    required: [true, 'Please provide travel purpose'],
    trim: true,
  },
  destination: {
    type: String,
    required: [true, 'Please provide destination'],
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date'],
  },
  estimatedBudget: {
    type: Number,
    required: [true, 'Please provide estimated budget'],
    min: [0.01, 'Budget must be greater than zero'],
  },
  additionalNotes: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  managerApproval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
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
travelRequestSchema.index({ employeeId: 1 });
travelRequestSchema.index({ managerId: 1 });
travelRequestSchema.index({ status: 1 });

module.exports = mongoose.model('TravelRequest', travelRequestSchema);
