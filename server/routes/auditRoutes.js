const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLogById,
} = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// All routes require Admin role
router.use(authorize('admin'));

// Get all audit logs with filtering and pagination
router.get('/', getAuditLogs);

// Get single audit log
router.get('/:id', getAuditLogById);

module.exports = router;
