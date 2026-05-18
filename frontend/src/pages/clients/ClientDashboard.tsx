import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, User, FileText, Trash2, Paperclip } from "lucide-react";
import { toast } from "sonner";

// Modal Components
import TransferModal from "../../components/modal/TransferModal";
import MaintenanceModal from "../../components/modal/MaintenanceModal";

// Custom UI
import TransactionHistoryTable from "@/components/custom/client/TransactionHistoryTable";
import ClientDashboardDrawer from "@/components/custom/client/ClientDashboardDrawer";
import {
  StatMiniCard,
  InfoCard,
  DataRow,
} from "../../components/custom/client/ClientDashboardHelper";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ClientDashboard() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Modal and Drawer
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTransactionForAction, setSelectedTransactionForAction] =
    useState<any>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<
    | "transaction"
    | "copurchaser"
    | "contact"
    | "payment"
    | "interment"
    | "file"
    | null
  >(null);

  // Database UI
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Delete Mutation for CoPurchaser and Contact Person
  const deleteMutation = useMutation({
    mutationFn: async ({
      type,
      recordId,
    }: {
      type: "co-purchaser" | "contact-person";
      recordId: string;
    }) => {
      const endpoint =
        type === "co-purchaser"
          ? `${API_URL}/api/contacts/co-purchasers/${recordId}`
          : `${API_URL}/api/contacts/contact-persons/${recordId}`;
      return axios.delete(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      toast.success("Record removed successfully");
    },
    onError: () => toast.error("Failed to remove record"),
  });

  // Delete Mutation for Client Files
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return axios.delete(`${API_URL}/api/clients/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      toast.success("File removed successfully");
    },
    onError: () => toast.error("Failed to remove file"),
  });

  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/clients/${id}`);
      return response.data;
    },
  });

  const handleTransactionAction = (
    action: "payment" | "interment" | "maintenance" | "transfer",
    txn: any,
  ) => {
    setSelectedTransactionForAction(txn);
    if (action === "payment" || action === "interment") {
      setActiveDrawer(action);
    } else if (action === "maintenance") {
      setIsMaintenanceModalOpen(true);
    } else if (action === "transfer") {
      setIsTransferModalOpen(true);
    }
  };

  const closeDrawerAndRefresh = () => {
    setActiveDrawer(null);
    queryClient.invalidateQueries({ queryKey: ["client", id] });
  };

  // Calculate available transactions for drawers
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
        (txn: any) =>
          !assignedCpIds.includes(txn.transaction_id) &&
          txn.status === "Completed",
      ) || [];
    const unassignedContactTxns =
      client.transactions?.filter(
        (txn: any) =>
          !assignedContactIds.includes(txn.transaction_id) &&
          txn.status === "Completed",
      ) || [];

    return {
      availableCoPurchaserTxns: unassignedCpTxns,
      availableContactTxns: unassignedContactTxns,
    };
  }, [client]);

  // Filtering Transaction base on Search and Status
  const filteredTransactions = useMemo(() => {
    if (!client?.transactions) return [];
    return client.transactions.filter((txn: any) => {
      const matchesSearch =
        txn.plot_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || txn.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [client?.transactions, searchTerm, statusFilter]);

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

  // Check if there is transaction that dont have any CoPurchaser and Contact Person assigned
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

  // Calculate total paid across all plots
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
      {/* Navigation to go back to ClientPage */}
      <Link
        to="/clients"
        className="flex items-center text-gray-500 hover:text-[#4a5a4a] mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client List
      </Link>

      {/* Header Section */}
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

      {/* Custom InfoCard Grid */}
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
                // Ensuring that soft deleted files will not be shown in the frontend
                .filter((f: any) => f.is_deleted !== 1)
                .map((file: any) => {
                  const safePath = file.file_path.replace(/\\/g, "/");
                  const fileUrl = `${API_URL}/${safePath}`;

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
        transactions={filteredTransactions}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onNewTransaction={() => setActiveDrawer("transaction")}
        onAction={handleTransactionAction}
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

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedTransactionForAction(null);
        }}
        transaction={selectedTransactionForAction}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["client", id] });
        }}
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
