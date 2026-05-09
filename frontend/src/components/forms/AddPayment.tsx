import { useState } from "react";
import axios from "axios";

export default function AddPayment({
  transactionId,
  currentBalance,
}: {
  transactionId: string;
  currentBalance: number;
}) {
  const [formData, setFormData] = useState({
    amount_paid: 0,
    payment_method: "Cash",
    reference_number: "",
    recorded_by: "Admin", // In a real app, this is the logged-in user
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Safety check: Prevent overpayment
    if (formData.amount_paid > currentBalance) {
      alert("Error: Payment amount cannot exceed the remaining balance!");
      return;
    }

    if (formData.amount_paid <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/payments", {
        ...formData,
        transaction_id: transactionId,
      });
      alert("Payment successfully recorded!");
      window.location.reload(); // Refresh to see the updated balance
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Failed to record payment. Check the console.");
    }
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
          max={currentBalance} // HTML validation to stop overpayment
          className="border p-2 rounded"
          value={formData.amount_paid}
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
          className="border p-2 rounded bg-white"
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
          className="border p-2 rounded"
          value={formData.reference_number}
          onChange={(e) =>
            setFormData({ ...formData, reference_number: e.target.value })
          }
        />
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition mt-4"
      >
        Record Payment
      </button>
    </form>
  );
}
