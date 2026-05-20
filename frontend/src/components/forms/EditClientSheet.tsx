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

  // Real-time Name Validation
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const val = e.target.value;
    setEditFormData({ ...editFormData, [field]: val });

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

  // Advanced formatting for Philippine phone numbers (+639XXXXXXXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d+]/g, "");

    // Auto-format PH numbers
    if (val.startsWith("09")) {
      val = "+63" + val.slice(1);
    } else if (val.startsWith("63")) {
      val = "+" + val;
    } else if (val.length > 0 && !val.startsWith("+")) {
      val = "+63" + val;
    }

    if (val.length > 13) val = val.slice(0, 13); // Limit to exactly 13 characters (+63 9XX XXX XXXX)

    setEditFormData({ ...editFormData, contact_number: val });

    if (val && !/^\+639\d{9}$/.test(val)) {
      setErrors((prev) => ({
        ...prev,
        contact_number: "Must be a valid PH number (+639XXXXXXXXX)",
      }));
    } else {
      setErrors((prev) => ({ ...prev, contact_number: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const nameRegex = /^[a-zA-Z\sñÑ\-]+$/;
    const phoneRegex = /^\+639\d{9}$/;

    // Validate Names (All strictly required)
    if (!nameRegex.test(editFormData.first_name || ""))
      newErrors.first_name = "Valid first name is required.";
    if (!nameRegex.test(editFormData.last_name || ""))
      newErrors.last_name = "Valid last name is required.";
    if (!nameRegex.test(editFormData.middle_name || ""))
      newErrors.middle_name = "Valid middle name is required.";

    // Validate Personal Info
    if (!editFormData.birthdate) newErrors.birthdate = "Birthdate is required.";
    if (!editFormData.civil_status)
      newErrors.civil_status = "Civil status is required.";

    // Validate Phone Number Format
    if (!phoneRegex.test(editFormData.contact_number || "")) {
      newErrors.contact_number = "Must be a valid PH number (+639XXXXXXXXX).";
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
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_first_name"
                value={editFormData.first_name || ""}
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
                htmlFor="edit_last_name"
                className={errors.last_name ? "text-red-500" : ""}
              >
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_last_name"
                value={editFormData.last_name || ""}
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
                htmlFor="edit_middle_name"
                className={errors.middle_name ? "text-red-500" : ""}
              >
                Middle Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_middle_name"
                value={editFormData.middle_name || ""}
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
                htmlFor="edit_birthdate"
                className={errors.birthdate ? "text-red-500" : ""}
              >
                Birthdate <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_birthdate"
                type="date"
                value={
                  editFormData.birthdate &&
                  !isNaN(new Date(editFormData.birthdate).getTime())
                    ? new Date(editFormData.birthdate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  setEditFormData({
                    ...editFormData,
                    birthdate: e.target.value,
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
                htmlFor="edit_status"
                className={errors.civil_status ? "text-red-500" : ""}
              >
                Civil Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="edit_status"
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.civil_status
                    ? "border-red-500 bg-red-50 focus:ring-red-500 text-red-500"
                    : "border-input bg-white focus:ring-[#4a5a4a]"
                }`}
                value={editFormData.civil_status || ""}
                onChange={(e) => {
                  setEditFormData({
                    ...editFormData,
                    civil_status: e.target.value,
                  });
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
                htmlFor="edit_contact"
                className={errors.contact_number ? "text-red-500" : ""}
              >
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_contact"
                placeholder="+639XXXXXXXXX"
                value={editFormData.contact_number || ""}
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

          {/* Address Section with PSGC API */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Current Address</Label>

            <div className="space-y-2">
              <Label
                htmlFor="edit_province"
                className={errors.province ? "text-red-500" : ""}
              >
                Province <span className="text-red-500">*</span>
              </Label>
              <select
                id="edit_province"
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.province
                    ? "border-red-500 bg-red-50 focus:ring-red-500 text-red-500"
                    : "border-input bg-white focus:ring-[#4a5a4a]"
                }`}
                value={editFormData.province || ""}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setEditFormData({
                    ...editFormData,
                    province: e.target.value,
                    city: "",
                    barangay: "",
                  });
                  setErrors((prev) => ({
                    ...prev,
                    province: "",
                    city: "",
                    barangay: "",
                  }));
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
                  htmlFor="edit_city"
                  className={errors.city ? "text-red-500" : ""}
                >
                  City / Municipality <span className="text-red-500">*</span>
                </Label>
                <select
                  id="edit_city"
                  className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors.city
                      ? "border-red-500 bg-red-50 focus:ring-red-500 text-red-500"
                      : "border-input bg-white focus:ring-[#4a5a4a]"
                  }`}
                  value={editFormData.city || ""}
                  disabled={!editFormData.province}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setEditFormData({
                      ...editFormData,
                      city: e.target.value,
                      barangay: "",
                    });
                    setErrors((prev) => ({ ...prev, city: "", barangay: "" }));
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
                  htmlFor="edit_barangay"
                  className={errors.barangay ? "text-red-500" : ""}
                >
                  Barangay <span className="text-red-500">*</span>
                </Label>
                <select
                  id="edit_barangay"
                  className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors.barangay
                      ? "border-red-500 bg-red-50 focus:ring-red-500 text-red-500"
                      : "border-input bg-white focus:ring-[#4a5a4a]"
                  }`}
                  value={editFormData.barangay || ""}
                  disabled={!editFormData.city}
                  onChange={(e) => {
                    setSelectedBarangay(e.target.value);
                    setEditFormData({
                      ...editFormData,
                      barangay: e.target.value,
                    });
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
              {isPending ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
