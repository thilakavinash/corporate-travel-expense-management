import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Filter, Download, RotateCcw, CheckCircle, XCircle, FileSpreadsheet, Printer } from 'lucide-react';
import {
  getTravelReport,
  getExpenseReport,
  getReimbursementReport,
  getDepartmentReport,
  getEmployeeReport,
  exportCSV,
  exportPDF,
} from '../../services/reportService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import StatusBadge from '../../components/ui/StatusBadge';

function ReportsDashboard() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('travel');
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    employeeId: '',
    department: '',
    travelType: '',
    category: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const departments = ['Engineering', 'Finance', 'HR', 'Marketing', 'Sales', 'Operations'];
  const travelTypes = ['domestic', 'international'];
  const categories = ['transport', 'accommodation', 'food', 'miscellaneous'];
  const travelStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
  const expenseStatuses = ['pending', 'approved', 'rejected'];
  const reimbursementStatuses = ['pending', 'approved', 'rejected', 'paid'];

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      let result;

      switch (reportType) {
        case 'travel':
          result = await getTravelReport(filters);
          setData(result.data || []);
          setSummary(result.summary || null);
          break;
        case 'expenses':
          result = await getExpenseReport(filters);
          setData(result.data || []);
          setSummary(result.summary || null);
          break;
        case 'reimbursements':
          result = await getReimbursementReport(filters);
          setData(result.data || []);
          setSummary(result.summary || null);
          break;
        case 'departments':
          result = await getDepartmentReport(filters);
          setData(result.data || []);
          setSummary(null);
          break;
        case 'employees':
          result = await getEmployeeReport(filters);
          setData(result.data || []);
          setSummary(null);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleApplyFilters = () => {
    fetchReport();
  };

  const handleResetFilters = () => {
    setFilters({
      employeeId: '',
      department: '',
      travelType: '',
      category: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    fetchReport();
  };

  const handleExportCSV = () => {
    exportCSV(reportType, filters);
  };

  const handleExportPDF = () => {
    exportPDF(reportType, filters);
  };

  const renderSummary = () => {
    if (!summary) return null;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {Object.entries(summary).map(([key, value]) => (
          <Card key={key} variant="elevated" style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-surface-secondary)' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-primary-700)', marginBottom: '8px' }}>
              {typeof value === 'number' ? formatCurrency(value) : value}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    if (data.length === 0) {
      return (
        <EmptyState
          icon={FileSpreadsheet}
          title="No records found"
          description="Try adjusting your filters or date range to see results."
        />
      );
    }

    const headers = Object.keys(data[0]);

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--color-surface)' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
              {headers.map(header => (
                <th key={header} style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', textTransform: 'capitalize' }}>
                  {header.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                {headers.map(header => (
                  <td key={header} style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)' }}>
                    {renderCell(row[header], header)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCell = (value, header) => {
    if (value === null || value === undefined) return '-';
    
    if (typeof value === 'number' && 
        (header.toLowerCase().includes('amount') || 
         header.toLowerCase().includes('budget') || 
         header.toLowerCase().includes('total'))) {
      return formatCurrency(value);
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString('en-GB');
    }
    
    if (header.toLowerCase().includes('status')) {
      return <StatusBadge status={String(value).toLowerCase()} size="sm" />;
    }
    
    return String(value);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-base)',
    fontSize: '14px',
    fontFamily: 'var(--font-family)',
    color: 'var(--color-text)',
    backgroundColor: 'var(--color-surface)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-text)',
    marginBottom: '8px',
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Reports
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Generate and export business reports according to your role
        </p>
      </div>

      {/* Filters */}
      <Card variant="elevated" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Filter size={20} style={{ color: 'var(--color-primary-600)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
            Report Filters
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Report Type</label>
            <select
              style={inputStyle}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="travel">Travel Requests</option>
              <option value="expenses">Expenses</option>
              <option value="reimbursements">Reimbursements</option>
              {(user.role === 'finance' || user.role === 'admin') && (
                <>
                  <option value="departments">Department Spending</option>
                  <option value="employees">Employee Spending</option>
                </>
              )}
            </select>
          </div>

          {(user.role === 'finance' || user.role === 'admin') && (
            <div>
              <label style={labelStyle}>Department</label>
              <select
                style={inputStyle}
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'travel' && (
            <div>
              <label style={labelStyle}>Travel Type</label>
              <select
                style={inputStyle}
                value={filters.travelType}
                onChange={(e) => setFilters({ ...filters, travelType: e.target.value })}
              >
                <option value="">All Types</option>
                {travelTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'expenses' && (
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              {reportType === 'travel' && travelStatuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
              {reportType === 'expenses' && expenseStatuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
              {reportType === 'reimbursements' && reimbursementStatuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
              {reportType !== 'travel' && reportType !== 'expenses' && reportType !== 'reimbursements' && (
                <option value="">All Status</option>
              )}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Start Date</label>
            <input
              style={inputStyle}
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <label style={labelStyle}>End Date</label>
            <input
              style={inputStyle}
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
          <Button onClick={handleApplyFilters} icon={Filter}>
            Apply Filters
          </Button>
          <Button variant="secondary" onClick={handleResetFilters} icon={RotateCcw}>
            Reset
          </Button>
          <Button variant="success" onClick={handleExportCSV} icon={FileSpreadsheet}>
            Export CSV
          </Button>
          <Button variant="success" onClick={handleExportPDF} icon={Printer}>
            Export PDF
          </Button>
        </div>
      </Card>

      {loading ? (
        <LoadingState message="Loading report data..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReport} />
      ) : (
        <>
          {renderSummary()}
          <Card variant="elevated" style={{ padding: '24px' }}>
            {renderTable()}
          </Card>
        </>
      )}
    </div>
  );
}

export default ReportsDashboard;
