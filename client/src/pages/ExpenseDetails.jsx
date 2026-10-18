import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, User, FileText, Plane, CheckCircle, XCircle, Clock, MessageSquare, ExternalLink, Check, Receipt } from 'lucide-react';
import expenseService from '../services/expenseService';
import { useAuth } from '../context/AuthContext';
import formatCurrency from '../utils/currencyFormatter';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

function ExpenseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvalData, setApprovalData] = useState({ comments: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getExpenseById(id);
      setExpense(response.expense);
    } catch (err) {
      console.error('Fetch expense error:', err);
      setError(err.response?.data?.message || 'Failed to fetch expense');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await expenseService.approveExpense(id, approvalData);
      fetchExpense();
      setApprovalData({ comments: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve expense');
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await expenseService.rejectExpense(id, approvalData);
      fetchExpense();
      setApprovalData({ comments: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject expense');
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
  const canApprove = isFinance && expense?.status === 'pending';

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
    return <LoadingState message="Loading expense details..." />;
  }

  if (error && !expense) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} icon={ArrowLeft}>
          Back
        </Button>
        <ErrorState message={error} onRetry={fetchExpense} />
      </div>
    );
  }

  if (!expense) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} icon={ArrowLeft}>
          Back
        </Button>
        <EmptyState icon={DollarSign} title="Expense not found" description="The requested expense could not be found." />
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
              Expense Details
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
              {getCategoryLabel(expense.category)}
            </p>
          </div>
        </div>
        <StatusBadge status={expense.status} />
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      {/* Workflow Timeline */}
      <Card variant="elevated" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px' }}>
          Approval Status
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <TimelineStep
            icon={Clock}
            label="Expense Submitted"
            status="completed"
            date={expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : null}
          />
          <TimelineStep
            icon={CheckCircle}
            label="Finance Review"
            status={
              expense.status === 'pending' ? 'active' :
              expense.status === 'rejected' ? 'completed' :
              expense.status === 'approved' ? 'completed' : 'pending'
            }
            date={expense.financeApproval?.approvedAt ? new Date(expense.financeApproval.approvedAt).toLocaleDateString() : null}
          />
          <TimelineStep
            icon={Receipt}
            label="Reimbursement Eligible"
            status={
              expense.status === 'approved' ? 'active' :
              expense.status === 'approved' ? 'completed' : 'pending'
            }
            isLast={true}
          />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Expense Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} />
            Expense Information
          </h2>
          <DetailRow
            icon={FileText}
            label="Category"
            value={getCategoryLabel(expense.category)}
          />
          <DetailRow
            icon={FileText}
            label="Description"
            value={expense.description || 'N/A'}
          />
          <DetailRow
            icon={DollarSign}
            label="Amount"
            value={formatCurrency(expense.amount)}
          />
          <DetailRow
            icon={Calendar}
            label="Expense Date"
            value={expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
          />
        </Card>

        {/* Travel Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plane size={20} />
            Travel Information
          </h2>
          <DetailRow
            icon={Plane}
            label="Destination"
            value={expense.travelRequestId?.destination || 'N/A'}
          />
          <DetailRow
            icon={Calendar}
            label="Travel Dates"
            value={`${expense.travelRequestId?.startDate ? new Date(expense.travelRequestId.startDate).toLocaleDateString() : 'N/A'} - ${expense.travelRequestId?.endDate ? new Date(expense.travelRequestId.endDate).toLocaleDateString() : 'N/A'}`}
          />
          <DetailRow
            icon={FileText}
            label="Purpose"
            value={expense.travelRequestId?.purpose || 'N/A'}
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
            value={`${expense.employeeId?.firstName || ''} ${expense.employeeId?.lastName || ''} (${expense.employeeId?.employeeId || 'N/A'})`}
          />
          <DetailRow
            icon={FileText}
            label="Department"
            value={expense.employeeId?.department || 'N/A'}
          />
        </Card>

        {/* Receipt */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} />
            Receipt
          </h2>
          {expense.receiptUrl ? (
            <div>
              <div style={{ fontSize: '14px', color: 'var(--color-success-700)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} />
                Receipt attached
              </div>
              <Button
                variant="secondary"
                onClick={() => window.open(`http://localhost:5000${expense.receiptUrl}`, '_blank')}
                icon={ExternalLink}
              >
                View Receipt
              </Button>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={16} />
              No receipt uploaded
            </div>
          )}
        </Card>

        {/* Approval Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} />
            Approval Status
          </h2>
          {expense.financeApproval && expense.financeApproval.status && expense.financeApproval.status !== 'pending' ? (
            <>
              <DetailRow
                icon={expense.financeApproval.status === 'approved' ? CheckCircle : XCircle}
                label="Decision"
                value={expense.financeApproval.status.charAt(0).toUpperCase() + expense.financeApproval.status.slice(1)}
              />
              {expense.financeApproval.approvedBy && (
                <DetailRow
                  icon={User}
                  label="Reviewed By"
                  value={`${expense.financeApproval.approvedBy.firstName || ''} ${expense.financeApproval.approvedBy.lastName || ''}`}
                />
              )}
              {expense.financeApproval.approvedAt && (
                <DetailRow
                  icon={Calendar}
                  label="Review Date"
                  value={new Date(expense.financeApproval.approvedAt).toLocaleString()}
                />
              )}
              {expense.financeApproval.comments && (
                <div style={{ padding: '12px 0', marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={14} />
                    Comments
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6', backgroundColor: 'var(--color-surface-secondary)', padding: '12px', borderRadius: 'var(--radius-base)' }}>
                    {expense.financeApproval.comments}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '12px 0', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} />
              Pending finance review
            </div>
          )}
        </Card>

        {/* Request Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} />
            Request Information
          </h2>
          <DetailRow
            icon={CheckCircle}
            label="Status"
            value={expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
          />
          <DetailRow
            icon={Calendar}
            label="Created"
            value={new Date(expense.createdAt).toLocaleString()}
          />
          <DetailRow
            icon={Calendar}
            label="Last Updated"
            value={new Date(expense.updatedAt).toLocaleString()}
          />
        </Card>
      </div>

      {/* Finance Approval Section */}
      {canApprove && (
        <Card variant="elevated" style={{ padding: '24px', border: '2px solid var(--color-primary-200)', backgroundColor: 'var(--color-primary-50)' }}>
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
              {submitting ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={submitting}
              icon={XCircle}
            >
              {submitting ? 'Processing...' : 'Reject'}
            </Button>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
              Comments (Optional)
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
    </div>
  );
}

export default ExpenseDetails;
