import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Map as MapIcon,
  BarChart3,
  Info,
  CheckCircle2,
  X,
  Search,
  Settings2,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// --- IMPORTED COMPONENTS ---
import Sidebar from "../../components/custom/Sidebar";
import {
  StatCard,
  SectionHeader,
  DetailRow,
} from "../../components/custom/PlotHelpers";
import EditPlotModal from "../../components/modal/EditPlotModal";

// --- INTERFACES ---
export interface Payment {
  payment_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
}

export interface Transaction {
  transaction_id: string;
  plot_price: number;
  downpayment: number;
  monthlypayment: number;
  remaining_balance: number;
  status: string;
  payments: Payment[];
}

export interface Interment {
  interment_id: number;
  deceased_name: string;
  date_of_birth: string;
  date_of_death: string;
  date_of_interment: string;
}

export interface Plot {
  plot_id: string;
  block: string;
  lot: string;
  plot_type: string;
  status: "Available" | "Occupied" | "Reserved" | "Maintenance";
  price: number;
  owner_name?: string;
  owner_contact?: string;
  transaction_id?: string;
  interments: Interment[];
}

export const formatDate = (dateString?: string) => {
  if (!dateString) return "?";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "?"
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export const getYear = (dateString?: string) => {
  if (!dateString) return "?";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "?" : date.getFullYear();
};

export default function PlotMap() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentPath = window.location.pathname;
  const userName = localStorage.getItem("userName") || "Admin User";
  const userRole = localStorage.getItem("userRole") || "Admin";

  // state variables for plot selection, search, filters, and modal
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [filterSection, setFilterSection] = useState("All Sections");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // fetching plots details for map display
  const {
    data: plots = [],
    isLoading,
    isError,
    error,
  } = useQuery<Plot[]>({
    queryKey: ["plots"],
    queryFn: async () => {
      const res = await axios.get<Plot[]>(
        "http://localhost:3000/api/plots/maps",
      );
      return res.data;
    },
  });

  // fetching transaction details for selected plot
  const { data: transaction } = useQuery<Transaction>({
    queryKey: ["transaction", selectedPlot?.transaction_id],
    queryFn: async () => {
      if (!selectedPlot?.transaction_id) return null;
      const res = await axios.get(
        `http://localhost:3000/api/transactions/${selectedPlot.transaction_id}`,
      );
      return res.data;
    },
    enabled: !!selectedPlot?.transaction_id,
  });

  const stats = useMemo(
    () => ({
      total: plots.length,
      available: plots.filter((p) => p.status === "Available").length,
      occupied: plots.filter((p) => p.status === "Occupied").length,
      reserved: plots.filter((p) => p.status === "Reserved").length,
      maintenance: plots.filter((p) => p.status === "Maintenance").length,
    }),
    [plots],
  );

  // grouping plots by block and determining total lots for each block
  const blockData = useMemo(() => {
    const grouped: Record<string, number> = {};
    plots.forEach((p) => {
      const lotNum = parseInt(p.lot, 10);
      if (!grouped[p.block] || lotNum > grouped[p.block]) {
        grouped[p.block] = lotNum;
      }
    });

    // ensure each block has lots for consistent display, even if some are missing from the database
    return Object.keys(grouped)
      .sort()
      .map((block) => ({
        block,
        // pwede palitan ang 24, ginibu ko 24 since yn
        // din si tig base ko sa image dumn sa figma
        totalLots: Math.max(grouped[block], 24),
      }));
  }, [plots]);

  const getTypeAbbr = (type: string) => {
    if (type?.includes("Mini")) return "m";
    if (type?.includes("Mausoleum")) return "M";
    if (type?.includes("Family")) return "F";
    if (type?.includes("Kennedy")) return "K";
    return "";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-[#e1efd8] border-[#c5dbb7]";
      case "Occupied":
        return "bg-[#d9d9d9] border-[#c0c0c0]";
      case "Reserved":
        return "bg-[#fde9cc] border-[#f9d5a7]";
      case "Maintenance":
        return "bg-[#fcd5d9] border-[#f9b2b9]";
      default:
        return "bg-white border-gray-200";
    }
  };

  const normalizedSearch = searchTerm.toLowerCase();

  // function to render each block with its lots, applying filters and search criteria
  // also dynamic rendering basta ibang blocks si naka indicate sa database
  const RenderBlock = (blockNum: string, totalLots: number) => (
    <div key={blockNum} className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        {/* Block label with dashed line for separation */}
        <span className="bg-[#3d4a3d] text-white text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-tighter">
          Block {blockNum}
        </span>
        <div className="h-[1px] flex-1 bg-gray-200 border-dashed border-t"></div>
      </div>

      <div className="grid grid-cols-12 gap-6 w-fit bg-white/50 p-3 rounded-[10px] border border-gray-100 shadow-sm">
        {/* Generate plot buttons based on total lots, applying filters and search criteria */}
        {Array.from({ length: totalLots }).map((_, i) => {
          const num = (i + 1).toString().padStart(2, "0");
          const id = `B${blockNum}-L${num}`;
          const data = plots.find((p) => p.plot_id === id);

          const matchesType =
            filterType === "All Types" || data?.plot_type === filterType;
          const matchesSection =
            filterSection === "All Sections" ||
            (filterSection === "Left Side" && i < totalLots / 2) ||
            (filterSection === "Right Side" && i >= totalLots / 2);

          const matchesSearch =
            !normalizedSearch ||
            id.toLowerCase().includes(normalizedSearch) ||
            data?.owner_name?.toLowerCase().includes(normalizedSearch) ||
            data?.interments?.some((interment) =>
              interment.deceased_name.toLowerCase().includes(normalizedSearch),
            );

          const isDimmed = !matchesType || !matchesSearch || !matchesSection;
          const isSelected = selectedPlot?.plot_id === id;

          return (
            <div key={id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => data && setSelectedPlot(data)}
                    className={`h-8 w-8 rounded-md border text-[9px] font-bold transition-all flex flex-col items-center justify-center relative
                    ${data ? getStatusColor(data.status) : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"}
                    ${isDimmed ? "opacity-20 grayscale-[0.5] scale-95" : "opacity-100 scale-100 hover:scale-105"}
                    ${isSelected ? "ring-2 ring-[#3d4a3d] ring-offset-2 z-10" : ""}`}
                    disabled={!data}
                  >
                    <span>{num}</span>
                    {data && (
                      <span className="absolute top-0 right-0.5 text-[6px] opacity-40 font-black">
                        {getTypeAbbr(data.plot_type)}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>

                {data && (
                  <TooltipContent className="text-[10px] font-bold bg-[#3d4a3d] text-white border-none p-3 shadow-xl z-50">
                    <p className="border-b border-white/20 pb-1 mb-1">
                      {id} • {data.plot_type ?? "No Type"}
                    </p>
                    {data.interments && data.interments.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-[8px] opacity-60 uppercase mt-2">
                          Interments:
                        </p>
                        {data.interments.map((person) => (
                          <p
                            key={person.interment_id}
                            className="font-medium text-[10px]"
                          >
                            • {person.deceased_name} (
                            {person.date_of_birth
                              ? formatDate(person.date_of_birth)
                              : "Unknown"}{" "}
                            -{" "}
                            {person.date_of_death
                              ? formatDate(person.date_of_death)
                              : "Present"}
                            )
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="opacity-50 italic font-normal mt-1 text-[9px]">
                        No interments recorded
                      </p>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm font-semibold text-[#3d4a3d]">
        <div className="animate-pulse flex flex-col items-center">
          <MapIcon size={32} className="mb-2 opacity-50" />
          Loading Cemetery Map...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500 font-semibold bg-[#fcfbf7]">
        {(error as Error).message}
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen bg-[#f7f6f0] font-sans text-[#1a1c1a] overflow-hidden">
        {/* Navigation Bar */}
        <Sidebar
          userRole={userRole}
          userName={userName}
          activePath={currentPath}
          onNavigate={(path) => navigate(path)}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100 shadow-sm z-20">
            <div className="flex items-center gap-6">
              <div className="relative group hidden md:block ml-4">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3d4a3d] transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search deceased, owner, or ID..."
                  className="pl-9 pr-4 py-2 bg-[#f7f6f0] border-transparent border focus:border-[#b5c2a9] focus:bg-white rounded-[7px] text-xs outline-none w-72 transition-all shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 scale-90 origin-right">
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="bg-[#f7f6f0] hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer transition-colors"
              >
                <option>All Sections</option>
                <option>Right Side</option>
                <option>Left Side</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-[#f7f6f0] hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer transition-colors"
              >
                <option>All Types</option>
                <option>Lawn Type</option>
                <option>Kennedy Type</option>
                <option>Family Type</option>
                <option>Mausoleum</option>
                <option>Mini Mausoleum</option>
              </select>
            </div>
          </header>

          {/* Map Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#fcfbf7]">
            <div className="max-w-5xl mx-auto pb-10">
              <div className="bg-[#eff1ea] rounded-[8px] p-8 border border-[#dce0d5] shadow-inner">
                {blockData.length > 0 ? (
                  blockData.map((b) => RenderBlock(b.block, b.totalLots))
                ) : (
                  <p className="text-center text-gray-400 font-bold text-sm py-10">
                    No plots found in the database.
                  </p>
                )}
              </div>

              {/* Stat Card */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard
                  label="Total Plots"
                  value={stats.total}
                  icon={<MapIcon size={16} />}
                />
                <StatCard
                  label="Available"
                  value={stats.available}
                  color="text-[#5b7a4a]"
                  icon={<CheckCircle2 size={16} />}
                />
                <StatCard
                  label="Occupied"
                  value={stats.occupied}
                  color="text-gray-600"
                  icon={<LayoutDashboard size={16} />}
                />
                <StatCard
                  label="Reserved"
                  value={stats.reserved}
                  color="text-orange-500"
                  icon={<Info size={16} />}
                />
                <StatCard
                  label="Maintenance"
                  value={stats.maintenance}
                  color="text-red-500"
                  icon={<BarChart3 size={16} />}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Details about sa plots naka sidebar right side*/}
        <aside className="w-80 bg-white border-l border-gray-100 p-6 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)] flex flex-col z-30">
          {selectedPlot ? (
            <div className="animate-in slide-in-from-right duration-300 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Plot Details
                </h3>
                <button
                  onClick={() => setSelectedPlot(null)}
                  className="hover:rotate-90 transition-transform bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="inline-block px-2.5 py-1 rounded-md bg-gray-100 text-[9px] font-black text-gray-500 uppercase mb-2 tracking-wider shadow-inner">
                  {selectedPlot.status}
                </div>
                <h2 className="text-2xl font-black mb-6 text-[#1a1c1a]">
                  {selectedPlot.plot_id}
                </h2>

                <div className="space-y-6">
                  <div>
                    <SectionHeader title="Plot Information" />
                    <div className="space-y-2">
                      <DetailRow label="Type" value={selectedPlot.plot_type} />
                      <DetailRow
                        label="Price"
                        value={`₱${selectedPlot.price.toLocaleString()}`}
                      />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-dashed border-gray-200">
                    <SectionHeader title="Ownership" />
                    {selectedPlot.owner_name !== "No Owner" ? (
                      <div className="bg-[#f7f6f0] p-4 rounded-xl border border-[#e1efd8] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#e1efd8] rounded-bl-full opacity-30 -mr-4 -mt-4"></div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-wider">
                          Current Owner
                        </p>
                        <p className="text-sm font-black text-[#3d4a3d] mb-1">
                          {selectedPlot.owner_name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {selectedPlot.owner_contact}
                        </p>
                        {selectedPlot.transaction_id && (
                          <p className="text-[9px] mt-3 text-gray-400 font-mono bg-white inline-block px-2 py-0.5 rounded border border-gray-100">
                            TRX: {selectedPlot.transaction_id}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                        <p className="text-[10px] text-gray-400 italic font-medium">
                          No active owner / Available for sale
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Financial Ledger */}
                  <div className="pt-5 border-t border-dashed border-gray-200">
                    <SectionHeader title="Financial Ledger" />
                    {!selectedPlot.transaction_id ? (
                      <div className="py-4 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                        <p className="text-[10px] text-gray-400 italic font-medium">
                          No active transaction
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-[#3d4a3d] text-white p-4 rounded-xl shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                          <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mb-1">
                            Remaining Balance
                          </p>
                          <p className="text-xl font-black">
                            ₱
                            {Number(
                              transaction?.remaining_balance || 0,
                            ).toLocaleString()}
                          </p>
                          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                            <div>
                              <p className="text-[8px] opacity-60 uppercase font-black">
                                Monthly Due
                              </p>
                              <p className="text-xs font-bold">
                                ₱
                                {Number(
                                  transaction?.monthlypayment || 0,
                                ).toLocaleString()}
                              </p>
                            </div>
                            <span className="text-[8px] bg-white/20 px-2 py-1 rounded-md font-black uppercase tracking-tighter">
                              {transaction?.status}
                            </span>
                          </div>
                        </div>

                        {/* Payment History List */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex justify-between">
                            Payment History{" "}
                            <span className="text-[#b5c2a9]">
                              {transaction?.payments?.length || 0} Records
                            </span>
                          </p>
                          <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                            {transaction?.payments?.map((pay) => (
                              <div
                                key={pay.payment_id}
                                className="flex justify-between items-center text-[10px] bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm"
                              >
                                <div>
                                  <p className="font-black text-gray-700">
                                    ₱{Number(pay.amount_paid).toLocaleString()}
                                  </p>
                                  <p className="text-gray-400 text-[8px]">
                                    {formatDate(pay.payment_date)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-[#3d4a3d] text-[8px] uppercase">
                                    {pay.payment_method}
                                  </p>
                                  <p className="font-mono text-gray-300 text-[7px]">
                                    Ref: {pay.reference_number || "N/A"}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {(!transaction?.payments ||
                              transaction.payments.length === 0) && (
                              <p className="text-center py-4 text-[10px] text-gray-300 italic">
                                No payments recorded yet
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interment Records */}
                  <div className="pt-5 border-t border-dashed border-gray-200">
                    <div className="flex justify-between items-end mb-4">
                      <SectionHeader title="Interment Records" />
                      <span className="text-[10px] font-bold text-[#3d4a3d] bg-[#f7f6f0] px-2 py-0.5 rounded-md shadow-inner">
                        {selectedPlot.interments?.length || 0} Total
                      </span>
                    </div>
                    <div className="space-y-3">
                      {selectedPlot.interments &&
                      selectedPlot.interments.length > 0 ? (
                        selectedPlot.interments.map((person) => (
                          <div
                            key={person.interment_id}
                            className="group relative bg-white border border-gray-100 p-3.5 rounded-xl shadow-sm hover:border-[#b5c2a9] hover:shadow-md transition-all"
                          >
                            <p className="text-xs font-black text-gray-800 uppercase leading-tight mb-2">
                              {person.deceased_name}
                            </p>
                            <div className="grid grid-cols-2 gap-y-2 bg-[#fcfbf7] p-2 rounded-lg border border-gray-50">
                              <div>
                                <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-0.5">
                                  Born — Died
                                </p>
                                <p className="text-[9px] font-semibold text-gray-600">
                                  {getYear(person.date_of_birth)} —{" "}
                                  {getYear(person.date_of_death) || "Present"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] text-[#b5c2a9] uppercase font-black tracking-widest mb-0.5">
                                  Interment
                                </p>
                                <p className="text-[10px] font-bold text-[#3d4a3d]">
                                  {formatDate(person.date_of_interment)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl bg-[#fcfbf7]">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Plot is Vacant
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 bg-white pb-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full bg-white border border-gray-200 text-[#3d4a3d] py-3 rounded-xl font-bold text-xs hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Settings2 size={14} />
                  Update Plot Status
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <MapIcon size={24} className="text-[#3d4a3d]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3d4a3d]">
                Select a Plot to View
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Modal for editing plot status, only rendered when a plot is selected */}
      {selectedPlot && (
        <EditPlotModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          selectedPlot={selectedPlot}
          onSuccess={(updatedStatus: any) => {
            setSelectedPlot({
              ...selectedPlot,
              status: updatedStatus as Plot["status"],
            });
            queryClient.invalidateQueries({ queryKey: ["plots"] });
          }}
        />
      )}
    </TooltipProvider>
  );
}
