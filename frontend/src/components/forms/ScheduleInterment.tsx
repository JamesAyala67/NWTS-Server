import { useState } from "react";
import axios from "axios";

interface ScheduleIntermentProps {
  plotId: string;
  transactionId: string;
  onSuccess: () => void;
}

export default function ScheduleInterment({
  plotId,
  transactionId,
  onSuccess,
}: ScheduleIntermentProps) {
  const [formData, setFormData] = useState({
    plot_id: plotId,
    transaction_id: transactionId,
    deceased_name: "",
    date_of_birth: "",
    date_of_death: "",
    date_of_interment: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/interments", formData);
      alert(
        "Interment successfully scheduled! Plot is now marked as Occupied.",
      );
      onSuccess(); // Close the drawer/refresh data
    } catch (error) {
      alert("Failed to schedule interment.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Auto-filled Read-Only Data */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Plot ID</label>
          <input
            type="text"
            className="bg-transparent font-bold"
            value={formData.plot_id}
            readOnly
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">
            Transaction ID
          </label>
          <input
            type="text"
            className="bg-transparent font-bold text-xs"
            value={formData.transaction_id}
            readOnly
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Deceased Full Name</label>
        <input
          type="text"
          className="border p-2 rounded"
          placeholder="e.g., Juan Dela Cruz"
          onChange={(e) =>
            setFormData({ ...formData, deceased_name: e.target.value })
          }
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Date of Birth</label>
          <input
            type="date"
            className="border p-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, date_of_birth: e.target.value })
            }
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Date of Death</label>
          <input
            type="date"
            className="border p-2 rounded"
            onChange={(e) =>
              setFormData({ ...formData, date_of_death: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-4 border-t pt-4">
        <label className="text-sm font-semibold text-blue-700">
          Scheduled Date of Interment
        </label>
        <input
          type="date"
          className="border-2 border-blue-400 p-2 rounded bg-blue-50"
          onChange={(e) =>
            setFormData({ ...formData, date_of_interment: e.target.value })
          }
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 transition mt-4"
      >
        Confirm & Schedule Interment
      </button>
    </form>
  );
}
