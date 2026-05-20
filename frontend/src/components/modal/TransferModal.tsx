// DAE DAA KAIPOHAN - DAVID DEE

import { useState, useEffect } from "react";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onSuccess: () => void;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

export default function TransferModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: TransferModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [transferFee, setTransferFee] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        try {
          const res = await api.get(`${API_BASE_URL}/clients`);
          const otherClients = res.data.filter(
            (c: any) => c.client_id !== transaction?.client_id,
          );
          setClients(otherClients);
        } catch (error) {
          console.error("Failed to fetch clients", error);
        }
      };
      fetchClients();
    }
  }, [isOpen, transaction]);

  const handleSubmit = async () => {
    if (!selectedClientId) return alert("Please select a new client.");

    setIsSubmitting(true);
    try {
      await api.post(`${API_BASE_URL}/transactions/transfer`, {
        old_transaction_id: transaction.transaction_id,
        new_client_id: selectedClientId,
        plot_id: transaction.plot_id,
        transfer_fee: transferFee,
        prepared_by: "Admin",
      });

      alert("Plot transferred successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to transfer plot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClientName = clients.find(
    (c) => c.client_id === selectedClientId,
  )
    ? `${clients.find((c) => c.client_id === selectedClientId)?.first_name} ${clients.find((c) => c.client_id === selectedClientId)?.last_name}`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* FIXED: Solid white background for the modal */}
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-200 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1e293b]">
            Transfer Plot
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Transferring Plot{" "}
            <strong className="text-blue-600">{transaction?.plot_id}</strong> to
            a new client. This will keep the original history intact.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* SEARCHABLE CLIENT DROPDOWN */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-gray-700">
              Search New Owner
            </Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between bg-white border-gray-300 hover:bg-gray-50 shadow-sm"
                >
                  {selectedClientId ? selectedClientName : "Search by name..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              {/* FIXED: Added bg-white, border, and shadow to the popover content */}
              <PopoverContent className="w-[380px] p-0 bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden">
                <Command className="bg-white">
                  <CommandInput
                    placeholder="Search clients..."
                    className="border-none focus:ring-0"
                  />
                  <CommandList className="bg-white">
                    <CommandEmpty>No client found.</CommandEmpty>
                    <CommandGroup className="bg-white text-gray-800">
                      {clients.map((client) => (
                        <CommandItem
                          key={client.client_id}
                          value={`${client.first_name} ${client.last_name}`}
                          onSelect={() => {
                            setSelectedClientId(client.client_id);
                            setOpenCombobox(false);
                          }}
                          className="cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-blue-600",
                              selectedClientId === client.client_id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {client.first_name} {client.last_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* OPTIONAL TRANSFER FEE */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-gray-700">
              Transfer Fee (₱)
            </Label>
            <Input
              type="number"
              className="bg-white border-gray-300 shadow-sm"
              value={transferFee}
              onChange={(e) => setTransferFee(Number(e.target.value))}
              placeholder="0"
            />
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
            disabled={isSubmitting || !selectedClientId}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isSubmitting ? "Transferring..." : "Confirm Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
