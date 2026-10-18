import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Calendar, Plane, CheckCircle, AlertCircle, ArrowRight, DollarSign, User, FileText } from 'lucide-react';
import reimbursementService from '../../services/reimbursementService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

function ReimbursementReview() {
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
      const response = await reimbursementService.getReimbursements({ status: 'pending' });
      setReimbursements(response.reimbursements || []);
    } catch (err) {
      console.error('Fetch reimbursements error:', err);
      setError(err.response?.data?.message || 'Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  const PendingReimbursementCard = ({ reimbursement }) => (
    <Card
      variant="elevated"
      hoverable={true}
      onClick={() => navigate(`/reimbursements/${reimbursement._id}`)}
      style={{ padding: '24px', border: '2px solid var(--color-primary-200)' }}
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
            {reimbursement.employeeId?.firstName} {reimbursement.employeeId?.lastName} • {reimbursement.employeeId?.employeeId} • {reimbursement.employeeId?.department || 'Department'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: '500' }}>
            {reimbursement.travelRequestId?.purpose || 'No purpose'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Claim Amount
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={14} />
            {formatCurrency(reimbursement.totalAmount)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Travel Dates
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {reimbursement.travelRequestId?.startDate ? new Date(reimbursement.travelRequestId.startDate).toLocaleDateString() : 'N/A'} - {reimbursement.travelRequestId?.endDate ? new Date(reimbursement.travelRequestId.endDate).toLocaleDateString() : 'N/A'}
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
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          Claim ID: {reimbursement._id.slice(-8)}
        </div>
        <Button size="sm" icon={ArrowRight}>
          Review Claim
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return <LoadingState message="Loading pending reimbursements..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReimbursements} />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Reimbursement Review
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Review and process employee reimbursement claims
        </p>
      </div>

      {/* Pending Reimbursements Alert */}
      {reimbursements.length > 0 && (
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
                {reimbursements.length} pending reimbursement claim{reimbursements.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-warning-700)' }}>
                Review and process reimbursement claims from employees
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Reimbursements List */}
      {reimbursements.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No pending reimbursements"
          description="All reimbursement claims have been reviewed. Check back later for new claims."
        />
      ) : (
        <div>
          {reimbursements.map((reimbursement) => (
            <PendingReimbursementCard key={reimbursement._id} reimbursement={reimbursement} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ReimbursementReview;
