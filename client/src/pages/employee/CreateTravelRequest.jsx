import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, MapPin, Calendar, DollarSign, FileText, X, ArrowRight } from 'lucide-react';
import travelService from '../../services/travelService';
import formatCurrency from '../../utils/currencyFormatter';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';

function CreateTravelRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    travelType: 'domestic',
    purpose: '',
    destination: '',
    startDate: '',
    endDate: '',
    estimatedBudget: '',
    additionalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.purpose.trim()) {
      errors.purpose = 'Purpose is required';
    }

    if (!formData.destination.trim()) {
      errors.destination = 'Destination is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const now = new Date();

      if (end <= start) {
        errors.endDate = 'End date must be after start date';
      }

      if (start < now) {
        errors.startDate = 'Start date cannot be in the past';
      }
    }

    if (!formData.estimatedBudget || parseFloat(formData.estimatedBudget) <= 0) {
      errors.estimatedBudget = 'Budget must be greater than zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await travelService.createTravelRequest(formData);
      navigate(`/travel-requests/${response.travelRequest._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create travel request');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Creating travel request..." />;
  }

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

  const formRowStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
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

  const summaryLabelStyle = {
    color: 'var(--color-text-secondary)',
    fontWeight: '500',
  };

  const summaryValueStyle = {
    color: 'var(--color-text)',
    fontWeight: '600',
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Create Travel Request
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Submit a new travel request for manager approval
        </p>
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      <Card variant="elevated" padding="xl">
        <form onSubmit={handleSubmit}>
          {/* Travel Details Section */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Plane size={20} />
              Travel Details
            </h2>

            <div style={formRowStyle}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                  Travel Type <span style={{ color: 'var(--color-danger-500)' }}>*</span>
                </label>
                <select
                  name="travelType"
                  value={formData.travelType}
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
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </div>

              <Input
                type="text"
                name="purpose"
                label="Purpose"
                placeholder="e.g., Client meeting, Conference"
                value={formData.purpose}
                onChange={handleChange}
                required
                error={formErrors.purpose}
                icon={FileText}
              />
            </div>

            <Input
              type="text"
              name="destination"
              label="Destination"
              placeholder="e.g., New York, London"
              value={formData.destination}
              onChange={handleChange}
              required
              error={formErrors.destination}
              icon={MapPin}
            />
          </div>

          {/* Travel Dates Section */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Calendar size={20} />
              Travel Dates
            </h2>

            <div style={formRowStyle}>
              <Input
                type="date"
                name="startDate"
                label="Start Date"
                value={formData.startDate}
                onChange={handleChange}
                required
                error={formErrors.startDate}
                icon={Calendar}
              />

              <Input
                type="date"
                name="endDate"
                label="End Date"
                value={formData.endDate}
                onChange={handleChange}
                required
                error={formErrors.endDate}
                icon={Calendar}
              />
            </div>
          </div>

          {/* Budget Section */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <DollarSign size={20} />
              Budget
            </h2>

            <Input
              type="number"
              name="estimatedBudget"
              label="Estimated Budget (₹)"
              placeholder="Enter amount"
              value={formData.estimatedBudget}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              error={formErrors.estimatedBudget}
              icon={DollarSign}
              helperText="Enter the total estimated cost for this trip"
            />
          </div>

          {/* Additional Notes */}
          <div style={sectionStyle}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
              Additional Notes (Optional)
            </label>
            <textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              placeholder="Any additional information..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontFamily: 'var(--font-family)',
                color: 'var(--color-text)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                minHeight: '100px',
                resize: 'vertical',
                transition: 'border-color 150ms ease-in-out, box-shadow 150ms ease-in-out',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px var(--color-primary-100)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Request Summary */}
          {formData.purpose && formData.destination && formData.startDate && formData.endDate && formData.estimatedBudget && (
            <div style={summaryStyle}>
              <h3 style={summaryTitleStyle}>
                <FileText size={18} />
                Request Summary
              </h3>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Travel Type</span>
                <span style={summaryValueStyle}>
                  {formData.travelType.charAt(0).toUpperCase() + formData.travelType.slice(1)}
                </span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Destination</span>
                <span style={summaryValueStyle}>{formData.destination}</span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Purpose</span>
                <span style={summaryValueStyle}>{formData.purpose}</span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Dates</span>
                <span style={summaryValueStyle}>
                  {new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}
                </span>
              </div>
              <div style={summaryItemStyle} style={{ borderBottom: 'none' }}>
                <span style={summaryLabelStyle}>Estimated Budget</span>
                <span style={{ ...summaryValueStyle, color: 'var(--color-primary-700)', fontSize: '16px' }}>
                  {formatCurrency(parseFloat(formData.estimatedBudget) || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/my-travel')}
              type="button"
              icon={X}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              icon={ArrowRight}
            >
              Submit Travel Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CreateTravelRequest;
