const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required'],
  },
  type: {
    type: String,
    enum: [
      'travel_request_submitted',
      'travel_request_approved',
      'travel_request_rejected',
      'expense_submitted',
      'expense_approved',
      'expense_rejected',
      'reimbursement_submitted',
      'reimbursement_approved',
      'reimbursement_rejected',
      'reimbursement_paid'
    ],
    required: [true, 'Notification type is required'],
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
  },
  relatedEntityType: {
    type: String,
    enum: ['travelRequest', 'expense', 'reimbursement'],
    required: false,
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
