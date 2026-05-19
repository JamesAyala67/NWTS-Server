// This component provides a form for adding new transactions. It allows users to search for available plots,
// select one, and then input transaction details such as agreed price, downpayment, and payment terms.
// The form dynamically calculates the remaining balance and estimated monthly payments based on user input.
// It fetches a list of active employees from the database to populate the "Prepared / Assisted By" dropdown.

import { useState, useEffect } from "react";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AddTransaction({ clientId }: { clientId: string }) {
  const [availablePlots, setAvailablePlots] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]); // Dynamic employee list state
  const [open, setOpen] = useState(false);

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  const [formData, setFormData] = useState({
    transaction_id: `TXN-${Date.now()}-${randomSuffix}`,
    client_id: clientId,
    plot_id: "",
    plot_type: "",
    plot_size: "2.44 sqm",
    plot_price: 0,
    downpayment: 0,
    monthlypayment: 0,
    remaining_balance: 0,
    status: "Pending",
    years_to_pay: 1,
    prepared_by: "", // Initialized empty to force selection
  });

  // Fetch available plots
  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/plots");
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

  // Fetch active employees from backend
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

  // Calculate monthly payments
  useEffect(() => {
    const totalMonths = formData.years_to_pay * 12;
    const monthly =
      formData.remaining_balance > 0
        ? formData.remaining_balance / totalMonths
        : 0;

    setFormData((prev) => ({
      ...prev,
      monthlypayment: monthly,
    }));
  }, [formData.remaining_balance, formData.years_to_pay]);

  const handlePlotSelection = (selectedPlot: any) => {
    const basePrice = Number(selectedPlot.price) || 0;
    const autoDownpayment = basePrice * 0.25;

    setFormData((prev) => ({
      ...prev,
      plot_id: selectedPlot.plot_id,
      plot_type: selectedPlot.plot_type || "",
      plot_size: selectedPlot.plot_size || selectedPlot.size || prev.plot_size,
      plot_price: basePrice,
      downpayment: autoDownpayment,
      remaining_balance: basePrice - autoDownpayment,
    }));

    setOpen(false);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    const autoDownpayment = newPrice * 0.25;

    setFormData({
      ...formData,
      plot_price: newPrice,
      downpayment: autoDownpayment,
      remaining_balance: newPrice - autoDownpayment,
    });
  };

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
    if (!formData.prepared_by)
      return alert("Please select the assisting employee.");

    try {
      // System account physically encoder mapping for Audit Logs
      const employeeId = localStorage.getItem("employee_id") || null;

      const payload = {
        ...formData,
        employee_id: employeeId,
      };

      await axios.post("http://localhost:3000/api/transactions", payload);
      alert("Transaction saved successfully! The plot is now marked as Sold.");
      window.location.reload();
    } catch (error) {
      alert("Failed to save transaction");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Search dropdown for available plots */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-[#1e293b]">
          Search Available Plot
        </Label>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between border border-gray-300 bg-white font-medium hover:bg-gray-50 shadow-sm"
            >
              {formData.plot_id ? (
                <span className="text-[#4a5a4a] font-bold">
                  {formData.plot_id} ({formData.plot_type})
                </span>
              ) : (
                <span className="text-gray-500">
                  Search block, lot, or ID...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0 bg-white border border-gray-200 shadow-xl rounded-md"
            align="start"
          >
            <Command className="bg-white rounded-md">
              <CommandInput
                placeholder="Search plot..."
                className="border-none focus:ring-0"
              />
              <CommandList className="bg-white">
                <CommandEmpty>No plot found.</CommandEmpty>
                <CommandGroup className="bg-white">
                  {availablePlots.map((plot) => (
                    <CommandItem
                      key={plot.plot_id}
                      value={`${plot.plot_id} ${plot.plot_type}`}
                      onSelect={() => handlePlotSelection(plot)}
                      className="cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100 text-gray-800"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-[#4a5a4a]",
                          formData.plot_id === plot.plot_id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex justify-between w-full">
                        <span className="font-bold">{plot.plot_id}</span>
                        <span className="text-gray-500 text-sm">
                          {plot.plot_type} -{" "}
                          <span className="text-[#4a5a4a] font-bold">
                            ₱{Number(plot.price).toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            Plot Type
          </Label>
          <Input
            type="text"
            className="bg-gray-100 border-gray-300 text-gray-500 font-medium"
            value={formData.plot_type}
            readOnly
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            Plot Size
          </Label>
          <Input
            type="text"
            className="bg-white border-gray-300 shadow-sm"
            value={formData.plot_size}
            onChange={(e) =>
              setFormData({ ...formData, plot_size: e.target.value })
            }
            required
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Editable Price */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-gray-700">
          Agreed Price (₱)
        </Label>
        <Input
          type="number"
          className="bg-white border-gray-300 font-bold text-lg h-12 shadow-sm"
          value={formData.plot_price}
          onChange={handlePriceChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            Downpayment (₱)
          </Label>
          <Input
            type="number"
            className="bg-white border-gray-300 shadow-sm"
            value={formData.downpayment}
            onChange={handleDownpaymentChange}
            required
          />
          <p className="text-[10px] text-gray-400 font-medium">
            Auto-calculated at 25%
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            Years to Pay
          </Label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800"
            value={formData.years_to_pay}
            onChange={(e) =>
              setFormData({
                ...formData,
                years_to_pay: parseInt(e.target.value),
              })
            }
          >
            <option value={1}>1 Year (12 mos)</option>
            <option value={2}>2 Years (24 mos)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Breakdown Display */}
      <div className="bg-[#f5f0e6] p-5 rounded-xl border border-[#e8dfce] mt-2 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#7a6a4f] font-bold mb-1">
            Remaining Balance
          </p>
          <p className="text-2xl font-bold text-[#4a5a4a]">
            ₱{Number(formData.remaining_balance).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-[#7a6a4f] font-bold mb-1">
            Est. Monthly{" "}
            <span className="normal-case font-medium">
              ({formData.years_to_pay * 12} mos)
            </span>
          </p>
          <p className="text-xl font-bold text-[#4a5a4a]">
            ₱
            {Number(formData.monthlypayment).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Dynamic Dropdown for Employee Selection */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-gray-700">
          Prepared / Assisted By
        </Label>
        <select
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800"
          value={formData.prepared_by}
          onChange={(e) =>
            setFormData({ ...formData, prepared_by: e.target.value })
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

      <Button
        type="submit"
        className="w-full bg-[#4a5a4a] text-white font-bold py-6 rounded-lg hover:bg-[#3a4a3f] transition mt-2 shadow-sm"
      >
        Confirm Transaction
      </Button>
    </form>
  );
}
