// This component allows users to schedule an interment for a specific plot and transaction
// it collects necessary details about the deceased and the interment date,
// then submits this information to the backend API, upon successful scheduling
// it updates the UI to reflect the new interment and marks the plot as occupied

import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  // Updated to match database columns
  const [formData, setFormData] = useState({
    plot_id: plotId,
    transaction_id: transactionId,
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    date_of_death: "",
    date_of_interment: "",
  });

  const intermentMutation = useMutation({
    mutationFn: (newInterment: typeof formData) => {
      return axios.post("http://localhost:3000/api/interments", newInterment);
    },
    onSuccess: () => {
      alert(
        "Interment successfully scheduled! Plot is now marked as Occupied.",
      );
      // Invalidate both transactions and plots queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error scheduling interment:", error);
      alert("Failed to schedule interment.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    intermentMutation.mutate(formData);
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

      {/* Deceased Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">First Name</label>
          <input
            type="text"
            className="border p-2 rounded"
            placeholder="e.g., Juan"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Middle Name</label>
          <input
            type="text"
            className="border p-2 rounded"
            placeholder="e.g., Santos"
            value={formData.middle_name}
            onChange={(e) =>
              setFormData({ ...formData, middle_name: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Last Name</label>
          <input
            type="text"
            className="border p-2 rounded"
            placeholder="e.g., Dela Cruz"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Dates fields */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Date of Birth</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={formData.date_of_birth}
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
            value={formData.date_of_death}
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
          value={formData.date_of_interment}
          onChange={(e) =>
            setFormData({ ...formData, date_of_interment: e.target.value })
          }
          required
        />
      </div>

      <button
        type="submit"
        disabled={intermentMutation.isPending}
        className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 transition mt-4 disabled:opacity-50"
      >
        {intermentMutation.isPending
          ? "Scheduling..."
          : "Confirm & Schedule Interment"}
      </button>
    </form>
  );
}
