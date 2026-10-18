const express = require('express');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  approveExpense,
  rejectExpense,
  getExpensesByTravelRequest,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, authorizeWorkflow } = require('../middleware/roleMiddleware');
const { uploadReceipt } = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Specific routes must come before parameterized routes
router.get('/travel/:travelId', getExpensesByTravelRequest);
router.put('/:id/approve', authorizeWorkflow('finance'), approveExpense);
router.put('/:id/reject', authorizeWorkflow('finance'), rejectExpense);

// Parameterized routes
router.route('/')
  .post(authorizeWorkflow('employee'), uploadReceipt, createExpense)
  .get(getExpenses);

router.route('/:id')
  .get(getExpenseById);

module.exports = router;
