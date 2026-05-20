import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/custom/DashboardLayout";

// Pages
import LoginPage from "./pages/Login/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ClientPage from "./pages/clients/ClientPage";
import ClientDashboard from "./pages/clients/ClientDashboard";
import PlotsPage from "./pages/plots/PlotsPage";
import PlotsMap from "./pages/plots/PlotsMap";
import AuditLogs from "./pages/audit/auditPage";

// NEW IMPORTS
import AccountPage from "./pages/AccountPage";
import RequestPage from "./pages/RequestPage";

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
      <Outlet />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

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
        <Route path="/logs" element={<AuditLogs />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/request" element={<RequestPage />} />
      </Route>
    </Routes>
  );
}
