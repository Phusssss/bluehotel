import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Layout } from './components/common/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Login } from './pages/Login';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { Staff } from './pages/Staff';
import { 
  Reservations, 
  Guests, 
  Invoices, 
  Services, 
  Maintenance, 
  Reports, 
  Settings, 
  NotFound 
} from './pages/index';

import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/common/LoadingSpinner';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('AppContent:', { isAuthenticated, loading, currentPath: window.location.pathname });

  if (loading) {
    return <LoadingSpinner tip="Đang khởi tạo ứng dụng..." />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      <Route 
        path="/forgot-password" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />} 
      />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/rooms" element={
        <ProtectedRoute>
          <Layout>
            <Rooms />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/reservations" element={
        <ProtectedRoute>
          <Layout>
            <Reservations />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/guests" element={
        <ProtectedRoute>
          <Layout>
            <Guests />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/invoices" element={
        <ProtectedRoute>
          <Layout>
            <Invoices />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/services" element={
        <ProtectedRoute>
          <Layout>
            <Services />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/staff" element={
        <ProtectedRoute>
          <Layout>
            <Staff />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/maintenance" element={
        <ProtectedRoute>
          <Layout>
            <Maintenance />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <Router>
          <AppContent />
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;