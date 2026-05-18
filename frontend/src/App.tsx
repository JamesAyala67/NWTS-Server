import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/Login/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ClientPage from "./pages/clients/ClientPage";
import ClientDashboard from "./pages/clients/ClientDashboard";
import PlotsPage from "./pages/plots/PlotsPage";
import PlotsMap from "./pages/plots/PlotsMap";
import AuditLogs from "./pages/audit/auditPage";

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <ClientPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clients/:id"
        element={
          <ProtectedRoute>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/plots"
        element={
          <ProtectedRoute>
            <PlotsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/plots/map"
        element={
          <ProtectedRoute>
            <PlotsMap />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
