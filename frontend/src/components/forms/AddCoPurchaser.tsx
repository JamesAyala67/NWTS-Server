// same sa addContactPerson.tsx

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

export default function AddCoPurchaser({ clientId, transactions }: Props) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    transaction_id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    contact_number: "",
  });

  const mutation = useMutation({
    mutationFn: (newData: typeof formData) => {
      return axios.post(
        `http://localhost:3000/api/contacts/${clientId}/co-purchasers`,
        newData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      toast.success("Co-purchaser added successfully!");
      setFormData({
        transaction_id: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        contact_number: "",
      });
    },
    onError: () => toast.error("Failed to add co-purchaser."),
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
          {/* Show only with Transaction Status of Completed */}
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

      <div className="grid grid-cols-2 gap-4">
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
          <Label>Contact Number</Label>
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
        {mutation.isPending ? "Saving..." : "Add Co-Purchaser"}
      </Button>
    </form>
  );
}
