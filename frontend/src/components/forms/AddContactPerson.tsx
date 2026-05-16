// This component allows users to add a contact person
// associated with a specific transaction for a client,
// it uses React state to manage form data,
// React Query for handling the mutation to add the contact person
// and Sonner for displaying success or error messages
// the form includes fields for selecting an associated transaction
// entering the contact persons details then upon successful submission,
// the form resets and the client data is refetched to reflect the new contact person

// Summarize ta hugak na ko mag para comment

import { useState } from "react";
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
  const [formData, setFormData] = useState({
    transaction_id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    relation: "",
    contact_number: "",
  });

  const mutation = useMutation({
    mutationFn: (newData: typeof formData) => {
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
      });
    },
    onError: () => toast.error("Failed to add contact person."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.transaction_id)
      return toast.error("Please select a transaction");
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Associated Transaction</Label>
        <select
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-gray-200"
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
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Middle Name</Label>
          <Input
            value={formData.middle_name}
            onChange={(e) =>
              setFormData({ ...formData, middle_name: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Relationship</Label>
          <Input
            value={formData.relation}
            onChange={(e) =>
              setFormData({ ...formData, relation: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Contact #</Label>
          <Input
            value={formData.contact_number}
            onChange={(e) =>
              setFormData({ ...formData, contact_number: e.target.value })
            }
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#4a5a4a] text-white"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Saving..." : "Add Contact Person"}
      </Button>
    </form>
  );
}
