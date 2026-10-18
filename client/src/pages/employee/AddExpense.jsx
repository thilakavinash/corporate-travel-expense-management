import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, DollarSign, Calendar, Plane, ArrowRight, Check, AlertCircle } from 'lucide-react';
import expenseService from '../../services/expenseService';
import travelService from '../../services/travelService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

function AddExpense() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    travelRequestId: '',
    category: 'transport',
    description: '',
    amount: '',
    date: '',
    receipt: null,
  });
  const [travelRequests, setTravelRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchApprovedTravelRequests();
  }, []);

  const fetchApprovedTravelRequests = async () => {
    try {
      setLoading(true);
      const response = await travelService.getTravelRequests({ status: 'approved' });
      setTravelRequests(response.travelRequests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch travel requests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'receipt') {
      setFormData({ ...formData, receipt: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFormErrors({ ...formErrors, receipt: 'Invalid file type. Please upload JPG, PNG, or PDF' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors({ ...formErrors, receipt: 'File size must be less than 5MB' });
      return;
    }
    setFormData({ ...formData, receipt: file });
    setFormErrors({ ...formErrors, receipt: '' });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, receipt: null });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.travelRequestId) {
      errors.travelRequestId = 'Travel request is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }

    if (!formData.date) {
      errors.date = 'Expense date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('travelRequestId', formData.travelRequestId);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('date', formData.date);
      if (formData.receipt) {
        formDataToSend.append('receipt', formData.receipt);
      }

      const response = await expenseService.createExpense(formDataToSend);
      
      if (response.expense && response.expense._id) {
        navigate(`/expenses/${response.expense._id}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Expense creation error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create expense';
      setError(errorMessage);
      setSubmitting(false);
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

  const uploadAreaStyle = {
    border: '2px dashed var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 150ms ease-in-out',
    backgroundColor: dragActive ? 'var(--color-primary-50)' : 'var(--color-surface-secondary)',
    borderColor: dragActive ? 'var(--color-primary)' : 'var(--color-border)',
  };

  const uploadIconStyle = {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-base)',
    backgroundColor: 'var(--color-primary-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  };

  const filePreviewStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--color-success-50)',
    border: '1px solid var(--color-success-200)',
    borderRadius: 'var(--radius-base)',
    marginTop: '16px',
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

  if (loading) {
    return <LoadingState message="Loading approved travel requests..." />;
  }

  if (travelRequests.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
            Add Expense
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            Submit expense reports for your approved travel requests
          </p>
        </div>
        <EmptyState
          icon={Plane}
          title="No approved travel requests found"
          description="You can only add expenses to approved travel requests. Create and get approval for a travel request first."
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
          Add Expense
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Submit expense reports for your approved travel requests
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      <Card variant="elevated" padding="xl">
        <form onSubmit={handleSubmit}>
          {/* Travel Request Section */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Plane size={20} />
              Travel Request
            </h2>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                Select Trip <span style={{ color: 'var(--color-danger-500)' }}>*</span>
              </label>
              <select
                name="travelRequestId"
                value={formData.travelRequestId}
                onChange={handleChange}
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
                <option value="">Select an approved trip...</option>
                {travelRequests.map((request) => (
                  <option key={request._id} value={request._id}>
                    {request.destination} ({request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'} - {request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A'})
                  </option>
                ))}
              </select>
              {formErrors.travelRequestId && (
                <div style={{ color: 'var(--color-danger-500)', fontSize: '12px', marginTop: '4px' }}>
                  {formErrors.travelRequestId}
                </div>
              )}
            </div>
          </div>

          {/* Expense Details Section */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <FileText size={20} />
              Expense Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                  Category <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
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
                  <option value="transport">Transport</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="food">Food</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <Input
                type="number"
                name="amount"
                label="Amount (₹)"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                error={formErrors.amount}
                icon={DollarSign}
              />
            </div>

            <Input
              type="text"
              name="description"
              label="Description"
              placeholder="e.g., Flight ticket, Hotel stay, Taxi fare"
              value={formData.description}
              onChange={handleChange}
              required
              error={formErrors.description}
              icon={FileText}
            />

            <Input
              type="date"
              name="date"
              label="Expense Date"
              value={formData.date}
              onChange={handleChange}
              required
              error={formErrors.date}
              icon={Calendar}
            />
          </div>

          {/* Receipt Upload Section */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Upload size={20} />
              Receipt
            </h2>

            {!formData.receipt ? (
              <div
                style={uploadAreaStyle}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('receipt-input').click()}
              >
                <input
                  id="receipt-input"
                  type="file"
                  name="receipt"
                  onChange={handleFileSelect}
                  accept=".jpg,.jpeg,.png,.pdf"
                  style={{ display: 'none' }}
                />
                <div style={uploadIconStyle}>
                  <Upload size={24} style={{ color: 'var(--color-primary-600)' }} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
                  Upload receipt
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  JPG, PNG or PDF · Maximum 5 MB
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  Drag and drop or click to browse
                </div>
              </div>
            ) : (
              <div style={filePreviewStyle}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-base)', backgroundColor: 'var(--color-success-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={20} style={{ color: 'var(--color-success-600)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                    {formData.receipt.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {(formData.receipt.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  icon={X}
                >
                  Remove
                </Button>
              </div>
            )}

            {formErrors.receipt && (
              <div style={{ color: 'var(--color-danger-500)', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} />
                {formErrors.receipt}
              </div>
            )}
          </div>

          {/* Expense Summary */}
          {formData.travelRequestId && formData.description && formData.amount && formData.date && (
            <div style={summaryStyle}>
              <h3 style={summaryTitleStyle}>
                <FileText size={18} />
                Expense Summary
              </h3>
              <div style={summaryItemStyle}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Category</span>
                <span style={{ color: 'var(--color-text)', fontWeight: '600' }}>
                  {getCategoryLabel(formData.category)}
                </span>
              </div>
              <div style={summaryItemStyle}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Description</span>
                <span style={{ color: 'var(--color-text)', fontWeight: '600' }}>
                  {formData.description}
                </span>
              </div>
              <div style={summaryItemStyle}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Date</span>
                <span style={{ color: 'var(--color-text)', fontWeight: '600' }}>
                  {new Date(formData.date).toLocaleDateString()}
                </span>
              </div>
              <div style={summaryItemStyle} style={{ borderBottom: 'none' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Amount</span>
                <span style={{ color: 'var(--color-primary-700)', fontWeight: '700', fontSize: '16px' }}>
                  {formatCurrency(parseFloat(formData.amount) || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/my-expenses')}
              type="button"
              icon={X}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              loading={submitting}
              icon={ArrowRight}
            >
              Submit Expense
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AddExpense;
