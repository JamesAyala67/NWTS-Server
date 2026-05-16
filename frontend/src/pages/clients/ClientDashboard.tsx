import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Plus,
  X,
  ArrowLeft,
  User,
  FileText,
  Trash2,
  Paperclip,
  MoreVertical,
  ArrowRightLeft,
  Wrench,
  Activity,
  CreditCard,
  Search,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Form Components
import AddTransaction from "../../components/forms/AddTransaction";
import AddCoPurchaser from "../../components/forms/AddCoPurchaser";
import AddContactPerson from "../../components/forms/AddContactPerson";
import AddPayment from "../../components/forms/AddPayment";
import ScheduleInterment from "../../components/forms/ScheduleInterment";
import AddClientFile from "../../components/forms/AddClientFiles";

// Modal Components
import TransferModal from "../../components/modal/TransferModal";
import MaintenanceModal from "../../components/modal/MaintenanceModal";

export default function ClientDashboard() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Custom UI

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

  // Databse UI
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
          ? `http://localhost:3000/api/contacts/co-purchasers/${recordId}`
          : `http://localhost:3000/api/contacts/contact-persons/${recordId}`;
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
      return axios.delete(`http://localhost:3000/api/clients/files/${fileId}`);
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
      const response = await axios.get(
        `http://localhost:3000/api/clients/${id}`,
      );
      return response.data;
    },
  });

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

  // Fetch only available transactions that dont have assigned CoPuurchaser
  const assignedCoPurchaserTxnIds =
    client.co_purchasers
      ?.filter((cp: any) => cp.is_deleted !== 1)
      .map((cp: any) => cp.transaction_id) || [];

  // Fetch only available transactions that dont have assigned Contact Person
  const assignedContactTxnIds =
    client.contact_persons
      ?.filter((c: any) => c.is_deleted !== 1)
      .map((c: any) => c.transaction_id) || [];

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
                  const fileUrl = `http://localhost:3000/${safePath}`;

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
                        onClick={(e) => {
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

      {/* Transactions History Table */}
      <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="border-b border-gray-100 px-8 py-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#4a5a4a]" />
            <CardTitle className="text-lg font-bold text-gray-800 uppercase tracking-wide">
              Transaction History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <Button
              onClick={() => setActiveDrawer("transaction")}
              className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" /> New Transaction
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search ID or Plot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-[200px] text-sm"
                />
              </div>
              <select
                className="h-9 px-3 py-1.5 text-sm border rounded-md border-gray-200 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#4a5a4a] text-white text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="p-4 font-semibold">ID</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Plot</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Balance</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredTransactions.map((txn: any) => (
                  <tr
                    key={txn.transaction_id}
                    className="border-b last:border-none hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-bold">{txn.transaction_id}</td>
                    <td className="p-4">{new Date().toLocaleDateString()}</td>
                    <td className="p-4">
                      {txn.plot_id} - {txn.plot_type}
                    </td>
                    <td className="p-4">
                      ₱{Number(txn.plot_price).toLocaleString()}
                    </td>
                    <td className="p-4">
                      ₱{Number(txn.remaining_balance).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          txn.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : txn.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : txn.status === "Transferred"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {txn.status !== "Transferred" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="bg-white border border-gray-200 shadow-xl rounded-md min-w-[160px] p-1"
                          >
                            {txn.remaining_balance > 0 && (
                              <DropdownMenuItem
                                className="cursor-pointer flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onSelect={() => {
                                  setTimeout(() => {
                                    setSelectedTransactionForAction(txn);
                                    setActiveDrawer("payment");
                                  }, 150);
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4 text-green-600" />
                                Add Payment
                              </DropdownMenuItem>
                            )}

                            {txn.status === "Completed" && (
                              <DropdownMenuItem
                                className="cursor-pointer flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onSelect={() => {
                                  setTimeout(() => {
                                    setSelectedTransactionForAction(txn);
                                    setActiveDrawer("interment");
                                  }, 150);
                                }}
                              >
                                <Activity className="mr-2 h-4 w-4 text-indigo-600" />
                                Schedule Interment
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="cursor-pointer flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onSelect={() => {
                                setTimeout(() => {
                                  setSelectedTransactionForAction(txn);
                                  setIsMaintenanceModalOpen(true);
                                }, 150);
                              }}
                            >
                              <Wrench className="mr-2 h-4 w-4 text-orange-600" />
                              Maintenance
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 font-medium"
                              onSelect={() => {
                                setTimeout(() => {
                                  setSelectedTransactionForAction(txn);
                                  setIsTransferModalOpen(true);
                                }, 150);
                              }}
                            >
                              <ArrowRightLeft className="mr-2 h-4 w-4" />
                              Transfer Plot
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <div className="text-center p-8 text-gray-400 italic text-sm">
                No transactions match your search/filter criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drawer */}
      {activeDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setActiveDrawer(null)}
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
                onClick={() => setActiveDrawer(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8">
              {activeDrawer === "transaction" && (
                <AddTransaction clientId={id!} />
              )}

              {activeDrawer === "copurchaser" && (
                <AddCoPurchaser
                  clientId={id!}
                  transactions={
                    client.transactions?.filter(
                      (txn: any) =>
                        !assignedCoPurchaserTxnIds.includes(
                          txn.transaction_id,
                        ) && txn.status === "Completed",
                    ) || []
                  }
                />
              )}

              {activeDrawer === "contact" && (
                <AddContactPerson
                  clientId={id!}
                  transactions={
                    client.transactions?.filter(
                      (txn: any) =>
                        !assignedContactTxnIds.includes(txn.transaction_id) &&
                        txn.status === "Completed",
                    ) || []
                  }
                />
              )}
              {activeDrawer === "file" && (
                <AddClientFile
                  clientId={id!}
                  transactions={client.transactions || []}
                />
              )}

              {activeDrawer === "payment" && selectedTransactionForAction && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Record New Payment</h3>
                  <AddPayment
                    transactionId={selectedTransactionForAction.transaction_id}
                    currentBalance={
                      selectedTransactionForAction.remaining_balance
                    }
                    onSuccess={() => {
                      setActiveDrawer(null);
                      queryClient.invalidateQueries({
                        queryKey: ["client", id],
                      });
                    }}
                  />
                </div>
              )}

              {activeDrawer === "interment" && selectedTransactionForAction && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Schedule Interment</h3>
                  <ScheduleInterment
                    plotId={selectedTransactionForAction.plot_id}
                    transactionId={selectedTransactionForAction.transaction_id}
                    onSuccess={() => {
                      setActiveDrawer(null);
                      queryClient.invalidateQueries({
                        queryKey: ["client", id],
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

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

// Helper component lalaag ko pa ni dumn sa components/custom
function StatMiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
  isCurrency?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex flex-col min-w-[120px]">
      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
        {label}
      </span>
      <span className="text-sm font-bold text-[#1e293b]">{value}</span>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  children,
  onAdd,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b border-black pt-1 pb-2 px-4 shrink-0">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-tight">
            {title}
          </CardTitle>
        </div>
        {onAdd && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 text-[#4a5a4a]"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-4 px-4 flex-1">{children}</CardContent>
    </Card>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
        {label}
      </span>
      <span className="text-gray-700 font-medium break-words leading-tight">
        {value}
      </span>
    </div>
  );
}
