import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import WorkerDashboard from './pages/WorkerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EquipmentPage from './pages/EquipmentPage';
import TyresPage from './pages/TyresPage';
import MaintenancePage from './pages/MaintenancePage';
import TasksPage from './pages/TasksPage';
import IssuesPage from './pages/IssuesPage';
import AttendancePage from './pages/AttendancePage';
import AlertsPage from './pages/AlertsPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Route Guard for Authenticated Users
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Role-based Route Guard
function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to the user's appropriate home dashboard
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    if (user.role === 'supervisor') return <Navigate to="/supervisor" replace />;
    return <Navigate to="/admin" replace />;
  }

  return children;
}

// Default Root Redirector based on user role
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'worker') return <Navigate to="/worker" replace />;
  if (user.role === 'supervisor') return <Navigate to="/supervisor" replace />;
  return <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Enterprise Portal Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default Index Route */}
        <Route index element={<RootRedirect />} />

        {/* Role Dashboards */}
        <Route
          path="worker"
          element={
            <RoleRoute allowedRoles={['worker', 'supervisor', 'admin']}>
              <WorkerDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="supervisor"
          element={
            <RoleRoute allowedRoles={['supervisor', 'admin']}>
              <SupervisorDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="admin"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />

        {/* Core Modules */}
        <Route path="equipment" element={<EquipmentPage />} />
        
        <Route
          path="tyres"
          element={
            <RoleRoute allowedRoles={['supervisor', 'admin']}>
              <TyresPage />
            </RoleRoute>
          }
        />

        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="issues" element={<IssuesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        <Route
          path="reports"
          element={
            <RoleRoute allowedRoles={['supervisor', 'admin']}>
              <ReportsPage />
            </RoleRoute>
          }
        />

        {/* Admin Management Modules */}
        <Route
          path="users"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AuditLogsPage />
            </RoleRoute>
          }
        />

        {/* User Account Settings */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
