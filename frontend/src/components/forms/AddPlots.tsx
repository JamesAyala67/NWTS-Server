import { useState, useEffect } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

type FieldErrors = {
  block?: string;
  lot?: string;
  price?: string;
};

type TouchedFields = {
  block: boolean;
  lot: boolean;
  price: boolean;
};

export default function AddPlot() {
  const [block, setBlock] = useState("");
  const [lot, setLot] = useState("");
  const [plotType, setPlotType] = useState("Lawn Type");
  const [price, setPrice] = useState("");
  const [generatedPlotId, setGeneratedPlotId] = useState("BXX-LXX");

  // Validation States
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    block: false,
    lot: false,
    price: false,
  });

  // Automatically generate and format the Plot ID whenever Block or Lot changes
  useEffect(() => {
    const formatValue = (val: string) => {
      const clean = val.trim();
      if (!clean) return "XX";
      // Pad single digit with leading zero (e.g., '1' -> '01')
      if (clean.length === 1) return `0${clean}`;
      return clean;
    };

    setGeneratedPlotId(`B${formatValue(block)}-L${formatValue(lot)}`);
  }, [block, lot]);

  // Core Validation Logic
  const validateField = (
    name: keyof FieldErrors,
    value: string,
  ): string | undefined => {
    if (name === "block" || name === "lot") {
      if (!value) return "Required";
      if (parseInt(value, 10) <= 0) return "Must be > 0";
    }
    if (name === "price") {
      if (!value) return "Required";
      if (parseFloat(value) <= 0) return "Must be > 0";
      if (value.endsWith(".")) return "Incomplete decimal";
    }
    return undefined;
  };

  const getFormErrors = () => ({
    block: validateField("block", block),
    lot: validateField("lot", lot),
    price: validateField("price", price),
  });

  const isFormValid =
    !Object.values(getFormErrors()).some(Boolean) && block && lot && price;

  // Handlers for strict number-only enforcement
  const handleIntegerChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: keyof TouchedFields,
  ) => {
    const val = e.target.value.replace(/\D/g, "");
    setter(val);

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

    const parts = val.split(".");
    if (parts[1] && parts[1].length > 2) {
      val = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }

    setPrice(val);
    if (touched.price) {
      setErrors((prev) => ({ ...prev, price: validateField("price", val) }));
    }
  };

  const handleBlur = (field: keyof TouchedFields, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = getFormErrors();
    setErrors(newErrors);
    setTouched({ block: true, lot: true, price: true });

    if (Object.values(newErrors).some(Boolean)) return;

    try {
      const employeeId = localStorage.getItem("employee_id") || "SYSTEM_EMP";

      const payload = {
        plot_id: generatedPlotId,
        block: block.trim(),
        lot: lot.trim(),
        plot_type: plotType,
        price: parseFloat(price),
        employee_id: employeeId,
      };

      await api.post(`${API_BASE_URL}/plots/`, payload);
      alert(`Plot ${generatedPlotId} successfully added!`);
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.error || "Error adding plot");
    }
  };

  // Dynamic input styling based on state
  const inputClass = (field: keyof FieldErrors) => {
    const base =
      "border p-2.5 rounded-lg w-full focus:outline-none transition-all duration-200 shadow-sm ";

    if (touched[field] && errors[field]) {
      return (
        base +
        "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-red-900"
      );
    }
    const fieldValue =
      field === "block" ? block : field === "lot" ? lot : price;
    if (touched[field] && !errors[field] && fieldValue) {
      return (
        base +
        "border-green-400 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-green-900"
      );
    }
    return (
      base +
      "border-gray-300 focus:border-[#4a5a4a] focus:ring-2 focus:ring-[#4a5a4a]/20"
    );
  };

  // Helper function to render the trailing Lucide icon based on validation state
  const renderValidationIcon = (field: keyof FieldErrors, value: string) => {
    if (!touched[field]) return null;
    if (errors[field])
      return <AlertCircle size={18} className="text-red-500" />;
    if (!errors[field] && value)
      return <CheckCircle2 size={18} className="text-green-500" />;
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Real-time Generated ID Display Panel */}
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-center shadow-inner">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
          Auto-Generated Plot ID
        </p>
        <p
          className={`text-3xl font-mono font-bold transition-colors duration-300 ${isFormValid ? "text-[#4a5a4a]" : "text-gray-400"}`}
        >
          {generatedPlotId}
        </p>
      </div>

      {/* Block & Lot */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">
            Block <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g., 1"
              className={`${inputClass("block")} pr-10`}
              value={block}
              onChange={(e) => handleIntegerChange(e, setBlock, "block")}
              onBlur={() => handleBlur("block", block)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {renderValidationIcon("block", block)}
            </div>
          </div>
          {touched.block && errors.block && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle size={14} /> {errors.block}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">
            Lot <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g., 3"
              className={`${inputClass("lot")} pr-10`}
              value={lot}
              onChange={(e) => handleIntegerChange(e, setLot, "lot")}
              onBlur={() => handleBlur("lot", lot)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {renderValidationIcon("lot", lot)}
            </div>
          </div>
          {touched.lot && errors.lot && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle size={14} /> {errors.lot}
            </p>
          )}
        </div>
      </div>

      {/* Plot Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">Plot Type</label>
        <select
          className="border border-gray-300 p-2.5 rounded-lg bg-white focus:outline-none focus:border-[#4a5a4a] focus:ring-2 focus:ring-[#4a5a4a]/20 w-full shadow-sm transition-all"
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

      {/* Price */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Base Price (₱) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-sm pointer-events-none transition-colors
            ${
              touched.price && errors.price
                ? "text-red-500"
                : touched.price && !errors.price && price
                  ? "text-green-600"
                  : "text-gray-400"
            }`}
          >
            ₱
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className={`${inputClass("price")} pl-8 pr-10`}
            value={price}
            onChange={handlePriceChange}
            onBlur={() => handleBlur("price", price)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {renderValidationIcon("price", price)}
          </div>
        </div>
        {touched.price && errors.price && (
          <p className="text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertCircle size={14} /> {errors.price}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          !isFormValid && (touched.block || touched.lot || touched.price)
        }
        className={`w-full font-bold py-3 rounded-lg transition-all duration-200 mt-6 shadow-md
          ${
            isFormValid
              ? "bg-[#4a5a4a] text-white hover:bg-[#3a4a3f] active:scale-[0.98]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        {isFormValid ? "Save Plot" : "Fill Required Fields"}
      </button>
    </form>
  );
}
