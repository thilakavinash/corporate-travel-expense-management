import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Calendar, FileText, Plus, CheckCircle, Receipt, Plane } from 'lucide-react';
import expenseService from '../../services/expenseService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import KPICard from '../../components/ui/KPICard';

function MyExpenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getExpenses();
      setExpenses(response.expenses || []);
    } catch (err) {
      console.error('Fetch expenses error:', err);
      setError(err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
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

  const ExpenseCard = ({ expense }) => (
    <Card
      variant="elevated"
      hoverable={true}
      onClick={() => navigate(`/expenses/${expense._id}`)}
      style={{ padding: '24px' }}
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
            {expense.description || 'No description'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plane size={12} />
            {expense.travelRequestId?.destination || 'No trip assigned'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Expense Date
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '4px', fontWeight: '500' }}>
            Amount
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

      <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
        Created {new Date(expense.createdAt).toLocaleDateString()}
      </div>
    </Card>
  );

  if (loading) {
    return <LoadingState message="Loading expenses..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchExpenses} />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
            My Expenses
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            Track and manage expenses submitted for your business travel
          </p>
        </div>
        <Button onClick={() => navigate('/add-expense')} icon={Plus} size="lg">
          Add Expense
        </Button>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No expenses yet"
          description="You haven't submitted any expenses. Add expenses for your approved travel requests to get started."
          action="Add Expense"
          onAction={() => navigate('/add-expense')}
        />
      ) : (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <KPICard
              title="Total Expenses"
              value={expenses.length}
              subtitle="All time"
              icon={FileText}
              color="primary"
              size="sm"
            />
            <KPICard
              title="Pending"
              value={expenses.filter(e => e.status === 'pending').length}
              subtitle="Awaiting review"
              icon={Calendar}
              color={expenses.filter(e => e.status === 'pending').length > 0 ? 'warning' : 'success'}
              size="sm"
            />
            <KPICard
              title="Approved"
              value={expenses.filter(e => e.status === 'approved').length}
              subtitle="Approved expenses"
              icon={CheckCircle}
              color="success"
              size="sm"
            />
            <KPICard
              title="Approved Amount"
              value={formatCurrency(expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount || 0), 0))}
              subtitle="Total approved"
              icon={DollarSign}
              color="success"
              size="sm"
            />
          </div>

          {/* Expense Cards */}
          {expenses.map((expense) => (
            <ExpenseCard key={expense._id} expense={expense} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyExpenses;
