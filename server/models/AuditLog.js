const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication
      'login_success',
      'login_failed',
      'logout',
      // Travel
      'travel_created',
      'travel_approved',
      'travel_rejected',
      'travel_cancelled',
      // Expense
      'expense_created',
      'expense_approved',
      'expense_rejected',
      // Reimbursement
      'reimbursement_created',
      'reimbursement_approved',
      'reimbursement_rejected',
      'reimbursement_paid',
      // User Management
      'user_created',
      'user_updated',
      'user_activated',
      'user_deactivated',
      'manager_assigned',
      // Reports
      'report_generated',
      'report_exported',
    ],
  },
  entityType: {
    type: String,
    required: true,
    enum: ['User', 'TravelRequest', 'Expense', 'Reimbursement', 'Report'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  description: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for common queries
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
