import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/custom/DashboardLayout"; // <-- Add this import

import LoginPage from "./pages/Login/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ClientPage from "./pages/clients/ClientPage";
import ClientDashboard from "./pages/clients/ClientDashboard";
import PlotsPage from "./pages/plots/PlotsPage";
import PlotsMap from "./pages/plots/PlotsMap";
import AuditLogs from "./pages/audit/auditPage";

// Create a wrapper that connects router to the Sidebar Layout
function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userName = localStorage.getItem("userName") || "";
  const userRole = localStorage.getItem("userRole") || "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    window.location.href = "/";
  };

  return (
    <DashboardLayout
      userName={userName}
      userRole={userRole}
      activePath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onLogout={handleLogout}
    >
      {/* <Outlet /> is the magic window where React Router puts your page content */}
      <Outlet />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Route (No Sidebar here) */}
      <Route path="/" element={<LoginPage />} />

      {/* 2. We wrap ALL protected routes inside our new AuthenticatedLayout 
        This means the Sidebar will automatically appear on all of these pages!
      */}
      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientPage />} />
        <Route path="/clients/:id" element={<ClientDashboard />} />
        <Route path="/plots" element={<PlotsPage />} />
        <Route path="/plots/map" element={<PlotsMap />} />

        {/* Notice your path here is /audit-logs, but your sidebar said /logs. 
            Make sure they match! I'll use /logs to match the sidebar. */}
        <Route path="/logs" element={<AuditLogs />} />
      </Route>
    </Routes>
  );
}
