const express = require('express');
const router = express.Router();
const {
  getOverview,
  getMonthlySpending,
  getDepartmentSpending,
  getExpenseCategories,
  getTravelTypes
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Overview - all authenticated users (data filtered by role)
router.get('/overview', getOverview);

// Organization-wide analytics - Finance and Admin only
router.get('/monthly-spending', (req, res, next) => {
  if (req.user.role !== 'finance' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Finance and Admin users can view monthly spending analytics' });
  }
  next();
}, getMonthlySpending);

router.get('/department-spending', (req, res, next) => {
  if (req.user.role !== 'finance' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Finance and Admin users can view department spending analytics' });
  }
  next();
}, getDepartmentSpending);

router.get('/expense-categories', (req, res, next) => {
  if (req.user.role !== 'finance' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Finance and Admin users can view expense category analytics' });
  }
  next();
}, getExpenseCategories);

router.get('/travel-types', (req, res, next) => {
  if (req.user.role !== 'finance' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Finance and Admin users can view travel type analytics' });
  }
  next();
}, getTravelTypes);

module.exports = router;
