import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, DollarSign, Calendar, User, FileText, CheckCircle, XCircle, Clock, Wallet, MessageSquare, Check, ChevronRight } from 'lucide-react';
import reimbursementService from '../services/reimbursementService';
import { useAuth } from '../context/AuthContext';
import formatCurrency from '../utils/currencyFormatter';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

function ReimbursementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reimbursement, setReimbursement] = useState(null);
  const [approvedExpenses, setApprovedExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvalData, setApprovalData] = useState({ comments: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReimbursement();
  }, [id]);

  const fetchReimbursement = async () => {
    try {
      setLoading(true);
      const response = await reimbursementService.getReimbursementById(id);
      setReimbursement(response.reimbursement);
      setApprovedExpenses(response.approvedExpenses || []);
    } catch (err) {
      console.error('Fetch reimbursement error:', err);
      setError(err.response?.data?.message || 'Failed to fetch reimbursement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await reimbursementService.approveReimbursement(id, approvalData);
      fetchReimbursement();
      setApprovalData({ comments: '' });
    } catch (err) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve reimbursement');
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!approvalData.comments || approvalData.comments.trim() === '') {
      setError('Rejection comment is required');
      setSubmitting(false);
      return;
    }

    try {
      await reimbursementService.rejectReimbursement(id, approvalData);
      fetchReimbursement();
      setApprovalData({ comments: '' });
    } catch (err) {
      console.error('Reject error:', err);
      setError(err.response?.data?.message || 'Failed to reject reimbursement');
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await reimbursementService.markReimbursementPaid(id, { comments: approvalData.comments });
      fetchReimbursement();
      setApprovalData({ comments: '' });
    } catch (err) {
      console.error('Mark paid error:', err);
      setError(err.response?.data?.message || 'Failed to mark reimbursement as paid');
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (category) => {
    if (!category) return 'N/A';
    const labels = {
      transport: 'Transport',
      accommodation: 'Accommodation',
      food: 'Food',
      miscellaneous: 'Miscellaneous',
    };
    return labels[category] || category;
  };

  const isFinance = user?.role === 'finance';
  const canApprove = isFinance && reimbursement?.status === 'pending';
  const canMarkPaid = isFinance && reimbursement?.status === 'approved';

  const DetailRow = ({ icon: Icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
      <Icon size={16} style={{ color: 'var(--color-text-tertiary)', marginTop: '2px', minWidth: '16px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
          {value}
        </div>
      </div>
    </div>
  );

  const TimelineStep = ({ icon: Icon, label, status, date, isLast }) => {
    const isActive = status === 'active';
    const isCompleted = status === 'completed';
    
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isActive ? 'var(--color-primary-100)' : isCompleted ? 'var(--color-success-100)' : 'var(--color-gray-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid',
            borderColor: isActive ? 'var(--color-primary)' : isCompleted ? 'var(--color-success)' : 'var(--color-gray-300)',
          }}>
            <Icon size={16} style={{ color: isActive ? 'var(--color-primary-600)' : isCompleted ? 'var(--color-success-600)' : 'var(--color-gray-400)' }} />
          </div>
          {!isLast && (
            <div style={{
              width: '2px',
              height: '24px',
              backgroundColor: isCompleted ? 'var(--color-success-300)' : 'var(--color-gray-200)',
              marginTop: '8px',
            }} />
          )}
        </div>
        <div style={{ flex: 1, paddingTop: '4px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: isActive ? 'var(--color-primary-700)' : isCompleted ? 'var(--color-success-700)' : 'var(--color-text-tertiary)' }}>
            {label}
          </div>
          {date && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {date}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingState message="Loading reimbursement details..." />;
  }

  if (error && !reimbursement) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} icon={ArrowLeft}>
          Back
        </Button>
        <ErrorState message={error} onRetry={fetchReimbursement} />
      </div>
    );
  }

  if (!reimbursement) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} icon={ArrowLeft}>
          Back
        </Button>
        <EmptyState icon={Wallet} title="Reimbursement not found" description="The requested reimbursement could not be found." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="ghost" onClick={() => navigate(-1)} icon={ArrowLeft}>
            Back
          </Button>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
              Reimbursement Details
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
              {reimbursement.travelRequestId?.destination || 'N/A'}
            </p>
          </div>
        </div>
        <StatusBadge status={reimbursement.status} />
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      {/* Workflow Timeline */}
      <Card variant="elevated" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px' }}>
          Workflow Status
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <TimelineStep
            icon={Clock}
            label="Claim Submitted"
            status="completed"
            date={reimbursement.createdAt ? new Date(reimbursement.createdAt).toLocaleDateString() : null}
          />
          <TimelineStep
            icon={CheckCircle}
            label="Finance Review"
            status={
              reimbursement.status === 'pending' ? 'active' :
              reimbursement.status === 'rejected' ? 'completed' :
              reimbursement.status === 'approved' || reimbursement.status === 'paid' ? 'completed' : 'pending'
            }
            date={reimbursement.processedAt ? new Date(reimbursement.processedAt).toLocaleDateString() : null}
          />
          <TimelineStep
            icon={Wallet}
            label="Payment"
            status={
              reimbursement.status === 'paid' ? 'completed' :
              reimbursement.status === 'approved' ? 'active' : 'pending'
            }
            date={reimbursement.status === 'paid' && reimbursement.processedAt ? new Date(reimbursement.processedAt).toLocaleDateString() : null}
            isLast={true}
          />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Travel Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plane size={20} />
            Travel Information
          </h2>
          <DetailRow
            icon={Plane}
            label="Destination"
            value={reimbursement.travelRequestId?.destination || 'N/A'}
          />
          <DetailRow
            icon={FileText}
            label="Purpose"
            value={reimbursement.travelRequestId?.purpose || 'N/A'}
          />
          <DetailRow
            icon={Calendar}
            label="Travel Dates"
            value={`${reimbursement.travelRequestId?.startDate ? new Date(reimbursement.travelRequestId.startDate).toLocaleDateString() : 'N/A'} - ${reimbursement.travelRequestId?.endDate ? new Date(reimbursement.travelRequestId.endDate).toLocaleDateString() : 'N/A'}`}
          />
        </Card>

        {/* People Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} />
            People
          </h2>
          <DetailRow
            icon={User}
            label="Employee"
            value={`${reimbursement.employeeId?.firstName || ''} ${reimbursement.employeeId?.lastName || ''} (${reimbursement.employeeId?.employeeId || 'N/A'})`}
          />
          <DetailRow
            icon={FileText}
            label="Department"
            value={reimbursement.employeeId?.department || 'N/A'}
          />
        </Card>

        {/* Claim Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} />
            Claim Information
          </h2>
          <DetailRow
            icon={DollarSign}
            label="Claim Amount"
            value={formatCurrency(reimbursement.totalAmount)}
          />
          <DetailRow
            icon={CheckCircle}
            label="Status"
            value={reimbursement.status.charAt(0).toUpperCase() + reimbursement.status.slice(1)}
          />
          <DetailRow
            icon={Calendar}
            label="Created"
            value={new Date(reimbursement.createdAt).toLocaleString()}
          />
          {reimbursement.processedAt && (
            <DetailRow
              icon={Calendar}
              label="Processed"
              value={new Date(reimbursement.processedAt).toLocaleString()}
            />
          )}
        </Card>

        {/* Processing Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} />
            Processing Information
          </h2>
          {reimbursement.status !== 'pending' && reimbursement.processedBy ? (
            <>
              <DetailRow
                icon={User}
                label="Processed By"
                value={`${reimbursement.processedBy.firstName || ''} ${reimbursement.processedBy.lastName || ''}`}
              />
              {reimbursement.processedAt && (
                <DetailRow
                  icon={Calendar}
                  label="Processed Date"
                  value={new Date(reimbursement.processedAt).toLocaleString()}
                />
              )}
            </>
          ) : (
            <div style={{ padding: '12px 0', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} />
              Pending finance review
            </div>
          )}
          {reimbursement.comments && (
            <div style={{ padding: '12px 0', marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={14} />
                Comments
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6', backgroundColor: 'var(--color-surface-secondary)', padding: '12px', borderRadius: 'var(--radius-base)' }}>
                {reimbursement.comments}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Approved Expenses */}
      <Card variant="elevated" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} />
          Approved Expenses
        </h2>
        {approvedExpenses.length > 0 ? (
          <>
            {approvedExpenses.map((expense) => (
              <div
                key={expense._id}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-base)',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                    {getCategoryLabel(expense.category)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                    {expense.description || 'No description'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={14} />
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            ))}
            <div style={{
              padding: '20px',
              borderTop: '2px solid var(--color-border)',
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
                Total Reimbursement Amount
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary-700)' }}>
                {formatCurrency(reimbursement.totalAmount)}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '12px 0', color: 'var(--color-text-secondary)' }}>
            No approved expenses found
          </div>
        )}
      </Card>

      {/* Finance Approval Section */}
      {canApprove && (
        <Card variant="elevated" style={{ padding: '24px', marginBottom: '24px', border: '2px solid var(--color-primary-200)', backgroundColor: 'var(--color-primary-50)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-primary-800)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} />
            Finance Review
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              icon={CheckCircle}
            >
              {submitting ? 'Processing...' : 'Approve Claim'}
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={submitting}
              icon={XCircle}
            >
              {submitting ? 'Processing...' : 'Reject Claim'}
            </Button>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
              Comments (Required for rejection)
            </label>
            <textarea
              value={approvalData.comments}
              onChange={(e) => setApprovalData({ comments: e.target.value })}
              placeholder="Add any comments for the employee..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'var(--font-family)',
              }}
            />
          </div>
        </Card>
      )}

      {/* Mark as Paid Section */}
      {canMarkPaid && (
        <Card variant="elevated" style={{ padding: '24px', border: '2px solid var(--color-success-200)', backgroundColor: 'var(--color-success-50)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-success-800)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} />
            Mark as Paid
          </h2>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
              Payment Comments (Optional)
            </label>
            <textarea
              value={approvalData.comments}
              onChange={(e) => setApprovalData({ comments: e.target.value })}
              placeholder="Add payment confirmation details..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'var(--font-family)',
              }}
            />
          </div>
          <div style={{ marginTop: '16px' }}>
            <Button
              onClick={handleMarkPaid}
              disabled={submitting}
              icon={Check}
            >
              {submitting ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ReimbursementDetails;
