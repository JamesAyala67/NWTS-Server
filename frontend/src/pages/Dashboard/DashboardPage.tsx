// DashboardPage.tsx
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Plus,
  FileText,
  Calendar as CalendarIcon,
  BarChart2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  ShieldAlert,
  Wrench,
  Download,
  Receipt,
} from "lucide-react";
import MegaForm from "@/components/forms/MegaForm";
import AddClientSheet from "../../components/forms/AddClientSheet";
import { useAddress } from "../../hooks/useAddress";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

const TRANSACTIONS_PER_PAGE = 8;
const TRANSACTIONS_MAX_DAYS = 10;

const fetchDashboardSummary = async () => {
  const { data } = await api.get("/dashboard/summary");
  return data;
};

const searchGlobalMatrix = async (searchTerm: string) => {
  if (!searchTerm) return [];
  const { data } = await api.get(
    `/dashboard/search-all?q=${encodeURIComponent(searchTerm)}`,
  );
  return data;
};

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMegaFormOpen, setIsMegaFormOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  // Transactions pagination
  const [txPage, setTxPage] = useState(1);

  // Add Client Form States
  const [clientForm, setClientForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    contact_number: "",
    civil_status: "Single",
    birthdate: "",
    province: "",
    city: "",
    barangay: "",
    prepared_by: "",
  });
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);

  const queryClient = useQueryClient();

  // PSGC Location States
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");

  const { provinces, cities, barangays } = useAddress(
    selectedProvince,
    selectedCity,
    selectedBarangay,
  );

  const [employees, setEmployees] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Admin User";

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api
      .get("/employees")
      .then(({ data }) => setEmployees(data))
      .catch(console.error);
  }, []);

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

  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["globalMatrixSearch", searchQuery],
    queryFn: () => searchGlobalMatrix(searchQuery),
    enabled: searchQuery.trim().length > 0,
  });

  // Filter transactions to last 10 days, then paginate
  const filteredTransactions = (() => {
    if (!dashboardData?.recentTransactions) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - TRANSACTIONS_MAX_DAYS);
    cutoff.setHours(0, 0, 0, 0);
    return dashboardData.recentTransactions.filter((item: any) => {
      return new Date(item.date) >= cutoff;
    });
  })();

  const totalTxPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE),
  );
  const paginatedTransactions = filteredTransactions.slice(
    (txPage - 1) * TRANSACTIONS_PER_PAGE,
    txPage * TRANSACTIONS_PER_PAGE,
  );

  const handleExportExcelReport = async () => {
    try {
      const response = await api.get("/reports/export-excel", {
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
      alert(
        "Backend route not found. Ensure /api/reports/export-excel is registered.",
      );
    }
  };

  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClient(true);
    try {
      const employeeId = localStorage.getItem("employee_id") || "EMP-001";
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const randomNumbers = Math.floor(10000 + Math.random() * 90000);
      const generatedClientId = `${currentYear}-${randomNumbers}`;

      const selectedProvName =
        provinces?.find((p: any) => p.code === selectedProvince)?.name || "";
      const selectedCityName =
        cities?.find((c: any) => c.code === selectedCity)?.name || "";
      const selectedBrgyName =
        barangays?.find((b: any) => b.code === selectedBarangay)?.name || "";

      const payload = {
        client_id: generatedClientId,
        ...clientForm,
        province: selectedProvName,
        city: selectedCityName,
        barangay: selectedBrgyName,
        created_at: new Date().toISOString(),
        employee_id: employeeId,
      };

      await api.post("/clients", payload);
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      alert("Client profile registered successfully!");

      setIsAddClientOpen(false);
      setClientForm({
        first_name: "",
        last_name: "",
        middle_name: "",
        contact_number: "",
        civil_status: "Single",
        birthdate: "",
        province: "",
        city: "",
        barangay: "",
        prepared_by: "",
      });
      setSelectedProvince("");
      setSelectedCity("");
      setSelectedBarangay("");
    } catch (err) {
      console.error("Failed to add client profile", err);
      alert("Failed to create client profile. Please try again.");
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handlePrevMonth = () => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1),
    );
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
    <div className="w-full bg-[#FDFCF8] font-sans p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Header with Search */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-3xl font-serif font-bold text-[#313c34]">
              Good afternoon, {userName}!
            </h2>
            <p className="text-[#4A5D4E]/80 text-sm mt-0.5 font-medium">
              Here's what's happening at New Heaven's Way today.
            </p>
          </div>

          <div className="hidden sm:flex gap-3 shrink-0">
            <div className="bg-white border border-[#EAEFEA] rounded-2xl p-3 px-4 flex items-center gap-3 shadow-sm">
              <CalendarIcon className="text-[#4A5D4E] h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#313c34] whitespace-nowrap">
                  {formattedDate}
                </p>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  {formattedDay}
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#EAEFEA] rounded-2xl p-3 px-4 flex items-center gap-3 shadow-sm">
              <Clock className="text-[#4A5D4E] h-5 w-5 shrink-0" />
              <p className="text-base font-bold text-[#313c34] tracking-wide font-mono whitespace-nowrap">
                {formattedTime}
              </p>
            </div>
          </div>
        </div>

        <div ref={dropdownRef} className="relative w-full z-40">
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
              placeholder="Search clients, PR-, SI-, or interments..."
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
                      if (result.url) {
                        navigate(result.url);
                      } else {
                        navigate(`/clients/${result.client_id}`);
                      }
                    }}
                    className="p-3.5 px-5 hover:bg-[#F4F6F4] cursor-pointer transition-colors flex justify-between items-start gap-4"
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-[#313c34] truncate">
                        {result.name}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-mono truncate">
                        {result.context_details}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shrink-0 border ${
                        result.match_type === "Client Base"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : result.match_type === "Transaction Ledger"
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
      </header>

      {/* Quick Access */}
      <div className="bg-white rounded-2xl p-2.5 flex flex-wrap items-center gap-y-2 shadow-sm border border-[#EAEFEA] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <h3 className="font-bold text-[#313c34] px-4 whitespace-nowrap text-xs uppercase tracking-wider">
          Quick Access
        </h3>
        <div className="h-8 w-[1px] bg-[#EAEFEA] hidden sm:block mx-1"></div>
        <div className="flex flex-wrap gap-2 pl-2 sm:pl-0">
          <button
            onClick={() => setIsAddClientOpen(true)}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-white hover:bg-[#4A5D4E] transition-all bg-[#FDFCF8] px-4 py-2.5 rounded-xl border border-[#EAEFEA] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Client
          </button>
          <button
            onClick={() => setIsMegaFormOpen(true)}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-white hover:bg-[#4A5D4E] transition-all bg-[#FDFCF8] px-4 py-2.5 rounded-xl border border-[#EAEFEA] whitespace-nowrap"
          >
            <FileText className="h-4 w-4" /> Mega Form (PAF)
          </button>
          <button
            onClick={() => navigate("/plots/map")}
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-white hover:bg-[#4A5D4E] transition-all bg-[#FDFCF8] px-4 py-2.5 rounded-xl border border-[#EAEFEA] whitespace-nowrap"
          >
            <BarChart2 className="h-4 w-4" /> View Plots Map
          </button>
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
        {/* ── Recent Activities (mobile-fixed) ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAEFEA] flex flex-col min-h-[300px] lg:h-[380px]">
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

          <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {isLoading ? (
              <p className="text-sm font-medium text-gray-400 text-center mt-10">
                Syncing feeds...
              </p>
            ) : !dashboardData?.recentActivity?.length ? (
              <p className="text-sm font-medium text-gray-400 text-center mt-10">
                No recent logs recorded.
              </p>
            ) : (
              dashboardData.recentActivity
                .slice(0, 5)
                .map((act: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 min-w-0">
                    {/* Icon — never shrinks */}
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
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

                    {/* Text block — takes remaining space, truncates */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 break-words">
                        {act.description}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium truncate">
                          By {act.operator || "System"}
                        </p>
                        <span className="text-gray-400 text-[10px] whitespace-nowrap font-medium shrink-0">
                          {new Date(act.log_date).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Plots Information */}
        <div className="flex flex-col gap-6 lg:h-[380px]">
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

        {/* Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAEFEA] min-h-[340px] lg:h-[380px] flex flex-col">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#4A5D4E]" />
              <h3 className="font-bold text-[#313c34]">Operations & Dues</h3>
            </div>
            <div className="flex gap-3 text-[9px] font-bold text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>{" "}
                INT
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{" "}
                DUE
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              {calendarDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] gap-y-2 flex-1 items-center">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
              <div key={d} className="font-bold text-gray-400">
                {d}
              </div>
            ))}

            {(() => {
              const year = calendarDate.getFullYear();
              const month = calendarDate.getMonth();
              const todayObj = new Date();
              const isCurrentMonthMatch =
                todayObj.getFullYear() === year &&
                todayObj.getMonth() === month;
              const todayDate = todayObj.getDate();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDayOfMonth = new Date(year, month, 1).getDay();

              const getEventsForDay = (events: any[], dayNum: number) => {
                if (!events) return [];
                return events.filter((evt: any) => {
                  const d = new Date(evt.date);
                  return (
                    d.getFullYear() === year &&
                    d.getMonth() === month &&
                    d.getDate() === dayNum
                  );
                });
              };

              const paddingDays = Array(firstDayOfMonth).fill(null);
              const monthDays = Array.from(
                { length: daysInMonth },
                (_, i) => i + 1,
              );

              return [...paddingDays, ...monthDays].map((day, i) => {
                if (day === null) {
                  return (
                    <div key={`pad-${i}`} className="w-7 h-7 mx-auto"></div>
                  );
                }

                const isToday = isCurrentMonthMatch && day === todayDate;
                const intermentsToday = getEventsForDay(
                  dashboardData?.calendarEvents?.interments,
                  day,
                );
                const dueDatesToday = getEventsForDay(
                  dashboardData?.calendarEvents?.due_dates,
                  day,
                );
                const hasInterment = intermentsToday.length > 0;
                const hasDueDate = dueDatesToday.length > 0;

                return (
                  <div
                    key={`day-${day}`}
                    className="flex flex-col items-center justify-center h-7 w-7 mx-auto relative cursor-pointer group"
                  >
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                        isToday
                          ? "bg-[#4A5D4E] text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {day}
                      <div className="absolute -bottom-0.5 flex gap-0.5 justify-center w-full">
                        {hasInterment && (
                          <span
                            className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-rose-500"}`}
                          ></span>
                        )}
                        {hasDueDate && (
                          <span
                            className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-indigo-500"}`}
                          ></span>
                        )}
                      </div>
                    </div>

                    {(hasInterment || hasDueDate) && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#313c34] text-white text-[10px] rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-xl space-y-2">
                        {hasInterment && (
                          <div>
                            <p className="font-bold text-rose-300 mb-1 border-b border-gray-600 pb-0.5 uppercase tracking-wider text-[9px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>{" "}
                              Interments
                            </p>
                            <ul className="text-left space-y-0.5 max-h-16 overflow-y-auto custom-scrollbar">
                              {intermentsToday.map(
                                (intEvt: any, idx: number) => (
                                  <li
                                    key={idx}
                                    className="truncate font-medium"
                                  >
                                    {intEvt.deceased_name ||
                                      intEvt.client_name ||
                                      "Unknown Deceased"}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                        {hasDueDate && (
                          <div>
                            <p className="font-bold text-indigo-300 mb-1 border-b border-gray-600 pb-0.5 uppercase tracking-wider text-[9px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{" "}
                              Accounts Due
                            </p>
                            <ul className="text-left space-y-0.5 max-h-16 overflow-y-auto custom-scrollbar">
                              {dueDatesToday.map((dueEvt: any, idx: number) => (
                                <li key={idx} className="truncate font-medium">
                                  {dueEvt.client_name ||
                                    dueEvt.name ||
                                    "Unknown Client"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[5px] border-transparent border-t-[#313c34]"></div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Recent Transactions — last 10 days, 8 per page ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#EAEFEA] overflow-hidden flex flex-col min-h-[320px]">
          <div className="p-5 border-b border-[#EAEFEA] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#4A5D4E]" />
              <h3 className="font-bold text-[#313c34]">
                Recent Transactions & Payments
              </h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Last {TRANSACTIONS_MAX_DAYS} days
            </span>
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F4F6F4] text-[#4A5D4E] text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">PR # / SI #</th>
                  <th className="px-6 py-4">Client / Plot</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFEA] text-gray-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-gray-400 font-medium text-sm"
                    >
                      Querying data sequence...
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-gray-400 font-medium text-sm"
                    >
                      No transactions in the last {TRANSACTIONS_MAX_DAYS} days.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((item: any, idx: number) => {
                    const isPayment = item.record_type === "payment";
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors cursor-pointer ${isPayment ? "bg-[#fcfcfc]/60 hover:bg-[#f3f5f3]" : "hover:bg-[#FDFCF8]"}`}
                        onClick={() => navigate(`/clients/${item.client_id}`)}
                      >
                        <td className="px-6 py-4 font-medium text-xs text-gray-500">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`font-bold ${isPayment ? "text-emerald-700" : "text-[#313c34]"}`}
                            >
                              {item.professional_receipt || "N/A"}
                            </span>
                            {!isPayment && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 w-max font-mono">
                                {item.sales_invoice || "N/A"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#313c34] text-xs">
                              {item.client_name}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              {item.plot || "Unassigned"} (
                              {item.plot_type || "N/A"})
                            </span>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-bold ${isPayment ? "text-emerald-600" : "text-[#4A5D4E]"}`}
                        >
                          ₱{" "}
                          {Number(item.amount || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {isPayment ? (
                            <span className="text-gray-300 italic text-xs">
                              —
                            </span>
                          ) : (
                            <span className="text-orange-600">
                              ₱{" "}
                              {Number(
                                item.remaining_balance || 0,
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${
                              isPayment ||
                              item.status?.toLowerCase() === "cleared" ||
                              item.status?.toLowerCase() === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {item.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {!isLoading && filteredTransactions.length > 0 && (
            <div className="px-6 py-3 border-t border-[#EAEFEA] flex items-center justify-between bg-[#fafaf8]">
              <p className="text-[11px] text-gray-400 font-medium">
                Showing{" "}
                <span className="font-bold text-gray-600">
                  {(txPage - 1) * TRANSACTIONS_PER_PAGE + 1}–
                  {Math.min(
                    txPage * TRANSACTIONS_PER_PAGE,
                    filteredTransactions.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-600">
                  {filteredTransactions.length}
                </span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page number pills */}
                {Array.from({ length: totalTxPages }, (_, i) => i + 1).map(
                  (pg) => (
                    <button
                      key={pg}
                      onClick={() => setTxPage(pg)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                        pg === txPage
                          ? "bg-[#4A5D4E] text-white"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {pg}
                    </button>
                  ),
                )}

                <button
                  onClick={() =>
                    setTxPage((p) => Math.min(totalTxPages, p + 1))
                  }
                  disabled={txPage === totalTxPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Overdue Accounts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EAEFEA] flex flex-col justify-between min-h-[320px]">
          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="font-bold text-[#313c34] mb-1 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Overdue
              Accounts
            </h3>
            <p className="text-[11px] text-gray-500 mb-4 font-medium">
              Hover over a card to reveal its PR/SI identifiers.
            </p>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar max-h-[220px]">
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
                    className="bg-[#FFFDF9] border border-amber-200/70 hover:border-amber-400 rounded-xl p-4 shadow-sm transition-all duration-300 cursor-pointer group flex flex-col"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 group-hover:bg-amber-100 transition-colors">
                          <AlertTriangle className="h-4 w-4 animate-pulse" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-[#313c34] text-sm truncate">
                            {notice.client_name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <p className="text-[10px] text-amber-700 font-medium bg-amber-50 inline-block px-1.5 py-0.5 rounded">
                              {notice.days_overdue} Days Past Due
                            </p>
                            {(notice.remaining_balance ||
                              notice.amount_due) && (
                              <span className="text-[11px] font-bold text-rose-600">
                                ₱
                                {Number(
                                  notice.remaining_balance || notice.amount_due,
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors shrink-0" />
                    </div>

                    <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-12 group-hover:opacity-100 group-hover:mt-3 transition-all duration-300 ease-in-out flex items-center gap-2 border-t border-dashed border-transparent group-hover:border-amber-100 group-hover:pt-2 text-[10px] font-mono text-gray-500">
                      <Receipt className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">
                        INV:{" "}
                        <strong className="text-gray-700">
                          {notice.si_number ||
                            notice.sales_invoice ||
                            "SI-XXXXXX"}
                        </strong>
                      </span>
                      <span className="text-gray-300 shrink-0">|</span>
                      <span className="truncate">
                        REC:{" "}
                        <strong className="text-gray-700">
                          {notice.pr_number ||
                            notice.professional_receipt ||
                            "PR-XXXX"}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <MegaForm isOpen={isMegaFormOpen} setIsOpen={setIsMegaFormOpen} />

      <AddClientSheet
        isOpen={isAddClientOpen}
        setIsOpen={setIsAddClientOpen}
        formData={clientForm}
        setFormData={setClientForm}
        handleAddClient={handleAddClientSubmit}
        provinces={provinces}
        cities={cities}
        barangays={barangays}
        selectedProvince={selectedProvince}
        setSelectedProvince={setSelectedProvince}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedBarangay={selectedBarangay}
        setSelectedBarangay={setSelectedBarangay}
        isPending={isSubmittingClient}
        employees={employees}
      />
    </div>
  );
}
