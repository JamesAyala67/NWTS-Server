import React, { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  User,
  AlertCircle,
  ClipboardList,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ScheduleIntermentProps {
  plotId: string;
  transactionId: string;
  onSuccess: () => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export default function ScheduleInterment({
  plotId,
  transactionId,
  onSuccess,
}: ScheduleIntermentProps) {
  const queryClient = useQueryClient();
  const currentEmployeeId = localStorage.getItem("employee_id") || "EMP-001";

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
    plot_id: plotId,
    transaction_id: transactionId,
    location: "UGI", // Default Location
    prNumber: "",
    siNumber: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    date_of_death: "",
    date_of_interment: "",
    remarks: "",
    recorded_by: "", // Added field
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // -- Validation Logic --
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const today = new Date();

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required.";
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = "Name is too short.";
    } else if (/(.)\1\1/.test(formData.first_name)) {
      newErrors.first_name = "Invalid repeating characters.";
    }

    const dob = formData.date_of_birth
      ? new Date(formData.date_of_birth)
      : null;
    const dod = formData.date_of_death
      ? new Date(formData.date_of_death)
      : null;
    const doi = formData.date_of_interment
      ? new Date(formData.date_of_interment)
      : null;

    if (!formData.prNumber.trim())
      newErrors.prNumber = "PR Number is required.";
    if (!formData.siNumber.trim())
      newErrors.siNumber = "SI Number is required.";

    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required.";
    if (!formData.middle_name.trim())
      newErrors.middle_name = "Middle name is required.";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required.";

    if (!formData.date_of_birth)
      newErrors.date_of_birth = "Date of Birth is required.";
    if (!formData.date_of_death)
      newErrors.date_of_death = "Date of Death is required.";
    if (!formData.date_of_interment)
      newErrors.date_of_interment = "Scheduled Date is required.";

    if (!formData.recorded_by)
      newErrors.recorded_by = "Please select the assisting employee.";

    if (dob && dob > today)
      newErrors.date_of_birth = "Cannot be in the future.";
    if (dod) {
      if (dod > today) newErrors.date_of_death = "Cannot be in the future.";
      if (dob && dod < dob)
        newErrors.date_of_death = "Cannot be before Date of Birth.";
    }
    if (doi && dod && doi < dod)
      newErrors.date_of_interment = "Cannot be before Date of Death.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -- Submit Mutation --
  const intermentMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/interments`, payload),
    onSuccess: () => {
      toast.success("Interment successfully scheduled!");
      queryClient.invalidateQueries({ queryKey: ["client"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      onSuccess();
    },
    onError: () => toast.error("Failed to schedule interment."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      intermentMutation.mutate({
        ...formData,
        employee_id: currentEmployeeId,
        professional_receipt: `PR-${formData.prNumber}`,
        sales_invoice: `SI-${formData.siNumber}`,
        remarks: formData.remarks.trim() || "N/A",
        recorded_by: formData.recorded_by,
      });
    }
  };

  // -- Change Handlers --
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Restricts input to letters and spaces ONLY (for names)
  const handleNameOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const lettersOnly = value.replace(/[^a-zA-Z\sñÑ-]/g, "");
    setFormData((prev) => ({ ...prev, [name]: lettersOnly }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Restricts input to numbers only (for PR/SI)
  const handleNumberOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-h-[85vh] overflow-y-auto p-1 custom-scrollbar"
    >
      {/* 1. Transaction Details */}
      <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <ClipboardList className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Plot &
          Location Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Plot ID
            </label>
            <Input
              type="text"
              value={formData.plot_id}
              disabled
              className="h-10 text-sm bg-gray-50 border-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Transaction ID
            </label>
            <Input
              type="text"
              value={formData.transaction_id}
              disabled
              className="h-10 text-sm bg-gray-50 border-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none bg-white"
            >
              <option value="UGI">Underground Interment (UGI)</option>
              <option value="OGI">Aboveground Interment (OGI)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Receipt Details */}
      <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
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
                value={formData.prNumber}
                onChange={handleNumberOnlyChange}
                className="w-full px-3 text-sm outline-none bg-transparent"
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
                value={formData.siNumber}
                onChange={handleNumberOnlyChange}
                className="w-full px-3 text-sm outline-none bg-transparent"
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

      {/* 3. Deceased Profile */}
      <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <User className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Deceased Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="first_name"
              placeholder="Juan"
              value={formData.first_name}
              onChange={handleNameOnlyChange}
              className={`h-10 text-sm ${errors.first_name ? "border-red-500 bg-red-50" : ""}`}
            />
            {errors.first_name && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.first_name}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Middle Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="middle_name"
              placeholder="Santos"
              value={formData.middle_name}
              onChange={handleNameOnlyChange}
              className={`h-10 text-sm ${errors.middle_name ? "border-red-500 bg-red-50" : ""}`}
            />
            {errors.middle_name && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.middle_name}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="last_name"
              placeholder="Dela Cruz"
              value={formData.last_name}
              onChange={handleNameOnlyChange}
              className={`h-10 text-sm ${errors.last_name ? "border-red-500 bg-red-50" : ""}`}
            />
            {errors.last_name && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.last_name}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className={`pl-9 h-10 text-sm ${errors.date_of_birth ? "border-red-500 bg-red-50" : ""}`}
              />
            </div>
            {errors.date_of_birth && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.date_of_birth}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Date of Death <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                name="date_of_death"
                value={formData.date_of_death}
                onChange={handleInputChange}
                className={`pl-9 h-10 text-sm ${errors.date_of_death ? "border-red-500 bg-red-50" : ""}`}
              />
            </div>
            {errors.date_of_death && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.date_of_death}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Schedule Date */}
      <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center uppercase tracking-wide">
          <Calendar className="w-4 h-4 mr-2 text-[#4a5a4a]" /> Schedule
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Scheduled Date of Interment <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              name="date_of_interment"
              value={formData.date_of_interment}
              onChange={handleInputChange}
              className={`pl-9 h-10 text-sm md:w-1/2 ${errors.date_of_interment ? "border-red-500 bg-red-50" : ""}`}
            />
          </div>
          {errors.date_of_interment && (
            <p className="text-red-500 text-[10px] mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />{" "}
              {errors.date_of_interment}
            </p>
          )}
        </div>
      </div>

      {/* 5. Administrative Details & Employee Tag */}
      <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
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
            placeholder="Add any additional notes here..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none bg-white custom-scrollbar resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Recorded / Assisted By (PAF Form){" "}
            <span className="text-red-500">*</span>
          </label>
          <select
            name="recorded_by"
            value={formData.recorded_by}
            onChange={handleInputChange}
            disabled={isLoadingEmployees}
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

      {/* 6. Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          className="text-gray-600 hover:bg-gray-100"
          disabled={intermentMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={intermentMutation.isPending}
          className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white shadow-md"
        >
          {intermentMutation.isPending ? "Processing..." : "Confirm Schedule"}
        </Button>
      </div>
    </form>
  );
}
