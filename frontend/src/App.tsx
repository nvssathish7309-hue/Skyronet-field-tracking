import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { GoogleMapsProvider } from './context/GoogleMapsContext';
import { DesktopLayout } from './layouts/DesktopLayout';
import { MobileLayout } from './layouts/MobileLayout';

import { LoginPage } from './pages/LoginPage';
import { EngineerSignupPage } from './pages/EngineerSignupPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LiveTrackingPage } from './pages/LiveTrackingPage';
import { TasksPage } from './pages/TasksPage';
import { TaskCreatePage } from './pages/TaskCreatePage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { EngineersPage } from './pages/EngineersPage';
import { EngineerDetailPage } from './pages/EngineerDetailPage';
import { BikesPage } from './pages/BikesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';

import { EngineerTasksPage } from './pages/EngineerTasksPage';
import { EngineerTaskDetailPage } from './pages/EngineerTaskDetailPage';
import { EngineerLiveMapPage } from './pages/EngineerLiveMapPage';
import { EngineerTripsPage } from './pages/EngineerTripsPage';
import { EngineerExpensesPage } from './pages/EngineerExpensesPage';
import { EngineerProfilePage } from './pages/EngineerProfilePage';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const isMobileScreen = useIsMobile();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 bg-white text-slate-800">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold tracking-wider uppercase text-slate-500">Loading FieldTrack 360...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'FIELD_ENGINEER') {
      return <Navigate to="/my-tasks" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (user.role === 'FIELD_ENGINEER' || isMobileScreen) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/engineer-signup" element={<EngineerSignupPage />} />

      {/* Admin / Accounts Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live-tracking"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <LiveTrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/create"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
            <TaskCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <TaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/engineers"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <EngineersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/engineers/:id"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <EngineerDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bikes"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
            <BikesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <ExpensesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'FIELD_ENGINEER']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Field Engineer Mobile Routes */}
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute roles={['FIELD_ENGINEER']}>
            <EngineerTasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks/:id"
        element={
          <ProtectedRoute roles={['FIELD_ENGINEER']}>
            <EngineerTaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-map"
        element={
          <ProtectedRoute roles={['FIELD_ENGINEER']}>
            <EngineerLiveMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-trips"
        element={
          <ProtectedRoute roles={['FIELD_ENGINEER']}>
            <EngineerTripsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-expenses"
        element={
          <ProtectedRoute roles={['FIELD_ENGINEER']}>
            <EngineerExpensesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-profile"
        element={
          <ProtectedRoute roles={['FIELD_ENGINEER']}>
            <EngineerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Default Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

import { ThemeProvider } from './context/ThemeContext';
import { useServiceWorker } from './hooks/useServiceWorker';
import { UpdatePrompt } from './components/UpdatePrompt';

function AppWithUpdatePrompt() {
  const { updateAvailable, applyUpdate } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      <AppContent />
      {updateAvailable && !dismissed && (
        <UpdatePrompt
          onUpdate={applyUpdate}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <GoogleMapsProvider>
              <AppWithUpdatePrompt />
            </GoogleMapsProvider>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
