import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BarChart3, Plane, DollarSign, Wallet, Clock, TrendingUp, FileText, CheckCircle, XCircle } from 'lucide-react';
import analyticsService from '../services/analyticsService';
import formatCurrency from '../utils/currencyFormatter';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import KPICard from '../components/ui/KPICard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [monthlySpending, setMonthlySpending] = useState([]);
  const [departmentSpending, setDepartmentSpending] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [travelTypes, setTravelTypes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFinanceOrAdmin = user?.role === 'finance' || user?.role === 'admin';

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch overview (filtered by role)
      const overviewResponse = await analyticsService.getOverview();
      setOverview(overviewResponse.data?.data || null);

      // Only fetch organization-wide analytics for Finance/Admin
      if (isFinanceOrAdmin) {
        const [monthlyResp, departmentResp, categoryResp, travelResp] = await Promise.all([
          analyticsService.getMonthlySpending(),
          analyticsService.getDepartmentSpending(),
          analyticsService.getExpenseCategories(),
          analyticsService.getTravelTypes()
        ]);

        setMonthlySpending(monthlyResp.data?.data || []);
        setDepartmentSpending(departmentResp.data?.data || []);
        setExpenseCategories(categoryResp.data?.data || []);
        setTravelTypes(travelResp.data?.data || null);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const capitalize = (str) => {
    if (!str || typeof str !== 'string') return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const COLORS = ['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#6b7280', '#0891b2', '#ea580c'];

  if (loading) {
    return <LoadingState message="Loading analytics data..." />;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
              {isFinanceOrAdmin ? 'Organization Analytics' : 'My Analytics'}
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
              {isFinanceOrAdmin ? 'Organization-wide spending insights' : 'Personal spending insights'}
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)} icon={ArrowLeft}>
            Back
          </Button>
        </div>
        <ErrorState message={error} onRetry={fetchAnalytics} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
            {isFinanceOrAdmin ? 'Organization Analytics' : 'My Analytics'}
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            {isFinanceOrAdmin ? 'Organization-wide spending insights' : 'Personal spending insights'}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Back
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <KPICard
          title="Total Travel Requests"
          value={overview?.travelRequests?.total || 0}
          subtitle={`${overview?.travelRequests?.approved || 0} approved`}
          icon={Plane}
          color="primary"
        />
        <KPICard
          title="Total Expenses"
          value={overview?.expenses?.total || 0}
          subtitle={formatCurrency(overview?.expenses?.totalApprovedAmount || 0) + ' approved'}
          icon={DollarSign}
          color="success"
        />
        <KPICard
          title="Total Reimbursements"
          value={overview?.reimbursements?.total || 0}
          subtitle={formatCurrency(overview?.reimbursements?.totalReimbursedAmount || 0) + ' paid'}
          icon={Wallet}
          color="primary"
        />
        <KPICard
          title="Pending Requests"
          value={overview?.travelRequests?.pending || 0}
          subtitle={`${overview?.expenses?.pending || 0} pending expenses`}
          icon={Clock}
          color={overview?.travelRequests?.pending > 0 ? 'warning' : 'success'}
        />
        <KPICard
          title="Approved Expenses"
          value={overview?.expenses?.approved || 0}
          subtitle={formatCurrency(overview?.expenses?.totalApprovedAmount || 0) + ' total'}
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title="Paid Reimbursements"
          value={overview?.reimbursements?.paid || 0}
          subtitle={formatCurrency(overview?.reimbursements?.totalReimbursedAmount || 0) + ' processed'}
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Organization-wide charts for Finance/Admin */}
      {isFinanceOrAdmin && (
        <>
          {/* Monthly Spending Chart */}
          <Card variant="elevated" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} />
              Monthly Spending Trends
            </h3>
            {monthlySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-text-tertiary)" />
                  <YAxis stroke="var(--color-text-tertiary)" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-base)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="approved" fill="#16a34a" name="Approved" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#ca8a04" name="Pending" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" fill="#dc2626" name="Rejected" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No monthly spending data"
                description="Monthly spending data will appear here as transactions are processed."
              />
            )}
          </Card>

          {/* Department Spending Chart */}
          <Card variant="elevated" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} />
              Department Spending
            </h3>
            {departmentSpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentSpending}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="department" stroke="var(--color-text-tertiary)" />
                  <YAxis stroke="var(--color-text-tertiary)" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-base)',
                    }}
                  />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No department spending data"
                description="Department spending data will appear here as transactions are processed."
              />
            )}
          </Card>

          {/* Expense Categories Chart */}
          <Card variant="elevated" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} />
              Expense Categories
            </h3>
            {expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${capitalize(entry.category)}: ${formatCurrency(entry.total)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-base)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No expense category data"
                description="Expense category data will appear here as transactions are processed."
              />
            )}
          </Card>

          {/* Travel Types Stats */}
          <Card variant="elevated" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plane size={20} />
              Travel Types
            </h3>
            {travelTypes ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <KPICard
                  title="Domestic Trips"
                  value={travelTypes.domestic}
                  subtitle="Within country"
                  icon={Plane}
                  color="primary"
                  size="sm"
                />
                <KPICard
                  title="International Trips"
                  value={travelTypes.international}
                  subtitle="Outside country"
                  icon={Plane}
                  color="info"
                  size="sm"
                />
                <KPICard
                  title="Approved Trips"
                  value={travelTypes.approved}
                  subtitle="Approved for travel"
                  icon={CheckCircle}
                  color="success"
                  size="sm"
                />
                <KPICard
                  title="Rejected Trips"
                  value={travelTypes.rejected}
                  subtitle="Not approved"
                  icon={XCircle}
                  color="danger"
                  size="sm"
                />
              </div>
            ) : (
              <EmptyState
                icon={Plane}
                title="No travel type data"
                description="Travel type data will appear here as travel requests are processed."
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
