import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plane, CheckCircle, DollarSign, Wallet, Plus, Calendar, FileText, TrendingUp } from 'lucide-react';
import travelService from '../../services/travelService';
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

function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [recentTravel, setRecentTravel] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentReimbursements, setRecentReimbursements] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employee's travel requests
      const travelData = await travelService.getTravelRequests();
      const travelRequests = travelData?.travelRequests || [];

      // Fetch employee's expenses
      const expenseData = await expenseService.getExpenses();
      const expenses = expenseData?.expenses || [];

      // Fetch employee's reimbursements
      const reimbursementData = await reimbursementService.getMyReimbursements();
      const reimbursements = reimbursementData?.reimbursements || [];

      // Fetch analytics
      const analyticsData = await analyticsService.getOverview();
      setAnalytics(analyticsData?.data || null);

      // Calculate stats
      const travelStats = {
        total: travelRequests.length,
        pending: travelRequests.filter(t => t.status === 'pending').length,
        approved: travelRequests.filter(t => t.status === 'approved').length,
        rejected: travelRequests.filter(t => t.status === 'rejected').length,
      };

      const expenseStats = {
        total: expenses.length,
        pending: expenses.filter(e => e.status === 'pending').length,
        approved: expenses.filter(e => e.status === 'approved').length,
        approvedAmount: expenses
          .filter(e => e.status === 'approved')
          .reduce((sum, e) => sum + (e.amount || 0), 0),
      };

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
        travel: travelStats,
        expense: expenseStats,
        reimbursement: reimbursementStats,
      });

      // Get recent items (last 5)
      setRecentTravel(travelRequests.slice(0, 5));
      setRecentExpenses(expenses.slice(0, 5));
      setRecentReimbursements(reimbursements.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const ActivityItem = ({ title, subtitle, status, date, amount, onClick }) => (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-base)',
        marginBottom: '12px',
        cursor: onClick ? 'pointer' : 'default',
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
            {title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </div>
        </div>
        {status && <StatusBadge status={status} size="sm" />}
      </div>
      {amount && (
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)' }}>
          {formatCurrency(amount)}
        </div>
      )}
      {date && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
          {new Date(date).toLocaleDateString()}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          {getGreeting()}, {user?.firstName || 'User'}
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Here's your travel and expense overview
        </p>
      </div>

      {/* Primary Action */}
      <div style={{ marginBottom: '32px' }}>
        <Button
          onClick={() => navigate('/create-travel-request')}
          variant="primary"
          size="lg"
          icon={Plus}
        >
          Create Travel Request
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <KPICard
          title="Total Travel Requests"
          value={stats.travel?.total || 0}
          subtitle={`${stats.travel?.pending || 0} pending approval`}
          icon={Plane}
          color="primary"
        />
        <KPICard
          title="Approved Travel"
          value={stats.travel?.approved || 0}
          subtitle="Approved for travel"
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title="Total Expenses"
          value={stats.expense?.total || 0}
          subtitle={`${stats.expense?.pending || 0} pending review`}
          icon={FileText}
          color="warning"
        />
        <KPICard
          title="Approved Amount"
          value={formatCurrency(stats.expense?.approvedAmount || 0)}
          subtitle="Total approved expenses"
          icon={DollarSign}
          color="success"
        />
        <KPICard
          title="Pending Reimbursements"
          value={stats.reimbursement?.pending || 0}
          subtitle="Awaiting processing"
          icon={Wallet}
          color="warning"
        />
        <KPICard
          title="Paid Reimbursements"
          value={stats.reimbursement?.paid || 0}
          subtitle={`Total ${formatCurrency(stats.reimbursement?.totalAmount || 0)}`}
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Secondary Actions */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/add-expense')}
            icon={DollarSign}
          >
            Add Expense
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/create-reimbursement')}
            icon={Wallet}
          >
            Create Reimbursement
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Recent Travel Requests */}
        <Card variant="elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
              Recent Travel Requests
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-travel')}>
              View All
            </Button>
          </div>
          {recentTravel.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="No travel requests yet"
              description="You haven't created any travel requests"
              action="Create Request"
              onAction={() => navigate('/create-travel-request')}
            />
          ) : (
            recentTravel.map((travel) => (
              <ActivityItem
                key={travel._id}
                title={travel.destination}
                subtitle={`${travel.travelType} • ${new Date(travel.startDate).toLocaleDateString()}`}
                status={travel.status}
                date={travel.createdAt}
                onClick={() => navigate(`/travel-requests/${travel._id}`)}
              />
            ))
          )}
        </Card>

        {/* Recent Expenses */}
        <Card variant="elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
              Recent Expenses
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-expenses')}>
              View All
            </Button>
          </div>
          {recentExpenses.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No expenses yet"
              description="You haven't submitted any expenses"
              action="Add Expense"
              onAction={() => navigate('/add-expense')}
            />
          ) : (
            recentExpenses.map((expense) => (
              <ActivityItem
                key={expense._id}
                title={expense.category}
                subtitle={expense.description || expense.merchantName || 'Expense'}
                status={expense.status}
                amount={expense.amount}
                date={expense.createdAt}
                onClick={() => navigate(`/expenses/${expense._id}`)}
              />
            ))
          )}
        </Card>

        {/* Recent Reimbursements */}
        <Card variant="elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
              Recent Reimbursements
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-reimbursements')}>
              View All
            </Button>
          </div>
          {recentReimbursements.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No reimbursements yet"
              description="You haven't created any reimbursement claims"
              action="Create Claim"
              onAction={() => navigate('/create-reimbursement')}
            />
          ) : (
            recentReimbursements.map((reimbursement) => (
              <ActivityItem
                key={reimbursement._id}
                title={`Reimbursement #${reimbursement._id?.slice(-6)}`}
                subtitle={`Created on ${new Date(reimbursement.createdAt).toLocaleDateString()}`}
                status={reimbursement.status}
                amount={reimbursement.totalAmount}
                date={reimbursement.createdAt}
                onClick={() => navigate(`/reimbursements/${reimbursement._id}`)}
              />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
