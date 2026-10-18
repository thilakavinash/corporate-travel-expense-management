import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from './employee/Dashboard';
import ManagerDashboard from './manager/Dashboard';
import FinanceDashboard from './finance/Dashboard';
import AdminDashboard from './admin/Dashboard';

function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleDashboards = {
    employee: EmployeeDashboard,
    manager: ManagerDashboard,
    finance: FinanceDashboard,
    admin: AdminDashboard,
  };

  const DashboardComponent = roleDashboards[user.role] || EmployeeDashboard;

  return <DashboardComponent />;
}

export default Dashboard;
