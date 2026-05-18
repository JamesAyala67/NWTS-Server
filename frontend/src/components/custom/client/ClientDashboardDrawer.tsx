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
            {activeDrawer === "transaction" && "Record New Transaction"}
            {activeDrawer === "copurchaser" && "Add Co-Purchaser"}
            {activeDrawer === "contact" && "Add Contact Person"}
            {activeDrawer === "file" && "Register Document"}
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
          {activeDrawer === "transaction" && (
            <AddTransaction clientId={clientId} />
          )}
          {activeDrawer === "copurchaser" && (
            <AddCoPurchaser
              clientId={clientId}
              transactions={availableCoPurchaserTxns}
            />
          )}
          {activeDrawer === "contact" && (
            <AddContactPerson
              clientId={clientId}
              transactions={availableContactTxns}
            />
          )}
          {activeDrawer === "file" && (
            <AddClientFile
              clientId={clientId}
              transactions={clientData.transactions || []}
            />
          )}

          {activeDrawer === "payment" && selectedTransaction && (
            <AddPayment
              transactionId={selectedTransaction.transaction_id}
              currentBalance={selectedTransaction.remaining_balance}
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
