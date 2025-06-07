import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx';
import LoadingScreen from './components/Common/LoadingScreen.jsx';

// Auth Components & Context
import { AuthProvider, useAuth } from './services/AuthContext.js'; // .js for the provider
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import PublicRoute from './components/auth/PublicRoute.jsx';

// UI Components
import Toast from './components/Ui/Toast.jsx';

// Page Components
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function AppContent() {
    const { isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen message="Initializing application, please wait..." />;
    }

    return (
        <div className="App min-h-screen bg-gray-50">
            <Toast />
            <Routes>
                <Route
                    path="/"
                    element={<PublicRoute><LandingPage /></PublicRoute>}
                />
                <Route
                    path="/login"
                    element={<PublicRoute><LoginPage /></PublicRoute>}
                />
                <Route
                    path="/register"
                    element={<PublicRoute><RegisterPage /></PublicRoute>}
                />

                <Route
                    path="/dashboard"
                    element={<ProtectedRoute requiredRoles={['admin', 'manager', 'staff', 'receptionist']}><DashboardPage /></ProtectedRoute>}
                />

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