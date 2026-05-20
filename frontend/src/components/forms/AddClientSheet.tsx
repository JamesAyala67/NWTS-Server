import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";

// Define the location item type for provinces, cities, and barangays
type LocationItem = { code: string; name: string };

// Props for the AddClientSheet component
interface AddClientSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  handleAddClient: (e: React.FormEvent) => void;
  provinces: LocationItem[];
  cities: LocationItem[];
  barangays: LocationItem[];
  selectedProvince: string;
  setSelectedProvince: (val: string) => void;
  selectedCity: string;
  setSelectedCity: (val: string) => void;
  selectedBarangay: string;
  setSelectedBarangay: (val: string) => void;
  isPending: boolean;
  employees: any[];
}

export default function AddClientSheet({
  isOpen,
  setIsOpen,
  formData,
  setFormData,
  handleAddClient,
  provinces,
  cities,
  barangays,
  setSelectedProvince,
  setSelectedCity,
  setSelectedBarangay,
  isPending,
  employees,
}: AddClientSheetProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time Name Validation
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const val = e.target.value;
    setFormData({ ...formData, [field]: val });

    if (!val.trim()) {
      setErrors((prev) => ({ ...prev, [field]: "This field is required." }));
    } else if (!/^[a-zA-Z\sñÑ\-]*$/.test(val)) {
      setErrors((prev) => ({
        ...prev,
        [field]: "Letters only. No numbers or special characters.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Real-time Contact Number Validation (+63 Format)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d+]/g, ""); // Allow only digits and +

    // Auto-format PH numbers
    if (val.startsWith("09")) {
      val = "+63" + val.slice(1);
    } else if (val.startsWith("63")) {
      val = "+" + val;
    } else if (val.length > 0 && !val.startsWith("+")) {
      val = "+63" + val;
    }

    if (val.length > 13) val = val.slice(0, 13); // +63 9XX XXX XXXX = 13 chars

    setFormData({ ...formData, contact_number: val });

    if (val && !/^\+639\d{9}$/.test(val)) {
      setErrors((prev) => ({
        ...prev,
        contact_number: "Must be a valid PH number (+639XXXXXXXXX)",
      }));
    } else {
      setErrors((prev) => ({ ...prev, contact_number: "" }));
    }
  };

  // Submit Interceptor to block invalid data
  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const nameRegex = /^[a-zA-Z\sñÑ\-]+$/;
    const phoneRegex = /^\+639\d{9}$/;

    if (!nameRegex.test(formData.first_name || ""))
      newErrors.first_name = "Valid first name is required.";
    if (!nameRegex.test(formData.last_name || ""))
      newErrors.last_name = "Valid last name is required.";
    if (!nameRegex.test(formData.middle_name || ""))
      newErrors.middle_name = "Valid middle name is required.";
    if (!phoneRegex.test(formData.contact_number || ""))
      newErrors.contact_number = "Must be a valid PH number (+639XXXXXXXXX).";
    if (!formData.birthdate) newErrors.birthdate = "Birthdate is required.";
    if (!formData.civil_status)
      newErrors.civil_status = "Civil status is required.";
    if (!formData.province) newErrors.province = "Province is required.";
    if (!formData.city) newErrors.city = "City is required.";
    if (!formData.barangay) newErrors.barangay = "Barangay is required.";
    if (!formData.prepared_by)
      newErrors.prepared_by = "Assisting staff is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setErrors({});
    handleAddClient(e);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-[540px] bg-[#faf8f5] p-8 border-l border-gray-200 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold text-[#1e293b]">
            Register New Client
          </SheetTitle>
          <SheetDescription>
            Enter the personal details and address of the new cemetery client.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleLocalSubmit} className="space-y-6" noValidate>
          {/* Name Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label
                htmlFor="first_name"
                className={errors.first_name ? "text-red-500" : ""}
              >
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                placeholder="e.g. Juan"
                value={formData.first_name || ""}
                onChange={(e) => handleNameChange(e, "first_name")}
                className={
                  errors.first_name
                    ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
                    : "bg-white"
                }
              />
              {errors.first_name && (
                <p className="text-[10px] text-red-500 font-medium">
                  {errors.first_name}
                </p>
              )}
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label
                htmlFor="last_name"
                className={errors.last_name ? "text-red-500" : ""}
              >
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                placeholder="e.g. Dela Cruz"
                value={formData.last_name || ""}
                onChange={(e) => handleNameChange(e, "last_name")}
                className={
                  errors.last_name
                    ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
                    : "bg-white"
                }
              />
              {errors.last_name && (
                <p className="text-[10px] text-red-500 font-medium">
                  {errors.last_name}
                </p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label
                htmlFor="middle_name"
                className={errors.middle_name ? "text-red-500" : ""}
              >
                Middle Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="middle_name"
                placeholder="e.g. Santos"
                value={formData.middle_name || ""}
                onChange={(e) => handleNameChange(e, "middle_name")}
                className={
                  errors.middle_name
                    ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
                    : "bg-white"
                }
              />
              {errors.middle_name && (
                <p className="text-[10px] text-red-500 font-medium">
                  {errors.middle_name}
                </p>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="birthdate"
                className={errors.birthdate ? "text-red-500" : ""}
              >
                Birthdate <span className="text-red-500">*</span>
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={
                  formData.birthdate &&
                  !isNaN(new Date(formData.birthdate).getTime())
                    ? new Date(formData.birthdate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    birthdate: new Date(e.target.value),
                  });
                  setErrors((prev) => ({ ...prev, birthdate: "" }));
                }}
                className={
                  errors.birthdate
                    ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
                    : "bg-white"
                }
              />
              {errors.birthdate && (
                <p className="text-[10px] text-red-500 font-medium">
                  {errors.birthdate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="status"
                className={errors.civil_status ? "text-red-500" : ""}
              >
                Civil Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="status"
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.civil_status
                    ? "border-red-500 bg-red-50 focus:ring-red-500"
                    : "border-input bg-white focus:ring-[#4a5a4a]"
                }`}
                value={formData.civil_status || ""}
                onChange={(e) => {
                  setFormData({ ...formData, civil_status: e.target.value });
                  setErrors((prev) => ({ ...prev, civil_status: "" }));
                }}
              >
                <option value="" disabled>
                  Select Status
                </option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
              {errors.civil_status && (
                <p className="text-[10px] text-red-500 font-medium">
                  {errors.civil_status}
                </p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label
                htmlFor="contact"
                className={errors.contact_number ? "text-red-500" : ""}
              >
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact"
                placeholder="+639XXXXXXXXX"
                value={formData.contact_number || ""}
                onChange={handlePhoneChange}
                className={
                  errors.contact_number
                    ? "border-red-500 bg-red-50 focus-visible:ring-red-500"
                    : "bg-white"
                }
              />
              {errors.contact_number && (
                <p className="text-[10px] text-red-500 font-medium">
                  {errors.contact_number}
                </p>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Address Details with PSGC API */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-[#1e293b]">
              Address Details
            </Label>

            <div className="space-y-2">
              <Label
                htmlFor="province"
                className={errors.province ? "text-red-500" : ""}
              >
                Province <span className="text-red-500">*</span>
              </Label>
              <select
                id="province"
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.province
                    ? "border-red-500 bg-red-50 focus:ring-red-500"
                    : "border-input bg-white focus:ring-[#4a5a4a]"
                }`}
                value={formData.province || ""}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setFormData({
                    ...formData,
                    province: e.target.value,
                    city: "",
                    barangay: "",
                  });
                  setErrors((prev) => ({ ...prev, province: "" }));
                }}
              >
                <option value="" disabled>
                  Select Province
                </option>
                {provinces?.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.province && (
                <p className="text-[10px] text-red-500 font-medium">
                  {errors.province}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className={errors.city ? "text-red-500" : ""}
                >
                  City / Municipality <span className="text-red-500">*</span>
                </Label>
                <select
                  id="city"
                  className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors.city
                      ? "border-red-500 bg-red-50 focus:ring-red-500"
                      : "border-input bg-white focus:ring-[#4a5a4a]"
                  }`}
                  value={formData.city || ""}
                  disabled={!formData.province}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setFormData({
                      ...formData,
                      city: e.target.value,
                      barangay: "",
                    });
                    setErrors((prev) => ({ ...prev, city: "" }));
                  }}
                >
                  <option value="" disabled>
                    Select City
                  </option>
                  {cities?.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.city}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="barangay"
                  className={errors.barangay ? "text-red-500" : ""}
                >
                  Barangay <span className="text-red-500">*</span>
                </Label>
                <select
                  id="barangay"
                  className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors.barangay
                      ? "border-red-500 bg-red-50 focus:ring-red-500"
                      : "border-input bg-white focus:ring-[#4a5a4a]"
                  }`}
                  value={formData.barangay || ""}
                  disabled={!formData.city}
                  onChange={(e) => {
                    setSelectedBarangay(e.target.value);
                    setFormData({ ...formData, barangay: e.target.value });
                    setErrors((prev) => ({ ...prev, barangay: "" }));
                  }}
                >
                  <option value="" disabled>
                    Select Barangay
                  </option>
                  {barangays?.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.barangay && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.barangay}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Label className={errors.prepared_by ? "text-red-500" : ""}>
              Prepared By (Assisting Staff){" "}
              <span className="text-red-500">*</span>
            </Label>
            <select
              className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.prepared_by
                  ? "border-red-500 bg-red-50 focus:ring-red-500"
                  : "border-gray-200 bg-white focus:ring-[#4a5a4a]"
              }`}
              value={formData.prepared_by || ""}
              onChange={(e) => {
                setFormData({ ...formData, prepared_by: e.target.value });
                setErrors((prev) => ({ ...prev, prepared_by: "" }));
              }}
            >
              <option value="" disabled>
                Select an employee...
              </option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                </option>
              ))}
            </select>
            {errors.prepared_by && (
              <p className="text-[10px] text-red-500 font-medium">
                {errors.prepared_by}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-6">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1 border-gray-300">
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="submit"
              className="flex-1 bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white"
              disabled={
                isPending || Object.values(errors).some((e) => e !== "")
              }
            >
              {isPending ? "Registering..." : "Add Client"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
