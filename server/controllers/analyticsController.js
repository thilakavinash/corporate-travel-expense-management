const TravelRequest = require('../models/TravelRequest');
const Expense = require('../models/Expense');
const Reimbursement = require('../models/Reimbursement');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private
const getOverview = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    
    // Convert userId to ObjectId for proper MongoDB comparison
    let userObjectId = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userObjectId = new mongoose.Types.ObjectId(userId);
    }

    // Build match filter based on role
    const employeeFilter = role === 'employee' ? { employeeId: userObjectId } : {};

    // Travel requests analytics
    const travelStats = await TravelRequest.aggregate([
      { $match: employeeFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const travelRequestStats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    };

    travelStats.forEach(stat => {
      travelRequestStats.total += stat.count;
      if (stat._id === 'pending') travelRequestStats.pending = stat.count;
      if (stat._id === 'approved') travelRequestStats.approved = stat.count;
      if (stat._id === 'rejected') travelRequestStats.rejected = stat.count;
      if (stat._id === 'cancelled') travelRequestStats.cancelled = stat.count;
    });

    // Expenses analytics
    const expenseStats = await Expense.aggregate([
      { $match: employeeFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const expenseStatsResult = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalApprovedAmount: 0
    };

    expenseStats.forEach(stat => {
      expenseStatsResult.total += stat.count;
      if (stat._id === 'pending') expenseStatsResult.pending = stat.count;
      if (stat._id === 'approved') {
        expenseStatsResult.approved = stat.count;
        expenseStatsResult.totalApprovedAmount = stat.totalAmount || 0;
      }
      if (stat._id === 'rejected') expenseStatsResult.rejected = stat.count;
    });

    // Reimbursement analytics
    const reimbursementStats = await Reimbursement.aggregate([
      { $match: employeeFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const reimbursementStatsResult = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
      totalReimbursedAmount: 0
    };

    reimbursementStats.forEach(stat => {
      reimbursementStatsResult.total += stat.count;
      if (stat._id === 'pending') reimbursementStatsResult.pending = stat.count;
      if (stat._id === 'approved') reimbursementStatsResult.approved = stat.count;
      if (stat._id === 'rejected') reimbursementStatsResult.rejected = stat.count;
      if (stat._id === 'paid') {
        reimbursementStatsResult.paid = stat.count;
        reimbursementStatsResult.totalReimbursedAmount = stat.totalAmount || 0;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        travelRequests: travelRequestStats,
        expenses: expenseStatsResult,
        reimbursements: reimbursementStatsResult
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching analytics overview'
    });
  }
};

// @desc    Get monthly spending analytics
// @route   GET /api/analytics/monthly-spending
// @access  Private (Finance/Admin only)
const getMonthlySpending = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'finance' && role !== 'admin') {
      return res.status(403).json({
        message: 'Only Finance and Admin users can view monthly spending analytics'
      });
    }

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const monthlyData = await Expense.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          total: { $sum: '$amount' },
          approved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const result = monthlyData.map(item => ({
      month: monthNames[item._id.month - 1] || `Month ${item._id.month}`,
      total: item.total || 0,
      approved: item.approved || 0,
      pending: item.pending || 0,
      rejected: item.rejected || 0
    }));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Monthly spending error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching monthly spending analytics'
    });
  }
};

// @desc    Get department spending analytics
// @route   GET /api/analytics/department-spending
// @access  Private (Finance/Admin only)
const getDepartmentSpending = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'finance' && role !== 'admin') {
      return res.status(403).json({
        message: 'Only Finance and Admin users can view department spending analytics'
      });
    }

    const departmentData = await Expense.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $group: {
          _id: '$employee.department',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    const result = departmentData.map(item => ({
      department: item._id || 'Unknown',
      total: item.total || 0
    }));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Department spending error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching department spending analytics'
    });
  }
};

// @desc    Get expense category analytics
// @route   GET /api/analytics/expense-categories
// @access  Private (Finance/Admin only)
const getExpenseCategories = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'finance' && role !== 'admin') {
      return res.status(403).json({
        message: 'Only Finance and Admin users can view expense category analytics'
      });
    }

    const categoryData = await Expense.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    const result = categoryData.map(item => ({
      category: item._id || 'Unknown',
      total: item.total || 0
    }));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Expense categories error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching expense category analytics'
    });
  }
};

// @desc    Get travel type analytics
// @route   GET /api/analytics/travel-types
// @access  Private (Finance/Admin only)
const getTravelTypes = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'finance' && role !== 'admin') {
      return res.status(403).json({
        message: 'Only Finance and Admin users can view travel type analytics'
      });
    }

    const travelData = await TravelRequest.aggregate([
      {
        $group: {
          _id: '$travelType',
          count: { $sum: 1 }
        }
      }
    ]);

    const domestic = travelData.find(item => item._id === 'domestic')?.count || 0;
    const international = travelData.find(item => item._id === 'international')?.count || 0;

    const statusData = await TravelRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const approved = statusData.find(item => item._id === 'approved')?.count || 0;
    const rejected = statusData.find(item => item._id === 'rejected')?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        domestic,
        international,
        approved,
        rejected
      }
    });
  } catch (error) {
    console.error('Travel types error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching travel type analytics'
    });
  }
};

module.exports = {
  getOverview,
  getMonthlySpending,
  getDepartmentSpending,
  getExpenseCategories,
  getTravelTypes
};
