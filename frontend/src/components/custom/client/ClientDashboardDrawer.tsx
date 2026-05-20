import { useState, useEffect } from "react";
import { X } from "lucide-react";
import AddTransaction from "../../forms/AddTransaction";
import AddCoPurchaser from "../../forms/AddCoPurchaser";
import AddContactPerson from "../../forms/AddContactPerson";
import AddClientFile from "../../forms/AddClientFiles";
import AddPayment from "../../forms/AddPayment";
import ScheduleInterment from "../../forms/ScheduleInterment";

export type DrawerAction =
  | "transaction"
  | "copurchaser"
  | "contact"
  | "payment"
  | "interment"
  | "file"
  | null;

interface ClientActionDrawerProps {
  activeDrawer: DrawerAction;
  onClose: () => void;
  clientId: string;
  clientData: any;
  availableCoPurchaserTxns: any[];
  availableContactTxns: any[];
  selectedTransaction: any;
  onSuccess: () => void;
}

export default function ClientActionDrawer({
  activeDrawer,
  onClose,
  clientId,
  clientData,
  availableCoPurchaserTxns,
  availableContactTxns,
  selectedTransaction,
  onSuccess,
}: ClientActionDrawerProps) {
  // Local state to handle the dropdown selection inside the drawer
  const [transactionType, setTransactionType] = useState<
    "plot" | "general" | ""
  >("");

  // Reset the dropdown selection whenever the drawer closes
  useEffect(() => {
    if (!activeDrawer) {
      setTransactionType("");
    }
  }, [activeDrawer]);

  if (!activeDrawer) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#faf8f5] shadow-2xl overflow-y-auto border-l border-gray-200">
        <div className="flex justify-between items-center p-6 border-b bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-[#1e293b]">
            {activeDrawer === "transaction" &&
              transactionType === "" &&
              "New Transaction"}
            {activeDrawer === "transaction" &&
              transactionType === "plot" &&
              "Plot Transaction"}
            {activeDrawer === "transaction" &&
              transactionType === "general" &&
              "General Transaction"}
            {activeDrawer === "copurchaser" && "Add Co-Purchaser"}
            {activeDrawer === "contact" && "Add Contact Person"}
            {activeDrawer === "file" && "Register Document"}
            {/* Keeping this just in case you trigger payment from somewhere else later */}
            {activeDrawer === "payment" && "Record Payment"}
            {activeDrawer === "interment" && "Schedule Interment"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8">
          {/* THE NEW DROPDOWN SELECTOR */}
          {activeDrawer === "transaction" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Transaction Type
              </label>
              <select
                className="w-full h-11 px-3 py-2 border rounded-md border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
              >
                <option value="" disabled>
                  Select an option...
                </option>
                <option value="plot">Plot Transaction (Add Plot)</option>
                <option value="general">
                  General Transaction (Add Payment)
                </option>
              </select>
            </div>
          )}

          {/* Render AddTransaction if Plot is selected */}
          {activeDrawer === "transaction" && transactionType === "plot" && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AddTransaction clientId={clientId} />
            </div>
          )}

          {/* Render AddPayment if General is selected */}
          {activeDrawer === "transaction" && transactionType === "general" && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* NOTE: Since this is a new general payment not triggered from a specific row, 
                  you will likely need to adjust AddPayment.tsx to let the user pick which 
                  plot/transaction they are paying for. I passed clientData.transactions down just in case! */}
              <AddPayment
                clientId={clientId}
                clientTransactions={clientData?.transactions || []}
                onSuccess={onSuccess}
              />
            </div>
          )}

          {activeDrawer === "copurchaser" && (
            <AddCoPurchaser
              clientId={clientId}
              transactions={availableCoPurchaserTxns}
              onSuccess={onSuccess}
            />
          )}
          {activeDrawer === "contact" && (
            <AddContactPerson
              clientId={clientId}
              transactions={availableContactTxns}
              onSuccess={onSuccess}
            />
          )}
          {activeDrawer === "file" && (
            <AddClientFile
              clientId={clientId}
              transactions={clientData.transactions || []}
              onSuccess={onSuccess}
            />
          )}

          {activeDrawer === "payment" && selectedTransaction && (
            <AddPayment
              transactionId={selectedTransaction.transaction_id}
              onSuccess={onSuccess}
            />
          )}
          {activeDrawer === "interment" && selectedTransaction && (
            <ScheduleInterment
              plotId={selectedTransaction.plot_id}
              transactionId={selectedTransaction.transaction_id}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </div>
    </>
  );
}
