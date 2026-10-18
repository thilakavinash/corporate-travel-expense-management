import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, MapPin, Calendar, DollarSign, User, FileText, CheckCircle, XCircle, Clock, MessageSquare, X, Check, ChevronRight } from 'lucide-react';
import travelService from '../services/travelService';
import { useAuth } from '../context/AuthContext';
import formatCurrency from '../utils/currencyFormatter';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

function TravelRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [travelRequest, setTravelRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvalData, setApprovalData] = useState({ status: '', comments: '' });
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchTravelRequest();
  }, [id]);

  const fetchTravelRequest = async () => {
    try {
      setLoading(true);
      const response = await travelService.getTravelRequestById(id);
      setTravelRequest(response.travelRequest);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch travel request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await travelService.managerApproveRequest(id, approvalData);
      fetchTravelRequest();
      setApprovalData({ status: '', comments: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process approval');
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this travel request? This action cannot be undone.')) {
      return;
    }

    setCancelling(true);
    try {
      await travelService.cancelTravelRequest(id);
      fetchTravelRequest();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel travel request');
    } finally {
      setCancelling(false);
    }
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isEmployee = user?.role === 'employee' || user?.role === 'admin';
  const canApprove = isManager && travelRequest?.status === 'pending';
  const canCancel = isEmployee && travelRequest?.status === 'pending' && travelRequest?.employeeId._id === user?.id;

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
    return <LoadingState message="Loading travel request details..." />;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} icon={ArrowLeft}>
          Back
        </Button>
        <ErrorState message={error} onRetry={fetchTravelRequest} />
      </div>
    );
  }

  if (!travelRequest) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} icon={ArrowLeft}>
          Back
        </Button>
        <EmptyState icon={Plane} title="Travel request not found" description="The requested travel request could not be found." />
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
              {travelRequest.destination}
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
              {travelRequest.purpose}
            </p>
          </div>
        </div>
        <StatusBadge status={travelRequest.status} />
      </div>

      {/* Workflow Timeline */}
      <Card variant="elevated" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px' }}>
          Approval Status
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <TimelineStep
            icon={Clock}
            label="Request Submitted"
            status="completed"
            date={travelRequest.createdAt ? new Date(travelRequest.createdAt).toLocaleDateString() : null}
          />
          <TimelineStep
            icon={CheckCircle}
            label="Manager Review"
            status={
              travelRequest.status === 'pending' ? 'active' :
              travelRequest.status === 'rejected' ? 'completed' :
              travelRequest.status === 'approved' ? 'completed' : 'pending'
            }
            date={travelRequest.managerApproval?.approvedAt ? new Date(travelRequest.managerApproval.approvedAt).toLocaleDateString() : null}
          />
          <TimelineStep
            icon={Plane}
            label="Travel"
            status={
              travelRequest.status === 'approved' ? 'active' :
              travelRequest.status === 'completed' ? 'completed' : 'pending'
            }
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
            label="Travel Type"
            value={travelRequest.travelType.charAt(0).toUpperCase() + travelRequest.travelType.slice(1)}
          />
          <DetailRow
            icon={MapPin}
            label="Destination"
            value={travelRequest.destination}
          />
          <DetailRow
            icon={FileText}
            label="Purpose"
            value={travelRequest.purpose}
          />
          <DetailRow
            icon={Calendar}
            label="Travel Dates"
            value={`${travelRequest.startDate ? new Date(travelRequest.startDate).toLocaleDateString() : 'N/A'} - ${travelRequest.endDate ? new Date(travelRequest.endDate).toLocaleDateString() : 'N/A'}`}
          />
          <DetailRow
            icon={DollarSign}
            label="Estimated Budget"
            value={formatCurrency(travelRequest.estimatedBudget)}
          />
          {travelRequest.additionalNotes && (
            <div style={{ padding: '12px 0', marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={14} />
                Additional Notes
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6', backgroundColor: 'var(--color-surface-secondary)', padding: '12px', borderRadius: 'var(--radius-base)' }}>
                {travelRequest.additionalNotes}
              </div>
            </div>
          )}
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
            value={`${travelRequest.employeeId?.firstName || ''} ${travelRequest.employeeId?.lastName || ''} (${travelRequest.employeeId?.employeeId || 'N/A'})`}
          />
          <DetailRow
            icon={User}
            label="Manager"
            value={`${travelRequest.managerId?.firstName || ''} ${travelRequest.managerId?.lastName || ''} (${travelRequest.managerId?.employeeId || 'N/A'})`}
          />
        </Card>

        {/* Approval Information */}
        <Card variant="elevated" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} />
            Approval Status
          </h2>
          {travelRequest.managerApproval && travelRequest.managerApproval.status && travelRequest.managerApproval.status !== 'pending' ? (
            <>
              <DetailRow
                icon={travelRequest.managerApproval.status === 'approved' ? CheckCircle : XCircle}
                label="Decision"
                value={travelRequest.managerApproval.status.charAt(0).toUpperCase() + travelRequest.managerApproval.status.slice(1)}
              />
              {travelRequest.managerApproval.approvedBy && (
                <DetailRow
                  icon={User}
                  label="Processed By"
                  value={`${travelRequest.managerApproval.approvedBy.firstName || ''} ${travelRequest.managerApproval.approvedBy.lastName || ''}`}
                />
              )}
              {travelRequest.managerApproval.approvedAt && (
                <DetailRow
                  icon={Calendar}
                  label="Processed Date"
                  value={new Date(travelRequest.managerApproval.approvedAt).toLocaleString()}
                />
              )}
              {travelRequest.managerApproval.comments && (
                <div style={{ padding: '12px 0', marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={14} />
                    Comments
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6', backgroundColor: 'var(--color-surface-secondary)', padding: '12px', borderRadius: 'var(--radius-base)' }}>
                    {travelRequest.managerApproval.comments}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '12px 0', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} />
              Pending manager review
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
            value={travelRequest.status.charAt(0).toUpperCase() + travelRequest.status.slice(1)}
          />
          <DetailRow
            icon={Calendar}
            label="Created"
            value={new Date(travelRequest.createdAt).toLocaleString()}
          />
          <DetailRow
            icon={Calendar}
            label="Last Updated"
            value={new Date(travelRequest.updatedAt).toLocaleString()}
          />
        </Card>
      </div>

      {/* Manager Approval Section */}
      {canApprove && (
        <Card variant="elevated" style={{ padding: '24px', marginBottom: '24px', border: '2px solid var(--color-primary-200)', backgroundColor: 'var(--color-primary-50)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-primary-800)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} />
            Manager Approval
          </h2>
          <form onSubmit={handleApproveReject}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                Decision <span style={{ color: 'var(--color-danger-500)' }}>*</span>
              </label>
              <select
                value={approvalData.status}
                onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}
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
                <option value="">Select decision...</option>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                Comments (Optional)
              </label>
              <textarea
                value={approvalData.comments}
                onChange={(e) => setApprovalData({ ...approvalData, comments: e.target.value })}
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

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="submit"
                disabled={submitting || !approvalData.status}
                icon={Check}
              >
                {submitting ? 'Processing...' : 'Submit Decision'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Employee Actions */}
      {canCancel && (
        <Card variant="elevated" style={{ padding: '24px', border: '2px solid var(--color-danger-200)', backgroundColor: 'var(--color-danger-50)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-danger-800)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={20} />
            Actions
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={cancelling}
              icon={X}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default TravelRequestDetails;
