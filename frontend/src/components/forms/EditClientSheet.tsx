// same structure as AddClientSheet but with pre-filled data

import React from "react";
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

        <form onSubmit={handleEditClient} className="space-y-6">
          {/* Name Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="edit_first_name">First Name</Label>
              <Input
                id="edit_first_name"
                value={editFormData.first_name}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    first_name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="edit_last_name">Last Name</Label>
              <Input
                id="edit_last_name"
                value={editFormData.last_name}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    last_name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_middle_name">Middle Name</Label>
              <Input
                id="edit_middle_name"
                value={editFormData.middle_name}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    middle_name: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_birthdate">Birthdate</Label>
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
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    birthdate: new Date(e.target.value),
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Civil Status</Label>
              <select
                id="edit_status"
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={editFormData.civil_status}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    civil_status: e.target.value,
                  })
                }
                required
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_contact">Contact Number</Label>
              <Input
                id="edit_contact"
                placeholder="09XXXXXXXXX"
                value={editFormData.contact_number}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    contact_number: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Address Section with PSGC API */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Current Address</Label>

            <div className="space-y-2">
              {/* Province Dropdown - Populated from PSGC API */}
              <Label htmlFor="edit_province">Province</Label>
              <select
                id="edit_province"
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={editFormData.province}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setEditFormData({
                    ...editFormData,
                    province: e.target.value,
                    city: "",
                    barangay: "",
                  });
                }}
                required
              >
                <option value="">Select Province</option>
                {provinces?.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {/* City Dropdown - Populated based on selected province */}
                <Label htmlFor="edit_city">City / Municipality</Label>
                <select
                  id="edit_city"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={editFormData.city}
                  disabled={!editFormData.province}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setEditFormData({
                      ...editFormData,
                      city: e.target.value,
                      barangay: "",
                    });
                  }}
                  required
                >
                  <option value="">Select City</option>
                  {cities?.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {/* Barangay Dropdown - Populated based on selected city */}
                <Label htmlFor="edit_barangay">Barangay</Label>
                <select
                  id="edit_barangay"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={editFormData.barangay}
                  disabled={!editFormData.city}
                  onChange={(e) => {
                    setSelectedBarangay(e.target.value);
                    setEditFormData({
                      ...editFormData,
                      barangay: e.target.value,
                    });
                  }}
                  required
                >
                  <option value="">Select Barangay</option>
                  {barangays?.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">
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
