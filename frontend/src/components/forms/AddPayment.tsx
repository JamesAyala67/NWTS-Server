import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  CreditCard,
  Receipt,
  AlertCircle,
  Calendar,
  FileText,
  UploadCloud,
  Paperclip,
  X,
  Loader2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface AddPaymentProps {
  clientId?: string;
  clientTransactions?: any[];
  transactionId?: string;
  onSuccess: () => void;
}

export default function AddPayment({
  clientId,
  clientTransactions = [],
  transactionId: initialTransactionId,
  onSuccess,
}: AddPaymentProps) {
  const queryClient = useQueryClient();
  const currentEmployeeId = localStorage.getItem("employee_id") || "";
  const currentEmployeeName = localStorage.getItem("userName") || "";

  // -- Data Fetching for Employees --
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data;
    },
  });

  // -- Form State --
  const [formData, setFormData] = useState({
    transactionId: initialTransactionId || "",
    prNumber: "",
    siNumber: "",
    amountPaid: "",
    paymentMethod: "Cash",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    remarks: "",
    recorded_by: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // -- Dynamic Computations --
  const pendingTransactions = useMemo(() => {
    return clientTransactions.filter(
      (txn) => Number(txn.remaining_balance) > 0,
    );
  }, [clientTransactions]);

  const selectedTxn = useMemo(() => {
    return pendingTransactions.find(
      (txn) => txn.transaction_id === formData.transactionId,
    );
  }, [formData.transactionId, pendingTransactions]);

  const remainingBalance = selectedTxn
    ? Number(selectedTxn.remaining_balance)
    : 0;
  const paymentAmount = Number(formData.amountPaid) || 0;
  const projectedBalance = Math.max(0, remainingBalance - paymentAmount);

  // -- Validation Logic --
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.transactionId)
      newErrors.transactionId = "Please select a plot/transaction.";
    if (!formData.prNumber.trim())
      newErrors.prNumber = "PR Number is required.";
    if (!formData.siNumber.trim())
      newErrors.siNumber = "SI Number is required.";

    if (!formData.recorded_by)
      newErrors.recorded_by = "Please select the assisting employee.";

    if (!formData.amountPaid) {
      newErrors.amountPaid = "Payment amount is required.";
    } else if (paymentAmount <= 0) {
      newErrors.amountPaid = "Amount must be greater than zero.";
    } else if (paymentAmount > remainingBalance) {
      newErrors.amountPaid = `Cannot exceed remaining balance of ₱${remainingBalance.toLocaleString()}`;
    }

    if (formData.paymentMethod !== "Cash" && !formData.referenceNumber.trim()) {
      newErrors.referenceNumber = `Reference required for ${formData.paymentMethod}.`;
    }

    if (!formData.paymentDate)
      newErrors.paymentDate = "Payment date is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -- File Handlers --
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };
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

  // -- Submit Mutation --
  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      // Step 1: Submit Payment Data
      const paymentRes = await api.post("/payments", {
        ...data,
        employee_id: currentEmployeeId, // Still pass the system logged-in ID for auditing
      });

      // Step 2: Upload Files sequentially if a client ID is provided
      if (selectedFiles.length > 0 && clientId) {
        const uploadPromises = selectedFiles.map((file) => {
          const fileFormData = new FormData();
          fileFormData.append("file", file);
          fileFormData.append("transaction_id", formData.transactionId);
          fileFormData.append("file_name", file.name);
          fileFormData.append("prepared_by", formData.recorded_by); // Attach to selected employee
          fileFormData.append("uploaded_by", currentEmployeeName); // Attach to actual system user
          if (currentEmployeeId)
            fileFormData.append("employee_id", currentEmployeeId);

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

      return paymentRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Payment and attachments recorded successfully!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error ||
          "Failed to record payment or upload files.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      paymentMutation.mutate({
        transaction_id: formData.transactionId,
        professional_receipt: `PR-${formData.prNumber}`,
        sales_invoice: `SI-${formData.siNumber}`,
        amount_paid: paymentAmount,
        payment_method: formData.paymentMethod,
        reference_number: formData.referenceNumber,
        payment_date: formData.paymentDate,
        remarks: formData.remarks,
        recorded_by: formData.recorded_by, // Send to DB
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNumberOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9.]/g, "");
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  if (pendingTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
        <Receipt className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-gray-800 font-semibold mb-1">
          No Pending Balances
        </h3>
        <p className="text-gray-500 text-sm">
          This client does not have any plots with outstanding balances.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Transaction Selector */}
      <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <Receipt className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Select Transaction
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Plot / PR Reference <span className="text-red-500">*</span>
          </label>
          <select
            name="transactionId"
            value={formData.transactionId}
            onChange={handleInputChange}
            disabled={paymentMutation.isPending}
            className={`w-full h-10 px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none bg-gray-50 disabled:opacity-50 ${
              errors.transactionId
                ? "border-red-500 bg-red-50"
                : "border-gray-200"
            }`}
          >
            <option value="" disabled>
              Select a plot to pay for...
            </option>
            {pendingTransactions.map((txn) => (
              <option key={txn.transaction_id} value={txn.transaction_id}>
                {txn.plot_id} — {txn.professional_receipt || "N/A"} (Bal: ₱
                {Number(txn.remaining_balance).toLocaleString()})
              </option>
            ))}
          </select>
          {errors.transactionId && (
            <p className="text-red-500 text-[10px] mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> {errors.transactionId}
            </p>
          )}
        </div>

        {selectedTxn && (
          <div className="grid grid-cols-2 gap-4 pt-3 mt-3 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Current Balance
              </p>
              <p className="text-lg font-bold text-gray-800">
                ₱
                {remainingBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg border transition-colors ${paymentAmount > 0 && paymentAmount <= remainingBalance ? "bg-[#f4f7f4] border-[#b5c2a9]" : "bg-gray-50 border-gray-200"}`}
            >
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Balance After Payment
              </p>
              <p
                className={`text-lg font-bold ${paymentAmount > 0 && paymentAmount <= remainingBalance ? "text-[#4a5a4a]" : "text-gray-800"}`}
              >
                ₱
                {projectedBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Receipt & Invoice Details */}
      <div
        className={cn(
          "space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-opacity",
          paymentMutation.isPending && "opacity-50 pointer-events-none",
        )}
      >
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <FileText className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Receipt Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PR Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Professional Receipt (PR) <span className="text-red-500">*</span>
            </label>
            <div
              className={`flex items-center border rounded-md h-10 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#4a5a4a] ${errors.prNumber ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            >
              <span className="px-3 text-sm font-bold text-gray-500 bg-gray-50 border-r border-gray-200 h-full flex items-center">
                PR-
              </span>
              <input
                type="text"
                name="prNumber"
                placeholder="XXXX"
                maxLength={4}
                value={formData.prNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // Strictly numbers
                  setFormData((prev) => ({ ...prev, prNumber: val }));
                  if (errors.prNumber)
                    setErrors((prev) => ({ ...prev, prNumber: "" }));
                }}
                disabled={!formData.transactionId}
                className="w-full px-3 text-sm outline-none bg-transparent disabled:bg-transparent"
              />
            </div>
            {errors.prNumber && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.prNumber}
              </p>
            )}
          </div>

          {/* SI Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Sales Invoice (SI) <span className="text-red-500">*</span>
            </label>
            <div
              className={`flex items-center border rounded-md h-10 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#4a5a4a] ${errors.siNumber ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            >
              <span className="px-3 text-sm font-bold text-gray-500 bg-gray-50 border-r border-gray-200 h-full flex items-center">
                SI-
              </span>
              <input
                type="text"
                name="siNumber"
                placeholder="XXXXXX"
                maxLength={6}
                value={formData.siNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // Strictly numbers
                  setFormData((prev) => ({ ...prev, siNumber: val }));
                  if (errors.siNumber)
                    setErrors((prev) => ({ ...prev, siNumber: "" }));
                }}
                disabled={!formData.transactionId}
                className="w-full px-3 text-sm outline-none bg-transparent disabled:bg-transparent"
              />
            </div>
            {errors.siNumber && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.siNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Payment Details */}
      <div
        className={cn(
          "space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-opacity",
          paymentMutation.isPending && "opacity-50 pointer-events-none",
        )}
      >
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <CreditCard className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Payment Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount Paid Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Amount Paid <span className="text-red-500">*</span>
            </label>
            <div
              className={`flex items-center border rounded-md h-10 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#4a5a4a] ${errors.amountPaid ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            >
              <span className="px-3 text-sm font-bold text-gray-500 bg-gray-50 border-r border-gray-200 h-full flex items-center">
                ₱
              </span>
              <input
                type="text"
                name="amountPaid"
                placeholder="0.00"
                value={formData.amountPaid}
                onChange={handleNumberOnlyChange}
                disabled={!formData.transactionId}
                className="w-full px-3 text-sm outline-none bg-transparent disabled:bg-transparent"
              />
            </div>
            {errors.amountPaid && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1 shrink-0" />{" "}
                {errors.amountPaid}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                disabled={!formData.transactionId}
                className={`pl-9 h-10 text-sm ${errors.paymentDate ? "border-red-500 bg-red-50" : ""}`}
              />
            </div>
            {errors.paymentDate && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.paymentDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              disabled={!formData.transactionId}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none bg-white"
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Reference Number{" "}
              {formData.paymentMethod !== "Cash" && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <Input
              type="text"
              name="referenceNumber"
              placeholder={
                formData.paymentMethod === "Cash" ? "Optional" : "Required"
              }
              value={formData.referenceNumber}
              onChange={handleInputChange}
              disabled={!formData.transactionId}
              className={`h-10 text-sm ${errors.referenceNumber ? "border-red-500 bg-red-50" : ""}`}
            />
            {errors.referenceNumber && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />{" "}
                {errors.referenceNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Drag & Drop File Attachments */}
      <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <label className="block text-sm font-bold text-gray-800 mb-1.5">
          Proof of Payment / Attachments
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col gap-3 p-5 border-2 border-dashed rounded-lg transition-all relative justify-center items-center text-center",
            isDragging
              ? "border-[#4a5a4a] bg-[#4a5a4a]/5 scale-[0.99]"
              : "border-gray-300 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-400",
            (paymentMutation.isPending || !formData.transactionId) &&
              "opacity-50 pointer-events-none",
          )}
        >
          <input
            type="file"
            id="payment_files"
            multiple
            disabled={paymentMutation.isPending || !formData.transactionId}
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
              Drag & Drop files here, or{" "}
              <span
                className="text-[#4a5a4a] font-bold underline cursor-pointer pointer-events-auto"
                onClick={() =>
                  document.getElementById("payment_files")?.click()
                }
              >
                browse
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-xs">
              Attach deposit slips, checks, or GCash receipts directly to this
              payment.
            </p>
          </div>

          {/* Selected Files Preview List */}
          {selectedFiles.length > 0 && (
            <div className="mt-2 border-t border-gray-200/60 pt-4 w-full text-left pointer-events-auto">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Attached Files ({selectedFiles.length})
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-white border border-gray-200 px-3 py-2 rounded-md text-xs text-gray-700 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 max-w-[75%]">
                      <Paperclip className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        disabled={paymentMutation.isPending}
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

      {/* 5. Administrative Details & Employee Tag */}
      <div
        className={cn(
          "space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-opacity",
          paymentMutation.isPending && "opacity-50 pointer-events-none",
        )}
      >
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <UserCheck className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Administrative
          Details
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Remarks (Optional)
          </label>
          <textarea
            name="remarks"
            rows={2}
            value={formData.remarks}
            onChange={handleInputChange}
            disabled={!formData.transactionId}
            placeholder="Add any additional notes here..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none bg-white custom-scrollbar resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Prepared By <span className="text-red-500">*</span>
          </label>
          <select
            name="recorded_by"
            value={formData.recorded_by}
            onChange={handleInputChange}
            disabled={isLoadingEmployees || !formData.transactionId}
            className={cn(
              "w-full h-10 px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none bg-white disabled:opacity-50",
              errors.recorded_by
                ? "border-red-500 bg-red-50/50"
                : "border-gray-200",
            )}
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
          {errors.recorded_by && (
            <p className="text-red-500 text-[10px] mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> {errors.recorded_by}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          className="text-gray-600 hover:bg-gray-100"
          disabled={paymentMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={paymentMutation.isPending || !formData.transactionId}
          className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white shadow-md flex items-center justify-center gap-2"
        >
          {paymentMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {paymentMutation.isPending ? "Processing Data..." : "Confirm Payment"}
        </Button>
      </div>
    </form>
  );
}
