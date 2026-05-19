// This component allows users to add a payment for a specific transaction
// it includes form validation to ensure the payment amount does not exceed the remaining balance
// and provides feedback on successful or failed payment recording
// It now features a dynamic employee dropdown to select who processed the payment.

import { useState, useEffect } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AddPayment({
  transactionId,
  currentBalance,
  onSuccess,
}: {
  transactionId: string;
  currentBalance: number;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [employees, setEmployees] = useState<any[]>([]); // Dynamic employee list state

  const [formData, setFormData] = useState({
    amount_paid: 0,
    payment_method: "Cash",
    reference_number: "",
    recorded_by: "", // Initialized empty to force user selection
  });

  // Fetch active employees to populate the Recorded By dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/employees");
        setEmployees(res.data);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, []);

  // Save payment
  const paymentMutation = useMutation({
    mutationFn: (newPayment: any) => {
      return axios.post("http://localhost:3000/api/payments", newPayment);
    },
    onSuccess: () => {
      alert("Payment successfully recorded!");
      // Invalidate transactions query to refresh data
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error saving payment:", error);
      alert("Failed to record payment. Check the console.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount_paid > currentBalance) {
      return alert(
        "Error: Payment amount cannot exceed the remaining balance!",
      );
    }
    if (formData.amount_paid <= 0) {
      return alert("Please enter a valid amount.");
    }
    if (!formData.recorded_by) {
      return alert("Please select the employee who recorded this payment.");
    }

    // Capture the physical encoder's system ID for the database Audit Trail
    const employeeId = localStorage.getItem("employee_id") || null;

    // Trigger the mutation
    paymentMutation.mutate({
      ...formData,
      transaction_id: transactionId,
      employee_id: employeeId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Visual Indicator of Current Balance */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
        <p className="text-sm text-green-700 font-semibold">Current Balance</p>
        <p className="text-2xl font-bold text-green-900">
          ₱{Number(currentBalance).toLocaleString()}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Payment Amount (₱)</label>
        <input
          type="number"
          max={currentBalance}
          className="border p-2 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
          value={formData.amount_paid || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount_paid: parseFloat(e.target.value) || 0,
            })
          }
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Payment Method</label>
        <select
          className="border p-2 rounded bg-white focus:outline-none focus:ring-1 focus:ring-green-600"
          value={formData.payment_method}
          onChange={(e) =>
            setFormData({ ...formData, payment_method: e.target.value })
          }
        >
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="GCash">GCash</option>
          <option value="Check">Check</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">
          Reference Number (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., GCash Ref No."
          className="border p-2 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
          value={formData.reference_number}
          onChange={(e) =>
            setFormData({ ...formData, reference_number: e.target.value })
          }
        />
      </div>

      {/* Dynamic Dropdown for Employee Selection */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">
          Recorded By
        </label>
        <select
          className="border p-2 rounded bg-white focus:outline-none focus:ring-1 focus:ring-green-600"
          value={formData.recorded_by}
          onChange={(e) =>
            setFormData({ ...formData, recorded_by: e.target.value })
          }
          required
        >
          <option value="">-- Select Assisting Employee --</option>
          {employees.map((emp) => {
            const fullName = `${emp.first_name} ${emp.last_name}`;
            return (
              <option key={emp.employee_id} value={fullName}>
                {fullName} ({emp.role})
              </option>
            );
          })}
        </select>
      </div>

      <button
        type="submit"
        disabled={paymentMutation.isPending}
        className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition mt-4 disabled:opacity-50"
      >
        {paymentMutation.isPending ? "Recording..." : "Record Payment"}
      </button>
    </form>
  );
}
