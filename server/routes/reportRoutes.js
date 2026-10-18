const express = require('express');
const router = express.Router();
const {
  getTravelReport,
  getExpenseReport,
  getReimbursementReport,
  getDepartmentReport,
  getEmployeeReport,
  exportCSV,
  exportPDF,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// Travel report - Employee (own), Finance/Admin (organization)
router.get('/travel', getTravelReport);

// Expense report - Employee (own), Finance/Admin (organization)
router.get('/expenses', getExpenseReport);

// Reimbursement report - Employee (own), Finance/Admin (organization)
router.get('/reimbursements', getReimbursementReport);

// Department report - Finance/Admin only
router.get('/departments', authorize('finance', 'admin'), getDepartmentReport);

// Employee spending report - Employee (own), Finance/Admin (organization)
router.get('/employees', getEmployeeReport);

// Export routes
router.get('/:type/csv', exportCSV);
router.get('/:type/pdf', exportPDF);

module.exports = router;
