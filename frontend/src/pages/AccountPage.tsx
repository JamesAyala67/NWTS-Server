// pages/account/AccountPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Users,
  UserCheck,
  UserMinus,
  Shield,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EmployeeModal from "../components/modal/EmployeeModal";

// Axios Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

export default function AccountPage() {
  const queryClient = useQueryClient();
  const currentUserRole = localStorage.getItem("userRole") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Pagination State (Max 10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Snap back to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Fetching
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data;
    },
  });

  // ONLY Admins can be on this page, it executes instantly!
  const handleSoftDelete = useMutation({
    mutationFn: async (empId: string) => {
      await api.post(`/employees/${empId}/soft-delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      alert("Employee deactivated successfully!");
    },
  });

  const handleCreateNew = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (emp: any) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const stats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter((e: any) => e.is_deleted === 0).length,
      inactive: employees.filter((e: any) => e.is_deleted === 1).length,
      admins: employees.filter((e: any) => e.role === "Admin").length,
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: any) => {
      const matchesSearch =
        `${emp.first_name} ${emp.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        emp.username.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "All Roles" || emp.role === roleFilter;

      const statusString = emp.is_deleted === 1 ? "Inactive" : "Active";
      const matchesStatus =
        statusFilter === "All Status" || statusString === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, searchTerm, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  const startItemIndex =
    filteredEmployees.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItemIndex = Math.min(
    currentPage * itemsPerPage,
    filteredEmployees.length,
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        Syncing system accounts...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#2A3B2E]">
            Account Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system user accounts and access permissions.
          </p>
        </div>

        <Button
          onClick={handleCreateNew}
          className="bg-[#4A5D4E] hover:bg-[#3b4b3e] text-white flex items-center gap-2 h-11 px-5 rounded-md shadow-sm font-medium w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" /> Create New Account
        </Button>
      </div>

      {/* State Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#E8F0EA] flex items-center justify-center text-[#4A5D4E]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
              Total Accounts
            </p>
            <p className="text-2xl font-bold text-[#2A3B2E] leading-tight">
              {stats.total}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">All user accounts</p>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
              Active Accounts
            </p>
            <p className="text-2xl font-bold text-[#2A3B2E] leading-tight">
              {stats.active}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Currently operational
            </p>
          </div>
        </div>

        {/* Inactive Accounts */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <UserMinus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
              Inactive Accounts
            </p>
            <p className="text-2xl font-bold text-[#2A3B2E] leading-tight">
              {stats.inactive}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Soft deleted</p>
          </div>
        </div>

        {/* Administrators */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
              Administrators
            </p>
            <p className="text-2xl font-bold text-[#2A3B2E] leading-tight">
              {stats.admins}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Admin privilege level
            </p>
          </div>
        </div>
      </div>

      {/* Filters & tables */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full md:w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full md:w-auto bg-white border border-gray-200 rounded-md text-sm px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
            >
              <option value="All Roles">All Roles</option>
              <option value="Admin">Administrator</option>
              <option value="Staff">Staff</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto bg-white border border-gray-200 rounded-md text-sm px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-white text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedEmployees.map((emp: any) => {
                const initials = `${emp.first_name?.charAt(0) || ""}${emp.last_name?.charAt(0) || ""}`;
                const isActive = emp.is_deleted === 0;
                const roleDisplay =
                  emp.role === "Admin" ? "Administrator" : "Staff";

                return (
                  <tr
                    key={emp.employee_id}
                    className="hover:bg-gray-50/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#E8F0EA] text-[#4A5D4E] flex items-center justify-center font-bold text-sm tracking-wide">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {emp.first_name} {emp.last_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-md ${
                          emp.role === "Admin"
                            ? "bg-[#E8F0EA] text-[#4A5D4E]"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {roleDisplay}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {emp.contact_number || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
                        ></span>
                        {isActive ? "Active" : "Inactive"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-gray-200 text-gray-500 hover:text-[#4A5D4E] hover:bg-[#E8F0EA] hover:border-[#4A5D4E] shadow-sm transition-colors"
                          onClick={() => handleEdit(emp)}
                          title="Edit Account"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        {isActive ? (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm transition-colors"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to deactivate ${emp.first_name}?`,
                                )
                              ) {
                                handleSoftDelete.mutate(emp.employee_id);
                              }
                            }}
                            title="Deactivate Account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 bg-gray-50/30"
                  >
                    No accounts found matching your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
          <p className="text-gray-500 hidden sm:block">
            Showing{" "}
            <span className="font-medium text-gray-800">{startItemIndex}</span>{" "}
            to <span className="font-medium text-gray-800">{endItemIndex}</span>{" "}
            of{" "}
            <span className="font-medium text-gray-800">
              {filteredEmployees.length}
            </span>{" "}
            accounts
          </p>

          <div className="flex items-center gap-1 justify-between sm:justify-end w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((number) => (
                <Button
                  key={number}
                  variant="outline"
                  onClick={() => setCurrentPage(number)}
                  className={`h-8 w-8 p-0 font-medium ${
                    currentPage === number
                      ? "bg-[#4A5D4E] text-white border-[#4A5D4E] hover:bg-[#3b4b3e]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {number}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8 border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employeeData={selectedEmployee}
      />
    </div>
  );
}
