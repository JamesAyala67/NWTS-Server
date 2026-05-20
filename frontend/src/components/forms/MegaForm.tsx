import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Check, Loader2, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Hooks & Child Components
import { useAddress } from "../../hooks/useAddress";
import AddTransaction from "./AddTransaction";
import AddContactPerson from "./AddContactPerson";
import AddCoPurchaser from "./AddCoPurchaser";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

interface MegaFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Updated Steps
const STEPS = [
  { id: 1, title: "Client", description: "Registration" },
  { id: 2, title: "Transaction", description: "Ledger Setup" },
  { id: 3, title: "Contact", description: "Primary Contact" },
  { id: 4, title: "Co-Purchaser", description: "Optional" },
];

export default function MegaForm({ isOpen, setIsOpen }: MegaFormProps) {
  const queryClient = useQueryClient();
  const currentEncoderId = localStorage.getItem("employee_id") || "EMP-001";

  const [currentStep, setCurrentStep] = useState(1);
  const [clientId, setClientId] = useState<string | null>(null);
  const [createdTransactions, setCreatedTransactions] = useState<any[]>([]);

  const [clientMode, setClientMode] = useState<"new" | "existing">("new");
  const [existingClientId, setExistingClientId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");
  const { provinces, cities, barangays } = useAddress(
    selectedProvince,
    selectedCity,
    selectedBarangay,
  );

  const [clientData, setClientData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    birthdate: "",
    civil_status: "",
    contact_number: "",
    prepared_by: "",
  });

  // Fetch Employees and Existing Clients
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get(`/employees`);
      return res.data;
    },
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await api.get(`/clients`);
      return res.data;
    },
  });

  // Resetter
  const resetForm = () => {
    setCurrentStep(1);
    setClientId(null);
    setCreatedTransactions([]);
    setClientMode("new");
    setExistingClientId("");
    setErrors({});
    setClientData({
      first_name: "",
      last_name: "",
      middle_name: "",
      birthdate: "",
      civil_status: "",
      contact_number: "",
      prepared_by: "",
    });
    setSelectedProvince("");
    setSelectedCity("");
    setSelectedBarangay("");
    setIsOpen(false);
  };

  // Validation and Formatting
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cleaned = e.target.value.replace(/[^\d+]/g, "");
    if (!cleaned.startsWith("+63")) {
      const digits = cleaned.replace(/\D/g, "");
      if (digits.startsWith("63")) cleaned = "+" + digits;
      else if (digits.startsWith("0")) cleaned = "+63" + digits.substring(1);
      else if (digits.length > 0) cleaned = "+63" + digits;
    }
    if (cleaned.length > 13) cleaned = cleaned.substring(0, 13);

    setClientData({ ...clientData, contact_number: cleaned });
    if (errors.contact_number)
      setErrors((prev) => ({ ...prev, contact_number: "" }));
  };

  const handleInputChange = (field: string, value: string) => {
    setClientData({ ...clientData, [field]: value });
    if (errors[field])
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
  };

  const validateClientStep = () => {
    const newErrors: Record<string, string> = {};

    if (clientMode === "existing") {
      if (!existingClientId)
        newErrors.existingClientId = "Please select an existing client.";
      if (!clientData.prepared_by)
        newErrors.prepared_by = "Please select assisting staff.";
    } else {
      if (!clientData.first_name.trim())
        newErrors.first_name = "First name is required.";
      if (!clientData.last_name.trim())
        newErrors.last_name = "Last name is required.";

      if (!clientData.contact_number) {
        newErrors.contact_number = "Contact number is required.";
      } else if (
        clientData.contact_number.length !== 13 ||
        !clientData.contact_number.startsWith("+639")
      ) {
        newErrors.contact_number = "Must be a 13-digit PH number (+639...).";
      }

      if (!clientData.birthdate) newErrors.birthdate = "Birthdate is required.";
      if (!clientData.civil_status)
        newErrors.civil_status = "Civil status is required.";
      if (!selectedProvince) newErrors.province = "Province is required.";
      if (!selectedCity) newErrors.city = "City is required.";
      if (!selectedBarangay) newErrors.barangay = "Barangay is required.";
      if (!clientData.prepared_by)
        newErrors.prepared_by = "Please select assisting staff.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add Client Mutation
  const addClientMutation = useMutation({
    mutationFn: async () => {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const randomNumbers = Math.floor(10000 + Math.random() * 90000);
      const generatedClientId = `${currentYear}-${randomNumbers}`;

      const provName =
        provinces?.find((p: any) => p.code === selectedProvince)?.name || "";
      const cityName =
        cities?.find((c: any) => c.code === selectedCity)?.name || "";
      const brgyName =
        barangays?.find((b: any) => b.code === selectedBarangay)?.name || "";

      const payload = {
        client_id: generatedClientId,
        ...clientData,
        province: provName,
        city: cityName,
        barangay: brgyName,
        created_at: new Date().toISOString(),
        employee_id: currentEncoderId,
      };

      const res = await api.post(`/clients`, payload);
      return { ...res.data, client_id: generatedClientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client Registered", {
        description: "Proceeding to transaction setup.",
      });
      setClientId(data.client_id);
      setCurrentStep(2);
    },
    onError: () => toast.error("Failed to register client."),
  });

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateClientStep()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    if (clientMode === "existing") {
      setClientId(existingClientId);
      setCurrentStep(2);
    } else {
      addClientMutation.mutate();
    }
  };

  const handleNextStep = () => setCurrentStep((prev) => prev + 1);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={resetForm}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#faf8f5] shadow-2xl overflow-y-auto border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#EAEFEA] bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">
                Procedural Action Form (PAF)
              </h2>
              <p className="text-[#4A5D4E]/80 text-sm font-medium mt-1">
                Complete the pipeline to assign plots and contacts.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-100 -z-10"></div>
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center bg-white px-2 z-10"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm",
                      isCompleted
                        ? "bg-[#4a5a4a] text-white"
                        : isActive
                          ? "border-2 border-[#4a5a4a] text-[#4a5a4a] bg-white"
                          : "border-2 border-gray-200 text-gray-400 bg-gray-50",
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <p
                    className={cn(
                      "text-[10px] uppercase tracking-wider font-bold mt-2 text-center",
                      isActive ? "text-[#313c34]" : "text-gray-400",
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1">
          {/* Add Client / Select Existing One */}
          {currentStep === 1 && (
            <form
              onSubmit={handleClientSubmit}
              className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6"
            >
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6 w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    setClientMode("new");
                    setErrors({});
                  }}
                  className={cn(
                    "flex-1 py-2.5 text-xs uppercase tracking-wider font-bold rounded-md transition-all",
                    clientMode === "new"
                      ? "bg-white text-[#4a5a4a] shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Register New
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode("existing");
                    setErrors({});
                  }}
                  className={cn(
                    "flex-1 py-2.5 text-xs uppercase tracking-wider font-bold rounded-md transition-all",
                    clientMode === "existing"
                      ? "bg-white text-[#4a5a4a] shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Existing Profile
                </button>
              </div>

              {clientMode === "existing" ? (
                <div className="space-y-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <Label>Select Client *</Label>
                  <select
                    className={cn(
                      "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:ring-[#4a5a4a]",
                      errors.existingClientId
                        ? "border-red-500"
                        : "border-gray-200",
                    )}
                    value={existingClientId}
                    onChange={(e) => {
                      setExistingClientId(e.target.value);
                      if (errors.existingClientId)
                        setErrors((p) => ({ ...p, existingClientId: "" }));
                    }}
                    disabled={isLoadingClients}
                  >
                    <option value="">
                      {isLoadingClients
                        ? "Syncing clients..."
                        : "Search for client..."}
                    </option>
                    {clients.map((c: any) => (
                      <option key={c.client_id} value={c.client_id}>
                        {c.client_id} — {c.last_name}, {c.first_name}
                      </option>
                    ))}
                  </select>
                  {errors.existingClientId && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.existingClientId}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input
                        className={errors.first_name ? "border-red-500" : ""}
                        value={clientData.first_name}
                        onChange={(e) =>
                          handleInputChange("first_name", e.target.value)
                        }
                      />
                      {errors.first_name && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.first_name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input
                        className={errors.last_name ? "border-red-500" : ""}
                        value={clientData.last_name}
                        onChange={(e) =>
                          handleInputChange("last_name", e.target.value)
                        }
                      />
                      {errors.last_name && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.last_name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input
                        value={clientData.middle_name}
                        onChange={(e) =>
                          handleInputChange("middle_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Number *</Label>
                      <Input
                        className={cn(
                          "font-mono",
                          errors.contact_number ? "border-red-500" : "",
                        )}
                        placeholder="+639..."
                        value={clientData.contact_number}
                        onChange={handleContactChange}
                      />
                      {errors.contact_number && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.contact_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Birthdate *</Label>
                      <Input
                        type="date"
                        className={errors.birthdate ? "border-red-500" : ""}
                        value={clientData.birthdate}
                        onChange={(e) =>
                          handleInputChange("birthdate", e.target.value)
                        }
                      />
                      {errors.birthdate && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.birthdate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Civil Status *</Label>
                      <select
                        className={cn(
                          "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:ring-[#4a5a4a]",
                          errors.civil_status
                            ? "border-red-500"
                            : "border-gray-200",
                        )}
                        value={clientData.civil_status}
                        onChange={(e) =>
                          handleInputChange("civil_status", e.target.value)
                        }
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                      {errors.civil_status && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.civil_status}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Province *</Label>
                      <select
                        className={cn(
                          "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm",
                          errors.province
                            ? "border-red-500"
                            : "border-gray-200",
                        )}
                        value={selectedProvince}
                        onChange={(e) => {
                          setSelectedProvince(e.target.value);
                          setSelectedCity("");
                          setSelectedBarangay("");
                          if (errors.province)
                            setErrors((p) => ({ ...p, province: "" }));
                        }}
                      >
                        <option value="">Select Province</option>
                        {provinces?.map((p: any) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {errors.province && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.province}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>City/Municipality *</Label>
                      <select
                        disabled={!selectedProvince}
                        className={cn(
                          "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm",
                          errors.city ? "border-red-500" : "border-gray-200",
                        )}
                        value={selectedCity}
                        onChange={(e) => {
                          setSelectedCity(e.target.value);
                          setSelectedBarangay("");
                          if (errors.city)
                            setErrors((p) => ({ ...p, city: "" }));
                        }}
                      >
                        <option value="">Select City</option>
                        {cities?.map((c: any) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Barangay *</Label>
                      <select
                        disabled={!selectedCity}
                        className={cn(
                          "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm",
                          errors.barangay
                            ? "border-red-500"
                            : "border-gray-200",
                        )}
                        value={selectedBarangay}
                        onChange={(e) => {
                          setSelectedBarangay(e.target.value);
                          if (errors.barangay)
                            setErrors((p) => ({ ...p, barangay: "" }));
                        }}
                      >
                        <option value="">Select Brgy</option>
                        {barangays?.map((b: any) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      {errors.barangay && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.barangay}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <Label className="text-sm font-semibold text-gray-700">
                  Prepared By (Assisting Staff) *
                </Label>
                <select
                  disabled={isLoadingEmployees}
                  className={cn(
                    "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:ring-[#4a5a4a] text-gray-800",
                    errors.prepared_by ? "border-red-500" : "border-gray-200",
                  )}
                  value={clientData.prepared_by}
                  onChange={(e) =>
                    handleInputChange("prepared_by", e.target.value)
                  }
                >
                  <option value="">
                    {isLoadingEmployees
                      ? "-- Syncing Employee Database... --"
                      : "-- Select Assisting Employee --"}
                  </option>
                  {employees.map((emp: any) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
                {errors.prepared_by && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.prepared_by}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={addClientMutation.isPending}
                className="w-full bg-[#4a5a4a] text-white h-12 mt-4 shadow-sm hover:bg-[#3a4a3f]"
              >
                {addClientMutation.isPending ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : clientMode === "new" ? (
                  "Register Client & Continue"
                ) : (
                  "Confirm Client & Continue"
                )}
              </Button>
            </form>
          )}

          {/* Transaction */}
          {currentStep === 2 && clientId && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <AddTransaction
                clientId={clientId}
                onSuccess={(txnData: any) => {
                  setCreatedTransactions([txnData]);
                  setCurrentStep(3);
                }}
              />
            </div>
          )}

          {/* Contact Person */}
          {currentStep === 3 && clientId && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800">
                  Assign a primary Contact Person for this transaction.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextStep}
                  className="bg-white hover:bg-blue-50 text-blue-700 border-blue-200"
                >
                  Skip Step <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <AddContactPerson
                clientId={clientId}
                transactions={createdTransactions}
                onSuccess={handleNextStep}
              />
            </div>
          )}

          {/* Co-Purchaser */}
          {currentStep === 4 && clientId && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-800">
                  Co-Purchasers are optional. Skip if not applicable.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextStep}
                  className="bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  Skip & Finish <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <AddCoPurchaser
                clientId={clientId}
                transactions={createdTransactions}
                onSuccess={handleNextStep}
              />
            </div>
          )}

          {/* Completed */}
          {currentStep === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 pt-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-900 mb-2">
                    Pipeline Registration Complete!
                  </h3>
                  <p className="text-sm text-emerald-700 max-w-md mx-auto">
                    The client profile, initial ledger, and contact designations
                    have been securely saved to the database.
                  </p>
                </div>
                <Button
                  onClick={resetForm}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-10 shadow-md mt-4 w-full md:w-auto transition-colors text-base"
                >
                  Finish & Close PAF
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
