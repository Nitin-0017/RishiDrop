import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { GuardLayout } from './layouts/GuardLayout';

// Guard Operational Views
import { GuardHome } from './pages/guard/GuardHome';
import ReceiveDeliveryFlow from './pages/guard/ReceiveDeliveryFlow';
import { HandoverScanFlow } from './pages/guard/HandoverScanFlow';
import { SearchStudentPage } from './pages/guard/SearchStudentPage';
import { StorageRacksPage } from './pages/guard/StorageRacksPage';
import GuardProfilePage from './pages/guard/GuardProfilePage';
import ParcelDetailsPage from './pages/guard/ParcelDetailsPage';

// Admin Views
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDeliveriesPage } from './pages/admin/AdminDeliveriesPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import AdminGuardsPage from './pages/admin/AdminGuardsPage';
import AdminStoragePage from './pages/admin/AdminStoragePage';
import { AdminPickupsPage } from './pages/admin/AdminPickupsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { LoadingSpinner } from './components/common/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard Route Protector: strictly allows only GUARD
const GuardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'GUARD') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Admin Route Protector: strictly allows only ADMIN
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/guard" replace />;
  }

  return <>{children}</>;
};

// Root Redirector
const RootRedirect: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner label="Loading RishiDrop..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/guard" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* GUARD PORTAL */}
              <Route
                path="/guard"
                element={
                  <GuardRoute>
                    <GuardLayout />
                  </GuardRoute>
                }
              >
                <Route index element={<GuardHome />} />
                <Route path="receive" element={<ReceiveDeliveryFlow />} />
                <Route path="pickup" element={<HandoverScanFlow />} />
                <Route path="search" element={<SearchStudentPage />} />
                <Route path="storage" element={<StorageRacksPage />} />
                <Route path="profile" element={<GuardProfilePage />} />
                <Route path="parcels/:id" element={<ParcelDetailsPage />} />
              </Route>

              {/* ADMIN PORTAL */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <DashboardLayout role="ADMIN" />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="deliveries" element={<AdminDeliveriesPage />} />
                <Route path="deliveries/:id" element={<ParcelDetailsPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="guards" element={<AdminGuardsPage />} />
                <Route path="storage" element={<AdminStoragePage />} />
                <Route path="pickups" element={<AdminPickupsPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Root Redirect to /login or Role Dashboard */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
