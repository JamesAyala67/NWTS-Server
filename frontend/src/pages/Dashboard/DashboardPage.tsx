import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Plus,
  FileText,
  Calendar as CalendarIcon,
  BarChart2,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  ShieldAlert,
  Wrench,
  Download,
} from "lucide-react";
import MegaForm from "@/components/forms/MegaForm";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

const fetchDashboardSummary = async () => {
  const { data } = await api.get(`${API_BASE_URL}/dashboard/summary`);
  return data;
};

const searchGlobalMatrix = async (searchTerm: string) => {
  if (!searchTerm) return [];
  const { data } = await api.get(
    `${API_BASE_URL}/dashboard/search-all?q=${encodeURIComponent(searchTerm)}`,
  );
  return data;
};

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMegaFormOpen, setIsMegaFormOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Admin User";

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Summary Fetching Hook
  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
  });

  // Global Context Search Hook
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["globalMatrixSearch", searchQuery],
    queryFn: () => searchGlobalMatrix(searchQuery),
    enabled: searchQuery.trim().length > 0,
  });

  // Excel Multi sheet Generator
  const handleExportExcelReport = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/reports/export-excel`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NWTS_System_Report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export unified report excel", err);
    }
  };

  const formattedDate = time.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedDay = time.toLocaleDateString("en-US", { weekday: "long" });
  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full bg-[#FDFCF8] font-sans p-6 lg:p-8 space-y-8">
      {/* Header with Search */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#313c34]">
            Good afternoon, {userName}!
          </h2>
          <p className="text-[#4A5D4E]/80 text-sm mt-1 font-medium">
            Here's what's happening at New Heaven's Way today.
          </p>
        </div>

        {/* Global Search */}
        <div ref={dropdownRef} className="relative w-full md:w-96 z-40">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-[#4A5D4E] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search clients, ledgers, or interments..."
              className="w-full bg-white border border-[#EAEFEA] rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#4A5D4E] focus:ring-2 focus:ring-[#4A5D4E]/20 shadow-sm transition-all placeholder:text-gray-400"
            />
          </div>

          {isDropdownOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-[#EAEFEA] rounded-2xl shadow-xl max-h-72 overflow-y-auto z-50 divide-y divide-[#EAEFEA] custom-scrollbar">
              {isSearching ? (
                <div className="p-6 flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#4A5D4E] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-medium text-[#4A5D4E]">
                    Querying data matrix...
                  </p>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setSearchQuery("");
                      navigate(`/clients/${result.client_id}`);
                    }}
                    className="p-3.5 px-5 hover:bg-[#F4F6F4] cursor-pointer transition-colors flex justify-between items-start gap-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#313c34]">
                        {result.name}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {result.context_details}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shrink-0 border ${
                        result.match_type === "Client Base"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : result.match_type === "Active Ledger"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-stone-50 text-stone-700 border-stone-200"
                      }`}
                    >
                      {result.match_type}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-6 text-sm text-gray-400 text-center font-medium">
                  No exact records found.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Date / Time widgets */}
        <div className="flex gap-3 w-full md:w-auto justify-start md:justify-end">
          <div className="bg-white border border-[#EAEFEA] rounded-2xl p-3 px-5 flex items-center gap-3 shadow-sm">
            <CalendarIcon className="text-[#4A5D4E] h-5 w-5" />
            <div>
              <p className="text-sm font-bold text-[#313c34]">
                {formattedDate}
              </p>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                {formattedDay}
              </p>
            </div>
          </div>
          <div className="bg-white border border-[#EAEFEA] rounded-2xl p-3 px-5 flex items-center gap-3 shadow-sm">
            <Clock className="text-[#4A5D4E] h-5 w-5" />
            <p className="text-lg font-bold text-[#313c34] tracking-wide font-mono">
              {formattedTime}
            </p>
          </div>
        </div>
      </header>

      {/* Quick Access */}
      <div className="bg-white rounded-2xl p-2.5 flex items-center shadow-sm border border-[#EAEFEA] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <h3 className="font-bold text-[#313c34] px-4 whitespace-nowrap text-xs uppercase tracking-wider">
          Quick Access
        </h3>
        <div className="h-8 w-[1px] bg-[#EAEFEA] hidden sm:block mx-1"></div>
        <div className="flex gap-2 pl-2 sm:pl-0">
          {/* Add Client */}
          <button
            onClick={() => setIsAddClientOpen(true)}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-white hover:bg-[#4A5D4E] transition-all bg-[#FDFCF8] px-4 py-2.5 rounded-xl border border-[#EAEFEA] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Client
          </button>

          {/* Mega Form */}
          <button
            onClick={() => setIsMegaFormOpen(true)}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-white hover:bg-[#4A5D4E] transition-all bg-[#FDFCF8] px-4 py-2.5 rounded-xl border border-[#EAEFEA] whitespace-nowrap"
          >
            <FileText className="h-4 w-4" /> Mega Form (PAF)
          </button>

          {/* View Plots Map */}
          <button
            onClick={() => navigate("/plots/map")}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-white hover:bg-[#4A5D4E] transition-all bg-[#FDFCF8] px-4 py-2.5 rounded-xl border border-[#EAEFEA] whitespace-nowrap"
          >
            <BarChart2 className="h-4 w-4" /> View Plots Map
          </button>

          {/* Generate Report */}
          <button
            onClick={handleExportExcelReport}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-white hover:bg-[#4A5D4E] transition-all bg-[#FDFCF8] px-4 py-2.5 rounded-xl border border-[#EAEFEA] whitespace-nowrap"
          >
            <Download className="h-4 w-4" /> Generate Report
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 font-medium text-sm">
          <AlertTriangle className="h-5 w-5" />
          <p>
            Failed to load dashboard data. Please make sure the backend server
            is running correctly.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activites */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAEFEA] flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-50">
            <h3 className="font-bold text-[#313c34] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#4A5D4E]" /> Recent Activities
            </h3>
            <button
              onClick={() => navigate("/logs")}
              className="text-xs font-bold text-[#4A5D4E] hover:text-[#313c34] transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {isLoading ? (
              <p className="text-sm font-medium text-gray-400 text-center mt-10">
                Syncing feeds...
              </p>
            ) : !dashboardData?.recentActivity?.length ? (
              <p className="text-sm font-medium text-gray-400 text-center mt-10">
                No recent logs recorded.
              </p>
            ) : (
              dashboardData.recentActivity.map((act: any, i: number) => (
                <div key={i} className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        act.log_type === "audit"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {act.log_type === "audit" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">
                        {act.description}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide font-medium">
                        By {act.operator || "System"}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-[10px] whitespace-nowrap font-medium">
                    {new Date(act.log_date).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PLots Information */}
        <div className="flex flex-col gap-6 h-[380px]">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAEFEA] flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-[#4A5D4E] transition-colors">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">
              Available Lots
            </h3>
            <p className="text-5xl font-serif font-bold text-[#4A5D4E]">
              {isLoading ? "..." : dashboardData?.inventory?.available || 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAEFEA] flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-[#4A5D4E] transition-colors">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">
              Occupied Lots
            </h3>
            <p className="text-5xl font-serif font-bold text-[#313c34]">
              {isLoading ? "..." : dashboardData?.inventory?.occupied || 0}
            </p>
          </div>
        </div>

        {/* Operations Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAEFEA] h-[380px] flex flex-col">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-50">
            <CalendarIcon className="h-4 w-4 text-[#4A5D4E]" />
            <h3 className="font-bold text-[#313c34]">Operations Calendar</h3>
          </div>

          <div className="flex justify-between items-center mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <button className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
            <button className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] gap-y-3 mb-2 flex-1">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
              <div key={d} className="font-bold text-gray-400">
                {d}
              </div>
            ))}

            {(() => {
              const currDate = new Date();
              const year = currDate.getFullYear();
              const month = currDate.getMonth();
              const today = currDate.getDate();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDayOfMonth = new Date(year, month, 1).getDay();

              const intermentDays =
                dashboardData?.calendarEvents?.interments?.map((item: any) =>
                  new Date(item.date).getDate(),
                ) || [];
              const maintenanceDays =
                dashboardData?.calendarEvents?.maintenance?.map((item: any) =>
                  new Date(item.date).getDate(),
                ) || [];
              const paddingDays = Array(firstDayOfMonth).fill(null);
              const monthDays = Array.from(
                { length: daysInMonth },
                (_, i) => i + 1,
              );

              return [...paddingDays, ...monthDays].map((day, i) => {
                if (day === null)
                  return (
                    <div key={`pad-${i}`} className="w-8 h-8 mx-auto"></div>
                  );
                const isToday = day === today;
                const hasInterment = intermentDays.includes(day);
                const hasMaintenance = maintenanceDays.includes(day);

                return (
                  <div
                    key={day}
                    className="flex flex-col items-center justify-center h-8 w-8 mx-auto relative cursor-pointer group"
                  >
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                        isToday
                          ? "bg-[#4A5D4E] text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {day}
                      <div className="absolute -bottom-1 flex gap-0.5">
                        {hasInterment && (
                          <span
                            className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-rose-500"}`}
                          ></span>
                        )}
                        {hasMaintenance && (
                          <span
                            className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-amber-500"}`}
                          ></span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#EAEFEA] overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#EAEFEA] flex justify-between items-center">
            <h3 className="font-bold text-[#313c34] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#4A5D4E]" /> Recent
              Transactions
            </h3>
            <button
              onClick={() => navigate("/transactions")}
              className="text-xs font-bold text-[#4A5D4E] hover:text-[#313c34] transition-colors"
            >
              View Matrix
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F4F6F4] text-[#4A5D4E] text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Date Registered</th>
                  <th className="px-6 py-4">Assigned Plot</th>
                  <th className="px-6 py-4">Installment</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFEA] text-gray-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-gray-400 font-medium text-sm"
                    >
                      Querying data sequence...
                    </td>
                  </tr>
                ) : !dashboardData?.recentTransactions?.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-gray-400 font-medium text-sm"
                    >
                      No transactions compiled.
                    </td>
                  </tr>
                ) : (
                  dashboardData.recentTransactions.map(
                    (row: any, idx: number) => (
                      <tr
                        key={idx}
                        className="hover:bg-[#FDFCF8] transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-[#313c34]">
                          {row.client_name}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500">
                          {row.plot || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#4A5D4E]">
                          ₱{" "}
                          {Number(row.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${
                              row.status?.toLowerCase() === "cleared" ||
                              row.status?.toLowerCase() === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {row.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              navigate(`/clients/${row.client_id}`)
                            }
                            className="text-gray-400 hover:text-[#4A5D4E] p-1.5 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAEFEA] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#313c34] mb-1 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Overdue
              Accounts
            </h3>
            <p className="text-[11px] text-gray-500 mb-5 font-medium">
              Click warning card below for quick client profile redirection.
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <p className="text-sm font-medium text-gray-400 text-center py-8">
                  Evaluating ledgers...
                </p>
              ) : !dashboardData?.overdueNotices?.length ? (
                <div className="text-center py-10 bg-[#FDFCF8] rounded-xl border border-dashed border-[#EAEFEA]">
                  <p className="text-sm font-bold text-[#4A5D4E]">
                    All metrics clear
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    No past due statements found.
                  </p>
                </div>
              ) : (
                dashboardData.overdueNotices.map((notice: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/clients/${notice.client_id}`)}
                    className="bg-[#FFFDF9] border border-amber-200/70 hover:border-amber-400 rounded-xl p-4 shadow-sm transition-all duration-200 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 group-hover:bg-amber-100 transition-colors">
                        <AlertTriangle className="h-4 w-4 animate-pulse" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-[#313c34] text-sm truncate">
                          {notice.client_name}
                        </h4>
                        <p className="text-[10px] text-amber-700 font-medium mt-0.5 bg-amber-50 inline-block px-1.5 py-0.5 rounded">
                          {notice.days_overdue} Days Past Due
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors ml-2 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          {dashboardData?.overdueNotices?.length > 0 && (
            <button
              onClick={() => navigate("/clients")}
              className="w-full mt-5 text-center font-bold text-xs bg-amber-50/50 text-amber-800 hover:bg-amber-100/80 py-3 rounded-xl transition-colors border border-amber-100"
            >
              Review All Delinquent Pipelines
            </button>
          )}

          <MegaForm isOpen={isMegaFormOpen} setIsOpen={setIsMegaFormOpen} />
        </div>
      </div>
    </div>
  );
}
