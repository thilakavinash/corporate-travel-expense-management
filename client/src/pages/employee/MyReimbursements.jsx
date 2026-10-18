import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Calendar, DollarSign, Plus, CheckCircle, Clock, Plane, User } from 'lucide-react';
import reimbursementService from '../../services/reimbursementService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import KPICard from '../../components/ui/KPICard';

function MyReimbursements() {
  const navigate = useNavigate();
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const response = await reimbursementService.getMyReimbursements();
      setReimbursements(response.reimbursements || []);
    } catch (err) {
      console.error('Fetch reimbursements error:', err);
      setError(err.response?.data?.message || 'Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  const ReimbursementCard = ({ reimbursement }) => (
    <Card
      variant="elevated"
      hoverable={true}
      onClick={() => navigate(`/reimbursements/${reimbursement._id}`)}
      style={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
              {reimbursement.travelRequestId?.destination || 'N/A'}
            </h3>
            <StatusBadge status={reimbursement.status} />
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            {reimbursement.travelRequestId?.purpose || 'No purpose'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plane size={12} />
            {reimbursement.travelRequestId?.startDate ? new Date(reimbursement.travelRequestId.startDate).toLocaleDateString() : 'N/A'} - {reimbursement.travelRequestId?.endDate ? new Date(reimbursement.travelRequestId.endDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Claim Amount
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={14} />
            {formatCurrency(reimbursement.totalAmount)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Submitted
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {reimbursement.createdAt ? new Date(reimbursement.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Processed
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
            {reimbursement.processedAt ? new Date(reimbursement.processedAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>

      {reimbursement.processedBy && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
          <User size={12} />
          Processed by: {reimbursement.processedBy.firstName || ''} {reimbursement.processedBy.lastName || ''}
        </div>
      )}
    </Card>
  );

  if (loading) {
    return <LoadingState message="Loading reimbursements..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReimbursements} />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
            My Reimbursements
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            Track and manage your reimbursement claims
          </p>
        </div>
        <Button onClick={() => navigate('/create-reimbursement')} icon={Plus} size="lg">
          Create Reimbursement
        </Button>
      </div>

      {/* Reimbursements List */}
      {reimbursements.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No reimbursement claims yet"
          description="You haven't submitted any reimbursement claims. Create a claim for your approved travel expenses to get started."
          action="Create Reimbursement"
          onAction={() => navigate('/create-reimbursement')}
        />
      ) : (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <KPICard
              title="Total Claims"
              value={reimbursements.length}
              subtitle="All time"
              icon={Wallet}
              color="primary"
              size="sm"
            />
            <KPICard
              title="Pending"
              value={reimbursements.filter(r => r.status === 'pending').length}
              subtitle="Awaiting review"
              icon={Clock}
              color={reimbursements.filter(r => r.status === 'pending').length > 0 ? 'warning' : 'success'}
              size="sm"
            />
            <KPICard
              title="Approved"
              value={reimbursements.filter(r => r.status === 'approved').length}
              subtitle="Approved for payment"
              icon={CheckCircle}
              color="success"
              size="sm"
            />
            <KPICard
              title="Paid"
              value={reimbursements.filter(r => r.status === 'paid').length}
              subtitle="Successfully paid"
              icon={CheckCircle}
              color="success"
              size="sm"
            />
            <KPICard
              title="Total Reimbursed"
              value={formatCurrency(reimbursements.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.totalAmount || 0), 0))}
              subtitle="Total amount paid"
              icon={DollarSign}
              color="success"
              size="sm"
            />
          </div>

          {/* Reimbursement Cards */}
          {reimbursements.map((reimbursement) => (
            <ReimbursementCard key={reimbursement._id} reimbursement={reimbursement} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReimbursements;
