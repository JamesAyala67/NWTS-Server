import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  clientId: string;
  transactions: any[];
  onSuccess?: () => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

export default function AddCoPurchaser({
  clientId,
  transactions,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    transaction_id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    contact_number: "",
    prepared_by: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch Employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Intelligent +63 PH Format Mask Handler
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    if (!inputVal) {
      setFormData((prev) => ({ ...prev, contact_number: "" }));
      return;
    }

    // Keep numbers and the leading plus symbol only
    let cleaned = inputVal.replace(/[^\d+]/g, "");

    // Enforce conversion to +63 format
    if (!cleaned.startsWith("+63")) {
      const digits = cleaned.replace(/\D/g, "");
      if (digits.startsWith("63")) {
        cleaned = "+" + digits;
      } else if (digits.startsWith("0")) {
        cleaned = "+63" + digits.substring(1);
      } else if (digits.length > 0) {
        cleaned = "+63" + digits;
      }
    }

    // Cap string length at 13 characters (+63 plus 10 trailing mobile digits)
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }

    setFormData((prev) => ({ ...prev, contact_number: cleaned }));

    // Live Validation Output
    if (cleaned.length >= 4 && cleaned[3] !== "9") {
      setErrors((prev) => ({
        ...prev,
        contact_number: "Philippine mobile numbers must start with +639",
      }));
    } else if (cleaned.length > 0 && cleaned.length < 13) {
      setErrors((prev) => ({
        ...prev,
        contact_number: "Number must be exactly 13 characters (+639XXXXXXXXX)",
      }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.contact_number;
        return copy;
      });
    }
  };

  const mutation = useMutation({
    mutationFn: (newData: any) => {
      return api.post(`/contacts/${clientId}/co-purchasers`, newData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      toast.success("Co-purchaser added successfully!");

      setFormData({
        transaction_id: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        contact_number: "",
        prepared_by: "",
      });
      setErrors({});
      if (onSuccess) onSuccess();
    },
    onError: () => toast.error("Failed to add co-purchaser."),
  });

  // Strict Validation: Every field configuration is treated as mandatory
  const validateForm = () => {
    const currentErrors: Record<string, string> = {};

    if (!formData.transaction_id)
      currentErrors.transaction_id = "Please pick a linked plot transaction.";
    if (!formData.first_name.trim())
      currentErrors.first_name = "First name is required.";
    if (!formData.last_name.trim())
      currentErrors.last_name = "Last name is required.";
    if (!formData.middle_name.trim())
      currentErrors.middle_name = "Middle name is required.";
    if (!formData.prepared_by)
      currentErrors.prepared_by = "Please select the assisting representative.";

    if (!formData.contact_number) {
      currentErrors.contact_number = "Contact number is required.";
    } else if (
      !formData.contact_number.startsWith("+639") ||
      formData.contact_number.length !== 13
    ) {
      currentErrors.contact_number =
        "Must be a valid 13-digit PH number starting with +639.";
    }

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required profile settings.");
      return;
    }

    const employeeId = localStorage.getItem("employee_id") || null;

    mutation.mutate({
      ...formData,
      employee_id: employeeId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Selector */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-gray-700">
          Associated Plot Transaction *
        </Label>
        <select
          className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800 ${
            errors.transaction_id
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
          value={formData.transaction_id}
          onChange={(e) => {
            setFormData({ ...formData, transaction_id: e.target.value });
            if (errors.transaction_id)
              setErrors((p) => ({ ...p, transaction_id: "" }));
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
        {errors.transaction_id && (
          <p className="text-xs text-red-500 font-medium">
            {errors.transaction_id}
          </p>
        )}
      </div>

      {/* Name Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold text-gray-700">
            First Name *
          </Label>
          <Input
            className={`bg-white border-gray-300 shadow-sm focus-visible:ring-[#4a5a4a] ${errors.first_name && "border-red-500 focus-visible:ring-red-500"}`}
            value={formData.first_name}
            onChange={(e) => {
              setFormData({ ...formData, first_name: e.target.value });
              if (errors.first_name)
                setErrors((p) => ({ ...p, first_name: "" }));
            }}
          />
          {errors.first_name && (
            <p className="text-xs text-red-500 font-medium">
              {errors.first_name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold text-gray-700">
            Last Name *
          </Label>
          <Input
            className={`bg-white border-gray-300 shadow-sm focus-visible:ring-[#4a5a4a] ${errors.last_name && "border-red-500 focus-visible:ring-red-500"}`}
            value={formData.last_name}
            onChange={(e) => {
              setFormData({ ...formData, last_name: e.target.value });
              if (errors.last_name) setErrors((p) => ({ ...p, last_name: "" }));
            }}
          />
          {errors.last_name && (
            <p className="text-xs text-red-500 font-medium">
              {errors.last_name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold text-gray-700">
            Middle Name *
          </Label>
          <Input
            className={`bg-white border-gray-300 shadow-sm focus-visible:ring-[#4a5a4a] ${errors.middle_name && "border-red-500 focus-visible:ring-red-500"}`}
            value={formData.middle_name}
            onChange={(e) => {
              setFormData({ ...formData, middle_name: e.target.value });
              if (errors.middle_name)
                setErrors((p) => ({ ...p, middle_name: "" }));
            }}
          />
          {errors.middle_name && (
            <p className="text-xs text-red-500 font-medium">
              {errors.middle_name}
            </p>
          )}
        </div>

        {/* Formatted Contact Field */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold text-gray-700">
            Contact Number *
          </Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="+639XXXXXXXXX"
              className={`bg-white border-gray-300 shadow-sm tracking-wide font-mono focus-visible:ring-[#4a5a4a] ${
                errors.contact_number &&
                "border-red-500 focus-visible:ring-red-500"
              }`}
              value={formData.contact_number}
              onChange={handleContactChange}
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">
              {formData.contact_number.length}/13
            </span>
          </div>
          {errors.contact_number && (
            <p className="text-xs text-red-500 font-medium">
              {errors.contact_number}
            </p>
          )}
        </div>
      </div>

      {/* Employee Dropdown */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-gray-700">
          Assisted / Prepared By *
        </Label>
        <select
          disabled={isLoadingEmployees}
          className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800 ${
            errors.prepared_by
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
          value={formData.prepared_by}
          onChange={(e) => {
            setFormData({ ...formData, prepared_by: e.target.value });
            if (errors.prepared_by)
              setErrors((p) => ({ ...p, prepared_by: "" }));
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
        {errors.prepared_by && (
          <p className="text-xs text-red-500 font-medium">
            {errors.prepared_by}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white font-bold py-6 rounded-lg transition-all shadow-sm mt-3 flex items-center justify-center gap-2"
        disabled={mutation.isPending}
      >
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mutation.isPending
          ? "Processing Parameters..."
          : "Add Co-Purchaser Profile"}
      </Button>
    </form>
  );
}
