import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  Paperclip,
  X,
  UploadCloud,
  Loader2,
  MapPin,
  FileText,
  CreditCard,
  UserCheck,
} from "lucide-react";
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

export default function AddTransaction({
  clientId,
  onSuccess,
}: {
  clientId: string;
  onSuccess?: (data: any) => void;
}) {
  const queryClient = useQueryClient();

  const defaultFormData = {
    client_id: clientId,
    professional_receipt: "",
    sales_invoice: "",
    remarks: "",
    plot_id: "",
    plot_type: "",
    plot_size: "2.44",
    contract_price: 0,
    spot_discount: false,
    dp_percentage: "0.25",
    final_price: 0,
    downpayment: 0,
    remaining_balance: 0,
    monthlypayment: 0,
    status: "Pending",
    years_to_pay: 1,
    prepared_by: "",
  };

  // 1. COMPONENT STATE HOOKS
  const [formData, setFormData] = useState(defaultFormData);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 2. DATA FETCHING (Queries)
  const { data: availablePlots = [], isLoading: isLoadingPlots } = useQuery({
    queryKey: ["plots", "available"],
    queryFn: async () => {
      const res = await api.get(`${API_BASE_URL}/plots`);
      return res.data.filter((plot: any) => plot.status === "Available");
    },
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get(`${API_BASE_URL}/employees`);
      return res.data;
    },
  });

  // 3. CENTRALIZED FINANCIAL ENGINE
  useEffect(() => {
    const contractPrice = Number(formData.contract_price) || 0;
    const discountRate = formData.spot_discount ? 0.08 : 0;
    const finalPrice = contractPrice - contractPrice * discountRate;
    const dpPercent = Number(formData.dp_percentage);
    const downpayment = finalPrice * dpPercent;
    const remainingBalance = finalPrice - downpayment;
    const totalMonths = formData.years_to_pay * 12;
    const monthly =
      remainingBalance > 0 && totalMonths > 0
        ? remainingBalance / totalMonths
        : 0;

    setFormData((prev) => ({
      ...prev,
      final_price: finalPrice,
      downpayment: downpayment,
      remaining_balance: remainingBalance,
      monthlypayment: monthly,
    }));
  }, [
    formData.contract_price,
    formData.spot_discount,
    formData.dp_percentage,
    formData.years_to_pay,
  ]);

  // Strict Dynamic Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.plot_id) newErrors.plot_id = "Please select a valid plot.";
    if (!formData.prepared_by)
      newErrors.prepared_by = "Please select the assisting employee.";
    if (Number(formData.contract_price) <= 0)
      newErrors.contract_price = "Contract price must be greater than 0.";
    if (!formData.plot_size || Number(formData.plot_size) <= 0)
      newErrors.plot_size = "Please enter a valid plot size.";

    if (!formData.professional_receipt) {
      newErrors.professional_receipt = "PR number is required.";
    } else if (!/^\d{4}$/.test(formData.professional_receipt)) {
      newErrors.professional_receipt = "Must be exactly 4 digits.";
    }

    if (!formData.sales_invoice) {
      newErrors.sales_invoice = "SI number is required.";
    } else if (!/^\d{6}$/.test(formData.sales_invoice)) {
      newErrors.sales_invoice = "Must be exactly 6 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    let finalValue: any =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    if (name === "professional_receipt" || name === "sales_invoice") {
      finalValue = value.replace(/\D/g, "");
    }

    if (name === "plot_size" || name === "contract_price") {
      let clean = String(value).replace(/[^0-9.]/g, "");
      const parts = clean.split(".");
      if (parts.length > 2) {
        clean = parts[0] + "." + parts.slice(1).join("");
      }
      finalValue = clean;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Native File Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  };
  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePlotSelection = (selectedPlot: any) => {
    const basePrice = Number(selectedPlot.price) || 0;
    const rawSize = selectedPlot.plot_size || selectedPlot.size || "2.44";
    const cleanSize = String(rawSize).replace(/[^0-9.]/g, "");

    setFormData((prev) => ({
      ...prev,
      plot_id: selectedPlot.plot_id,
      plot_type: selectedPlot.plot_type || "",
      plot_size: cleanSize,
      contract_price: basePrice,
    }));

    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.plot_id;
      delete updated.contract_price;
      delete updated.plot_size;
      return updated;
    });
    setOpen(false);
  };

  // 4. DATA SUBMISSION (Mutation)
  const submitTransaction = useMutation({
    mutationFn: async () => {
      const employeeId = localStorage.getItem("employee_id") || "";

      // Step 1: Submit transaction object
      const transactionPayload = {
        ...formData,
        professional_receipt: `PR-${formData.professional_receipt}`,
        sales_invoice: `SI-${formData.sales_invoice}`,
        plot_size: `${formData.plot_size} sqm`,
        plot_price: formData.final_price,
        employee_id: employeeId || null,
      };

      const txResponse = await api.post(
        `${API_BASE_URL}/transactions`,
        transactionPayload,
      );
      const generatedTransactionId =
        txResponse.data?.transaction_id ||
        txResponse.data?.id ||
        `TX-${Date.now()}`;

      // Step 2: Upload files
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file) => {
          const fileFormData = new FormData();
          fileFormData.append("file", file);
          fileFormData.append("transaction_id", generatedTransactionId);
          fileFormData.append("file_name", file.name);
          fileFormData.append("prepared_by", formData.prepared_by);
          fileFormData.append("uploaded_by", formData.prepared_by);
          if (employeeId) fileFormData.append("employee_id", employeeId);

          return api.post(
            `${API_BASE_URL}/clients/${clientId}/files`,
            fileFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
        });
        await Promise.all(uploadPromises);
      }
      return txResponse.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["plots", "available"] });
      alert("Transaction records and dropped attachments saved successfully!");
      setFormData(defaultFormData);
      setSelectedFiles([]);

      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      console.error(error);
      alert("Failed to successfully sync transaction records or file arrays.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    submitTransaction.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* --- SECTION 1: PLOT DETAILS --- */}
      <div
        className={cn(
          "space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-opacity",
          submitTransaction.isPending && "opacity-50 pointer-events-none",
        )}
      >
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <MapPin className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Plot Details
        </h3>

        {/* Search Dropdown */}
        <div className="flex flex-col gap-2">
          <Label
            className={cn(
              "text-xs font-semibold",
              errors.plot_id ? "text-red-600" : "text-gray-600",
            )}
          >
            Search Available Plot <span className="text-red-500">*</span>
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between border font-medium shadow-sm transition-colors",
                  errors.plot_id
                    ? "border-red-500 bg-red-50/50 hover:bg-red-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100",
                )}
                disabled={isLoadingPlots || submitTransaction.isPending}
              >
                {formData.plot_id ? (
                  <span className="text-[#4a5a4a] font-bold">
                    {formData.plot_id} ({formData.plot_type})
                  </span>
                ) : (
                  <span className="text-gray-500">
                    {isLoadingPlots
                      ? "Loading available inventory..."
                      : "Search block, lot, or ID..."}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-[400px] p-0 bg-white border border-gray-200 shadow-xl rounded-md"
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
                    {availablePlots.map((plot: any) => (
                      <CommandItem
                        key={plot.plot_id}
                        value={`${plot.plot_id} ${plot.plot_type}`}
                        onSelect={() => handlePlotSelection(plot)}
                        className="cursor-pointer hover:bg-gray-100 text-gray-800"
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
          {errors.plot_id && (
            <span className="text-[10px] text-red-500 font-medium">
              {errors.plot_id}
            </span>
          )}
        </div>

        {/* Plot Metadata Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-gray-600">
              Plot Type
            </Label>
            <Input
              type="text"
              className="bg-gray-50 border-gray-200 text-gray-500 font-medium cursor-not-allowed h-10"
              value={formData.plot_type}
              readOnly
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              className={cn(
                "text-xs font-semibold",
                errors.plot_size ? "text-red-600" : "text-gray-600",
              )}
            >
              Plot Size <span className="text-red-500">*</span>
            </Label>
            <div
              className={cn(
                "flex rounded-md shadow-sm border overflow-hidden h-10 focus-within:ring-2 focus-within:ring-[#4a5a4a]",
                errors.plot_size ? "border-red-500" : "border-gray-200",
              )}
            >
              <Input
                type="text"
                name="plot_size"
                disabled={submitTransaction.isPending}
                className={cn(
                  "rounded-none border-0 bg-white flex-1 h-full shadow-none focus-visible:ring-0",
                  errors.plot_size && "bg-red-50/50 text-red-900",
                )}
                value={formData.plot_size}
                onChange={handleInputChange}
                required
              />
              <span
                className={cn(
                  "inline-flex items-center px-3 border-l text-sm font-semibold select-none",
                  errors.plot_size
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-500 border-gray-200",
                )}
              >
                sqm
              </span>
            </div>
            {errors.plot_size && (
              <span className="text-[10px] text-red-500 font-medium">
                {errors.plot_size}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 2: DOCUMENTATION --- */}
      <div
        className={cn(
          "space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-opacity",
          submitTransaction.isPending && "opacity-50 pointer-events-none",
        )}
      >
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <FileText className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Documentation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              className={cn(
                "text-xs font-semibold",
                errors.professional_receipt ? "text-red-600" : "text-gray-600",
              )}
            >
              Professional Receipt (PR) <span className="text-red-500">*</span>
            </Label>
            <div
              className={cn(
                "flex rounded-md shadow-sm border overflow-hidden h-10 focus-within:ring-2 focus-within:ring-[#4a5a4a]",
                errors.professional_receipt
                  ? "border-red-500"
                  : "border-gray-200",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center px-3 border-r text-sm font-semibold select-none",
                  errors.professional_receipt
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-500 border-gray-200",
                )}
              >
                PR-
              </span>
              <Input
                type="text"
                name="professional_receipt"
                placeholder="XXXX"
                maxLength={4}
                disabled={submitTransaction.isPending}
                className={cn(
                  "rounded-none border-0 bg-white flex-1 h-full shadow-none focus-visible:ring-0",
                  errors.professional_receipt &&
                    "bg-red-50/50 text-red-900 placeholder-red-300",
                )}
                value={formData.professional_receipt}
                onChange={handleInputChange}
              />
            </div>
            {errors.professional_receipt && (
              <span className="text-[10px] text-red-500 font-medium">
                {errors.professional_receipt}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              className={cn(
                "text-xs font-semibold",
                errors.sales_invoice ? "text-red-600" : "text-gray-600",
              )}
            >
              Sales Invoice (SI) <span className="text-red-500">*</span>
            </Label>
            <div
              className={cn(
                "flex rounded-md shadow-sm border overflow-hidden h-10 focus-within:ring-2 focus-within:ring-[#4a5a4a]",
                errors.sales_invoice ? "border-red-500" : "border-gray-200",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center px-3 border-r text-sm font-semibold select-none",
                  errors.sales_invoice
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-500 border-gray-200",
                )}
              >
                SI-
              </span>
              <Input
                type="text"
                name="sales_invoice"
                placeholder="XXXXXX"
                maxLength={6}
                disabled={submitTransaction.isPending}
                className={cn(
                  "rounded-none border-0 bg-white flex-1 h-full shadow-none focus-visible:ring-0",
                  errors.sales_invoice &&
                    "bg-red-50/50 text-red-900 placeholder-red-300",
                )}
                value={formData.sales_invoice}
                onChange={handleInputChange}
              />
            </div>
            {errors.sales_invoice && (
              <span className="text-[10px] text-red-500 font-medium">
                {errors.sales_invoice}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 3: FINANCIAL DETAILS --- */}
      <div
        className={cn(
          "space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-opacity",
          submitTransaction.isPending && "opacity-50 pointer-events-none",
        )}
      >
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <CreditCard className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Financial
          Details
        </h3>

        {/* Pricing Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="flex flex-col gap-1.5 relative">
            <Label
              className={cn(
                "text-xs font-semibold",
                errors.contract_price ? "text-red-600" : "text-gray-600",
              )}
            >
              Contract Price (₱) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              name="contract_price"
              disabled={submitTransaction.isPending}
              className={cn(
                "h-10 font-bold shadow-sm focus-visible:ring-[#4a5a4a]",
                errors.contract_price
                  ? "border-red-500 bg-red-50/50 text-red-900"
                  : "bg-white border-gray-200",
              )}
              value={formData.contract_price}
              onChange={handleInputChange}
              required
            />
            {errors.contract_price && (
              <span className="text-[10px] text-red-500 font-medium absolute -bottom-4">
                {errors.contract_price}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-gray-600">
              Discount Status
            </Label>
            <div className="flex h-10 items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-2 shadow-sm transition-colors hover:bg-gray-100">
              <Label
                htmlFor="spot_discount"
                className={cn(
                  "text-sm font-semibold text-gray-700 cursor-pointer w-full",
                  submitTransaction.isPending && "opacity-50",
                )}
              >
                Spot Discount (8%)
              </Label>
              <input
                type="checkbox"
                id="spot_discount"
                name="spot_discount"
                disabled={submitTransaction.isPending}
                checked={formData.spot_discount}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Compact Ledger Block for Final Net Price */}
        <div className="bg-orange-50/70 p-3.5 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-orange-800 font-bold">
              Final Net Price
            </p>
            <p className="text-lg font-extrabold text-orange-900 mt-0.5">
              ₱
              {Number(formData.final_price).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          {formData.spot_discount && (
            <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded border border-orange-200 shadow-sm">
              8% Discount Applied
            </span>
          )}
        </div>

        {/* Terms and Downpayment Splitters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-gray-600">
              Downpayment Option
            </Label>
            <select
              name="dp_percentage"
              disabled={submitTransaction.isPending}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800 disabled:opacity-50"
              value={formData.dp_percentage}
              onChange={handleInputChange}
            >
              <option value="0.25">25% Downpayment</option>
              <option value="0.50">50% Downpayment</option>
              <option value="1.00">Full Payment (100%)</option>
            </select>
            <p className="text-[11px] text-[#4a5a4a] font-bold mt-1">
              Value: ₱
              {Number(formData.downpayment).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-gray-600">
              Years to Pay
            </Label>
            <select
              name="years_to_pay"
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
              value={formData.years_to_pay}
              onChange={handleInputChange}
              disabled={
                formData.dp_percentage === "1.00" || submitTransaction.isPending
              }
            >
              <option value={1}>1 Year (12 mos)</option>
              <option value={2}>2 Years (24 mos)</option>
            </select>
          </div>
        </div>

        {/* Main Ledger Box Breakdown Display */}
        <div className="bg-[#f5f0e6] p-5 rounded-xl border border-[#e8dfce] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#7a6a4f] font-bold mb-1">
              Remaining Balance
            </p>
            <p className="text-2xl font-bold text-[#4a5a4a]">
              ₱
              {Number(formData.remaining_balance).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wider text-[#7a6a4f] font-bold mb-1">
              Est. Monthly{" "}
              <span className="normal-case font-medium">
                (
                {formData.dp_percentage === "1.00"
                  ? 0
                  : formData.years_to_pay * 12}{" "}
                mos)
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
      </div>

      {/* --- SECTION 4: ATTACHMENTS --- */}
      <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-opacity">
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <Paperclip className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Attachments
        </h3>

        <div className="flex flex-col gap-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col gap-3 p-5 border-2 border-dashed rounded-lg transition-all relative justify-center items-center text-center",
              isDragging
                ? "border-[#4a5a4a] bg-[#4a5a4a]/5 scale-[0.99]"
                : "border-gray-300 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-400",
              submitTransaction.isPending && "opacity-50 pointer-events-none",
            )}
          >
            <input
              type="file"
              id="client_files"
              multiple
              disabled={submitTransaction.isPending}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <UploadCloud
                className={cn(
                  "h-8 w-8 transition-colors",
                  isDragging ? "text-[#4a5a4a]" : "text-gray-400",
                )}
              />
              <div className="text-sm text-gray-600 font-medium">
                Drag & Drop your files here, or{" "}
                <span
                  className="text-[#4a5a4a] font-bold underline cursor-pointer pointer-events-auto"
                  onClick={() =>
                    document.getElementById("client_files")?.click()
                  }
                >
                  browse
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-xs">
                Supports multiple files connected directly to Client ID:{" "}
                <span className="font-semibold text-gray-600">{clientId}</span>
              </p>
            </div>

            {/* Selected Files Preview List */}
            {selectedFiles.length > 0 && (
              <div className="mt-2 border-t border-gray-200/60 pt-4 w-full text-left pointer-events-auto">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Queue to Upload ({selectedFiles.length})
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white border border-gray-200 px-3 py-2 rounded-md text-xs text-gray-700 shadow-sm"
                    >
                      <div className="flex items-center gap-2 max-w-[75%]">
                        <Paperclip className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate font-medium">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          disabled={submitTransaction.isPending}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 5: ADMINISTRATIVE DETAILS --- */}
      <div
        className={cn(
          "space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-opacity",
          submitTransaction.isPending && "opacity-50 pointer-events-none",
        )}
      >
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <UserCheck className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Administrative
          Details
        </h3>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-gray-600">
            Remarks (Optional)
          </Label>
          <textarea
            name="remarks"
            disabled={submitTransaction.isPending}
            className="min-h-[90px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] disabled:opacity-50 resize-none custom-scrollbar"
            placeholder="Enter historical client baseline notes..."
            value={formData.remarks}
            onChange={handleInputChange}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            className={cn(
              "text-xs font-semibold",
              errors.prepared_by ? "text-red-600" : "text-gray-600",
            )}
          >
            Prepared By <span className="text-red-500">*</span>
          </Label>
          <select
            name="prepared_by"
            className={cn(
              "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800 disabled:opacity-50",
              errors.prepared_by
                ? "border-red-500 bg-red-50/50"
                : "border-gray-200",
            )}
            value={formData.prepared_by}
            onChange={handleInputChange}
            disabled={isLoadingEmployees || submitTransaction.isPending}
            required
          >
            <option value="">
              {isLoadingEmployees
                ? "-- Loading active staff... --"
                : "-- Select Assisting Employee --"}
            </option>
            {employees.map((emp: any) => {
              const fullName = `${emp.first_name} ${emp.last_name}`;
              return (
                <option key={emp.employee_id} value={fullName}>
                  {fullName} ({emp.role})
                </option>
              );
            })}
          </select>
          {errors.prepared_by && (
            <span className="text-[10px] text-red-500 font-medium">
              {errors.prepared_by}
            </span>
          )}
        </div>
      </div>

      {/* --- ACTIONS --- */}
      <Button
        type="submit"
        disabled={submitTransaction.isPending}
        className="w-full h-12 bg-[#4a5a4a] text-white font-bold rounded-lg hover:bg-[#3a4a3f] transition shadow-md flex items-center justify-center gap-2 disabled:bg-[#4a5a4a]/70"
      >
        {submitTransaction.isPending && (
          <Loader2 className="h-5 w-5 animate-spin" />
        )}
        {submitTransaction.isPending
          ? "Processing Transaction..."
          : "Confirm Transaction"}
      </Button>
    </form>
  );
}
