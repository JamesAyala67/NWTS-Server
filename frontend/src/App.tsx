import { Routes, Route } from "react-router-dom";
import ClientPage from "./pages/clients/ClientPage";
import ClientDashboard from "./pages/clients/ClientDashboard";
import InventoryPage from "./pages/Inventory/InventoryPage";

export default function App() {
  return (
    <Routes>
      {/* If the URL is exactly "/", show the main table */}
      <Route path="/" element={<ClientPage />} />

      {/* If the URL is "/clients/SOMETHING", show the dashboard for that specific client */}
      <Route path="/clients/:id" element={<ClientDashboard />} />
      <Route path="/inventory" element={<InventoryPage />} />
    </Routes>
  );
}
