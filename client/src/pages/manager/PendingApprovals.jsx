import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, DollarSign, CheckCircle, AlertCircle, ArrowRight, FileText, User } from 'lucide-react';
import travelService from '../../services/travelService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

function PendingApprovals() {
  const navigate = useNavigate();
  const [travelRequests, setTravelRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await travelService.getTravelRequests({ status: 'pending' });
      setTravelRequests(response.travelRequests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const PendingRequestCard = ({ request }) => (
    <Card
      variant="elevated"
      hoverable={true}
      onClick={() => navigate(`/travel-requests/${request._id}`)}
      style={{ padding: '24px', border: '2px solid var(--color-primary-200)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
              {request.destination}
            </h3>
            <StatusBadge status={request.status} />
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            {request.employeeId?.firstName} {request.employeeId?.lastName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: '500' }}>
            {request.employeeId?.employeeId} • {request.employeeId?.department || 'Department'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Travel Type
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
            {request.travelType.charAt(0).toUpperCase() + request.travelType.slice(1)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Purpose
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={14} />
            {request.purpose}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Travel Dates
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'} - {request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Estimated Budget
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={14} />
            {formatCurrency(request.estimatedBudget)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          Submitted {new Date(request.createdAt).toLocaleDateString()}
        </div>
        <Button size="sm" icon={ArrowRight}>
          Review Request
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return <LoadingState message="Loading pending approvals..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPendingRequests} />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Pending Travel Approvals
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Review and approve travel requests from your team members
        </p>
      </div>

      {/* Pending Requests Alert */}
      {travelRequests.length > 0 && (
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
                {travelRequests.length} pending approval{travelRequests.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-warning-700)' }}>
                Review and respond to travel requests from your team
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Requests List */}
      {travelRequests.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No pending travel requests"
          description="All travel requests have been reviewed. Check back later for new requests."
        />
      ) : (
        <div>
          {travelRequests.map((request) => (
            <PendingRequestCard key={request._id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

export default PendingApprovals;
