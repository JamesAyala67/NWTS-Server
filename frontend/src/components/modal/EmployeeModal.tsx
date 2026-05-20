// components/forms/EmployeeModal.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeInfo, AlertCircle } from "lucide-react";

// Axios Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: any;
}

export default function EmployeeModal({
  isOpen,
  onClose,
  employeeData,
}: EmployeeModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!employeeData;

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    username: "",
    password: "",
    role: "Staff",
    contact_number: "",
  });

  // ✨ ADDED: Advanced validation errors dictionary state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset states when open/close or data updates
  useEffect(() => {
    if (employeeData && isOpen) {
      setFormData({
        first_name: employeeData.first_name || "",
        last_name: employeeData.last_name || "",
        middle_name: employeeData.middle_name || "",
        username: employeeData.username || "",
        password: "",
        role: employeeData.role || "Staff",
        contact_number: employeeData.contact_number || "",
      });
      setErrors({}); // clear previous alerts
    } else if (isOpen) {
      setFormData({
        first_name: "",
        last_name: "",
        middle_name: "",
        username: "",
        password: "",
        role: "Staff",
        contact_number: "",
      });
      setErrors({});
    }
  }, [employeeData, isOpen]);

  // ✨ ADDED: Centralized dynamic single-field validator logic
  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    if (!value.trim() && name !== "password") {
      errorMsg = "This field is strictly required.";
    } else if (name === "contact_number") {
      if (value.length !== 11) {
        errorMsg = `Must be exactly 11 digits (Current: ${value.length}).`;
      } else if (!value.startsWith("09")) {
        errorMsg = "Must begin with Philippine carrier digits '09'.";
      }
    } else if (name === "username" && value.trim().length < 4) {
      errorMsg = "Username must be at least 4 characters long.";
    } else if (name === "password" && !isEditMode && value.length < 6) {
      errorMsg = "Password must be at least 6 characters long.";
    }

    // Update errors object dynamically
    setErrors((prev) => {
      const updated = { ...prev };
      if (errorMsg) {
        updated[name] = errorMsg;
      } else {
        delete updated[name];
      }
      return updated;
    });
  };

  // Generic Handler tracking updates dynamically
  const handleChange = (name: string, value: string) => {
    let cleanValue = value;

    // Contact field formatting restriction
    if (name === "contact_number") {
      cleanValue = value.replace(/\D/g, "").slice(0, 11);
    }

    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    validateField(name, cleanValue); // Re-evaluate error state on keystroke
  };

  // Complete Form Deep-Scan on Submission
  const validateFormAll = () => {
    const newErrors: Record<string, string> = {};

    // Check basic string fields
    const requiredStrings = [
      "first_name",
      "last_name",
      "middle_name",
      "username",
      "role",
    ];
    requiredStrings.forEach((field) => {
      if (!formData[field as keyof typeof formData]?.trim()) {
        newErrors[field] = "This field is strictly required.";
      }
    });

    // Contact verification
    if (!formData.contact_number) {
      newErrors.contact_number = "This field is strictly required.";
    } else if (formData.contact_number.length !== 11) {
      newErrors.contact_number = `Must be exactly 11 digits (Current: ${formData.contact_number.length}).`;
    } else if (!formData.contact_number.startsWith("09")) {
      newErrors.contact_number =
        "Must begin with Philippine carrier digits '09'.";
    }

    // Username length checks
    if (formData.username && formData.username.trim().length < 4) {
      newErrors.username = "Username must be at least 4 characters long.";
    }

    // Password context dependency checks
    if (!isEditMode && (!formData.password || formData.password.length < 6)) {
      newErrors.password = "Password must be at least 6 characters long.";
    } else if (
      isEditMode &&
      formData.password &&
      formData.password.length < 6
    ) {
      newErrors.password =
        "Password updates must be at least 6 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = isEditMode
        ? `/employees/${employeeData.employee_id}`
        : `/employees`;
      const response = isEditMode
        ? await api.put(url, data)
        : await api.post(url, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to save account";
      alert(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Stop server syncing if internal checks identify faults
    if (validateFormAll()) {
      mutation.mutate(formData);
    }
  };

  // Helper template engine managing component text highlights conditional classes
  const getInputClass = (fieldName: string) => {
    return `bg-white transition-all ${
      errors[fieldName]
        ? "border-red-500 focus-visible:ring-red-500 text-red-900 placeholder:text-red-300 shadow-sm bg-red-50/10"
        : "border-gray-200 focus-visible:ring-[#4a5a4a]"
    }`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[450px] bg-[#faf8f5] p-6 sm:p-8 overflow-y-auto custom-scrollbar border-l border-gray-200 shadow-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold text-[#1e293b]">
            {isEditMode ? "Edit Employee Account" : "Register New Account"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Modify the assigned credentials and details below."
              : "Generate a new system access profile for front-office operations."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* DYNAMIC EMPLOYEE ID BANNER */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#4A5D4E]">
              <BadgeInfo className="h-4 w-4" />
              <span className="text-sm font-bold">System ID</span>
            </div>
            <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {isEditMode
                ? employeeData.employee_id
                : "EMP-XXXX (Auto-generated)"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="first_name"
                className={errors.first_name ? "text-red-600" : ""}
              >
                First Name
              </Label>
              <Input
                id="first_name"
                className={getInputClass("first_name")}
                placeholder="Juan"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
              />
              {errors.first_name && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 inline" /> {errors.first_name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="last_name"
                className={errors.last_name ? "text-red-600" : ""}
              >
                Last Name
              </Label>
              <Input
                id="last_name"
                className={getInputClass("last_name")}
                placeholder="Dela Cruz"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
              />
              {errors.last_name && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 inline" /> {errors.last_name}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="middle_name"
              className={errors.middle_name ? "text-red-600" : ""}
            >
              Middle Name
            </Label>
            <Input
              id="middle_name"
              className={getInputClass("middle_name")}
              placeholder="Santos"
              value={formData.middle_name}
              onChange={(e) => handleChange("middle_name", e.target.value)}
            />
            {errors.middle_name && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 inline" /> {errors.middle_name}
              </p>
            )}
          </div>

          <hr className="border-gray-200" />

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="contact_number"
                className={errors.contact_number ? "text-red-600" : ""}
              >
                Mobile Contact Number
              </Label>
              <span
                className={`text-[10px] font-mono ${formData.contact_number.length === 11 ? "text-green-600 font-bold" : "text-gray-400"}`}
              >
                {formData.contact_number.length} / 11 digits
              </span>
            </div>
            <Input
              id="contact_number"
              type="tel"
              className={getInputClass("contact_number") + " font-mono text-sm"}
              placeholder="09171234567"
              value={formData.contact_number}
              onChange={(e) => handleChange("contact_number", e.target.value)}
            />
            {errors.contact_number && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 inline" />{" "}
                {errors.contact_number}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className={errors.username ? "text-red-600" : ""}
              >
                Username
              </Label>
              <Input
                id="username"
                className={getInputClass("username")}
                placeholder="user_jd"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
              />
              {errors.username && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 inline" /> {errors.username}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">System Role</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a]"
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <option value="Staff">Staff</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <Label
              htmlFor="password"
              className={errors.password ? "text-red-600" : ""}
            >
              Password{" "}
              {isEditMode && (
                <span className="text-xs text-gray-400 font-normal ml-1">
                  (Leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              id="password"
              type="password"
              className={getInputClass("password")}
              placeholder={
                isEditMode
                  ? "••••••••"
                  : "Create a strong password (min 6 chars)"
              }
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
            {errors.password && (
              <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 inline" /> {errors.password}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-6 pb-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-white border-gray-300"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-[#4A5D4E] hover:bg-[#3b4b3e] text-white shadow-md font-bold"
            >
              {mutation.isPending
                ? "Syncing Server..."
                : isEditMode
                  ? "Update Account"
                  : "Create Account"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
