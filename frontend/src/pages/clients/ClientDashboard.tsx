import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, User, FileText, Trash2, Paperclip } from "lucide-react";
import { toast } from "sonner";

// Modal Components
import MaintenanceModal from "../../components/modal/MaintenanceModal";

// Custom UI
import TransactionHistoryTable from "@/components/custom/client/TransactionHistoryTable";
import ClientDashboardDrawer from "@/components/custom/client/ClientDashboardDrawer";
import {
  StatMiniCard,
  InfoCard,
  DataRow,
} from "../../components/custom/client/ClientDashboardHelper";
import TransactionDetailsModal from "@/components/modal/TransactionDetailsModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

export default function ClientDashboard() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const currentEmployeeId = localStorage.getItem("employee_id") || "";
  const currentEmployeeName = localStorage.getItem("userName") || "";

  // Modal and Drawer
  const [selectedTransactionForAction, setSelectedTransactionForAction] =
    useState<any>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [selectedTransactionForPr, setSelectedTransactionForPr] =
    useState<any>(null);
  const [activeDrawer, setActiveDrawer] = useState<
    | "transaction" // AddTransaction.tsx
    | "copurchaser"
    | "contact"
    | "payment" // AddPayments.tsx
    | "interment"
    | "file"
    | null
  >(null);

  // Database UI
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const deleteMutation = useMutation({
    mutationFn: async ({
      type,
      recordId,
    }: {
      type: "co-purchaser" | "contact-person";
      recordId: string;
    }) => {
      const userRole = localStorage.getItem("userRole");

      if (userRole === "Admin") {
        // Direct Delete for Admins (Assuming you have these endpoints in contactRoutes)
        const endpoint =
          type === "co-purchaser"
            ? `/contacts/co-purchasers/${recordId}/delete`
            : `/contacts/contact-persons/${recordId}/delete`;

        return api.patch(endpoint, {
          employee_id: currentEmployeeId,
          deleted_by: currentEmployeeName,
        });
      } else {
        // Send to Request Queue for Staff
        const endpoint =
          type === "co-purchaser"
            ? `/requests/stage-copurchaser/${recordId}`
            : `/requests/stage-contact/${recordId}`;

        return api.post(endpoint, { submitter_name: currentEmployeeName });
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });

      if (localStorage.getItem("userRole") === "Admin") {
        toast.success("Record removed successfully");
      } else {
        toast.success("Request Sent", {
          description: `Deletion request for ${variables.type.replace("-", " ")} sent to Admin.`,
        });
      }
    },
    onError: () => toast.error("Failed to process request"),
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const userRole = localStorage.getItem("userRole");

      if (userRole === "Admin") {
        // Direct Delete for Admins (uses your existing clientRoutes.js)
        return api.patch(`/clients/files/${fileId}`, {
          employee_id: currentEmployeeId,
          deleted_by: currentEmployeeName,
        });
      } else {
        // Send to Request Queue for Staff
        return api.post(`/requests/stage-file/${fileId}`, {
          submitter_name: currentEmployeeName,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });

      if (localStorage.getItem("userRole") === "Admin") {
        toast.success("File removed successfully");
      } else {
        toast.success("Request Sent", {
          description: "Document deletion request sent to Admin.",
        });
      }
    },
    onError: () => toast.error("Failed to process file removal"),
  });

  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    },
  });

  const handleTransactionAction = (
    action: "payment" | "interment" | "maintenance",
    txn: any,
  ) => {
    setSelectedTransactionForAction(txn);
    if (action === "payment" || action === "interment") {
      setActiveDrawer(action);
    } else if (action === "maintenance") {
      setIsMaintenanceModalOpen(true);
    }
  };
  const handlePrClick = (txn: any) => {
    setSelectedTransactionForPr(txn);
    setIsPrModalOpen(true);
  };

  const closeDrawerAndRefresh = () => {
    setActiveDrawer(null);
    queryClient.invalidateQueries({ queryKey: ["client", id] });
  };

  const { availableCoPurchaserTxns, availableContactTxns } = useMemo(() => {
    if (!client)
      return { availableCoPurchaserTxns: [], availableContactTxns: [] };

    const assignedCpIds =
      client.co_purchasers
        ?.filter((cp: any) => cp.is_deleted !== 1)
        .map((cp: any) => cp.transaction_id) || [];

    const assignedContactIds =
      client.contact_persons
        ?.filter((c: any) => c.is_deleted !== 1)
        .map((c: any) => c.transaction_id) || [];

    const unassignedCpTxns =
      client.transactions?.filter(
        (txn: any) => !assignedCpIds.includes(txn.transaction_id),
      ) || [];

    const unassignedContactTxns =
      client.transactions?.filter(
        (txn: any) => !assignedContactIds.includes(txn.transaction_id),
      ) || [];

    return {
      availableCoPurchaserTxns: unassignedCpTxns,
      availableContactTxns: unassignedContactTxns,
    };
  }, [client]);

  // Combine Transactions and Payments
  const combinedLedger = useMemo(() => {
    if (!client) return [];

    const txns = client.transactions || [];
    const payments = client.payments || [];

    // Combine them and sort by date
    return [...txns, ...payments].sort((a, b) => {
      const dateA = new Date(
        a.payment_date || a.transaction_date || a.date_created || 0,
      );
      const dateB = new Date(
        b.payment_date || b.transaction_date || b.date_created || 0,
      );
      return dateB.getTime() - dateA.getTime();
    });
  }, [client]);

  // 2. Filter the COMBINED ledger for the table
  const filteredTransactions = useMemo(() => {
    return combinedLedger.filter((item: any) => {
      const matchesSearch =
        item.professional_receipt
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.sales_invoice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.plot_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const isPayment = !!item.payment_id;
      let matchesStatus = true;

      if (statusFilter !== "All") {
        if (statusFilter === "Transaction") {
          matchesStatus = !isPayment; // FIXED: Assign to matchesStatus instead of returning early
        } else if (statusFilter === "Payment") {
          matchesStatus = isPayment;
        } else {
          matchesStatus = !isPayment && item.status === statusFilter;
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [combinedLedger, searchTerm, statusFilter]);

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        Loading client profile...
      </div>
    );
  if (isError || !client)
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Error loading client.
      </div>
    );

  const fullName = `${client.first_name} ${client.middle_name ? client.middle_name + " " : ""}${client.last_name}`;
  const fullAddress = `${client.barangay}, ${client.city}, ${client.province}`;

  const canAddCoPurchaser = client.transactions?.some(
    (txn: any) =>
      !client.co_purchasers?.find(
        (cp: any) =>
          cp.transaction_id === txn.transaction_id && cp.is_deleted !== 1,
      ),
  );
  const canAddContact = client.transactions?.some(
    (txn: any) =>
      !client.contact_persons?.find(
        (c: any) =>
          c.transaction_id === txn.transaction_id && c.is_deleted !== 1,
      ),
  );

  const totalPaid =
    client.transactions?.reduce(
      (sum: number, txn: any) =>
        sum + (Number(txn.plot_price) - Number(txn.remaining_balance)),
      0,
    ) || 0;

  const handleDelete = (
    type: "co-purchaser" | "contact-person",
    recordId: string,
  ) => {
    if (window.confirm("Are you sure you want to remove this record?")) {
      deleteMutation.mutate({ type, recordId });
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (window.confirm("Are you sure you want to remove this document?")) {
      deleteFileMutation.mutate(fileId);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] p-4 md:p-8">
      <Link
        to="/clients"
        className="flex items-center text-gray-500 hover:text-[#4a5a4a] mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client List
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-[#4a5a4a] flex items-center justify-center text-white text-3xl font-bold shadow-inner">
            {client.first_name[0]}
            {client.last_name[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1e293b] leading-tight">
              {fullName}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatMiniCard
            label="Total Plots"
            value={client.transactions?.length?.toString() || "0"}
          />
          <StatMiniCard
            label="Client Since"
            value={new Date(
              client.date_created || Date.now(),
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
          <StatMiniCard
            label="Total Paid"
            value={`₱${totalPaid.toLocaleString()}`}
            isCurrency
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <InfoCard
          title="Client Profile"
          icon={<User className="h-4 w-4 text-[#4a5a4a]" />}
        >
          <div className="space-y-2 text-sm">
            <DataRow label="Full Name" value={fullName} />
            <DataRow label="Contact Number" value={client.contact_number} />
            <DataRow label="Civil Status" value={client.civil_status} />
            <DataRow label="Address" value={fullAddress} />
          </div>
        </InfoCard>

        <InfoCard
          title="Co-Purchasers"
          icon={<User className="h-4 w-4 text-[#4a5a4a]" />}
          onAdd={
            canAddCoPurchaser ? () => setActiveDrawer("copurchaser") : undefined
          }
        >
          {!client.co_purchasers || client.co_purchasers.length === 0 ? (
            <p className="text-xs text-gray-400 mt-4 italic">
              No co-purchasers listed.
            </p>
          ) : (
            <div className="space-y-3 mt-4 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {client.co_purchasers.map((cp: any) => (
                <div
                  key={cp.co_purchaser_id}
                  className="p-3 bg-gray-50 rounded-lg flex justify-between items-center group border border-transparent hover:border-gray-200 transition-all"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-xs">
                      {cp.first_name} {cp.last_name}
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5 bg-white inline-block px-1 rounded border border-gray-100">
                      REF: {cp.transaction_id?.substring(0, 8) || "N/A"}
                    </p>
                    {cp.contact_number && (
                      <span className="ml-1 text-gray-400 font-mono text-[8px]">
                        {cp.contact_number}
                      </span>
                    )}
                  </div>
                  <Trash2
                    onClick={() =>
                      handleDelete("co-purchaser", cp.co_purchaser_id)
                    }
                    className="h-3 w-3 text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          )}
        </InfoCard>

        <InfoCard
          title="Contact Persons"
          icon={<User className="h-4 w-4 text-[#4a5a4a]" />}
          onAdd={canAddContact ? () => setActiveDrawer("contact") : undefined}
        >
          {!client.contact_persons || client.contact_persons.length === 0 ? (
            <p className="text-xs text-gray-400 mt-4 italic">
              No contact persons listed.
            </p>
          ) : (
            <div className="space-y-3 mt-4 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {client.contact_persons.map((contact: any) => (
                <div
                  key={contact.contact_id}
                  className="p-3 bg-gray-50 rounded-lg flex justify-between items-center group border border-transparent hover:border-gray-200 transition-all"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-xs">
                      {contact.first_name} {contact.last_name}{" "}
                      <span className="font-normal text-gray-400">
                        ({contact.relation})
                      </span>
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5 bg-white inline-block px-1 rounded border border-gray-100">
                      REF: {contact.transaction_id?.substring(0, 8) || "N/A"}
                    </p>
                    {contact.contact_number && (
                      <span className="ml-1 text-gray-400 font-mono text-[8px]">
                        {contact.contact_number}
                      </span>
                    )}
                  </div>
                  <Trash2
                    onClick={() =>
                      handleDelete("contact-person", contact.contact_id)
                    }
                    className="h-3 w-3 text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          )}
        </InfoCard>

        <InfoCard
          title="Documents"
          icon={<Paperclip className="h-4 w-4 text-[#4a5a4a]" />}
          onAdd={() => setActiveDrawer("file")}
        >
          {!client.client_files || client.client_files.length === 0 ? (
            <p className="text-xs text-gray-400 mt-4 italic">
              No documents recorded.
            </p>
          ) : (
            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {client.client_files
                .filter((f: any) => f.is_deleted !== 1)
                .map((file: any) => {
                  // 1. Standardize formatting to prevent duplicate slashes or dot-segments
                  let cleanPath = file.file_path.replace(/\\/g, "/");
                  if (cleanPath.startsWith("../")) {
                    cleanPath = cleanPath.replace("../", "");
                  }

                  // 2. CRITICAL FIX: Extract the structural base URL out of the API_BASE_URL parameter
                  // Drops "/api" so it addresses "http://localhost:3000/uploads/..." directly
                  const serverBaseUrl = API_BASE_URL.replace(/\/api$/, "");
                  const fileUrl = `${serverBaseUrl}/${cleanPath}`;

                  return (
                    <div
                      key={file.file_id}
                      className="p-2.5 bg-[#fcfaf7] rounded-lg flex items-center justify-between border border-[#f0e6d2] group hover:border-[#b5c2a9] hover:bg-white transition-all"
                    >
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-100 shadow-sm shrink-0 group-hover:shadow-md transition-shadow">
                          <FileText className="h-4 w-4 text-[#4a5a4a]" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] font-bold text-gray-700 truncate group-hover:text-[#4a5a4a]">
                            {file.file_name}
                          </p>
                          <p className="text-[8px] text-gray-400 font-mono mt-0.5">
                            TXN: {file.transaction_id?.substring(0, 8)}
                          </p>
                        </div>
                      </a>
                      <Trash2
                        onClick={(e: React.MouseEvent<SVGSVGElement>) => {
                          e.stopPropagation();
                          handleDeleteFile(file.file_id);
                        }}
                        className="h-3 w-3 text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </InfoCard>
      </div>

      <TransactionHistoryTable
        transactions={filteredTransactions} // <-- Pass the FILTERED list, not combinedLedger
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onNewTransaction={() => setActiveDrawer("transaction")}
        onAction={handleTransactionAction} // <-- Changed from handleAction
        onPrClick={handlePrClick} // <-- Attached the new function
      />

      <TransactionDetailsModal
        isOpen={isPrModalOpen}
        onClose={() => {
          setIsPrModalOpen(false);
          setSelectedTransactionForPr(null);
        }}
        transaction={selectedTransactionForPr}
      />

      <ClientDashboardDrawer
        activeDrawer={activeDrawer}
        onClose={() => setActiveDrawer(null)}
        clientId={id!}
        clientData={client}
        availableCoPurchaserTxns={availableCoPurchaserTxns}
        availableContactTxns={availableContactTxns}
        selectedTransaction={selectedTransactionForAction}
        onSuccess={closeDrawerAndRefresh}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setSelectedTransactionForAction(null);
        }}
        transaction={selectedTransactionForAction}
        onSuccess={() => {
          toast.success("Maintenance scheduled!");
          queryClient.invalidateQueries({ queryKey: ["client", id] });
        }}
      />
    </div>
  );
}
