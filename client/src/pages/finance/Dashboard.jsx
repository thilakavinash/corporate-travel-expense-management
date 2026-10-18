import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Clock, Wallet, CheckCircle, AlertCircle, ArrowRight, FileText, TrendingUp } from 'lucide-react';
import expenseService from '../../services/expenseService';
import reimbursementService from '../../services/reimbursementService';
import analyticsService from '../../services/analyticsService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import KPICard from '../../components/ui/KPICard';

function FinanceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [pendingReimbursements, setPendingReimbursements] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch expenses
      const expenseData = await expenseService.getExpenses();
      const expenses = expenseData?.expenses || [];

      // Fetch reimbursements
      const reimbursementData = await reimbursementService.getReimbursements();
      const reimbursements = reimbursementData?.reimbursements || [];

      // Fetch analytics
      const analyticsData = await analyticsService.getOverview();
      setAnalytics(analyticsData?.data || null);

      // Calculate expense stats
      const expenseStats = {
        total: expenses.length,
        pending: expenses.filter(e => e.status === 'pending').length,
        approved: expenses.filter(e => e.status === 'approved').length,
        rejected: expenses.filter(e => e.status === 'rejected').length,
        approvedAmount: expenses
          .filter(e => e.status === 'approved')
          .reduce((sum, e) => sum + (e.amount || 0), 0),
      };

      // Calculate reimbursement stats
      const reimbursementStats = {
        total: reimbursements.length,
        pending: reimbursements.filter(r => r.status === 'pending').length,
        approved: reimbursements.filter(r => r.status === 'approved').length,
        paid: reimbursements.filter(r => r.status === 'paid').length,
        totalAmount: reimbursements
          .filter(r => r.status === 'paid')
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0),
      };

      setStats({
        expense: expenseStats,
        reimbursement: reimbursementStats,
      });

      // Get pending items
      setPendingExpenses(expenses.filter(e => e.status === 'pending').slice(0, 5));
      setPendingReimbursements(reimbursements.filter(r => r.status === 'pending').slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const ExpenseItem = ({ expense, onClick }) => (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-base)',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 150ms ease-in-out',
        backgroundColor: 'var(--color-surface)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
            {expense.category}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {expense.employeeId?.firstName} {expense.employeeId?.lastName} • {expense.travelRequestId?.destination || 'Travel'}
          </div>
        </div>
        <StatusBadge status={expense.status} size="sm" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          {new Date(expense.createdAt).toLocaleDateString()}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)' }}>
          {formatCurrency(expense.amount || 0)}
        </div>
      </div>
    </div>
  );

  const ReimbursementItem = ({ reimbursement, onClick }) => (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-base)',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 150ms ease-in-out',
        backgroundColor: 'var(--color-surface)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
            {reimbursement.employeeId?.firstName} {reimbursement.employeeId?.lastName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {reimbursement.travelRequestId?.destination || 'Travel'} • {reimbursement.employeeId?.department || 'Department'}
          </div>
        </div>
        <StatusBadge status={reimbursement.status} size="sm" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          {new Date(reimbursement.createdAt).toLocaleDateString()}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)' }}>
          {formatCurrency(reimbursement.totalAmount || 0)}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const totalPending = (stats.expense?.pending || 0) + (stats.reimbursement?.pending || 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Finance Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Monitor organizational expenses and reimbursement activity
        </p>
      </div>

      {/* Pending Actions Alert */}
      {totalPending > 0 && (
        <Card
          variant="outlined"
          style={{
            marginBottom: '32px',
            backgroundColor: 'var(--color-warning-50)',
            borderColor: 'var(--color-warning-300)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-base)', backgroundColor: 'var(--color-warning-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} style={{ color: 'var(--color-warning-700)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-warning-800)', marginBottom: '4px' }}>
                {totalPending} pending action{totalPending !== 1 ? 's' : ''} awaiting review
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-warning-700)' }}>
                {stats.expense?.pending || 0} expense{stats.expense?.pending !== 1 ? 's' : ''} and {stats.reimbursement?.pending || 0} reimbursement{stats.reimbursement?.pending !== 1 ? 's' : ''} to process
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {stats.expense?.pending > 0 && (
                <Button
                  variant="primary"
                  onClick={() => navigate('/expense-review')}
                  icon={ArrowRight}
                >
                  Review Expenses
                </Button>
              )}
              {stats.reimbursement?.pending > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/reimbursement-review')}
                  icon={ArrowRight}
                >
                  Review Claims
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <KPICard
          title="Approved Expenses"
          value={formatCurrency(stats.expense?.approvedAmount || 0)}
          subtitle={`${stats.expense?.approved || 0} approved`}
          icon={DollarSign}
          color="success"
        />
        <KPICard
          title="Pending Expenses"
          value={stats.expense?.pending || 0}
          subtitle="Awaiting finance review"
          icon={FileText}
          color={stats.expense?.pending > 0 ? 'warning' : 'success'}
        />
        <KPICard
          title="Pending Reimbursements"
          value={stats.reimbursement?.pending || 0}
          subtitle="Awaiting processing"
          icon={Clock}
          color={stats.reimbursement?.pending > 0 ? 'warning' : 'success'}
        />
        <KPICard
          title="Approved Reimbursements"
          value={stats.reimbursement?.approved || 0}
          subtitle="Ready for payment"
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title="Paid Reimbursements"
          value={stats.reimbursement?.paid || 0}
          subtitle="Successfully processed"
          icon={Wallet}
          color="success"
        />
        <KPICard
          title="Total Reimbursed"
          value={formatCurrency(stats.reimbursement?.totalAmount || 0)}
          subtitle="Total amount paid"
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* Pending Expenses Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)' }}>
            Pending Expenses
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/expense-review')}>
            View All
          </Button>
        </div>
        <Card variant="elevated">
          {pendingExpenses.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No pending expenses"
              description="All expenses have been reviewed"
            />
          ) : (
            pendingExpenses.map((expense) => (
              <ExpenseItem
                key={expense._id}
                expense={expense}
                onClick={() => navigate(`/expenses/${expense._id}`)}
              />
            ))
          )}
        </Card>
      </div>

      {/* Pending Reimbursements Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)' }}>
            Pending Reimbursements
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/reimbursement-review')}>
            View All
          </Button>
        </div>
        <Card variant="elevated">
          {pendingReimbursements.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No pending reimbursements"
              description="All reimbursements have been processed"
            />
          ) : (
            pendingReimbursements.map((reimbursement) => (
              <ReimbursementItem
                key={reimbursement._id}
                reimbursement={reimbursement}
                onClick={() => navigate(`/reimbursements/${reimbursement._id}`)}
              />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

export default FinanceDashboard;
