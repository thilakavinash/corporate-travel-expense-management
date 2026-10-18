import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, ArrowRight, X, DollarSign, FileText, CheckCircle, AlertCircle, Wallet, Calendar, Info } from 'lucide-react';
import reimbursementService from '../../services/reimbursementService';
import travelService from '../../services/travelService';
import expenseService from '../../services/expenseService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

function CreateReimbursement() {
  const navigate = useNavigate();
  const [travelRequests, setTravelRequests] = useState([]);
  const [selectedTravelRequestId, setSelectedTravelRequestId] = useState('');
  const [approvedExpenses, setApprovedExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEligibleTravelRequests();
  }, []);

  const fetchEligibleTravelRequests = async () => {
    try {
      setLoading(true);
      const response = await travelService.getTravelRequests({ status: 'approved' });
      const approvedRequests = response.travelRequests || [];
      
      // Filter to only show travel requests with approved expenses
      const eligibleRequests = [];
      
      for (const request of approvedRequests) {
        const expensesResponse = await expenseService.getExpensesByTravelRequest(request._id);
        const expenses = expensesResponse.expenses || [];
        const approvedExpenses = expenses.filter(
          exp => exp.status === 'approved'
        );
        if (approvedExpenses.length > 0) {
          eligibleRequests.push({
            ...request,
            approvedExpensesCount: approvedExpenses.length,
          });
        }
      }
      
      setTravelRequests(eligibleRequests);
    } catch (err) {
      console.error('Fetch travel requests error:', err);
      setError(err.response?.data?.message || 'Failed to fetch travel requests');
    } finally {
      setLoading(false);
    }
  };

  const handleTravelRequestChange = async (e) => {
    const travelRequestId = e.target.value;
    setSelectedTravelRequestId(travelRequestId);
    setApprovedExpenses([]);
    setTotalAmount(0);
    setError(null);

    if (travelRequestId) {
      try {
        const expensesResponse = await expenseService.getExpensesByTravelRequest(travelRequestId);
        const expenses = expensesResponse.expenses || [];
        const approved = expenses.filter(
          exp => exp.status === 'approved'
        );
        setApprovedExpenses(approved);
        const total = approved.reduce((sum, exp) => sum + exp.amount, 0);
        setTotalAmount(total);
      } catch (err) {
        console.error('Fetch expenses error:', err);
        setError(err.response?.data?.message || 'Failed to fetch expenses');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!selectedTravelRequestId) {
        throw new Error('Please select a travel request');
      }

      if (approvedExpenses.length === 0) {
        throw new Error('No approved expenses found for the selected travel request');
      }

      const response = await reimbursementService.createReimbursement({
        travelRequestId: selectedTravelRequestId,
      });

      if (response.reimbursement && response.reimbursement._id) {
        navigate(`/reimbursements/${response.reimbursement._id}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Reimbursement creation error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create reimbursement claim';
      setError(errorMessage);
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

  const sectionStyle = {
    marginBottom: '32px',
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--color-text)',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const infoBoxStyle = {
    padding: '16px',
    backgroundColor: 'var(--color-info-50)',
    borderRadius: 'var(--radius-base)',
    marginBottom: '24px',
    border: '1px solid var(--color-info-200)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const summaryStyle = {
    padding: '24px',
    backgroundColor: 'var(--color-primary-50)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '32px',
    border: '1px solid var(--color-primary-200)',
  };

  const summaryTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--color-primary-800)',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const summaryItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--color-primary-200)',
    fontSize: '14px',
  };

  const expenseItemStyle = {
    padding: '16px',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-base)',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  if (loading) {
    return <LoadingState message="Loading eligible travel requests..." />;
  }

  if (travelRequests.length === 0) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
            Create Reimbursement Claim
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            Submit reimbursement claims for your approved travel expenses
          </p>
        </div>
        <EmptyState
          icon={Plane}
          title="No eligible travel requests found"
          description="You need approved travel requests with approved expenses to create a reimbursement claim."
          action="View My Travel Requests"
          onAction={() => navigate('/my-travel')}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Create Reimbursement Claim
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Submit reimbursement claims for your approved travel expenses
        </p>
      </div>

      {/* Info Box */}
      <div style={infoBoxStyle}>
        <Info size={20} style={{ color: 'var(--color-info-600)' }} />
        <div style={{ fontSize: '14px', color: 'var(--color-info-800)', lineHeight: '1.5' }}>
          Reimbursement claims are automatically calculated from your approved expenses. The total amount cannot be manually edited.
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      <Card variant="elevated" padding="xl">
        <form onSubmit={handleSubmit}>
          {/* Travel Request Selection */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Plane size={20} />
              Select Travel Request
            </h2>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                Choose a travel request <span style={{ color: 'var(--color-danger-500)' }}>*</span>
              </label>
              <select
                value={selectedTravelRequestId}
                onChange={handleTravelRequestChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontFamily: 'var(--font-family)',
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-base)',
                  cursor: 'pointer',
                }}
              >
                <option value="">Choose a travel request...</option>
                {travelRequests.map((request) => (
                  <option key={request._id} value={request._id}>
                    {request.destination} - {request.purpose} ({request.approvedExpensesCount} approved expenses)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTravelRequestId && approvedExpenses.length > 0 && (
            <>
              {/* Travel Information */}
              <div style={sectionStyle}>
                <h2 style={sectionTitleStyle}>
                  <Info size={20} />
                  Travel Information
                </h2>
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                }}>
                  {(() => {
                    const selectedRequest = travelRequests.find(r => r._id === selectedTravelRequestId);
                    return selectedRequest ? (
                      <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.8' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Destination:</span>
                          <span style={{ color: 'var(--color-text)', fontWeight: '600', marginLeft: '8px' }}>
                            {selectedRequest.destination}
                          </span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Purpose:</span>
                          <span style={{ color: 'var(--color-text)', fontWeight: '600', marginLeft: '8px' }}>
                            {selectedRequest.purpose}
                          </span>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Type:</span>
                          <span style={{ color: 'var(--color-text)', fontWeight: '600', marginLeft: '8px' }}>
                            {selectedRequest.travelType?.charAt(0).toUpperCase() + selectedRequest.travelType?.slice(1)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Dates:</span>
                          <span style={{ color: 'var(--color-text)', fontWeight: '600', marginLeft: '8px' }}>
                            {selectedRequest.startDate ? new Date(selectedRequest.startDate).toLocaleDateString() : 'N/A'} - {selectedRequest.endDate ? new Date(selectedRequest.endDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Eligible Expenses */}
              <div style={sectionStyle}>
                <h2 style={sectionTitleStyle}>
                  <FileText size={20} />
                  Eligible Approved Expenses
                </h2>
                <div>
                  {approvedExpenses.map((expense) => (
                    <div key={expense._id} style={expenseItemStyle}>
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
                </div>
              </div>

              {/* Reimbursement Summary */}
              <div style={summaryStyle}>
                <h3 style={summaryTitleStyle}>
                  <Wallet size={18} />
                  Reimbursement Summary
                </h3>
                <div style={summaryItemStyle}>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Total Claim Amount</span>
                  <span style={{ color: 'var(--color-primary-700)', fontWeight: '700', fontSize: '20px' }}>
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  Amount calculated from {approvedExpenses.length} approved expense{approvedExpenses.length !== 1 ? 's' : ''}
                </div>
              </div>
            </>
          )}

          {selectedTravelRequestId && approvedExpenses.length === 0 && (
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--color-danger-50)',
              borderRadius: 'var(--radius-base)',
              marginBottom: '32px',
              border: '1px solid var(--color-danger-200)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <AlertCircle size={20} style={{ color: 'var(--color-danger-600)' }} />
              <p style={{ fontSize: '14px', color: 'var(--color-danger-700)', margin: 0 }}>
                No approved expenses found for this travel request. Please ensure your expenses have been approved by Finance before creating a reimbursement claim.
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/my-reimbursements')}
              type="button"
              icon={X}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || approvedExpenses.length === 0}
              loading={submitting}
              icon={ArrowRight}
            >
              Submit Claim
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CreateReimbursement;
