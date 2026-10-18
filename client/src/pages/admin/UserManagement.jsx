import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Plus, Edit, Eye, Shield, Building, User, Mail, Key, X, ChevronRight, CheckCircle, XCircle, Settings } from 'lucide-react';
import { getUsers, getUserById, createUser, updateUser, updateUserStatus, updateUserManager } from '../../services/userService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import StatusBadge from '../../components/ui/StatusBadge';
import KPICard from '../../components/ui/KPICard';

function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ role: '', department: '', status: '', search: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    employeeId: '',
    managerId: '',
  });

  const departments = ['Engineering', 'Finance', 'HR', 'Marketing', 'Sales', 'Operations'];
  const roles = ['employee', 'manager', 'finance', 'admin'];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers(filters);
      if (data?.success && data?.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        employeeId: '',
        managerId: '',
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      alert('Failed to create user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      await updateUser(selectedUser._id, updateData);
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        employeeId: '',
        managerId: '',
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      await updateUserStatus(user._id, !user.isActive);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleManagerChange = async (userId, managerId) => {
    try {
      await updateUserManager(userId, managerId);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update manager:', err);
      alert('Failed to update manager: ' + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      managerId: user.managerId?._id || '',
    });
    setShowEditModal(true);
  };

  const openDetailsModal = async (user) => {
    try {
      const data = await getUserById(user._id);
      if (data?.success && data?.user) {
        setSelectedUser(data.user);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      alert('Failed to fetch user details');
    }
  };

  const getManagers = () => users.filter(u => u.role === 'manager' && u.isActive);

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

  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const managerCount = users.filter(u => u.role === 'manager').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
            User Management
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            Manage organization users, roles, and permissions
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={Plus}>
          Add User
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <KPICard
          title="Total Users"
          value={users.length}
          subtitle="All accounts"
          icon={Users}
          color="primary"
          size="sm"
        />
        <KPICard
          title="Active Users"
          value={activeUsers}
          subtitle="Currently active"
          icon={CheckCircle}
          color="success"
          size="sm"
        />
        <KPICard
          title="Inactive Users"
          value={inactiveUsers}
          subtitle="Deactivated accounts"
          icon={XCircle}
          color="danger"
          size="sm"
        />
        <KPICard
          title="Managers"
          value={managerCount}
          subtitle="Team managers"
          icon={Shield}
          color="info"
          size="sm"
        />
      </div>

      {/* Filters */}
      <Card variant="elevated" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Filter size={20} style={{ color: 'var(--color-primary-600)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
            Filter Users
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Search</label>
            <input
              style={inputStyle}
              placeholder="Name, email, or employee ID"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select
              style={inputStyle}
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <select
              style={inputStyle}
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingState message="Loading users..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : (
        <Card variant="elevated" style={{ padding: '24px' }}>
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="Try adjusting your filters or add a new user."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Name
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Employee ID
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Email
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Role
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Department
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Manager
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Status
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                        {user.firstName} {user.lastName}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)' }}>
                        {user.employeeId}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                        {user.email}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)' }}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                        {user.department}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text)' }}>
                        {user.managerId?.firstName || '-'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <StatusBadge status={user.isActive ? 'active' : 'inactive'} size="sm" />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="ghost" size="sm" onClick={() => openDetailsModal(user)} icon={Eye}>
                            View
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(user)} icon={Edit}>
                            Edit
                          </Button>
                          <Button
                            variant={user.isActive ? 'danger' : 'success'}
                            size="sm"
                            onClick={() => handleStatusToggle(user)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add User Modal */}
      {showAddModal && (
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
        }} onClick={() => setShowAddModal(false)}>
          <Card
            variant="elevated"
            style={{
              padding: '32px',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>
                Add User
              </h2>
              <Button variant="ghost" onClick={() => setShowAddModal(false)} icon={X} />
            </div>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>First Name</label>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Last Name</label>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Role</label>
                <select
                  style={inputStyle}
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Department</label>
                <select
                  style={inputStyle}
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Employee ID</label>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </div>
              {formData.role === 'employee' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Manager</label>
                  <select
                    style={inputStyle}
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">No Manager</option>
                    {getManagers().map(manager => (
                      <option key={manager._id} value={manager._id}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button type="submit" icon={Plus}>
                  Create User
                </Button>
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
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
        }} onClick={() => setShowEditModal(false)}>
          <Card
            variant="elevated"
            style={{
              padding: '32px',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>
                Edit User
              </h2>
              <Button variant="ghost" onClick={() => setShowEditModal(false)} icon={X} />
            </div>
            <form onSubmit={handleEditUser}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>First Name</label>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Last Name</label>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Password (leave blank to keep current)</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Role</label>
                <select
                  style={inputStyle}
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Department</label>
                <select
                  style={inputStyle}
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Employee ID</label>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </div>
              {formData.role === 'employee' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Manager</label>
                  <select
                    style={inputStyle}
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">No Manager</option>
                    {getManagers().map(manager => (
                      <option key={manager._id} value={manager._id}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button type="submit" icon={Settings}>
                  Update User
                </Button>
                <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
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
        }} onClick={() => setShowDetailsModal(false)}>
          <Card
            variant="elevated"
            style={{
              padding: '32px',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>
                User Details
              </h2>
              <Button variant="ghost" onClick={() => setShowDetailsModal(false)} icon={X} />
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Employee ID:</strong> {selectedUser.employeeId}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Role:</strong> {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Department:</strong> {selectedUser.department}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <strong>Manager:</strong> {selectedUser.managerId?.firstName || selectedUser.managerId?.lastName || 'None'}
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Status:</strong> <StatusBadge status={selectedUser.isActive ? 'active' : 'inactive'} size="sm" />
              </div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
              </div>
              
              {selectedUser.statistics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
                  <KPICard
                    title="Travel Requests"
                    value={selectedUser.statistics.travelRequests}
                    subtitle="Submitted"
                    icon={User}
                    color="primary"
                    size="sm"
                  />
                  <KPICard
                    title="Expenses"
                    value={selectedUser.statistics.expenses}
                    subtitle="Submitted"
                    icon={Key}
                    color="success"
                    size="sm"
                  />
                  <KPICard
                    title="Reimbursements"
                    value={selectedUser.statistics.reimbursements}
                    subtitle="Claimed"
                    icon={Shield}
                    color="info"
                    size="sm"
                  />
                </div>
              )}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
