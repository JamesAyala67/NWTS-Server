import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  Pencil,
  Eye,
  Plus,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { useAddress } from "../../hooks/useAddress";

// Form Components
import AddClientSheet from "../../components/forms/AddClientSheet";
import EditClientSheet from "../../components/forms/EditClientSheet";

type Client = {
  client_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  birthdate: Date;
  civil_status: string;
  contact_number: string;
  province: string;
  city: string;
  barangay: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

function ClientPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Custom UI
  const employeeId = localStorage.getItem("employee_id") || "EMP-001";

  // Sheet
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCivilStatus, setFilterCivilStatus] = useState("All");

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Address data
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");
  const { provinces, cities, barangays } = useAddress(
    selectedProvince,
    selectedCity,
    selectedBarangay,
  );

  // Add form
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    birthdate: new Date(),
    civil_status: "",
    contact_number: "",
    province: "",
    city: "",
    barangay: "",
    prepared_by: "",
  });

  // Edit form
  const [editFormData, setEditFormData] = useState({
    client_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    civil_status: "",
    contact_number: "",
    birthdate: new Date(),
    province: "",
    city: "",
    barangay: "",
  });

  // Fetch clients from the backend
  const {
    data: clients = [],
    isLoading,
    isError,
  } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await api.get(`${API_BASE_URL}/clients`);
      return response.data;
    },
  });
  // Fetch employees from the backend
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await api.get(`${API_BASE_URL}/employees`);
      return response.data;
    },
  });

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (newClient: typeof formData) => {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const randomNumbers = Math.floor(10000 + Math.random() * 90000);
      const generatedClientId = `${currentYear}-${randomNumbers}`;
      const selectedProvName =
        provinces?.find((p: { code: string }) => p.code === selectedProvince)
          ?.name || "";
      const selectedCityName =
        cities?.find((c: { code: string }) => c.code === selectedCity)?.name ||
        "";
      const selectedBrgyName =
        barangays?.find((b: { code: string }) => b.code === selectedBarangay)
          ?.name || "";

      return await api.post(`${API_BASE_URL}/clients`, {
        client_id: generatedClientId,
        ...newClient,
        province: selectedProvName,
        city: selectedCityName,
        barangay: selectedBrgyName,
        created_at: new Date().toISOString(),

        employee_id: employeeId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });

      setIsOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        middle_name: "",
        birthdate: new Date(),
        civil_status: "",
        contact_number: "",
        province: "",
        city: "",
        barangay: "",
        prepared_by: employeeId,
      });
      setSelectedProvince("");
      setSelectedCity("");
      setSelectedBarangay("");

      toast.success("Client Added", {
        description: "The new client has been successfully registered.",
      });
    },
    onError: (error) => {
      console.error("Error saving client:", error);
      toast.error("Error", {
        description: "Failed to add client. Please try again.",
      });
    },
  });

  // Edit client mutation
  const editClientMutation = useMutation({
    mutationFn: async ({
      clientId,
      formData,
    }: {
      clientId: string;
      formData: any;
    }) => {
      const userRole = localStorage.getItem("userRole");
      const currentEmployeeName =
        localStorage.getItem("userName") || "Staff Member";

      if (userRole === "Admin") {
        return api.put(`/clients/${clientId}`, formData);
      } else {
        return api.post(`/requests/stage-edit-client/${clientId}`, {
          submitter_name: currentEmployeeName,
          edit_data: formData, // Flat form object (e.g., { first_name: 'James', ... })
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client"] });
      toast.success("Action processed successfully!");
    },
    onError: () => toast.error("Failed to process update request."),
  });

  const currentEmployee = employees.find(
    (emp: any) => emp.employee_id === employeeId,
  );
  const submitterName = currentEmployee
    ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
    : "Front Office Staff";

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientID: string) => {
      // ROUTE TO REQUEST QUEUE INSTEAD OF DIRECT DELETE
      return await api.post(
        `${API_BASE_URL}/requests/stage-client/${clientID}`,
        {
          submitter_name: submitterName, // Matches backend requirement
        },
      );
    },
    onSuccess: () => {
      // Invalidate client queries to keep layout uniform
      queryClient.invalidateQueries({ queryKey: ["clients"] });

      toast.success("Deletion Requested", {
        description:
          "This removal request has been sent to the Admin queue for review.",
      });
    },
    onError: (error) => {
      console.error("Error staging client deletion:", error);
      toast.error("Error", {
        description: "Could not submit deletion request.",
      });
    },
  });

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClientMutation.mutate(formData);
  };

  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    editClientMutation.mutate(editFormData);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCivilStatus]);

  // Filtering clients by search and status
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.client_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCivil =
        filterCivilStatus === "All" ||
        client.civil_status?.toLowerCase() === filterCivilStatus.toLowerCase();
      return matchesSearch && matchesCivil;
    });
  }, [clients, searchTerm, filterCivilStatus]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf8f5] text-xl font-bold text-slate-700">
        Loading cemetery records...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf8f5] text-xl font-bold text-red-500">
        Error: Could not connect to the database. Is your Express server
        running?
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8f5] font-sans">
      <main className="flex-1 overflow-y-auto p-10">
        {/* Header section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1e293b] mb-1">Clients</h2>
            <p className="text-gray-500 text-sm">
              Manage and view all registered cemetery clients.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm rounded-md"
            />
          </div>

          <select
            className="h-10 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm shadow-sm outline-none text-gray-700 min-w-[140px]"
            value={filterCivilStatus}
            onChange={(e) => setFilterCivilStatus(e.target.value)}
          >
            <option value="All">Civil Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
          </select>

          {/* Add client button */}
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white shadow-sm h-10"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>

        {/* Client table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader className="bg-[#f5f0e6] sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent border-b-gray-200">
                  <TableHead className="font-semibold text-gray-800 py-4 pl-6">
                    Client ID
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800 py-4">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800 py-4">
                    Contact
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800 py-4">
                    Civil Status
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800 py-4 text-center pr-6 w-24">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-gray-500"
                    >
                      No clients found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClients.map((client) => {
                    const fullName =
                      `${client.first_name} ${client.middle_name ? client.middle_name + " " : ""}${client.last_name}`.trim();

                    return (
                      <TableRow
                        key={client.client_id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="py-4 pl-6 text-gray-600 font-medium">
                          {client.client_id}
                        </TableCell>

                        <TableCell className="py-4 text-gray-800">
                          {fullName}
                        </TableCell>

                        <TableCell className="py-4 text-gray-600">
                          {client.contact_number}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded border-none font-medium px-2.5 py-0.5",
                              client.civil_status?.toLowerCase() === "single"
                                ? "bg-[#e4ebd8] text-[#4a5a4a]"
                                : client.civil_status?.toLowerCase() ===
                                    "married"
                                  ? "bg-[#e4ebd8] text-[#4a5a4a]"
                                  : "bg-[#f0e3cc] text-[#7a6a4f]",
                            )}
                          >
                            {client.civil_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 pr-6 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                              >
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white border border-gray-200 rounded-md shadow-lg py-1"
                            >
                              <DropdownMenuItem
                                className="cursor-pointer text-gray-700"
                                onClick={() =>
                                  navigate(`/clients/${client.client_id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="cursor-pointer text-gray-700"
                                onClick={() => {
                                  setEditFormData({
                                    client_id: client.client_id,
                                    first_name: client.first_name,
                                    middle_name: client.middle_name || "",
                                    last_name: client.last_name,
                                    contact_number: client.contact_number,
                                    civil_status: client.civil_status,
                                    birthdate: client.birthdate,
                                    province: client.province,
                                    city: client.city,
                                    barangay: client.barangay,
                                  });

                                  setSelectedProvince(client.province);
                                  setSelectedCity(client.city);
                                  setSelectedBarangay(client.barangay);

                                  setIsEditOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to remove ${fullName}?`,
                                    )
                                  ) {
                                    deleteClientMutation.mutate(
                                      client.client_id,
                                    );
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
          <span>
            Showing{" "}
            {(currentPage - 1) * itemsPerPage +
              (paginatedClients.length > 0 ? 1 : 0)}{" "}
            to {(currentPage - 1) * itemsPerPage + paginatedClients.length} of{" "}
            {filteredClients.length} entries
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 bg-white border-gray-200 text-gray-400 disabled:opacity-50"
            >
              &lt;
            </Button>
            <span className="px-3 text-gray-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 bg-white border-gray-200 text-gray-400 disabled:opacity-50"
            >
              &gt;
            </Button>
          </div>
        </div>
      </main>

      {/* Extracted sheets */}
      <AddClientSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        formData={formData}
        setFormData={setFormData}
        handleAddClient={handleAddClient}
        provinces={provinces}
        cities={cities}
        barangays={barangays}
        selectedProvince={selectedProvince}
        setSelectedProvince={setSelectedProvince}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedBarangay={selectedBarangay}
        setSelectedBarangay={setSelectedBarangay}
        isPending={addClientMutation.isPending}
        employees={employees}
      />

      <EditClientSheet
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        handleEditClient={handleEditClient}
        provinces={provinces}
        cities={cities}
        barangays={barangays}
        selectedProvince={selectedProvince}
        setSelectedProvince={setSelectedProvince}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedBarangay={selectedBarangay}
        setSelectedBarangay={setSelectedBarangay}
        isPending={editClientMutation.isPending}
      />
    </div>
  );
}

export default ClientPage;
