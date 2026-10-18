import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, RotateCcw, X, FileText, Calendar, User, Shield, Eye, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import KPICard from '../../components/ui/KPICard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    actorId: '',
    startDate: '',
    endDate: '',
  });

  const actions = [
    'login_success', 'login_failed', 'logout',
    'travel_created', 'travel_approved', 'travel_rejected', 'travel_cancelled',
    'expense_created', 'expense_approved', 'expense_rejected',
    'reimbursement_created', 'reimbursement_approved', 'reimbursement_rejected', 'reimbursement_paid',
    'user_created', 'user_updated', 'user_activated', 'user_deactivated', 'manager_assigned',
    'report_generated', 'report_exported',
  ];

  const entityTypes = ['User', 'TravelRequest', 'Expense', 'Reimbursement', 'Report'];

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', page);
      params.append('limit', '25');

      const response = await axios.get(`${API_URL}/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleApplyFilters = () => {
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      actorId: '',
      startDate: '',
      endDate: '',
    });
    fetchLogs(1);
  };

  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  const viewDetails = (log) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const getActionLabel = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEntityTypeLabel = (entityType) => {
    return entityType || 'N/A';
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-base)',
    fontSize: '14px',
    fontFamily: 'var(--font-family)',
    color: 'var(--color-text)',
    backgroundColor: 'var(--color-surface)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-text)',
    marginBottom: '8px',
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Audit Logs
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
          Review system activity and security-relevant events (Read-Only)
        </p>
      </div>

      {/* Filters */}
      <Card variant="elevated" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Filter size={20} style={{ color: 'var(--color-primary-600)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
            Filter Logs
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Action</label>
            <select
              style={inputStyle}
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>{getActionLabel(action)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Entity Type</label>
            <select
              style={inputStyle}
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            >
              <option value="">All Entities</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Start Date</label>
            <input
              style={inputStyle}
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <label style={labelStyle}>End Date</label>
            <input
              style={inputStyle}
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
          <Button onClick={handleApplyFilters} icon={Filter}>
            Apply Filters
          </Button>
          <Button variant="secondary" onClick={handleResetFilters} icon={RotateCcw}>
            Reset
          </Button>
        </div>
      </Card>

      {loading ? (
        <LoadingState message="Loading audit logs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchLogs()} />
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <KPICard
              title="Total Events"
              value={pagination.total}
              subtitle="All time"
              icon={FileText}
              color="primary"
              size="sm"
            />
            <KPICard
              title="Showing This Page"
              value={logs.length}
              subtitle="Current page"
              icon={FileText}
              color="info"
              size="sm"
            />
            <KPICard
              title="Total Pages"
              value={pagination.totalPages}
              subtitle="Pagination"
              icon={FileText}
              color="info"
              size="sm"
            />
          </div>

          {/* Audit Logs Table */}
          {logs.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No audit logs found"
              description="Try adjusting your filters or date range to see results."
            />
          ) : (
            <Card variant="elevated" style={{ padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Date/Time
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Actor
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Role
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Action
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Entity
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Description
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                          {log.actorId?.firstName} {log.actorId?.lastName}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)' }}>
                          {log.actorId?.role}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)' }}>
                          {getActionLabel(log.action)}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)' }}>
                          {getEntityTypeLabel(log.entityType)}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)' }}>
                          {log.description}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewDetails(log)}
                            icon={Eye}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    icon={ChevronLeft}
                  >
                    Previous
                  </Button>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-text)', fontWeight: '500' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    icon={ChevronRight}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowDetails(false)}>
          <Card
            variant="elevated"
            style={{
              padding: '32px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>
                Audit Log Details
              </h2>
              <Button variant="ghost" onClick={() => setShowDetails(false)} icon={X} />
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Date:</strong> {new Date(selectedLog.createdAt).toLocaleString()}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Actor:</strong> {selectedLog.actorId?.firstName} {selectedLog.actorId?.lastName} ({selectedLog.actorId?.email})
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Role:</strong> {selectedLog.actorId?.role}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Action:</strong> {getActionLabel(selectedLog.action)}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Entity Type:</strong> {getEntityTypeLabel(selectedLog.entityType)}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Description:</strong> {selectedLog.description}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>IP Address:</strong> {selectedLog.ipAddress || 'N/A'}
              </div>
              <div style={{
                backgroundColor: 'var(--color-surface-secondary)',
                padding: '16px',
                borderRadius: 'var(--radius-base)',
                marginTop: '16px',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}>
                <strong>Metadata:</strong>
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowDetails(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
