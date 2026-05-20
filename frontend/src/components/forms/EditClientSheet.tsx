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

type LocationItem = { code: string; name: string };

interface EditClientSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editFormData: any;
  setEditFormData: (data: any) => void;
  handleEditClient: (e: React.FormEvent) => void;
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
}

export default function EditClientSheet({
  isOpen,
  setIsOpen,
  editFormData,
  setEditFormData,
  handleEditClient,
  provinces,
  cities,
  barangays,
  setSelectedProvince,
  setSelectedCity,
  setSelectedBarangay,
  isPending,
}: EditClientSheetProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to update form data and instantly clear its specific error when user types
  const handleChange = (field: string, value: string) => {
    setEditFormData({ ...editFormData, [field]: value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Advanced formatting for Philippine phone numbers (09XXXXXXXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digits and limit to 11 characters
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);

    handleChange("contact_number", val);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate Names (All strictly required)
    if (!editFormData.first_name?.trim())
      newErrors.first_name = "First name is required.";
    if (!editFormData.last_name?.trim())
      newErrors.last_name = "Last name is required.";
    if (!editFormData.middle_name?.trim())
      newErrors.middle_name = "Middle name is required.";

    // Validate Personal Info
    if (!editFormData.birthdate) newErrors.birthdate = "Birthdate is required.";
    if (!editFormData.civil_status)
      newErrors.civil_status = "Civil status is required.";

    // Validate Phone Number Format
    const phoneRegex = /^09\d{9}$/;
    if (!editFormData.contact_number) {
      newErrors.contact_number = "Contact number is required.";
    } else if (!phoneRegex.test(editFormData.contact_number)) {
      newErrors.contact_number = "Must be 11 digits and start with 09.";
    }

    // Validate Address
    if (!editFormData.province) newErrors.province = "Province is required.";
    if (!editFormData.city) newErrors.city = "City is required.";
    if (!editFormData.barangay) newErrors.barangay = "Barangay is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitWrapper = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      handleEditClient(e);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-[540px] bg-[#faf8f5] p-8 border-l border-gray-200 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold text-[#1e293b]">
            Edit Client Details
          </SheetTitle>
          <SheetDescription>
            Update information for Client ID:{" "}
            <span className="font-mono font-bold text-[#4a5a4a]">
              {editFormData.client_id}
            </span>
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmitWrapper} className="space-y-6" noValidate>
          {/* Name Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label
                htmlFor="edit_first_name"
                className={errors.first_name ? "text-red-500" : ""}
              >
                First Name
              </Label>
              <Input
                id="edit_first_name"
                value={editFormData.first_name || ""}
                onChange={(e) => handleChange("first_name", e.target.value)}
                className={
                  errors.first_name
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.first_name && (
                <p className="text-xs text-red-500">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label
                htmlFor="edit_last_name"
                className={errors.last_name ? "text-red-500" : ""}
              >
                Last Name
              </Label>
              <Input
                id="edit_last_name"
                value={editFormData.last_name || ""}
                onChange={(e) => handleChange("last_name", e.target.value)}
                className={
                  errors.last_name
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.last_name && (
                <p className="text-xs text-red-500">{errors.last_name}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label
                htmlFor="edit_middle_name"
                className={errors.middle_name ? "text-red-500" : ""}
              >
                Middle Name
              </Label>
              <Input
                id="edit_middle_name"
                value={editFormData.middle_name || ""}
                onChange={(e) => handleChange("middle_name", e.target.value)}
                className={
                  errors.middle_name
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.middle_name && (
                <p className="text-xs text-red-500">{errors.middle_name}</p>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit_birthdate"
                className={errors.birthdate ? "text-red-500" : ""}
              >
                Birthdate
              </Label>
              <Input
                id="edit_birthdate"
                type="date"
                value={
                  editFormData.birthdate
                    ? new Date(editFormData.birthdate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) => handleChange("birthdate", e.target.value)}
                className={
                  errors.birthdate
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.birthdate && (
                <p className="text-xs text-red-500">{errors.birthdate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="edit_status"
                className={errors.civil_status ? "text-red-500" : ""}
              >
                Civil Status
              </Label>
              <select
                id="edit_status"
                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  errors.civil_status
                    ? "border-red-500 focus:ring-red-500 text-red-500"
                    : "border-input focus:ring-[#4a5a4a]"
                }`}
                value={editFormData.civil_status || ""}
                onChange={(e) => handleChange("civil_status", e.target.value)}
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
                <p className="text-xs text-red-500">{errors.civil_status}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label
                htmlFor="edit_contact"
                className={errors.contact_number ? "text-red-500" : ""}
              >
                Contact Number
              </Label>
              <Input
                id="edit_contact"
                placeholder="09XXXXXXXXX"
                value={editFormData.contact_number || ""}
                onChange={handlePhoneChange}
                className={
                  errors.contact_number
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.contact_number && (
                <p className="text-xs text-red-500">{errors.contact_number}</p>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Address Section with PSGC API */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Current Address</Label>

            <div className="space-y-2">
              <Label
                htmlFor="edit_province"
                className={errors.province ? "text-red-500" : ""}
              >
                Province
              </Label>
              <select
                id="edit_province"
                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  errors.province
                    ? "border-red-500 focus:ring-red-500 text-red-500"
                    : "border-input focus:ring-[#4a5a4a]"
                }`}
                value={editFormData.province || ""}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  handleChange("province", e.target.value);
                  handleChange("city", "");
                  handleChange("barangay", "");
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
                <p className="text-xs text-red-500">{errors.province}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit_city"
                  className={errors.city ? "text-red-500" : ""}
                >
                  City / Municipality
                </Label>
                <select
                  id="edit_city"
                  className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    errors.city
                      ? "border-red-500 focus:ring-red-500 text-red-500"
                      : "border-input focus:ring-[#4a5a4a]"
                  }`}
                  value={editFormData.city || ""}
                  disabled={!editFormData.province}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    handleChange("city", e.target.value);
                    handleChange("barangay", "");
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
                  <p className="text-xs text-red-500">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit_barangay"
                  className={errors.barangay ? "text-red-500" : ""}
                >
                  Barangay
                </Label>
                <select
                  id="edit_barangay"
                  className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    errors.barangay
                      ? "border-red-500 focus:ring-red-500 text-red-500"
                      : "border-input focus:ring-[#4a5a4a]"
                  }`}
                  value={editFormData.barangay || ""}
                  disabled={!editFormData.city}
                  onChange={(e) => {
                    setSelectedBarangay(e.target.value);
                    handleChange("barangay", e.target.value);
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
                  <p className="text-xs text-red-500">{errors.barangay}</p>
                )}
              </div>
            </div>
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
              disabled={isPending}
            >
              {isPending ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
