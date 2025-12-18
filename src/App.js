import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider, useLocation } from './context/LocationContext';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import Dashboard from './pages/Dashboard';
import IntakeForm from './pages/IntakeForm';

// Loading spinner component
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      width: '24px',
      height: '24px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: '#0ea5e9',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Protected Route - requires auth AND completed intake
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { needsIntake, loading: locationLoading } = useLocation();

  if (authLoading || locationLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user needs to complete intake, redirect to intake form
  if (needsIntake) {
    return <Navigate to="/intake" replace />;
  }

  return children;
};

// Intake Route - requires auth but NOT completed intake
const IntakeRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { needsIntake, loading: locationLoading } = useLocation();

  if (authLoading || locationLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user already completed intake, go to dashboard
  if (!needsIntake) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route - redirects to appropriate page if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { needsIntake, loading: locationLoading } = useLocation();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    // Wait for location profile to load
    if (locationLoading) {
      return <LoadingScreen />;
    }

    // Route based on intake status
    if (needsIntake) {
      return <Navigate to="/intake" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main app content with routing
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        }
      />

      {/* Intake route - auth required, intake NOT completed */}
      <Route
        path="/intake"
        element={
          <IntakeRoute>
            <IntakeForm />
          </IntakeRoute>
        }
      />

      {/* Protected routes - auth required, intake completed */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to dashboard (will handle routing from there) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
