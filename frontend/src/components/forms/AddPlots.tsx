// This component provides a form for adding new plots to the system
// it collects necessary information such as plot ID, block, lot, plot type, and price
// upon submission, it sends a POST request to the backend API to create the new plot entry in the database
// the form includes validation to ensure all required fields are filled out correctly

import { useState } from "react";
import axios from "axios";

export default function AddPlot() {
  const [formData, setFormData] = useState({
    plot_id: "",
    block: "",
    lot: "",
    plot_type: "Lawn Lot",
    price: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/plots/", formData);
      alert("Plot successfully added!");
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error adding plot");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">
          Plot ID (Must be unique)
        </label>
        <input
          type="text"
          placeholder="e.g., B01-L03-P01"
          className="border p-2 rounded uppercase"
          required
          onChange={(e) =>
            setFormData({ ...formData, plot_id: e.target.value.toUpperCase() })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Block</label>
          <input
            type="text"
            placeholder="e.g., 01"
            className="border p-2 rounded uppercase"
            required
            onChange={(e) =>
              setFormData({ ...formData, block: e.target.value.toUpperCase() })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Lot</label>
          <input
            type="text"
            placeholder="e.g., 03"
            className="border p-2 rounded uppercase"
            required
            onChange={(e) =>
              setFormData({ ...formData, lot: e.target.value.toUpperCase() })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Plot Type</label>
        <select
          className="border p-2 rounded bg-white"
          required
          onChange={(e) =>
            setFormData({ ...formData, plot_type: e.target.value })
          }
        >
          {/* Dagdag nlng digdi if need */}
          <option value="Lawn Type">Lawn Type</option>
          <option value="Kennedy Type">Kennedy Type</option>
          <option value="Family Type">Family Type</option>
          <option value="Mausoleum">Mausoleum</option>
          <option value="Mini Mausoleum">Mini Mausoleum</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Base Price (₱)</label>
        <input
          type="number"
          className="border p-2 rounded"
          required
          onChange={(e) =>
            setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
          }
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition mt-4"
      >
        Save Plot
      </button>
    </form>
  );
}
