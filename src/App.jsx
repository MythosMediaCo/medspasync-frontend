import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './services/AuthContext.jsx';
import PublicRoute from './components/auth/PublicRoute.jsx';
import PrivateRoute from './components/auth/ProtectedRoute.jsx';
import Toast from './components/Common/Toast.jsx';
import LoadingScreen from './components/Common/LoadingScreen.jsx';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import DocsPage from './pages/DocsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const DashboardPage = lazy(() => import('./pages/Dashboard.jsx'));
const DemoReconciliation = lazy(() => import('./pages/DemoReconciliation.jsx'));

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
        <Route
          path="/"
          element={
            <PublicRoute>
              <Suspense fallback={<LoadingScreen />}>
                <LandingPage />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/support" element={<PublicRoute><SupportPage /></PublicRoute>} />
        <Route path="/docs" element={<PublicRoute><DocsPage /></PublicRoute>} />
        <Route
          path="/demo"
          element={
            <PublicRoute>
              <Suspense fallback={<LoadingScreen />}>
                <DemoReconciliation />
              </Suspense>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingScreen />}>
                <DashboardPage />
              </Suspense>
            </PrivateRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default AppContent;
