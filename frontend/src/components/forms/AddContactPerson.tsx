// This component allows users to add a contact person
// associated with a specific transaction for a client,
// it uses React state to manage form data,
// React Query for handling the mutation to add the contact person
// and Sonner for displaying success or error messages
// the form includes fields for selecting an associated transaction
// entering the contact persons details then upon successful submission,
// the form resets and the client data is refetched to reflect the new contact person

// Summarize ta hugak na ko mag para comment

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  clientId: string;
  transactions: any[];
}

export default function AddContactPerson({ clientId, transactions }: Props) {
  const queryClient = useQueryClient();
  const [employees, setEmployees] = useState<any[]>([]); // Dynamic employee state

  const [formData, setFormData] = useState({
    transaction_id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    relation: "",
    contact_number: "",
    prepared_by: "", // Handled by employee selection dropdown
  });

  // Fetch active employees to populate selection options
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/employees");
        setEmployees(res.data);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, []);

  const mutation = useMutation({
    mutationFn: (newData: any) => {
      return axios.post(
        `http://localhost:3000/api/contacts/${clientId}/contact-persons`,
        newData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      toast.success("Contact person added!");
      setFormData({
        transaction_id: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        relation: "",
        contact_number: "",
        prepared_by: "",
      });
    },
    onError: () => toast.error("Failed to add contact person."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.transaction_id)
      return toast.error("Please select a transaction");
    if (!formData.prepared_by)
      return toast.error("Please select the assisting employee");

    // Capture the active system encoder for administrative audit tracking
    const employeeId = localStorage.getItem("employee_id") || null;

    mutation.mutate({
      ...formData,
      employee_id: employeeId, // Appends security token to transaction log context
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-gray-700">
          Associated Transaction
        </Label>
        <select
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800"
          value={formData.transaction_id}
          onChange={(e) =>
            setFormData({ ...formData, transaction_id: e.target.value })
          }
          required
        >
          <option value="">-- Select Transaction --</option>
          {transactions
            ?.filter((txn) => txn.status === "Completed")
            .map((txn) => (
              <option key={txn.transaction_id} value={txn.transaction_id}>
                {txn.plot_id} ({txn.transaction_id.substring(0, 8)})
              </option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            First Name
          </Label>
          <Input
            className="bg-white border-gray-300 shadow-sm focus-visible:ring-[#4a5a4a]"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            Last Name
          </Label>
          <Input
            className="bg-white border-gray-300 shadow-sm focus-visible:ring-[#4a5a4a]"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            Middle Name
          </Label>
          <Input
            className="bg-white border-gray-300 shadow-sm focus-visible:ring-[#4a5a4a]"
            value={formData.middle_name}
            onChange={(e) =>
              setFormData({ ...formData, middle_name: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            Relationship
          </Label>
          <Input
            className="bg-white border-gray-300 shadow-sm focus-visible:ring-[#4a5a4a]"
            value={formData.relation}
            onChange={(e) =>
              setFormData({ ...formData, relation: e.target.value })
            }
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">
            Contact #
          </Label>
          <Input
            className="bg-white border-gray-300 shadow-sm focus-visible:ring-[#4a5a4a]"
            value={formData.contact_number}
            onChange={(e) =>
              setFormData({ ...formData, contact_number: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Dynamic Dropdown for Employee Selection */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-gray-700">
          Assisted / Prepared By
        </Label>
        <select
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a5a4a] text-gray-800"
          value={formData.prepared_by}
          onChange={(e) =>
            setFormData({ ...formData, prepared_by: e.target.value })
          }
          required
        >
          <option value="">-- Select Assisting Employee --</option>
          {employees.map((emp) => {
            const fullName = `${emp.first_name} ${emp.last_name}`;
            return (
              <option key={emp.employee_id} value={fullName}>
                {fullName} ({emp.role})
              </option>
            );
          })}
        </select>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white font-bold py-6 rounded-lg transition shadow-sm mt-2"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Saving..." : "Add Contact Person"}
      </Button>
    </form>
  );
}
