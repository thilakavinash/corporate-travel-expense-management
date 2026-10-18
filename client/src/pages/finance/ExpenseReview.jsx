import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Calendar, Plane, CheckCircle, AlertCircle, ArrowRight, FileText, Receipt, ExternalLink } from 'lucide-react';
import expenseService from '../../services/expenseService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

function ExpenseReview() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  const fetchPendingExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getExpenses({ status: 'pending' });
      setExpenses(response.expenses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending expenses');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      transport: 'Transport',
      accommodation: 'Accommodation',
      food: 'Food',
      miscellaneous: 'Miscellaneous',
    };
    return labels[category] || category;
  };

  const PendingExpenseCard = ({ expense }) => (
    <Card
      variant="elevated"
      hoverable={true}
      onClick={() => navigate(`/expenses/${expense._id}`)}
      style={{ padding: '24px', border: '2px solid var(--color-primary-200)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
              {getCategoryLabel(expense.category)}
            </h3>
            <StatusBadge status={expense.status} />
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            {expense.description}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: '500' }}>
            {expense.employeeId?.firstName} {expense.employeeId?.lastName} • {expense.employeeId?.employeeId} • {expense.employeeId?.department || 'Department'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Travel Destination
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plane size={14} />
            {expense.travelRequestId?.destination || 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Expense Date
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {new Date(expense.date).toLocaleDateString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Amount
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={14} />
            {formatCurrency(expense.amount)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Receipt
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {expense.receiptUrl ? (
              <>
                <CheckCircle size={14} style={{ color: 'var(--color-success-600)' }} />
                Attached
              </>
            ) : (
              'None'
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
          Submitted {new Date(expense.createdAt).toLocaleDateString()}
        </div>
        <Button size="sm" icon={ArrowRight}>
          Review Expense
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return <LoadingState message="Loading pending expenses..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPendingExpenses} />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Expense Review
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Review employee expenses and process finance approvals
        </p>
      </div>

      {/* Pending Expenses Alert */}
      {expenses.length > 0 && (
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
                {expenses.length} pending expense{expenses.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-warning-700)' }}>
                Review and process expense reports from employees
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Expenses List */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No pending expenses"
          description="All expenses have been reviewed. Check back later for new expense submissions."
        />
      ) : (
        <div>
          {expenses.map((expense) => (
            <PendingExpenseCard key={expense._id} expense={expense} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExpenseReview;
