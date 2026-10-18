const express = require('express');
const router = express.Router();
const {
  createReimbursement,
  getReimbursements,
  getReimbursementById,
  getMyReimbursements,
  approveReimbursement,
  rejectReimbursement,
  markReimbursementPaid,
} = require('../controllers/reimbursementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, authorizeWorkflow } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// My claims endpoint (employee only)
router.get('/my-claims', authorizeWorkflow('employee'), getMyReimbursements);

// Reimbursement CRUD routes
router
  .route('/')
  .post(authorizeWorkflow('employee'), createReimbursement)
  .get(getReimbursements);

// Specific reimbursement routes
router.get('/:id', getReimbursementById);

// Finance actions
router.put('/:id/approve', authorizeWorkflow('finance'), approveReimbursement);
router.put('/:id/reject', authorizeWorkflow('finance'), rejectReimbursement);
router.put('/:id/mark-paid', authorizeWorkflow('finance'), markReimbursementPaid);

module.exports = router;
