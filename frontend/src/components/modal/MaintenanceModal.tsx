// This component renders a modal that allows users to log maintenance activities for a specific plot and transaction
// It collects details such as maintenance description, scheduled date, cost, and payment status
// Upon submission, it sends this information to the backend API to create a new maintenance record
// The parent component is then updated to reflect the new maintenance entry and any associated changes

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onSuccess: () => void;
}

export default function MaintenanceModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: MaintenanceModalProps) {
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [cost, setCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  const handleSubmit = async () => {
    if (!description || !scheduledDate)
      return alert("Please fill in the description and date.");

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:3000/api/transactions/maintenance", {
        plot_id: transaction.plot_id,
        transaction_id: transaction.transaction_id,
        description,
        cost,
        scheduled_date: scheduledDate,
        paymenta_status: paymentStatus,
        logged_by: "Admin",
      });

      // Call onSuccess to refresh the parent component's data and close the modal
      onSuccess();
      onClose();
      // Reset form
      setDescription("");
      setScheduledDate("");
      setCost(0);
    } catch (error) {
      console.error(error);
      alert("Failed to schedule maintenance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-200 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1e293b]">
            Log Maintenance
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Schedule maintenance for Plot{" "}
            <strong className="text-orange-600">{transaction?.plot_id}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-gray-700">
              Maintenance Description
            </Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grass cutting, tombstone cleaning..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-gray-700">
                Scheduled Date
              </Label>
              <Input
                type="date"
                className="bg-white border-gray-300 shadow-sm"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-gray-700">
                Cost (₱)
              </Label>
              <Input
                type="number"
                className="bg-white border-gray-300 shadow-sm"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-gray-700">
                Payment Status
              </Label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="Unpaid">Unpaid (Bill Later)</option>
                <option value="Paid">Paid Upfront</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            className="bg-white hover:bg-gray-100 border-gray-300"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
          >
            {isSubmitting ? "Saving..." : "Save Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
