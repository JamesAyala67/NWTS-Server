import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Plus, TrendingUp, X } from "lucide-react";
import AddPlot from "../../components/forms/AddPlot";

export default function InventoryList() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [bulkData, setBulkData] = useState({
    plot_type: "Lawn Lot",
    new_price: 0,
  });

  // Fetch all plots from the database
  const {
    data: plots,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:3000/api/inventory");
      return res.data;
    },
  });

  // Handle Bulk Price Update
  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !confirm(
        `Are you sure you want to change ALL Available ${bulkData.plot_type}s to ₱${bulkData.new_price}?`,
      )
    )
      return;

    try {
      const res = await axios.put(
        "http://localhost:3000/api/inventory/bulk-price",
        bulkData,
      );
      alert(`${res.data.message} (${res.data.plots_affected} plots changed)`);
      refetch(); // Refresh the table
    } catch (error) {
      alert("Error updating prices.");
    }
  };

  if (isLoading) return <div className="p-8">Loading inventory...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Cemetery Inventory
          </h1>
          <p className="text-gray-500">Manage blocks, lots, and pricing.</p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" /> Add Single Plot
        </button>
      </div>

      {/* --- ADMIN TOOL: BULK PRICE UPDATE --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex items-center gap-3 bg-amber-100 p-3 rounded-full text-amber-700">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Global Price Adjustment</h2>
          <p className="text-sm text-gray-500">
            Update the base price for all{" "}
            <span className="font-bold text-red-500">Available</span> plots of a
            specific type.
          </p>
        </div>

        <form
          onSubmit={handleBulkUpdate}
          className="flex gap-2 w-full md:w-auto"
        >
          <select
            className="border p-2 rounded"
            value={bulkData.plot_type}
            onChange={(e) =>
              setBulkData({ ...bulkData, plot_type: e.target.value })
            }
          >
            <option value="Bone Crypt">Bone Crypt</option>
            <option value="Lawn Lot">Lawn Lot</option>
            <option value="Mausoleum">Mausoleum</option>
            <option value="Family Estate">Family Estate</option>
          </select>
          <input
            type="number"
            placeholder="New Price (₱)"
            className="border p-2 rounded w-32"
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
            className="bg-amber-500 text-white px-4 py-2 rounded font-bold hover:bg-amber-600"
          >
            Apply
          </button>
        </form>
      </div>

      {/* --- INVENTORY TABLE --- */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-sm">Plot ID</th>
              <th className="p-4 font-semibold text-sm">Block / Lot</th>
              <th className="p-4 font-semibold text-sm">Type</th>
              <th className="p-4 font-semibold text-sm">Base Price</th>
              <th className="p-4 font-semibold text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {plots?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No plots in inventory yet.
                </td>
              </tr>
            )}
            {plots?.map((plot: any) => (
              <tr key={plot.plot_id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-mono font-bold text-blue-600">
                  {plot.plot_id}
                </td>
                <td className="p-4">
                  Block {plot.block} - Lot {plot.lot}
                </td>
                <td className="p-4">{plot.plot_type}</td>
                <td className="p-4">₱{Number(plot.price).toLocaleString()}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      plot.status === "Available"
                        ? "bg-green-100 text-green-800"
                        : plot.status === "Sold"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
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

      {/* --- SLIDE-OUT DRAWER --- */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto transform transition-transform border-l">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold">Add New Plot</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-500 hover:text-red-500 transition"
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
