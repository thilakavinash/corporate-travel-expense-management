import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, Plane, DollarSign, Wallet, Briefcase, Shield, BarChart3, FileText, Search, UserCheck, UserCog, Users as UsersIcon, CheckCircle } from 'lucide-react';
import travelService from '../../services/travelService';
import expenseService from '../../services/expenseService';
import reimbursementService from '../../services/reimbursementService';
import analyticsService from '../../services/analyticsService';
import { getUsers } from '../../services/userService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import KPICard from '../../components/ui/KPICard';

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch organization-wide data
      const [travelData, expenseData, reimbursementData, analyticsData, usersData] = await Promise.all([
        travelService.getTravelRequests(),
        expenseService.getExpenses(),
        reimbursementService.getReimbursements(),
        analyticsService.getOverview(),
        getUsers(),
      ]);

      const travelRequests = travelData?.travelRequests || [];
      const expenses = expenseData?.expenses || [];
      const reimbursements = reimbursementData?.reimbursements || [];
      const users = usersData?.data || [];

      setAnalytics(analyticsData?.data || null);

      // Calculate organization stats
      const orgStats = {
        totalUsers: users.length,
        totalTravelRequests: travelRequests.length,
        totalExpenses: expenses.length,
        totalReimbursements: reimbursements.length,
        approvedExpenseAmount: expenses
          .filter(e => e.status === 'approved')
          .reduce((sum, e) => sum + (e.amount || 0), 0),
      };

      setStats(orgStats);

      // Calculate user stats
      const userRoleStats = {
        employees: users.filter(u => u.role === 'employee').length,
        managers: users.filter(u => u.role === 'manager').length,
        finance: users.filter(u => u.role === 'finance').length,
        admins: users.filter(u => u.role === 'admin').length,
        active: users.filter(u => u.isActive !== false).length,
      };

      setUserStats(userRoleStats);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const QuickAccessCard = ({ icon: Icon, title, description, onClick }) => (
    <Card
      variant="elevated"
      onClick={onClick}
      hoverable={true}
      style={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-base)', backgroundColor: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} style={{ color: 'var(--color-primary-600)' }} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
          {title}
        </h3>
      </div>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
        {description}
      </p>
    </Card>
  );

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Organization-wide system overview and control center
        </p>
      </div>

      {/* Organization KPI Cards */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px' }}>
          Organization Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <KPICard
            title="Total Users"
            value={stats.totalUsers || 0}
            subtitle={`${userStats.active || 0} active users`}
            icon={Users}
            color="primary"
          />
          <KPICard
            title="Travel Requests"
            value={stats.totalTravelRequests || 0}
            subtitle="All organization requests"
            icon={Plane}
            color="primary"
          />
          <KPICard
            title="Total Expenses"
            value={stats.totalExpenses || 0}
            subtitle="Expense records"
            icon={DollarSign}
            color="warning"
          />
          <KPICard
            title="Reimbursements"
            value={stats.totalReimbursements || 0}
            subtitle="Reimbursement claims"
            icon={Wallet}
            color="success"
          />
          <KPICard
            title="Approved Amount"
            value={formatCurrency(stats.approvedExpenseAmount || 0)}
            subtitle="Total approved expenses"
            icon={TrendingUp}
            color="success"
          />
        </div>
      </div>

      {/* User Statistics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px' }}>
          User Distribution
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <KPICard
            title="Employees"
            value={userStats.employees || 0}
            subtitle="Regular employees"
            icon={UserCheck}
            color="primary"
            size="sm"
          />
          <KPICard
            title="Managers"
            value={userStats.managers || 0}
            subtitle="Team managers"
            icon={Briefcase}
            color="info"
            size="sm"
          />
          <KPICard
            title="Finance"
            value={userStats.finance || 0}
            subtitle="Finance team"
            icon={DollarSign}
            color="success"
            size="sm"
          />
          <KPICard
            title="Administrators"
            value={userStats.admins || 0}
            subtitle="System admins"
            icon={Shield}
            color="danger"
            size="sm"
          />
          <KPICard
            title="Active Users"
            value={userStats.active || 0}
            subtitle="Currently active"
            icon={CheckCircle}
            color="success"
            size="sm"
          />
        </div>
      </div>

      {/* Quick Access - Read Only */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px' }}>
          Quick Access
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <QuickAccessCard
            icon={UsersIcon}
            title="User Management"
            description="Manage user accounts, roles, and permissions"
            onClick={() => navigate('/user-management')}
          />
          <QuickAccessCard
            icon={BarChart3}
            title="Analytics"
            description="View organization-wide analytics and reports"
            onClick={() => navigate('/analytics')}
          />
          <QuickAccessCard
            icon={FileText}
            title="Reports"
            description="Generate and export organization reports"
            onClick={() => navigate('/reports')}
          />
          <QuickAccessCard
            icon={Search}
            title="Audit Logs"
            description="View system audit logs and security events"
            onClick={() => navigate('/audit-logs')}
          />
        </div>
      </div>

      {/* Analytics Preview */}
      {analytics && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px' }}>
            Analytics Overview
          </h2>
          <Card variant="elevated" style={{ padding: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
              Detailed analytics are available in the Analytics section. Click below to view comprehensive reports on travel patterns, expense trends, and reimbursement statistics.
            </p>
            <Button onClick={() => navigate('/analytics')} icon={BarChart3}>
              View Full Analytics
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
