import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { RoleSelection } from "./pages/Auth/RoleSelection";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { VideoCall } from "./pages/Consultation/VideoCall";
import { AppointmentDetail } from "./pages/Appointments/AppointmentDetail";
import { DatabaseManager } from "./pages/Admin/DatabaseManager";
import { LandingPage } from "./pages/LandingPage";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading)
    return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public Landing Page as Root if not logged in */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />

      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />

        {/* Entry flow */}
        <Route path="/get-started" element={<RoleSelection />} />
        <Route path="/register/doctor" element={<Register role="doctor" />} />
        <Route path="/register/patient" element={<Register role="patient" />} />
        {/* Redirect generic register to get-started */}
        <Route path="/register" element={<Navigate to="/get-started" replace />} />



        {/* Protected Routes */}

        // ...

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/new"
          element={
            <ProtectedRoute>
              <AppointmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:id"
          element={
            <ProtectedRoute>
              <AppointmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultation/:appointmentId"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />

        {/* Admin DB Manager */}
        <Route
          path="/admin/db"
          element={
            <ProtectedRoute>
              <DatabaseManager />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
