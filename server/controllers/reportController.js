const TravelRequest = require('../models/TravelRequest');
const Expense = require('../models/Expense');
const Reimbursement = require('../models/Reimbursement');
const User = require('../models/User');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const { createAuditLog } = require('../services/auditService');

// Helper to build employee filter based on role
const buildEmployeeFilter = (user, employeeIdParam) => {
  const { role, _id: userId } = user;
  
  // Employees can only see their own data
  if (role === 'employee') {
    return { employeeId: userId };
  }
  
  // Finance/Admin can filter by employee if provided
  if ((role === 'finance' || role === 'admin') && employeeIdParam) {
    if (mongoose.Types.ObjectId.isValid(employeeIdParam)) {
      return { employeeId: new mongoose.Types.ObjectId(employeeIdParam) };
    }
  }
  
  // Finance/Admin without employee filter - organization-wide
  return {};
};

// Helper to build date filter
const buildDateFilter = (startDate, endDate, dateField) => {
  const filter = {};
  if (startDate) {
    filter[dateField] = { $gte: new Date(startDate) };
  }
  if (endDate) {
    if (filter[dateField]) {
      filter[dateField].$lte = new Date(endDate);
    } else {
      filter[dateField] = { $lte: new Date(endDate) };
    }
  }
  return filter;
};

// @desc    Get travel request report
// @route   GET /api/reports/travel
// @access  Private (Employee own data, Finance/Admin organization)
const getTravelReport = async (req, res) => {
  try {
    const { role } = req.user;
    const { employeeId, department, travelType, status, startDate, endDate } = req.query;

    // Manager cannot access reports
    if (role === 'manager') {
      return res.status(403).json({ message: 'Manager cannot access reports' });
    }

    // Build filters
    const employeeFilter = buildEmployeeFilter(req.user, employeeId);
    const dateFilter = buildDateFilter(startDate, endDate, 'startDate');
    
    const matchFilter = {
      ...employeeFilter,
      ...dateFilter,
    };

    if (travelType) matchFilter.travelType = travelType;
    if (status) matchFilter.status = status;

    const travelRequests = await TravelRequest.find(matchFilter)
      .populate('employeeId', 'firstName lastName employeeId department')
      .populate('managerId', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    // Filter by department after population
    let filteredRequests = travelRequests;
    if (department) {
      console.log('Filtering by department:', department);
      console.log('Before filter:', travelRequests.length);
      filteredRequests = travelRequests.filter(tr => {
        const dept = tr.employeeId?.department;
        const match = dept && dept.toLowerCase() === department.toLowerCase();
        console.log(`Record dept: ${dept}, Target: ${department}, Match: ${match}`);
        return match;
      });
      console.log('After filter:', filteredRequests.length);
    }

    const reportData = filteredRequests.map(tr => ({
      travelRequestId: tr._id,
      employeeName: `${tr.employeeId?.firstName} ${tr.employeeId?.lastName}`,
      employeeId: tr.employeeId?.employeeId,
      department: tr.employeeId?.department,
      manager: tr.managerId ? `${tr.managerId.firstName} ${tr.managerId.lastName}` : 'N/A',
      travelType: tr.travelType,
      purpose: tr.purpose,
      destination: tr.destination,
      startDate: tr.startDate,
      endDate: tr.endDate,
      estimatedBudget: tr.estimatedBudget,
      status: tr.status,
      managerApprovalStatus: tr.managerApproval?.status || 'N/A',
      createdDate: tr.createdAt,
    }));

    // Summary stats
    const summary = {
      total: reportData.length,
      pending: reportData.filter(r => r.status === 'pending').length,
      approved: reportData.filter(r => r.status === 'approved').length,
      rejected: reportData.filter(r => r.status === 'rejected').length,
      cancelled: reportData.filter(r => r.status === 'cancelled').length,
      totalEstimatedBudget: reportData.reduce((sum, r) => sum + (r.estimatedBudget || 0), 0),
    };

    // Log report generation
    createAuditLog({
      actorId: req.user.id,
      action: 'report_generated',
      entityType: 'Report',
      entityId: null,
      description: 'Travel report generated',
      metadata: {
        reportType: 'travel',
        recordCount: reportData.length,
        filters: { department, travelType, status, startDate, endDate },
      },
      req,
    });

    res.status(200).json({
      success: true,
      data: reportData,
      summary,
    });
  } catch (error) {
    console.error('Travel report error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching travel report'
    });
  }
};

// @desc    Get expense report
// @route   GET /api/reports/expenses
// @access  Private (Employee own data, Finance/Admin organization)
const getExpenseReport = async (req, res) => {
  try {
    const { role } = req.user;
    const { employeeId, department, category, status, startDate, endDate } = req.query;

    // Manager cannot access reports
    if (role === 'manager') {
      return res.status(403).json({ message: 'Manager cannot access reports' });
    }

    // Build filters
    const employeeFilter = buildEmployeeFilter(req.user, employeeId);
    const dateFilter = buildDateFilter(startDate, endDate, 'date');
    
    const matchFilter = {
      ...employeeFilter,
      ...dateFilter,
    };

    if (category) matchFilter.category = category;
    if (status) matchFilter.status = status;

    const expenses = await Expense.find(matchFilter)
      .populate('employeeId', 'firstName lastName employeeId department')
      .populate('travelRequestId', 'purpose destination')
      .populate('financeApproval.approvedBy', 'firstName lastName')
      .sort({ date: -1 });

    // Filter by department after population
    let filteredExpenses = expenses;
    if (department) {
      filteredExpenses = expenses.filter(exp => exp.employeeId?.department === department);
    }

    const reportData = filteredExpenses.map(exp => ({
      expenseId: exp._id,
      travelRequestId: exp.travelRequestId?._id,
      employeeName: `${exp.employeeId?.firstName} ${exp.employeeId?.lastName}`,
      employeeId: exp.employeeId?.employeeId,
      department: exp.employeeId?.department,
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
      status: exp.status,
      financeApprover: exp.financeApproval?.approvedBy 
        ? `${exp.financeApproval.approvedBy.firstName} ${exp.financeApproval.approvedBy.lastName}`
        : 'N/A',
      approvalDate: exp.financeApproval?.approvedAt,
    }));

    // Summary stats
    const summary = {
      total: reportData.length,
      pending: reportData.filter(r => r.status === 'pending').length,
      approved: reportData.filter(r => r.status === 'approved').length,
      rejected: reportData.filter(r => r.status === 'rejected').length,
      totalApprovedAmount: reportData
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.amount || 0), 0),
    };

    // Log report generation
    createAuditLog({
      actorId: req.user.id,
      action: 'report_generated',
      entityType: 'Report',
      entityId: null,
      description: 'Expense report generated',
      metadata: {
        reportType: 'expenses',
        recordCount: reportData.length,
        filters: { department, category, status, startDate, endDate },
      },
      req,
    });

    res.status(200).json({
      success: true,
      data: reportData,
      summary,
    });
  } catch (error) {
    console.error('Expense report error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching expense report'
    });
  }
};

// @desc    Get reimbursement report
// @route   GET /api/reports/reimbursements
// @access  Private (Employee own data, Finance/Admin organization)
const getReimbursementReport = async (req, res) => {
  try {
    const { role } = req.user;
    const { employeeId, department, status, startDate, endDate } = req.query;

    // Manager cannot access reports
    if (role === 'manager') {
      return res.status(403).json({ message: 'Manager cannot access reports' });
    }

    // Build filters
    const employeeFilter = buildEmployeeFilter(req.user, employeeId);
    const dateFilter = buildDateFilter(startDate, endDate, 'createdAt');
    
    const matchFilter = {
      ...employeeFilter,
      ...dateFilter,
    };

    if (department) matchFilter.department = department;
    if (status) matchFilter.status = status;

    const reimbursements = await Reimbursement.find(matchFilter)
      .populate('employeeId', 'firstName lastName employeeId department')
      .populate('travelRequestId', 'purpose destination')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Filter by department after population
    let filteredReimbursements = reimbursements;
    if (department) {
      filteredReimbursements = reimbursements.filter(rm => {
        const dept = rm.employeeId?.department;
        return dept && dept.toLowerCase() === department.toLowerCase();
      });
    }

    const reportData = filteredReimbursements.map(rm => ({
      reimbursementId: rm._id,
      travelRequestId: rm.travelRequestId?._id,
      employeeName: `${rm.employeeId?.firstName} ${rm.employeeId?.lastName}`,
      employeeId: rm.employeeId?.employeeId,
      department: rm.employeeId?.department,
      totalAmount: rm.totalAmount,
      status: rm.status,
      processedBy: rm.processedBy ? `${rm.processedBy.firstName} ${rm.processedBy.lastName}` : 'N/A',
      processedDate: rm.processedAt,
      createdDate: rm.createdAt,
    }));

    // Summary stats
    const summary = {
      total: reportData.length,
      pending: reportData.filter(r => r.status === 'pending').length,
      approved: reportData.filter(r => r.status === 'approved').length,
      rejected: reportData.filter(r => r.status === 'rejected').length,
      paid: reportData.filter(r => r.status === 'paid').length,
      totalReimbursedAmount: reportData
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + (r.totalAmount || 0), 0),
    };

    // Log report generation
    createAuditLog({
      actorId: req.user.id,
      action: 'report_generated',
      entityType: 'Report',
      entityId: null,
      description: 'Reimbursement report generated',
      metadata: {
        reportType: 'reimbursements',
        recordCount: reportData.length,
        filters: { department, status, startDate, endDate },
      },
      req,
    });

    res.status(200).json({
      success: true,
      data: reportData,
      summary,
    });
  } catch (error) {
    console.error('Reimbursement report error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching reimbursement report'
    });
  }
};

// @desc    Get department spending report
// @route   GET /api/reports/departments
// @access  Private (Finance/Admin only)
const getDepartmentReport = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'finance' && role !== 'admin') {
      return res.status(403).json({ message: 'Only Finance and Admin can view department reports' });
    }

    const departmentData = await Expense.aggregate([
      { $match: { status: 'approved' } },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employee.department',
          totalApprovedExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
          uniqueEmployees: { $addToSet: '$employeeId' }
        }
      },
      {
        $project: {
          department: '$_id',
          totalApprovedExpenses: 1,
          expenseCount: 1,
          employeeCount: { $size: '$uniqueEmployees' },
          averageExpense: { $divide: ['$totalApprovedExpenses', '$expenseCount'] }
        }
      },
      { $sort: { totalApprovedExpenses: -1 } }
    ]);

    // Get reimbursed amounts by department
    const reimbursementData = await Reimbursement.aggregate([
      { $match: { status: 'paid' } },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employee.department',
          totalReimbursed: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Merge data
    const reportData = departmentData.map(dept => {
      const reimbursement = reimbursementData.find(r => r._id === dept.department);
      return {
        department: dept.department || 'Unknown',
        totalApprovedExpenses: dept.totalApprovedExpenses || 0,
        numberOfExpenses: dept.expenseCount || 0,
        numberOfEmployees: dept.employeeCount || 0,
        averageExpense: dept.averageExpense || 0,
        totalReimbursedAmount: reimbursement?.totalReimbursed || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Department report error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching department report'
    });
  }
};

// @desc    Get employee spending report
// @route   GET /api/reports/employees
// @access  Private (Employee own data, Finance/Admin organization)
const getEmployeeReport = async (req, res) => {
  try {
    const { role } = req.user;
    const { department } = req.query;

    // Manager cannot access reports
    if (role === 'manager') {
      return res.status(403).json({ message: 'Manager cannot access reports' });
    }

    let matchFilter = {};
    
    // Employee can only see their own data
    if (role === 'employee') {
      matchFilter.employeeId = req.user._id;
    }
    
    // Finance/Admin can filter by department
    if ((role === 'finance' || role === 'admin') && department) {
      matchFilter.department = department;
    }

    const expenseData = await Expense.aggregate([
      { $match: { ...matchFilter, status: 'approved' } },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employeeId',
          name: { $first: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] } },
          employeeId: { $first: '$employee.employeeId' },
          department: { $first: '$employee.department' },
          totalApprovedExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      }
    ]);

    const reimbursementData = await Reimbursement.aggregate([
      { $match: { ...matchFilter, status: 'paid' } },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employeeId',
          totalReimbursed: { $sum: '$totalAmount' },
          reimbursementCount: { $sum: 1 }
        }
      }
    ]);

    // Merge data
    const reportData = expenseData.map(emp => {
      const reimbursement = reimbursementData.find(r => r._id === emp._id);
      return {
        employee: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        totalApprovedExpenses: emp.totalApprovedExpenses || 0,
        totalReimbursed: reimbursement?.totalReimbursed || 0,
        expenseCount: emp.expenseCount || 0,
        reimbursementCount: reimbursement?.reimbursementCount || 0,
      };
    });

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Employee report error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching employee report'
    });
  }
};

// Helper to generate CSV
const generateCSV = (data, filename) => {
  try {
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);
    return csv;
  } catch (error) {
    console.error('CSV generation error:', error);
    throw new Error('Failed to generate CSV');
  }
};

// Helper to generate PDF
const generatePDF = (data, reportType, summary, filters) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Corporate Travel & Expense Management', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).font('Helvetica').text(`${reportType} Report`, { align: 'center' });
      doc.moveDown();

      // Generated date
      doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' });
      doc.moveDown();

      // Filters
      if (Object.keys(filters).length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Filters:');
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            doc.fontSize(10).font('Helvetica').text(`${key}: ${value}`);
          }
        });
        doc.moveDown();
      }

      // Summary
      if (summary) {
        doc.fontSize(12).font('Helvetica-Bold').text('Summary:');
        Object.entries(summary).forEach(([key, value]) => {
          if (typeof value === 'number') {
            doc.fontSize(10).font('Helvetica').text(`${key}: ₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          } else {
            doc.fontSize(10).font('Helvetica').text(`${key}: ${value}`);
          }
        });
        doc.moveDown();
      }

      // Table
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const tableTop = doc.y;
        const rowHeight = 25;
        const colWidths = headers.map(() => (doc.page.width - 100) / headers.length);

        // Headers
        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, 50 + (i * colWidths[i]), tableTop, { width: colWidths[i] - 10 });
        });

        // Rows
        doc.fontSize(9).font('Helvetica');
        data.forEach((row, rowIndex) => {
          const y = tableTop + rowHeight + (rowIndex * rowHeight);
          if (y > doc.page.height - 50) {
            doc.addPage();
          }
          headers.forEach((header, colIndex) => {
            let value = row[header];
            if (typeof value === 'number' && (header.toLowerCase().includes('amount') || header.toLowerCase().includes('budget'))) {
              value = `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            if (value instanceof Date) {
              value = value.toLocaleDateString('en-GB');
            }
            doc.text(String(value || ''), 50 + (colIndex * colWidths[colIndex]), tableTop + rowHeight + (rowIndex * rowHeight), { width: colWidths[colIndex] - 10 });
          });
        });
      } else {
        doc.fontSize(12).font('Helvetica').text('No data found for the selected filters.');
      }

      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
};

// @desc    Export report as CSV
// @route   GET /api/reports/:type/csv
// @access  Private
const exportCSV = async (req, res) => {
  try {
    const { type } = req.params;
    const { role } = req.user;

    // Manager cannot access reports
    if (role === 'manager') {
      return res.status(403).json({ message: 'Manager cannot access reports' });
    }

    let data;
    let filename;

    switch (type) {
      case 'travel':
        const travelResult = await getTravelReportInternal(req);
        data = travelResult.data;
        filename = `travel-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'expenses':
        const expenseResult = await getExpenseReportInternal(req);
        data = expenseResult.data;
        filename = `expense-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'reimbursements':
        const reimbursementResult = await getReimbursementReportInternal(req);
        data = reimbursementResult.data;
        filename = `reimbursement-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'departments':
        if (role !== 'finance' && role !== 'admin') {
          return res.status(403).json({ message: 'Only Finance and Admin can view department reports' });
        }
        const departmentResult = await getDepartmentReportInternal(req);
        data = departmentResult.data;
        filename = `department-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'employees':
        const employeeResult = await getEmployeeReportInternal(req);
        data = employeeResult.data;
        filename = `employee-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const csv = generateCSV(data, filename);

    // Log export
    createAuditLog({
      actorId: req.user.id,
      action: 'report_exported',
      entityType: 'Report',
      entityId: null,
      description: `${type} report exported as CSV`,
      metadata: {
        reportType: type,
        format: 'csv',
        recordCount: data.length,
        filters: { ...req.query },
      },
      req,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || 'Error exporting CSV'
      });
    }
  }
};

// @desc    Export report as PDF
// @route   GET /api/reports/:type/pdf
// @access  Private
const exportPDF = async (req, res) => {
  try {
    const { type } = req.params;
    const { role } = req.user;

    // Manager cannot access reports
    if (role === 'manager') {
      return res.status(403).json({ message: 'Manager cannot access reports' });
    }

    let data;
    let summary;
    let filename;
    let reportTitle;

    switch (type) {
      case 'travel':
        const travelResult = await getTravelReportInternal(req);
        data = travelResult.data;
        summary = travelResult.summary;
        filename = `travel-report-${new Date().toISOString().split('T')[0]}.pdf`;
        reportTitle = 'Travel Request';
        break;
      case 'expenses':
        const expenseResult = await getExpenseReportInternal(req);
        data = expenseResult.data;
        summary = expenseResult.summary;
        filename = `expense-report-${new Date().toISOString().split('T')[0]}.pdf`;
        reportTitle = 'Expense';
        break;
      case 'reimbursements':
        const reimbursementResult = await getReimbursementReportInternal(req);
        data = reimbursementResult.data;
        summary = reimbursementResult.summary;
        filename = `reimbursement-report-${new Date().toISOString().split('T')[0]}.pdf`;
        reportTitle = 'Reimbursement';
        break;
      case 'departments':
        if (role !== 'finance' && role !== 'admin') {
          return res.status(403).json({ message: 'Only Finance and Admin can view department reports' });
        }
        const departmentResult = await getDepartmentReportInternal(req);
        data = departmentResult.data;
        filename = `department-report-${new Date().toISOString().split('T')[0]}.pdf`;
        reportTitle = 'Department Spending';
        break;
      case 'employees':
        const employeeResult = await getEmployeeReportInternal(req);
        data = employeeResult.data;
        filename = `employee-report-${new Date().toISOString().split('T')[0]}.pdf`;
        reportTitle = 'Employee Spending';
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const filters = { ...req.query };
    const pdfBuffer = await generatePDF(data, reportTitle, summary, filters);

    // Log export
    createAuditLog({
      actorId: req.user.id,
      action: 'report_exported',
      entityType: 'Report',
      entityId: null,
      description: `${type} report exported as PDF`,
      metadata: {
        reportType: type,
        format: 'pdf',
        recordCount: data.length,
        filters,
      },
      req,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        message: error.message || 'Error exporting PDF'
      });
    }
  }
};

// Internal functions for export (return data instead of sending response)
const getTravelReportInternal = async (req) => {
  const { role } = req.user;
  const { employeeId, department, travelType, status, startDate, endDate } = req.query;

  const employeeFilter = buildEmployeeFilter(req.user, employeeId);
  const dateFilter = buildDateFilter(startDate, endDate, 'startDate');
  
  const matchFilter = {
    ...employeeFilter,
    ...dateFilter,
  };

  if (travelType) matchFilter.travelType = travelType;
  if (status) matchFilter.status = status;

  const travelRequests = await TravelRequest.find(matchFilter)
    .populate('employeeId', 'firstName lastName employeeId department')
    .populate('managerId', 'firstName lastName employeeId')
    .sort({ createdAt: -1 });

  // Filter by department after population
  let filteredRequests = travelRequests;
  if (department) {
    filteredRequests = travelRequests.filter(tr => {
      const dept = tr.employeeId?.department;
      return dept && dept.toLowerCase() === department.toLowerCase();
    });
  }

  const reportData = filteredRequests.map(tr => ({
    travelRequestId: tr._id,
    employeeName: `${tr.employeeId?.firstName} ${tr.employeeId?.lastName}`,
    employeeId: tr.employeeId?.employeeId,
    department: tr.employeeId?.department,
    manager: tr.managerId ? `${tr.managerId.firstName} ${tr.managerId.lastName}` : 'N/A',
    travelType: tr.travelType,
    purpose: tr.purpose,
    destination: tr.destination,
    startDate: tr.startDate,
    endDate: tr.endDate,
    estimatedBudget: tr.estimatedBudget,
    status: tr.status,
    managerApprovalStatus: tr.managerApproval?.status || 'N/A',
    createdDate: tr.createdAt,
  }));

  const summary = {
    total: reportData.length,
    pending: reportData.filter(r => r.status === 'pending').length,
    approved: reportData.filter(r => r.status === 'approved').length,
    rejected: reportData.filter(r => r.status === 'rejected').length,
    cancelled: reportData.filter(r => r.status === 'cancelled').length,
    totalEstimatedBudget: reportData.reduce((sum, r) => sum + (r.estimatedBudget || 0), 0),
  };

  return { data: reportData, summary };
};

const getExpenseReportInternal = async (req) => {
  const { role } = req.user;
  const { employeeId, department, category, status, startDate, endDate } = req.query;

  const employeeFilter = buildEmployeeFilter(req.user, employeeId);
  const dateFilter = buildDateFilter(startDate, endDate, 'date');
  
  const matchFilter = {
    ...employeeFilter,
    ...dateFilter,
  };

  if (category) matchFilter.category = category;
  if (status) matchFilter.status = status;

  const expenses = await Expense.find(matchFilter)
    .populate('employeeId', 'firstName lastName employeeId department')
    .populate('travelRequestId', 'purpose destination')
    .populate('financeApproval.approvedBy', 'firstName lastName')
    .sort({ date: -1 });

  // Filter by department after population
  let filteredExpenses = expenses;
  if (department) {
    filteredExpenses = expenses.filter(exp => {
      const dept = exp.employeeId?.department;
      return dept && dept.toLowerCase() === department.toLowerCase();
    });
  }

  const reportData = filteredExpenses.map(exp => ({
    expenseId: exp._id,
    travelRequestId: exp.travelRequestId?._id,
    employeeName: `${exp.employeeId?.firstName} ${exp.employeeId?.lastName}`,
    employeeId: exp.employeeId?.employeeId,
    department: exp.employeeId?.department,
    category: exp.category,
    description: exp.description,
    amount: exp.amount,
    date: exp.date,
    status: exp.status,
    financeApprover: exp.financeApproval?.approvedBy 
      ? `${exp.financeApproval.approvedBy.firstName} ${exp.financeApproval.approvedBy.lastName}`
      : 'N/A',
    approvalDate: exp.financeApproval?.approvedAt,
  }));

  const summary = {
    total: reportData.length,
    pending: reportData.filter(r => r.status === 'pending').length,
    approved: reportData.filter(r => r.status === 'approved').length,
    rejected: reportData.filter(r => r.status === 'rejected').length,
    totalApprovedAmount: reportData
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.amount || 0), 0),
  };

  return { data: reportData, summary };
};

const getReimbursementReportInternal = async (req) => {
  const { role } = req.user;
  const { employeeId, department, status, startDate, endDate } = req.query;

  const employeeFilter = buildEmployeeFilter(req.user, employeeId);
  const dateFilter = buildDateFilter(startDate, endDate, 'createdAt');
  
  const matchFilter = {
    ...employeeFilter,
    ...dateFilter,
  };

  if (department) matchFilter.department = department;
  if (status) matchFilter.status = status;

  const reimbursements = await Reimbursement.find(matchFilter)
    .populate('employeeId', 'firstName lastName employeeId department')
    .populate('travelRequestId', 'purpose destination')
    .populate('processedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  // Filter by department after population
  let filteredReimbursements = reimbursements;
  if (department) {
    filteredReimbursements = reimbursements.filter(rm => {
      const dept = rm.employeeId?.department;
      return dept && dept.toLowerCase() === department.toLowerCase();
    });
  }

  const reportData = filteredReimbursements.map(rm => ({
    reimbursementId: rm._id,
    travelRequestId: rm.travelRequestId?._id,
    employeeName: `${rm.employeeId?.firstName} ${rm.employeeId?.lastName}`,
    employeeId: rm.employeeId?.employeeId,
    department: rm.employeeId?.department,
    totalAmount: rm.totalAmount,
    status: rm.status,
    processedBy: rm.processedBy ? `${rm.processedBy.firstName} ${rm.processedBy.lastName}` : 'N/A',
    processedDate: rm.processedAt,
    createdDate: rm.createdAt,
  }));

  const summary = {
    total: reportData.length,
    pending: reportData.filter(r => r.status === 'pending').length,
    approved: reportData.filter(r => r.status === 'approved').length,
    rejected: reportData.filter(r => r.status === 'rejected').length,
    paid: reportData.filter(r => r.status === 'paid').length,
    totalReimbursedAmount: reportData
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0),
  };

  return { data: reportData, summary };
};

const getDepartmentReportInternal = async (req) => {
  const departmentData = await Expense.aggregate([
    { $match: { status: 'approved' } },
    {
      $lookup: {
        from: 'users',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employee'
      }
    },
    { $unwind: '$employee' },
    {
      $group: {
        _id: '$employee.department',
        totalApprovedExpenses: { $sum: '$amount' },
        expenseCount: { $sum: 1 },
        uniqueEmployees: { $addToSet: '$employeeId' }
      }
    },
    {
      $project: {
        department: '$_id',
        totalApprovedExpenses: 1,
        expenseCount: 1,
        employeeCount: { $size: '$uniqueEmployees' },
        averageExpense: { $divide: ['$totalApprovedExpenses', '$expenseCount'] }
      }
    },
    { $sort: { totalApprovedExpenses: -1 } }
  ]);

  const reimbursementData = await Reimbursement.aggregate([
    { $match: { status: 'paid' } },
    {
      $lookup: {
        from: 'users',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employee'
      }
    },
    { $unwind: '$employee' },
    {
      $group: {
        _id: '$employee.department',
        totalReimbursed: { $sum: '$totalAmount' }
      }
    }
  ]);

  const reportData = departmentData.map(dept => {
    const reimbursement = reimbursementData.find(r => r._id === dept.department);
    return {
      department: dept.department || 'Unknown',
      totalApprovedExpenses: dept.totalApprovedExpenses || 0,
      numberOfExpenses: dept.expenseCount || 0,
      numberOfEmployees: dept.employeeCount || 0,
      averageExpense: dept.averageExpense || 0,
      totalReimbursedAmount: reimbursement?.totalReimbursed || 0,
    };
  });

  return { data: reportData };
};

const getEmployeeReportInternal = async (req) => {
  const { role } = req.user;
  const { department } = req.query;

  let matchFilter = {};
  
  if (role === 'employee') {
    matchFilter.employeeId = req.user._id;
  }
  
  if ((role === 'finance' || role === 'admin') && department) {
    matchFilter.department = department;
  }

  const expenseData = await Expense.aggregate([
    { $match: { ...matchFilter, status: 'approved' } },
    {
      $lookup: {
        from: 'users',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employee'
      }
    },
    { $unwind: '$employee' },
    {
      $group: {
        _id: '$employeeId',
        name: { $first: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] } },
        employeeId: { $first: '$employee.employeeId' },
        department: { $first: '$employee.department' },
        totalApprovedExpenses: { $sum: '$amount' },
        expenseCount: { $sum: 1 }
      }
    }
  ]);

  const reimbursementData = await Reimbursement.aggregate([
    { $match: { ...matchFilter, status: 'paid' } },
    {
      $lookup: {
        from: 'users',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employee'
      }
    },
    { $unwind: '$employee' },
    {
      $group: {
        _id: '$employeeId',
        totalReimbursed: { $sum: '$totalAmount' },
        reimbursementCount: { $sum: 1 }
      }
    }
  ]);

  const reportData = expenseData.map(emp => {
    const reimbursement = reimbursementData.find(r => r._id === emp._id);
    return {
      employee: emp.name,
      employeeId: emp.employeeId,
      department: emp.department,
      totalApprovedExpenses: emp.totalApprovedExpenses || 0,
      totalReimbursed: reimbursement?.totalReimbursed || 0,
      expenseCount: emp.expenseCount || 0,
      reimbursementCount: reimbursement?.reimbursementCount || 0,
    };
  });

  return { data: reportData };
};

module.exports = {
  getTravelReport,
  getExpenseReport,
  getReimbursementReport,
  getDepartmentReport,
  getEmployeeReport,
  exportCSV,
  exportPDF,
};
