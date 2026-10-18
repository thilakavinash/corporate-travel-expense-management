const mongoose = require('mongoose');

const reimbursementSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    travelRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TravelRequest',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    comments: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active claims for the same employee + travel request
reimbursementSchema.index(
  { employeeId: 1, travelRequestId: 1, status: 1 },
  {
    partialFilterExpression: {
      status: { $in: ['pending', 'approved', 'paid'] },
    },
    unique: true,
  }
);

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
