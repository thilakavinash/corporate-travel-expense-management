import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import CreateTravelRequest from './pages/employee/CreateTravelRequest';
import MyTravelRequests from './pages/employee/MyTravelRequests';
import TravelRequestDetails from './pages/TravelRequestDetails';
import PendingApprovals from './pages/manager/PendingApprovals';
import MyExpenses from './pages/employee/MyExpenses';
import AddExpense from './pages/employee/AddExpense';
import ExpenseDetails from './pages/ExpenseDetails';
import ExpenseReview from './pages/finance/ExpenseReview';
import MyReimbursements from './pages/employee/MyReimbursements';
import CreateReimbursement from './pages/employee/CreateReimbursement';
import ReimbursementDetails from './pages/ReimbursementDetails';
import ReimbursementReview from './pages/finance/ReimbursementReview';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import UserManagement from './pages/admin/UserManagement';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import AuditLogs from './pages/admin/AuditLogs';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-travel-request"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreateTravelRequest />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-travel-requests"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MyTravelRequests />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/travel-requests/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TravelRequestDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pending-approvals"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PendingApprovals />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-expense"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AddExpense />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-expenses"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MyExpenses />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ExpenseDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expense-review"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ExpenseReview />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reimbursements"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MyReimbursements />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-reimbursement"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreateReimbursement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reimbursements/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReimbursementDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reimbursement-review"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReimbursementReview />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AnalyticsDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReportsDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AuditLogs />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
