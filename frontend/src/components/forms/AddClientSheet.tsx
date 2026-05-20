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

// Component for adding a new client, used in ClientDashboard
// Contains form fields for personal info and address details,
// with dynamic dropdowns for location based on PSGC codes
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

        <form onSubmit={handleAddClient} className="space-y-6">
          {/* Name Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                placeholder="e.g. Juan"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="e.g. Dela Cruz"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="middle_name">Middle Name (Optional)</Label>
              <Input
                id="middle_name"
                placeholder="e.g. Santos"
                value={formData.middle_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
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
              <Label htmlFor="birthdate">Birthdate</Label>
              <Input
                id="birthdate"
                type="date"
                value={
                  formData.birthdate
                    ? new Date(formData.birthdate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    birthdate: new Date(e.target.value),
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Civil Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a]"
                value={formData.civil_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    civil_status: e.target.value,
                  })
                }
                required
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                placeholder="09123456789"
                value={formData.contact_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_number: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Address Details with PSGC API */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-[#1e293b]">
              Address Details
            </Label>

            <div className="space-y-2">
              {/* Province Dropdown - Populated from PSGC API */}
              <Label htmlFor="province">Province</Label>
              <select
                id="province"
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a]"
                value={formData.province}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setFormData({
                    ...formData,
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
                <Label htmlFor="city">City / Municipality</Label>
                <select
                  id="city"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a]"
                  value={formData.city}
                  disabled={!formData.province}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setFormData({
                      ...formData,
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
                <Label htmlFor="barangay">Barangay</Label>
                <select
                  id="barangay"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a]"
                  value={formData.barangay}
                  disabled={!formData.city}
                  onChange={(e) => {
                    setSelectedBarangay(e.target.value);
                    setFormData({ ...formData, barangay: e.target.value });
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

          <div className="flex flex-col gap-2 mt-4">
            <label className="text-sm font-medium text-gray-700">
              Prepared By (Assisting Staff)
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4a5a4a]"
              value={formData.prepared_by}
              onChange={(e) =>
                setFormData({ ...formData, prepared_by: e.target.value })
              }
              required
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
              {isPending ? "Registering..." : "Add Client"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
