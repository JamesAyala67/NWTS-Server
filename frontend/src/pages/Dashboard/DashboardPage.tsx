import { useState, useEffect } from "react";
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
} from "lucide-react";

import Sidebar from "../../components/custom/Sidebar";

// --- NEW: Axios fetcher function ---
const fetchDashboardSummary = async () => {
  const { data } = await axios.get(
    "http://localhost:3000/api/dashboard/summary",
  );
  return data;
};

export default function Dashboard() {
  const [time, setTime] = useState(new Date());

  const navigate = useNavigate();

  const currentPath = window.location.pathname; // Gets the actual URL path
  const userName = localStorage.getItem("userName") || "Admin User";
  const userRole = localStorage.getItem("userRole") || "Admin";

  // Real-time clock updater (useEffect is still fine for this specific UI tick!)
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- NEW: TanStack Query hook ---
  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: fetchDashboardSummary,
  });

  // Format helpers
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-[#FDFCF8] font-sans overflow-hidden">
      {/* --- SIDEBAR (Flush to the edge) --- */}
      <Sidebar
        userRole={userRole}
        userName={userName}
        activePath={currentPath}
        onNavigate={(path) => navigate(path)} // Uses React Router to change pages without reloading!
        onLogout={handleLogout}
      />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#313c34]">
              Good afternoon, {userName}!
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Here's what's happening today.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-3 px-4 flex items-center gap-3 shadow-sm">
              <CalendarIcon className="text-gray-400 h-5 w-5" />
              <div>
                <p className="text-sm font-bold text-[#313c34]">
                  {formattedDate}
                </p>
                <p className="text-xs text-gray-500">{formattedDay}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 px-4 flex items-center gap-3 shadow-sm">
              <Clock className="text-gray-400 h-5 w-5" />
              <p className="text-lg font-bold text-[#313c34] tracking-wide">
                {formattedTime}
              </p>
            </div>
          </div>
        </header>

        {/* Quick Access */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-6 shadow-sm border border-gray-100 mb-8 overflow-x-auto">
          <h3 className="font-bold text-[#313c34] ml-2 whitespace-nowrap">
            Quick Access
          </h3>
          <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>

          {/* --- NEW: Added onClick routes to all buttons --- */}
          <button
            onClick={() => navigate("/clients")}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#4A5D4E] transition bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 hover:border-[#4A5D4E] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Add Client
          </button>

          <button
            onClick={() => navigate("/transactions")}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#4A5D4E] transition bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 hover:border-[#4A5D4E] whitespace-nowrap"
          >
            <FileText className="h-4 w-4" /> New Transaction
          </button>

          <button
            onClick={() => navigate("/calendar")}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#4A5D4E] transition bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 hover:border-[#4A5D4E] whitespace-nowrap"
          >
            <CalendarIcon className="h-4 w-4" /> View Calendar
          </button>

          <button
            onClick={() => navigate("/reports")}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#4A5D4E] transition bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 hover:border-[#4A5D4E] whitespace-nowrap"
          >
            <BarChart2 className="h-4 w-4" /> Generate Report
          </button>
        </div>

        {/* Handle Error State Early */}
        {isError && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>
              Failed to load dashboard data. Please make sure the backend server
              is running.
            </p>
          </div>
        )}

        {/* Middle Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-[#313c34] flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" /> Recent Activity
              </h3>
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-[#4A5D4E]"
              >
                View All
              </a>
            </div>
            <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
              TODAY
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "System Login",
                  ref: userName,
                  time: "Just now",
                  color: "bg-green-500",
                },
                {
                  title: "Dashboard Accessed",
                  ref: "System",
                  time: "1 min ago",
                  color: "bg-green-500",
                },
              ].map((act, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${act.color}`}></div>
                    <span className="font-medium text-gray-700">
                      {act.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 w-24 text-right truncate">
                      {act.ref}
                    </span>
                    <span className="text-gray-400 text-xs w-16 text-right">
                      {act.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE INVENTORY SUMMARY */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col justify-center relative overflow-hidden">
              <h3 className="font-bold text-[#313c34] mb-2 z-10">
                Available Lots
              </h3>
              <p className="text-5xl font-bold text-[#4A5D4E] z-10">
                {isLoading ? "..." : dashboardData?.inventory?.available || 0}
              </p>
              <div className="absolute right-4 bottom-4 opacity-10">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.69 2 6 4.69 6 8v14h12V8c0-3.31-2.69-6-6-6z" />
                </svg>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col justify-center relative overflow-hidden">
              <h3 className="font-bold text-[#313c34] mb-2 z-10">
                Occupied Lots
              </h3>
              <p className="text-5xl font-bold text-[#4A5D4E] z-10">
                {isLoading ? "..." : dashboardData?.inventory?.occupied || 0}
              </p>
              <div className="absolute right-4 bottom-4 opacity-10">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.69 2 6 4.69 6 8v14h12V8c0-3.31-2.69-6-6-6zM11 11H8v2h3v3h2v-3h3v-2h-3V8h-2v3z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <CalendarIcon className="h-4 w-4 text-[#4A5D4E]" />
              <h3 className="font-bold text-[#313c34]">Scheduled Interments</h3>
            </div>

            {/* Dynamic Month/Year Header */}
            <div className="flex justify-between items-center mb-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
              <ChevronLeft className="h-4 w-4 cursor-pointer text-gray-400 hover:text-[#4A5D4E] transition" />
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
              <ChevronRight className="h-4 w-4 cursor-pointer text-gray-400 hover:text-[#4A5D4E] transition" />
            </div>

            {/* Days of the Week Header */}
            <div className="grid grid-cols-7 text-center text-[10px] gap-y-4 mb-2">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                <div key={d} className="font-bold text-gray-400">
                  {d}
                </div>
              ))}

              {/* JavaScript Magic: Calculate accurate dates & interments */}
              {(() => {
                const currDate = new Date();
                const year = currDate.getFullYear();
                const month = currDate.getMonth();
                const today = currDate.getDate();

                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDayOfMonth = new Date(year, month, 1).getDay();

                // Extract just the day number (e.g., 15) from our database records
                const intermentDays =
                  dashboardData?.interments?.map(
                    (item: any) => new Date(item.date_of_interment).getDate(), // <-- Updated column name!
                  ) || [];

                const paddingDays = Array(firstDayOfMonth).fill(null);
                const monthDays = Array.from(
                  { length: daysInMonth },
                  (_, i) => i + 1,
                );

                return [...paddingDays, ...monthDays].map((day, i) => {
                  if (day === null) {
                    return (
                      <div key={`pad-${i}`} className="w-8 h-8 mx-auto"></div>
                    );
                  }

                  const isToday = day === today;
                  const hasInterment = intermentDays.includes(day);

                  return (
                    <div
                      key={day}
                      className="flex flex-col items-center justify-center h-10 w-10 mx-auto cursor-pointer group"
                    >
                      <div
                        className={`
                         w-8 h-8 flex items-center justify-center rounded-full transition text-xs relative
                         ${
                           isToday
                             ? "bg-[#4A5D4E] text-white font-bold shadow-md"
                             : hasInterment
                               ? "bg-[#f9f8f3] text-[#4A5D4E] font-bold border border-[#e2dcc8]"
                               : "text-gray-700 hover:bg-gray-100 font-medium"
                         }
                       `}
                      >
                        {day}

                        {/* Little indicator dot under the number if an interment is scheduled */}
                        {hasInterment && isToday && (
                          <span className="absolute -bottom-1 w-1.5 h-1.5 border-[red] bg-[red] rounded-full"></span>
                        )}
                        {hasInterment && !isToday && (
                          <span className="absolute -bottom-1 w-1.5 h-1.5 bg-[#4A5D4E] rounded-full"></span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#4A5D4E] rounded-full"></div> Today
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 border border-[red] bg-[red] rounded-full"></div>{" "}
                Interment
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* LIVE RECENT TRANSACTIONS TABLE */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FDFCF8]">
              <h3 className="font-bold text-[#313c34] flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" /> Recent
                Transactions
              </h3>
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-[#4A5D4E]"
              >
                View All
              </a>
            </div>
            <div className="p-0 overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#f9f8f3]/50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Client Name</th>
                    <th className="px-6 py-4 font-semibold">Date Added</th>
                    <th className="px-6 py-4 font-semibold">Plot</th>
                    <th className="px-6 py-4 font-semibold">Monthly Payment</th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-400"
                      >
                        Loading transactions...
                      </td>
                    </tr>
                  ) : !dashboardData?.recentTransactions?.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-400"
                      >
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.recentTransactions.map(
                      (row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {row.client_name}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {row.plot || "Unassigned"}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            ₱
                            {Number(row.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                row.status?.toLowerCase() === "cleared" ||
                                row.status?.toLowerCase() === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {row.status || "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="text-gray-400 hover:text-[#4A5D4E] transition p-1 bg-gray-100 rounded hover:bg-gray-200">
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

          {/* Notices */}
          <div className="bg-[#fcf8ef] rounded-2xl p-6 shadow-sm border border-[#f5e8cd] flex flex-col">
            <h3 className="font-bold text-[#313c34] mb-6 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Notices
            </h3>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {isLoading ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Checking for notices...
                </p>
              ) : !dashboardData?.notices?.length ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    All caught up!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    No overdue payments found.
                  </p>
                </div>
              ) : (
                dashboardData.notices.map((notice: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-[#fdfcf8] border border-[#f5e8cd] rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 text-sm">
                        {notice.client_name}
                      </h4>
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                        Overdue
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Remaining Balance:{" "}
                      <span className="font-bold text-gray-800">
                        ₱
                        {Number(notice.remaining_balance).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </p>
                    <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-3">
                      <span className="text-gray-500">
                        Since:{" "}
                        {new Date(notice.date_created).toLocaleDateString()}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#4A5D4E] transition" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {dashboardData?.notices?.length > 0 && (
              <a
                href="/clients"
                className="mt-6 text-sm font-bold text-gray-600 hover:text-[#4A5D4E] flex items-center gap-2 justify-center bg-white py-2 rounded-lg border border-[#f5e8cd]"
              >
                View All Accounts
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
