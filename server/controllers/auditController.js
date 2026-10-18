const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin only)
const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, actorId, startDate, endDate, page = 1, limit = 25 } = req.query;

    // Only Admin can access audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only Admin can view audit logs' });
    }

    // Build filter
    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (actorId) filter.actorId = actorId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'firstName lastName email employeeId role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error fetching audit logs' });
  }
};

// @desc    Get single audit log
// @route   GET /api/audit-logs/:id
// @access  Private (Admin only)
const getAuditLogById = async (req, res) => {
  try {
    // Only Admin can access audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only Admin can view audit logs' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid audit log ID' });
    }

    const auditLog = await AuditLog.findById(req.params.id)
      .populate('actorId', 'firstName lastName email employeeId role');

    if (!auditLog) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json({
      success: true,
      auditLog,
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ message: 'Server error fetching audit log' });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
