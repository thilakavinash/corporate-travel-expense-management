import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Clock, Plane, AlertCircle, ArrowRight } from 'lucide-react';
import travelService from '../../services/travelService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import KPICard from '../../components/ui/KPICard';

function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch travel requests that need manager approval
      const travelData = await travelService.getTravelRequests();
      const travelRequests = travelData?.travelRequests || [];

      // Filter for pending approvals (manager role sees requests they need to approve)
      const pending = travelRequests.filter(t => t.status === 'pending');
      setPendingApprovals(pending);

      // Calculate stats
      const stats = {
        pending: pending.length,
        approved: travelRequests.filter(t => t.status === 'approved').length,
        rejected: travelRequests.filter(t => t.status === 'rejected').length,
        total: travelRequests.length,
      };

      setStats(stats);

      // Get recent requests (last 10)
      setRecentRequests(travelRequests.slice(0, 10));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const ApprovalItem = ({ request, onClick }) => (
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
            {request.destination}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {request.employeeId?.firstName} {request.employeeId?.lastName} • {request.travelType}
          </div>
        </div>
        <StatusBadge status={request.status} size="sm" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)' }}>
          {formatCurrency(request.estimatedBudget)}
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

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Manager Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Review and approve travel requests from your team
        </p>
      </div>

      {/* Pending Approvals Alert */}
      {stats.pending > 0 && (
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
                {stats.pending} travel request{stats.pending !== 1 ? 's' : ''} awaiting your approval
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-warning-700)' }}>
                Review pending requests to keep travel planning on track
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/pending-approvals')}
              icon={ArrowRight}
            >
              Review Now
            </Button>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <KPICard
          title="Pending Approvals"
          value={stats.pending || 0}
          subtitle="Requires your action"
          icon={Clock}
          color={stats.pending > 0 ? 'warning' : 'success'}
        />
        <KPICard
          title="Approved Requests"
          value={stats.approved || 0}
          subtitle="Approved for travel"
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title="Rejected Requests"
          value={stats.rejected || 0}
          subtitle="Not approved"
          icon={XCircle}
          color="danger"
        />
        <KPICard
          title="Total Requests"
          value={stats.total || 0}
          subtitle="All time"
          icon={Plane}
          color="primary"
        />
      </div>

      {/* Pending Approvals Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)' }}>
            Pending Approvals
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/pending-approvals')}>
            View All
          </Button>
        </div>
        <Card variant="elevated">
          {pendingApprovals.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No pending approvals"
              description="All travel requests have been processed"
            />
          ) : (
            pendingApprovals.slice(0, 5).map((request) => (
              <ApprovalItem
                key={request._id}
                request={request}
                onClick={() => navigate(`/travel-requests/${request._id}`)}
              />
            ))
          )}
        </Card>
      </div>

      {/* Recent Requests */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)' }}>
            Recent Requests
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/pending-approvals')}>
            View All
          </Button>
        </div>
        <Card variant="elevated">
          {recentRequests.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="No requests yet"
              description="No travel requests have been submitted"
            />
          ) : (
            recentRequests.slice(0, 5).map((request) => (
              <ApprovalItem
                key={request._id}
                request={request}
                onClick={() => navigate(`/travel-requests/${request._id}`)}
              />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

export default ManagerDashboard;
