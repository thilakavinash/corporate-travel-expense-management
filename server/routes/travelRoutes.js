const express = require('express');
const {
  createTravelRequest,
  getTravelRequests,
  getTravelRequestById,
  managerApproveRequest,
  cancelTravelRequest,
} = require('../controllers/travelController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, authorizeWorkflow } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Specific routes must come before parameterized routes
router.put('/:id/manager-approve', authorizeWorkflow('manager'), managerApproveRequest);
router.put('/:id/cancel', authorizeWorkflow('employee'), cancelTravelRequest);

// Parameterized routes
router.route('/')
  .post(authorizeWorkflow('employee'), createTravelRequest)
  .get(getTravelRequests);

router.route('/:id')
  .get(getTravelRequestById);

module.exports = router;
