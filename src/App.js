import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider, useLocation } from './context/LocationContext';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import Dashboard from './pages/Dashboard';
import IntakeForm from './pages/IntakeForm';
import PendingApproval from './pages/PendingApproval';
import Admin from './pages/Admin';
import LocationInfo from './pages/LocationInfo';
import BusinessInfo from './pages/BusinessInfo';
import AddressInfo from './pages/AddressInfo';
import OperatingHours from './pages/OperatingHours';
import UpgradePlan from './pages/UpgradePlan';
import ManageStaff from './pages/ManageStaff';
import Schedule from './pages/Schedule';
import WeeklyEvents from './pages/WeeklyEvents';

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

// Protected Route - requires auth AND approved status
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { needsIntake, isPending, isApproved, loading: locationLoading } = useLocation();

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

  // If user is pending approval, redirect to pending page
  if (isPending) {
    return <Navigate to="/pending" replace />;
  }

  // Only approved users can access dashboard
  if (!isApproved) {
    return <Navigate to="/pending" replace />;
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

  // If user already completed intake, go to pending or dashboard
  if (!needsIntake) {
    return <Navigate to="/pending" replace />;
  }

  return children;
};

// Pending Route - requires auth AND completed intake but NOT approved
const PendingRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { needsIntake, isApproved, loading: locationLoading } = useLocation();

  if (authLoading || locationLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user needs intake, go to intake
  if (needsIntake) {
    return <Navigate to="/intake" replace />;
  }

  // If user is approved, go to dashboard
  if (isApproved) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route - redirects to appropriate page if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { needsIntake, isPending, isApproved, loading: locationLoading } = useLocation();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    // Wait for location profile to load
    if (locationLoading) {
      return <LoadingScreen />;
    }

    // Route based on status
    if (needsIntake) {
      return <Navigate to="/intake" replace />;
    }
    if (isPending) {
      return <Navigate to="/pending" replace />;
    }
    if (isApproved) {
      return <Navigate to="/" replace />;
    }
    // Default to pending if none match
    return <Navigate to="/pending" replace />;
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

      {/* Pending route - auth required, intake completed, NOT approved */}
      <Route
        path="/pending"
        element={
          <PendingRoute>
            <PendingApproval />
          </PendingRoute>
        }
      />

      {/* Protected routes - auth required, approved */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/info"
        element={
          <ProtectedRoute>
            <LocationInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/info/business"
        element={
          <ProtectedRoute>
            <BusinessInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/info/address"
        element={
          <ProtectedRoute>
            <AddressInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hours"
        element={
          <ProtectedRoute>
            <OperatingHours />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upgrade"
        element={
          <ProtectedRoute>
            <UpgradePlan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <ManageStaff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <WeeklyEvents />
          </ProtectedRoute>
        }
      />

      {/* Admin route - handles its own auth check */}
      <Route path="/admin" element={<Admin />} />

      {/* Catch all */}
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
