// This component provides a form for adding new plots to the system
// It collects block, lot, plot type, and price, automatically generating a formatted Plot ID.
// Upon submission, it sends a POST request along with the active employee ID for the audit trail.

import { useState, useEffect } from "react";
import axios from "axios";

export default function AddPlot() {
  const [block, setBlock] = useState("");
  const [lot, setLot] = useState("");
  const [plotType, setPlotType] = useState("Lawn Type");
  const [price, setPrice] = useState(0);
  const [generatedPlotId, setGeneratedPlotId] = useState("BXX-LXX");

  // Automatically generate and format the Plot ID whenever Block or Lot changes
  useEffect(() => {
    const formatValue = (val: string) => {
      const clean = val.trim().toUpperCase();
      if (!clean) return "XX";
      // If it's a single digit number, automatically pad it with a leading zero (e.g., '1' -> '01')
      if (clean.length === 1 && !isNaN(Number(clean))) {
        return `0${clean}`;
      }
      return clean;
    };

    const formattedBlock = formatValue(block);
    const formattedLot = formatValue(lot);

    setGeneratedPlotId(`B${formattedBlock}-L${formattedLot}`);
  }, [block, lot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!block.trim() || !lot.trim() || price <= 0) {
      alert(
        "Please ensure all fields are filled out correctly and price is greater than 0.",
      );
      return;
    }

    try {
      // Get the current logged-in employee ID for auditing (fallback to system default if not logged in yet)
      const employeeId = localStorage.getItem("employee_id") || "SYSTEM_EMP";

      const payload = {
        plot_id: generatedPlotId,
        block: block.trim().toUpperCase(),
        lot: lot.trim().toUpperCase(),
        plot_type: plotType,
        price: price,
        employee_id: employeeId, // Included for the backend Audit Trail
      };

      await axios.post("http://localhost:3000/api/plots/", payload);
      alert(`Plot ${generatedPlotId} successfully added!`);
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error adding plot");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Real-time Generated ID Display Panel */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center mb-4 shadow-inner">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
          Auto-Generated Plot ID
        </p>
        <p className="text-2xl font-mono font-bold text-[#4a5a4a]">
          {generatedPlotId}
        </p>
      </div>

      {/* Hand-written Block & Lot Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Block</label>
          <input
            type="text"
            placeholder="e.g., 1 or A"
            className="border p-2 rounded uppercase focus:outline-none focus:ring-1 focus:ring-[#4a5a4a]"
            required
            value={block}
            onChange={(e) => setBlock(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Lot</label>
          <input
            type="text"
            placeholder="e.g., 3 or B"
            className="border p-2 rounded uppercase focus:outline-none focus:ring-1 focus:ring-[#4a5a4a]"
            required
            value={lot}
            onChange={(e) => setLot(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">Plot Type</label>
        <select
          className="border p-2 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#4a5a4a]"
          required
          value={plotType}
          onChange={(e) => setPlotType(e.target.value)}
        >
          <option value="Lawn Type">Lawn Type</option>
          <option value="Kennedy Type">Kennedy Type</option>
          <option value="Family Type">Family Type</option>
          <option value="Mausoleum">Mausoleum</option>
          <option value="Mini Mausoleum">Mini Mausoleum</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">
          Base Price (₱)
        </label>
        <input
          type="number"
          placeholder="0.00"
          className="border p-2 rounded focus:outline-none focus:ring-1 focus:ring-[#4a5a4a]"
          required
          value={price || ""}
          onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-[#4a5a4a] text-white font-bold py-2.5 rounded hover:bg-[#3a4a3f] transition mt-4 shadow-sm"
      >
        Save Plot
      </button>
    </form>
  );
}
