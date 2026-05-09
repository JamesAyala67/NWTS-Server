import { useState, useEffect } from "react";
import axios from "axios";

export default function AddTransaction({ clientId }: { clientId: string }) {
  const [availablePlots, setAvailablePlots] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    transaction_id: `TXN-${Date.now()}`,
    client_id: clientId,
    plot_id: "",
    plot_type: "",
    plot_size: "2.44 sqm",
    plot_price: 0,
    downpayment: 0,
    monthlypayment: 0,
    remaining_balance: 0,
    status: "Active",
    years_to_pay: 1, // Defaulting to 1 year
    prepared_by: "Admin",
  });

  // 1. Fetch only AVAILABLE plots
  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/inventory");
        const available = res.data.filter(
          (plot: any) => plot.status === "Available",
        );
        setAvailablePlots(available);
      } catch (error) {
        console.error("Failed to fetch plots", error);
      }
    };
    fetchPlots();
  }, []);

  // 2. Auto-fill defaults AND calculate 25% Downpayment when plot is selected
  const handlePlotSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPlotId = e.target.value;
    const selectedPlot = availablePlots.find(
      (p) => p.plot_id === selectedPlotId,
    );

    if (selectedPlot) {
      const basePrice = Number(selectedPlot.price);
      const autoDownpayment = basePrice * 0.25; // 25% automatic calculation

      setFormData({
        ...formData,
        plot_id: selectedPlot.plot_id,
        plot_type: selectedPlot.plot_type,
        plot_price: basePrice,
        downpayment: autoDownpayment,
        remaining_balance: basePrice - autoDownpayment,
      });
    } else {
      setFormData({
        ...formData,
        plot_id: "",
        plot_type: "",
        plot_price: 0,
        downpayment: 0,
        remaining_balance: 0,
      });
    }
  };

  // 3. Recalculate 25% Downpayment and Balance if staff edits the Agreed Price
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    const autoDownpayment = newPrice * 0.25; // Recalculates 25% based on new custom price

    setFormData({
      ...formData,
      plot_price: newPrice,
      downpayment: autoDownpayment,
      remaining_balance: newPrice - autoDownpayment,
    });
  };

  // 4. Recalculate balance if staff overrides the downpayment (e.g., client pays 50% upfront)
  const handleDownpaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customDownpayment = parseFloat(e.target.value) || 0;
    setFormData({
      ...formData,
      downpayment: customDownpayment,
      remaining_balance: formData.plot_price - customDownpayment,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plot_id) return alert("Please select a valid plot.");

    try {
      await axios.post("http://localhost:3000/api/transactions", formData);
      alert("Transaction saved successfully! The plot is now marked as Sold.");
      window.location.reload();
    } catch (error) {
      alert("Failed to save transaction");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SMART DROPDOWN */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-blue-700">
          Select Available Plot
        </label>
        <select
          className="border-2 border-blue-400 p-2 rounded bg-blue-50 font-bold"
          value={formData.plot_id}
          onChange={handlePlotSelection}
          required
        >
          <option value="">-- Choose a Plot --</option>
          {availablePlots.map((plot) => (
            <option key={plot.plot_id} value={plot.plot_id}>
              {plot.plot_id} ({plot.plot_type}) - Base: ₱
              {Number(plot.price).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-500">
            Plot Type
          </label>
          <input
            type="text"
            className="border p-2 rounded bg-gray-100"
            value={formData.plot_type}
            readOnly
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-800">
            Plot Size
          </label>
          <input
            type="text"
            className="border p-2 rounded"
            value={formData.plot_size}
            onChange={(e) =>
              setFormData({ ...formData, plot_size: e.target.value })
            }
            required
          />
        </div>
      </div>

      <hr className="my-2" />

      {/* Editable Agreed Price */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-800">
          Agreed Price (₱)
        </label>
        <input
          type="number"
          className="border p-2 rounded bg-green-50"
          value={formData.plot_price}
          onChange={handlePriceChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Downpayment (₱)</label>
          <input
            type="number"
            className="border p-2 rounded"
            value={formData.downpayment}
            onChange={handleDownpaymentChange}
            required
          />
          <p className="text-[10px] text-gray-500">Auto-calculated at 25%</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">Years to Pay</label>
          <select
            className="border p-2 rounded bg-white"
            value={formData.years_to_pay}
            onChange={(e) =>
              setFormData({
                ...formData,
                years_to_pay: parseInt(e.target.value),
              })
            }
          >
            {/* UPDATED: Only 1 or 2 years allowed */}
            <option value={1}>1 Year</option>
            <option value={2}>2 Years (Max)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Remaining Balance */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-2">
        <p className="text-sm text-red-700 font-semibold">Remaining Balance</p>
        <p className="text-2xl font-bold text-red-900">
          ₱{Number(formData.remaining_balance).toLocaleString()}
        </p>
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition mt-4"
      >
        Confirm Transaction
      </button>
    </form>
  );
}
