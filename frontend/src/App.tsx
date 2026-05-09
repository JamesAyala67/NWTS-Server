import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Defining Client type to match the structure of client data we expect from the backend
type Client = {
  client_id: string;
  name: string;
  birthdate: Date;
  civil_status: string;
  contact_number: string;
  address: string;
};

function App() {
  const queryClient = useQueryClient();
  // Controls the visibility of the Add and Edit dialogs
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // state for Add form
  const [formData, setFormData] = useState({
    client_id: "",
    name: "",
    birthdate: new Date(),
    civil_status: "",
    contact_number: "",
    address: "",
  });
  // state for Edit form
  const [editFormData, setEditFormData] = useState({
    client_id: "",
    name: "",
    civil_status: "",
    contact_number: "",
  });

  // Fetching Array of Clients from the backend
  const {
    data: clients = [],
    isLoading,
    isError,
  } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:3000/api/clients");
      return response.data;
    },
  });

  // Handles the Add Client request
  const addClientMutation = useMutation({
    mutationFn: async (newClient: typeof formData) => {
      return await axios.post("http://localhost:3000/api/clients", newClient);
    },
    onSuccess: () => {
      // This single line replaces your old fetchClients()!
      queryClient.invalidateQueries({ queryKey: ["clients"] });

      setIsOpen(false);
      setFormData({
        client_id: "",
        name: "",
        birthdate: new Date(),
        civil_status: "",
        contact_number: "",
        address: "",
      });
    },
    onError: (error) => {
      console.error("Error saving client:", error);
      alert("Failed to add client. Make sure the ID is unique!");
    },
  });
  // Handles the Edit Client request
  const editClientMutation = useMutation({
    mutationFn: async (updatedClient: typeof editFormData) => {
      return await axios.put(
        `http://localhost:3000/api/clients/${updatedClient.client_id}`,
        {
          name: updatedClient.name,
          civil_status: updatedClient.civil_status,
          contact_number: updatedClient.contact_number,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsEditOpen(false);
    },
    onError: (error) => {
      console.error("Error updating client:", error);
      alert("Failed to update client");
    },
  });
  // Handles the Soft Delete equest
  const deleteClientMutation = useMutation({
    mutationFn: async (clientID: String) => {
      return await axios.patch(
        `http://localhost:3000/api/clients/${clientID}/delete`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      console.error("Error deleting client:", error);
      alert("Failed to delete client. Try again later.");
    },
  });

  // Called when Add/Edit form is submitted
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClientMutation.mutate(formData);
  };
  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    editClientMutation.mutate(editFormData);
  };

  // If the data is still loading, show a loading message
  if (isLoading) {
    return (
      <div className="p-10 text-xl font-bold text-slate-700">
        Loading cemetery records...
      </div>
    );
  }
  // If there was an error fetching the data, show an error message
  if (isError) {
    return (
      <div className="p-10 text-xl font-bold text-red-500">
        Error: Could not connect to the database. Is your Express server
        running?
      </div>
    );
  }

  return (
    <div className="container mx-auto p-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Cemetery Clients</h1>
        {/* Responsible for Adding */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>+ Add New Client</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleAddClient}
              className="flex flex-col gap-4 mt-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="client_id">Client ID</Label>
                <Input
                  id="client_id"
                  placeholder="e.g. C-003"
                  value={formData.client_id}
                  onChange={(e) =>
                    setFormData({ ...formData, client_id: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                  id="birthdate"
                  value={formData.birthdate.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      birthdate: new Date(e.target.value),
                    })
                  }
                  type="date"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  placeholder="09123456789"
                  value={formData.contact_number}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_number: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Civil Status</Label>
                <Input
                  id="status"
                  placeholder="Single, Married, etc."
                  value={formData.civil_status}
                  onChange={(e) =>
                    setFormData({ ...formData, civil_status: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St."
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="mt-4">
                Save Client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        {/* Responsible for Editing */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleEditClient}
              className="flex flex-col gap-4 mt-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_name">Full Name</Label>
                <Input
                  id="edit_name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_contact">Contact Number</Label>
                <Input
                  id="edit_contact"
                  value={editFormData.contact_number}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      contact_number: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_status">Civil Status</Label>
                <Input
                  id="edit_status"
                  value={editFormData.civil_status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      civil_status: e.target.value,
                    })
                  }
                />
              </div>
              <Button type="submit" className="mt-4">
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Client ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Civil Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-slate-500"
                >
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.client_id}>
                  <TableCell className="font-medium">
                    {client.client_id}
                  </TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.contact_number}</TableCell>
                  <TableCell>{client.civil_status}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    {/* New Edit Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // When clicked, pre-fill the form with this client's current data and open it!
                        setEditFormData({
                          client_id: client.client_id,
                          name: client.name,
                          contact_number: client.contact_number,
                          civil_status: client.civil_status,
                        });
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Existing Delete Button */}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to remove ${client.name}?`,
                          )
                        ) {
                          deleteClientMutation.mutate(client.client_id);
                        }
                      }}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default App;
