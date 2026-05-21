import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Plus, TrendingUp, X, ChevronLeft, ChevronRight } from "lucide-react";

import AddPlot from "../../components/forms/AddPlots";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

const PLOTS_PER_PAGE = 10;

export default function PlotsPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const userRole = localStorage.getItem("userRole") || "Staff";
  const isAdmin = userRole === "Admin";
  const employeeId = localStorage.getItem("employee_id");

  const [bulkData, setBulkData] = useState({
    plot_type: "Lawn Lot",
    new_price: 0,
    employee_id: employeeId,
  });

  const {
    data: plots,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["plots"],
    queryFn: async () => {
      const res = await api.get(`${API_BASE_URL}/plots`);
      return res.data;
    },
  });

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !confirm(
        `Are you sure you want to change ALL Available ${bulkData.plot_type}s to ₱${bulkData.new_price}?`,
      )
    ) {
      return;
    }

    try {
      const res = await api.put(`${API_BASE_URL}/plots/bulk-price`, bulkData);
      alert(`${res.data.message} (${res.data.plots_affected} plots changed)`);
      refetch();
    } catch (error) {
      alert("Error updating prices.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gray-500 text-sm">Loading plots...</div>;
  }

  const totalPlots = plots?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPlots / PLOTS_PER_PAGE));
  const paginatedPlots =
    plots?.slice((page - 1) * PLOTS_PER_PAGE, page * PLOTS_PER_PAGE) ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto bg-[#faf8f5] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b]">
            Cemetery Plots Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage blocks, lots, and pricing.
          </p>
        </div>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {isAdmin ? "Add Single Plot" : "Request Plot Addition"}
        </button>
      </div>

      {/* Bulk Price Update — Admin only */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-[#4a5a4a]" />
            <h2 className="text-lg font-bold text-[#1e293b]">
              Bulk Price Update
            </h2>
          </div>

          <form
            onSubmit={handleBulkUpdate}
            className="flex flex-col md:flex-row gap-4"
          >
            <select
              className="border border-gray-200 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-1 focus:ring-[#4a5a4a] focus:border-[#4a5a4a]"
              value={bulkData.plot_type}
              onChange={(e) =>
                setBulkData({ ...bulkData, plot_type: e.target.value })
              }
            >
              <option value="Lawn Type">Lawn Type</option>
              <option value="Kennedy Type">Kennedy Type</option>
              <option value="Family Type">Family Type</option>
              <option value="Mausoleum">Mausoleum</option>
              <option value="Mini Mausoleum">Mini Mausoleum</option>
            </select>

            <input
              type="number"
              placeholder="New Price (₱)"
              className="border border-gray-200 rounded-lg px-4 py-3 w-full md:w-48 focus:outline-none focus:ring-1 focus:ring-[#4a5a4a] focus:border-[#4a5a4a]"
              value={bulkData.new_price || ""}
              onChange={(e) =>
                setBulkData({
                  ...bulkData,
                  new_price: parseFloat(e.target.value) || 0,
                })
              }
              required
            />

            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Apply Changes
            </button>
          </form>
        </div>
      )}

      {/* Plot Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-[#faf8f5] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1e293b]">Plots</h2>
          {totalPlots > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {totalPlots} total
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#f9f8f3] border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                  Plot ID
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                  Block / Lot
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                  Base Price
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedPlots.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No Plots Found.
                  </td>
                </tr>
              )}

              {paginatedPlots.map((plot: any) => (
                <tr key={plot.plot_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-[#4a5a4a]">
                    {plot.plot_id}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    Block {plot.block} - Lot {plot.lot}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{plot.plot_type}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    ₱{Number(plot.price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        plot.status === "Available"
                          ? "bg-green-100 text-green-700"
                          : plot.status === "Sold"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {plot.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPlots > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-[#faf8f5]">
            <p className="text-[11px] text-gray-400 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-600">
                {(page - 1) * PLOTS_PER_PAGE + 1}–
                {Math.min(page * PLOTS_PER_PAGE, totalPlots)}
              </span>{" "}
              of <span className="font-bold text-gray-600">{totalPlots}</span>
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                    pg === page
                      ? "bg-[#4a5a4a] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Request Plot Drawer */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto border-l border-gray-100">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-[#faf8f5]">
              <h2 className="text-xl font-bold text-[#1e293b]">
                {isAdmin ? "Add New Plot" : "Request Plot Addition"}
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <AddPlot />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
