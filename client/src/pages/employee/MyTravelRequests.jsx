import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, DollarSign, X, Plus, Filter } from 'lucide-react';
import travelService from '../../services/travelService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import KPICard from '../../components/ui/KPICard';

function MyTravelRequests() {
  const navigate = useNavigate();
  const [travelRequests, setTravelRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchTravelRequests();
  }, []);

  const fetchTravelRequests = async () => {
    try {
      setLoading(true);
      const response = await travelService.getTravelRequests();
      setTravelRequests(response.travelRequests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch travel requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this travel request? This action cannot be undone.')) {
      return;
    }

    setCancellingId(id);
    try {
      await travelService.cancelTravelRequest(id);
      fetchTravelRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel travel request');
    } finally {
      setCancellingId(null);
    }
  };

  const TravelRequestCard = ({ request, onCancel }) => (
    <Card
      variant="elevated"
      hoverable={true}
      onClick={() => navigate(`/travel-requests/${request._id}`)}
      style={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
            {request.destination}
          </h3>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            {request.purpose}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: '500' }}>
            {request.travelType.charAt(0).toUpperCase() + request.travelType.slice(1)}
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
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
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={14} />
            {formatCurrency(request.estimatedBudget)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Created
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
            {new Date(request.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {request.status === 'pending' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--color-border)', marginTop: '16px' }}>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(request._id);
            }}
            disabled={cancellingId === request._id}
            icon={X}
          >
            {cancellingId === request._id ? 'Cancelling...' : 'Cancel Request'}
          </Button>
        </div>
      )}
    </Card>
  );

  if (loading) {
    return <LoadingState message="Loading travel requests..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchTravelRequests} />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
            My Travel Requests
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            View and manage your travel requests
          </p>
        </div>
        <Button onClick={() => navigate('/create-travel-request')} icon={Plus} size="lg">
          Create Travel Request
        </Button>
      </div>

      {/* Travel Requests List */}
      {travelRequests.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No travel requests yet"
          description="You haven't created any travel requests. Create your first travel request to get started."
          action="Create Travel Request"
          onAction={() => navigate('/create-travel-request')}
        />
      ) : (
        <div>
          {/* Status Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <KPICard
              title="Total Requests"
              value={travelRequests.length}
              subtitle="All time"
              icon={Plane}
              color="primary"
              size="sm"
            />
            <KPICard
              title="Pending"
              value={travelRequests.filter(r => r.status === 'pending').length}
              subtitle="Awaiting approval"
              icon={Calendar}
              color={travelRequests.filter(r => r.status === 'pending').length > 0 ? 'warning' : 'success'}
              size="sm"
            />
            <KPICard
              title="Approved"
              value={travelRequests.filter(r => r.status === 'approved').length}
              subtitle="Approved for travel"
              icon={Plane}
              color="success"
              size="sm"
            />
            <KPICard
              title="Rejected"
              value={travelRequests.filter(r => r.status === 'rejected').length}
              subtitle="Not approved"
              icon={X}
              color="danger"
              size="sm"
            />
          </div>

          {/* Request Cards */}
          {travelRequests.map((request) => (
            <TravelRequestCard
              key={request._id}
              request={request}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTravelRequests;
