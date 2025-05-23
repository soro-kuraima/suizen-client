import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useWalletAdapter } from '../hooks/useWalletAdapter';
import { WalletAwareLayout } from '../components/layouts/WalletAwareLayout';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('../pages/HomePage'));
const WalletPage = React.lazy(() => import('../pages/WalletPage'));
const CreateWalletPage = React.lazy(() => import('../pages/CreateWalletPage'));
const TransactionsPage = React.lazy(() => import('../pages/TransactionsPage'));
const ProposalsPage = React.lazy(() => import('../pages/ProposalsPage'));
const SettingsPage = React.lazy(() => import('../pages/SettingsPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected } = useWalletAdapter();

  if (!connected) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Loading component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="text-muted-foreground">Loading...</span>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <WalletAwareLayout>
              <HomePage />
            </WalletAwareLayout>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletAwareLayout>
                <WalletPage />
              </WalletAwareLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet/create"
          element={
            <ProtectedRoute>
              <WalletAwareLayout>
                <CreateWalletPage />
              </WalletAwareLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet/:walletId"
          element={
            <ProtectedRoute>
              <WalletAwareLayout>
                <WalletPage />
              </WalletAwareLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <WalletAwareLayout>
                <TransactionsPage />
              </WalletAwareLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions/:walletId"
          element={
            <ProtectedRoute>
              <WalletAwareLayout>
                <TransactionsPage />
              </WalletAwareLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/proposals"
          element={
            <ProtectedRoute>
              <WalletAwareLayout>
                <ProposalsPage />
              </WalletAwareLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/proposals/:walletId"
          element={
            <ProtectedRoute>
              <WalletAwareLayout>
                <ProposalsPage />
              </WalletAwareLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <WalletAwareLayout>
                <SettingsPage />
              </WalletAwareLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route
          path="*"
          element={
            <WalletAwareLayout>
              <NotFoundPage />
            </WalletAwareLayout>
          }
        />
      </Routes>
    </React.Suspense>
  );
};