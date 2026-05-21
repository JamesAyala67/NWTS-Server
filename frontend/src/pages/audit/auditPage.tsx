import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Trash2,
  UserCheck,
  Upload,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
} from "lucide-react";

interface AuditLog {
  audit_id: string;
  employee_id: string;
  employee_name: string;
  action_type: string;
  action_description: string;
  date_time: string;
}

interface DeletedRecord {
  id: string;
  record_id: string;
  record_type: string;
  record_name: string;
  deleted_by_name: string;
  deleted_by_id: string;
  deleted_at: string;
}

interface Stats {
  totalLogs: number;
  deletedRecords: number;
  activeUsers: number;
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

export default function AuditLogs() {
  // State Management
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLogs: 0,
    deletedRecords: 0,
    activeUsers: 0,
  });
  const [activeTab, setActiveTab] = useState("Activity Logs");
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("All Actions");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Recovery Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
  const [drawerTab, setDrawerTab] = useState("All");
  const [drawerSearch, setDrawerSearch] = useState("");

  // Helper to safely parse dates without crashing date-fns if undefined/null
  const safeFormatDate = (dateString: string, formatStr: string) => {
    try {
      if (!dateString) return "N/A";
      return format(new Date(dateString), formatStr);
    } catch (e) {
      return "N/A";
    }
  };

  // Style helper mapping icons and color classes to action types
  const getActionStyles = (type: string) => {
    const lowerType = type ? type.toLowerCase() : "";
    if (lowerType.includes("delete") || lowerType.includes("remove")) {
      return {
        bg: "bg-red-50 text-red-700 border-red-100",
        dotBg: "bg-red-500",
        icon: <Trash2 className="w-4 h-4 text-white" />,
      };
    }
    if (
      lowerType.includes("login") ||
      lowerType.includes("logout") ||
      lowerType.includes("add") ||
      lowerType.includes("link")
    ) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
        dotBg: "bg-emerald-500",
        icon: <UserCheck className="w-4 h-4 text-white" />,
      };
    }
    if (lowerType.includes("upload")) {
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-100",
        dotBg: "bg-blue-500",
        icon: <Upload className="w-4 h-4 text-white" />,
      };
    }
    return {
      bg: "bg-amber-50 text-amber-700 border-amber-100",
      dotBg: "bg-amber-500",
      icon: <FileText className="w-4 h-4 text-white" />,
    };
  };

  // Fetch core table logs & calculations
  const fetchLogsData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get(`${API_BASE_URL}/audit-logs`, {
          params: {
            page: currentPage,
            search,
            action_type: actionType,
            tab: activeTab,
          },
        }),
        api.get(`${API_BASE_URL}/audit-logs/summary-stats`),
      ]);

      setLogs(logsRes.data.logs || []);
      setTotalPages(logsRes.data.pagination?.totalPages || 1);
      setTotalLogsCount(logsRes.data.pagination?.totalLogs || 0);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error collecting system log adjustments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items inside soft-delete drawer
  const fetchDeletedRecords = async () => {
    try {
      const res = await api.get(`${API_BASE_URL}/audit-logs/deleted-records`, {
        params: { category: drawerTab, search: drawerSearch },
      });
      setDeletedRecords(res.data || []);
    } catch (err) {
      console.error("Error sourcing deleted archives:", err);
    }
  };

  useEffect(() => {
    fetchLogsData();
  }, [currentPage, activeTab, actionType, search]);

  useEffect(() => {
    if (isDrawerOpen) fetchDeletedRecords();
  }, [isDrawerOpen, drawerTab, drawerSearch]);

  const handleRestore = async (record_id: string, record_type: string) => {
    if (
      !confirm(`Are you sure you want to restore this ${record_type} record?`)
    )
      return;
    try {
      await api.post(`${API_BASE_URL}/audit-logs/restore`, {
        record_id,
        record_type,
      });
      fetchDeletedRecords();
      fetchLogsData();
    } catch (err) {
      alert("Error restoring file asset pipeline structural references.");
    }
  };

  return (
    <div className="p-6 bg-[#FAF9F5] min-h-screen text-slate-800 relative overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-[#2C3E2B] font-bold">
            Operations Center
          </h1>
          <p className="text-sm text-slate-500">
            Track system activity, and recover deleted data.
          </p>
        </div>
      </div>

      {/* Summary Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Logs
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {stats.totalLogs.toLocaleString()}
          </p>
        </div>
        <div
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition"
          onClick={() => setIsDrawerOpen(true)}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Deleted Records
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {stats.deletedRecords}
          </p>
          <p>
            <span className="text-xs text-slate-500 underline font-medium">
              Recoverable
            </span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Users
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {stats.activeUsers}
          </p>
        </div>
      </div>

      {/* Navigation Menu Tabs */}
      <div className="border-b border-slate-200 mb-5 flex gap-6">
        {["Activity Logs", "Deleted Records", "System Events"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === tab
                ? "text-[#2C3E2B] font-bold"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C3E2B]" />
            )}
          </button>
        ))}
      </div>

      {/* Interactive Utility */}
      <div className="bg-white p-4 rounded-t-xl border-x border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by keyword, ID, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative">
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-slate-200 text-sm pl-3 pr-8 py-2 rounded-lg font-medium text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All Actions">All Actions</option>
              <option value="EMPLOYEE LOGIN">Employee Login</option>
              <option value="EMPLOYEE LOGOUT">Employee Logout</option>
              <option value="DELETE FILE">Delete File</option>
              <option value="SOFT-DELETED CLIENT">Soft-Deleted Client</option>
              <option value="REMOVE CO-PURCHASER">Remove Co-Purchaser</option>
              <option value="REMOVE CONTACT PERSON">
                Remove Contact Person
              </option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Timeline*/}
      <div className="bg-white rounded-b-xl border-x border-b border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm font-medium text-slate-400">
            Loading operational events...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm font-medium text-slate-400">
            No events matched your current search parameters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const styles = getActionStyles(log.action_type);
              return (
                <div
                  key={log.audit_id}
                  className="p-4 flex items-start justify-between hover:bg-slate-50/70 transition group relative"
                >
                  <div className="flex items-start gap-4">
                    {/* Timestamp */}
                    <div className="w-28 flex-shrink-0 text-xs text-slate-400 font-medium pt-1">
                      <div>{safeFormatDate(log.date_time, "MMM dd, yyyy")}</div>
                      <div>{safeFormatDate(log.date_time, "hh:mm a")}</div>
                    </div>

                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full ${styles.dotBg} flex items-center justify-center shadow-sm z-10`}
                      >
                        {styles.icon}
                      </div>
                      <div className="absolute top-8 bottom-[-20px] w-[2px] bg-slate-100 group-last:hidden" />
                    </div>

                    {/* Action Labels */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${styles.bg}`}
                        >
                          {log.action_type
                            ? log.action_type.replace(/_/g, " ")
                            : "UNKNOWN"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 max-w-2xl">
                        {log.action_description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {log.employee_id || "EMP-4001"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 cursor-pointer transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Selector Pagination */}
        <div className="border-t border-slate-200 p-4 flex items-center justify-between text-sm font-medium text-slate-500">
          <div>
            Showing{" "}
            <span className="text-slate-800">{(currentPage - 1) * 10 + 1}</span>{" "}
            to{" "}
            <span className="text-slate-800">
              {Math.min(currentPage * 10, totalLogsCount)}
            </span>{" "}
            of <span className="text-slate-800">{totalLogsCount}</span> logs
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                    currentPage === pageNum
                      ? "bg-[#2C3E2B] text-white border-[#2C3E2B]"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {pageNum}
                </button>
              ),
            )}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recovery Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Heading */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Deleted Records
              </h2>
              <p className="text-xs text-slate-400">
                Recover soft-deleted data elements.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Category*/}
        <div className="px-4 pt-3 border-b border-slate-100 flex gap-4 text-xs font-bold text-slate-400">
          {["All", "Files", "Clients", "Contacts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setDrawerTab(tab)}
              className={`pb-2 relative ${drawerTab === tab ? "text-slate-800" : "hover:text-slate-600"}`}
            >
              {tab}
              {drawerTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800" />
              )}
            </button>
          ))}
        </div>

        {/* Isolated Drawer */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deleted records..."
              value={drawerSearch}
              onChange={(e) => setDrawerSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:bg-white bg-slate-50"
            />
          </div>
        </div>

        {/* Dynamic Populated Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {deletedRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No files currently staged for removal in this scope.
            </div>
          ) : (
            deletedRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 mt-0.5">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">
                      {rec.record_name}{" "}
                      <span className="font-normal text-slate-400">
                        ({rec.record_id})
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Deleted by:{" "}
                      <span className="text-slate-600 font-medium">
                        {rec.deleted_by_name}
                      </span>
                    </p>
                    <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.2 rounded font-mono font-bold mt-1 inline-block">
                      {rec.deleted_by_id}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {safeFormatDate(rec.deleted_at, "MMM dd, yyyy")}
                    <br />
                    {safeFormatDate(rec.deleted_at, "hh:mm a")}
                  </span>
                  <button
                    onClick={() =>
                      handleRestore(rec.record_id, rec.record_type)
                    }
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 border border-emerald-200 rounded-lg flex items-center gap-1 transition shadow-sm"
                  >
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
