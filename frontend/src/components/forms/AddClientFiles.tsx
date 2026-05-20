import { useState, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileText, X } from "lucide-react";

interface Props {
  clientId: string;
  transactions: any[];
  onSuccess?: () => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const fileApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

export default function AddClientFiles({
  clientId,
  transactions,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const fileInputId = useId();

  // Form Field States
  const [files, setFiles] = useState<File[]>([]);
  const [transactionId, setTransactionId] = useState("");
  const [preparedBy, setPreparedBy] = useState("");

  // UX states
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Fetch Employees for Archiving Matrix Tracking
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fileApi.get("/employees");
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Drag & Drop Event Interceptors
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
      setFiles((prev) => [...prev, ...droppedFiles]);
      if (errors.files) setErrors((p) => ({ ...p, files: "" }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
      if (errors.files) setErrors((p) => ({ ...p, files: "" }));
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 3. Mutation: Processes single file instances (Matches upload.single("file"))
  const uploadMutation = useMutation({
    mutationFn: (formDataPayload: FormData) => {
      return fileApi.post(`/clients/${clientId}/files`, formDataPayload);
    },
  });

  // 4. Input Matrix Validation Engine (All Remaining Fields are Required)
  const validateForm = () => {
    const currentErrors: Record<string, string> = {};

    if (files.length === 0)
      currentErrors.files = "Please drag or select at least one document.";
    if (!transactionId)
      currentErrors.transactionId =
        "Please link these files to an associated transaction.";
    if (!preparedBy)
      currentErrors.preparedBy = "Please specify the archiving administrator.";

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  // 5. Submit Batch Queue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill out all missing required properties.");
      return;
    }

    const employeeId = localStorage.getItem("employee_id") || null;
    const toastId = toast.loading(
      `Uploading batch queue (0/${files.length})...`,
    );

    try {
      // Loop execution array to safely stream files individually into your backend single-uploader route
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("transaction_id", transactionId);
        formData.append("file_name", file.name); // Required by your backend req.body mapping
        formData.append("prepared_by", preparedBy);
        formData.append("uploaded_by", preparedBy);
        if (employeeId) formData.append("employee_id", employeeId);

        return uploadMutation.mutateAsync(formData);
      });

      await Promise.all(uploadPromises);

      toast.success("All selected files have been securely processed!", {
        id: toastId,
      });

      // Clear Form Queues
      setFiles([]);
      setTransactionId("");
      setPreparedBy("");
      setErrors({});

      // Invalidate target profile queries to reveal changes immediately
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Batch upload loop exception:", err);
      toast.error(
        err.response?.data?.error ||
          "An error occurred during multi-file streaming.",
        { id: toastId },
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Selector Field */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-gray-700">
          Associated Plot Transaction *
        </Label>
        <select
          className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800 ${
            errors.transactionId
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
          value={transactionId}
          onChange={(e) => {
            setTransactionId(e.target.value);
            if (errors.transactionId)
              setErrors((p) => ({ ...p, transactionId: "" }));
          }}
        >
          <option value="">-- Select Plot / Reference Code --</option>
          {transactions.map((txn) => (
            <option key={txn.transaction_id} value={txn.transaction_id}>
              Plot: {txn.plot_id || "Unassigned"} (
              {txn.transaction_id.substring(0, 8).toUpperCase()})
            </option>
          ))}
        </select>
        {errors.transactionId && (
          <p className="text-xs text-red-500 font-medium">
            {errors.transactionId}
          </p>
        )}
      </div>

      {/* Advanced Drag & Drop Queue Container Area */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-gray-700">
          Documents Drop Zone *
        </Label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] ${
            isDragging
              ? "border-[#4a5a4a] bg-[#4a5a4a]/5 scale-[0.99]"
              : errors.files
                ? "border-red-500 bg-red-50/30"
                : "border-gray-300 bg-gray-50 hover:border-[#4a5a4a]"
          }`}
        >
          <UploadCloud
            className={`h-12 w-12 mb-2 ${isDragging ? "text-[#4a5a4a] animate-bounce" : errors.files ? "text-red-400" : "text-gray-400"}`}
          />

          <label
            htmlFor={fileInputId}
            className="cursor-pointer text-sm font-bold text-[#4a5a4a] hover:underline block"
          >
            Drag & Drop Files here or Click to Browse
          </label>
          <p className="text-xs text-gray-400 mt-1">
            Multi-selection streaming framework active
          </p>

          <Input
            id={fileInputId}
            type="file"
            className="hidden"
            multiple // Native capability toggle
            onChange={handleFileSelect}
          />
        </div>
        {errors.files && (
          <p className="text-xs text-red-500 font-medium">{errors.files}</p>
        )}
      </div>

      {/* Dynamic Queue Stack Listing Module */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto border border-gray-200 rounded-md p-2 bg-white shadow-inner">
          <p className="text-xs font-semibold text-gray-500 px-1 mb-1">
            Staged Upload Queue ({files.length})
          </p>
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between text-xs font-mono bg-gray-50 border rounded-md p-2 text-gray-600 shadow-sm gap-2"
            >
              <div className="flex items-center gap-2 truncate max-w-[85%]">
                <FileText className="h-4 w-4 text-[#4a5a4a] shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-gray-400 font-normal shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors"
                title="Remove from queue"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Auditor Signature Drops */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-gray-700">
          Uploaded / Archived By *
        </Label>
        <select
          disabled={isLoadingEmployees}
          className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800 ${
            errors.preparedBy
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
          value={preparedBy}
          onChange={(e) => {
            setPreparedBy(e.target.value);
            if (errors.preparedBy) setErrors((p) => ({ ...p, preparedBy: "" }));
          }}
        >
          <option value="">
            {isLoadingEmployees
              ? "Syncing Employee Database..."
              : "-- Select Assisting Employee --"}
          </option>
          {employees.map((emp: any) => {
            const fullName = `${emp.first_name} ${emp.last_name}`;
            return (
              <option key={emp.employee_id} value={fullName}>
                {fullName} ({emp.role || "Staff"})
              </option>
            );
          })}
        </select>
        {errors.preparedBy && (
          <p className="text-xs text-red-500 font-medium">
            {errors.preparedBy}
          </p>
        )}
      </div>

      {/* Upload Triggers */}
      <Button
        type="submit"
        className="w-full bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white font-bold py-6 rounded-lg transition-all shadow-sm mt-2 flex items-center justify-center gap-2"
        disabled={uploadMutation.isPending}
      >
        {uploadMutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {uploadMutation.isPending
          ? `Streaming Queue Items...`
          : `Securely Upload Staged File${files.length > 1 ? "s" : ""}`}
      </Button>
    </form>
  );
}
