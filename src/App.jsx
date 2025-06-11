import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/Ui/ErrorBoundary.jsx';
import LoadingScreen from './components/Common/LoadingScreen.jsx';

// Auth Components & Context
import { AuthProvider, useAuth } from './services/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import PublicRoute from './components/auth/PublicRoute.jsx';

// UI Components
import Toast from './components/Ui/Toast.jsx';

// Page Components
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import DemoReconciliation from './pages/DemoReconciliation.jsx';
import SupportPage from './pages/SupportPage.jsx';
import DocsPage from './pages/DocsPage.jsx';
import ReconciliationRunner from './components/ReconciliationRunner';

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Initializing application, please wait..." />;
  }

  return (
    <div className="App min-h-screen bg-gray-50">
      <Toast />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/demo" element={<PublicRoute><DemoReconciliation /></PublicRoute>} />
        <Route path="/support" element={<PublicRoute><SupportPage /></PublicRoute>} />
        <Route path="/docs" element={<PublicRoute><DocsPage /></PublicRoute>} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute requiredRoles={['admin', 'manager', 'staff', 'receptionist']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute requiredRoles={['admin', 'manager', 'receptionist']}><ClientsPage /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute requiredRoles={['admin', 'manager', 'staff', 'receptionist']}><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute requiredRoles={['admin', 'manager']}><ServicesPage /></ProtectedRoute>} />
        <Route path="/reconciliation" element={<ProtectedRoute requiredRoles={['admin', 'manager']}><ReconciliationRunner /></ProtectedRoute>} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
