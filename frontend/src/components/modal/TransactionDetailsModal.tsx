import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { X, Save, User, Edit2, Trash2, Check, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({ baseURL: API_BASE_URL });

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailsModalProps) {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState("");

  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    date_of_interment: "",
    location: "",
  });

  useEffect(() => {
    if (transaction) setRemarks(transaction.remarks || "");
    setEditingId(null);
  }, [transaction, isOpen]);

  const { data: interments = [], isLoading } = useQuery({
    queryKey: ["interments", transaction?.transaction_id],
    queryFn: async () => {
      const res = await api.get(
        `/interments?transaction_id=${transaction.transaction_id}`,
      );
      return res.data;
    },
    enabled: !!transaction?.transaction_id && isOpen,
  });

  const updateRemarksMutation = useMutation({
    mutationFn: async (newRemarks: string) => {
      return api.patch(`/transactions/${transaction.transaction_id}/remarks`, {
        remarks: newRemarks,
      });
    },
    onSuccess: () => {
      toast.success("Remarks saved!");
      queryClient.invalidateQueries({
        queryKey: ["client", transaction.client_id],
      });
    },
  });

  // Example for Editing an Interment
  const updateIntermentMutation = useMutation({
    mutationFn: async ({
      intermentId,
      formData,
    }: {
      intermentId: string;
      formData: any;
    }) => {
      const userRole = localStorage.getItem("userRole");
      const currentEmployeeName =
        localStorage.getItem("userName") || "Staff Member";

      if (userRole === "Admin") {
        return api.put(`/interments/${intermentId}`, formData);
      } else {
        return api.post(`/requests/stage-edit-interment/${intermentId}`, {
          submitter_name: currentEmployeeName,
          edit_data: formData,
        });
      }
    },
    onSuccess: () => {
      // Refresh interment tables immediately
      queryClient.invalidateQueries({
        queryKey: ["interments", transaction?.transaction_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["client", transaction?.client_id],
      });
      setEditingId(null); // Clear the inline edit mode row layout
      toast.success("Action processed successfully!");
    },
    onError: () => toast.error("Failed to process interment update request."),
  });

  const deleteIntermentMutation = useMutation({
    mutationFn: async (intermentId: string) => {
      const userRole = localStorage.getItem("userRole");
      const currentEmployeeName = localStorage.getItem("userName") || "Staff";
      const currentEmployeeId = localStorage.getItem("employee_id") || "";

      if (userRole === "Admin") {
        return api.patch(`/interments/${intermentId}/delete`, {
          employee_id: currentEmployeeId,
          deleted_by: currentEmployeeName,
        });
      } else {
        return api.post(`/requests/stage-interment/${intermentId}`, {
          submitter_name: currentEmployeeName,
        });
      }
    },
    onSuccess: () => {
      // ✨ FIX: Invalidate with the specific string IDs, not the full dataset array variable
      queryClient.invalidateQueries({
        queryKey: ["interments", transaction?.transaction_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["client", transaction?.client_id],
      });

      if (localStorage.getItem("userRole") === "Admin") {
        toast.success("Interment record removed successfully");
      } else {
        toast.success("Request Sent", {
          description: "Interment deletion request sent to Admin.",
        });
      }
    },
    onError: () => toast.error("Failed to process interment removal"),
  });

  // --- HANDLERS ---
  const handleEditClick = (record: any) => {
    setEditingId(record.interment_id);
    setEditForm({
      first_name: record.first_name,
      last_name: record.last_name,
      date_of_interment: record.date_of_interment
        ? new Date(record.date_of_interment).toISOString().split("T")[0]
        : "",
      location: record.location || "",
    });
  };

  const handleSaveEdit = () => {
    if (editingId) {
      // ✨ FIX: Match names exactly to match the properties expected by the mutationFn destructuring assignment
      updateIntermentMutation.mutate({
        intermentId: editingId,
        formData: editForm,
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    if (
      window.confirm("Are you sure you want to remove this interment record?")
    ) {
      deleteIntermentMutation.mutate(id);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#4a5a4a] p-4 flex justify-between items-center text-white">
          <div>
            <h2 className="font-bold text-lg">Transaction Hub</h2>
            <p className="text-xs text-gray-300 font-mono">
              PR: {transaction.professional_receipt} | Plot:{" "}
              {transaction.plot_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-gray-50">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              Agent Remarks & Notes
            </label>
            <textarea
              className="w-full min-h-[80px] p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none"
              placeholder="Add tracking notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <Button
                onClick={() => updateRemarksMutation.mutate(remarks)}
                disabled={
                  updateRemarksMutation.isPending ||
                  remarks === transaction.remarks
                }
                className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white text-xs h-8"
              >
                <Save className="h-3 w-3 mr-1" /> Save Remarks
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <User className="h-4 w-4 text-[#4a5a4a]" />
              <h3 className="font-bold text-gray-800 text-sm">
                Interment Records
              </h3>
            </div>

            {isLoading ? (
              <p className="p-6 text-center text-gray-500 text-sm italic">
                Loading interment records...
              </p>
            ) : interments.length === 0 ? (
              <p className="p-6 text-center text-gray-500 text-sm italic">
                No active interment records found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase">
                    <tr>
                      <th className="p-3 font-semibold">Date of Interment</th>
                      <th className="p-3 font-semibold">First Name</th>
                      <th className="p-3 font-semibold">Last Name</th>
                      <th className="p-3 font-semibold">Location</th>
                      <th className="p-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interments.map((record: any) => {
                      const isItemEditing = editingId === record.interment_id;

                      return (
                        <tr
                          key={record.interment_id}
                          className="border-b last:border-none hover:bg-gray-50 transition-colors"
                        >
                          {isItemEditing ? (
                            <>
                              <td className="p-2">
                                <input
                                  type="date"
                                  className="w-full text-xs p-1.5 border rounded"
                                  value={editForm.date_of_interment}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      date_of_interment: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full text-xs p-1.5 border rounded"
                                  value={editForm.first_name}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      first_name: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full text-xs p-1.5 border rounded"
                                  value={editForm.last_name}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      last_name: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full text-xs p-1.5 border rounded"
                                  value={editForm.location}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      location: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="p-2 flex justify-center gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={updateIntermentMutation.isPending}
                                  className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                  title="Cancel"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 text-gray-700 font-medium">
                                {record.date_of_interment
                                  ? new Date(
                                      record.date_of_interment,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "N/A"}
                              </td>
                              <td className="p-3 text-gray-800 capitalize">
                                {record.first_name}
                              </td>
                              <td className="p-3 text-gray-800 font-bold capitalize">
                                {record.last_name}
                              </td>
                              <td className="p-3 text-gray-600">
                                {record.location}
                              </td>
                              <td className="p-3 flex justify-center gap-3">
                                <button
                                  onClick={() => handleEditClick(record)}
                                  className="text-blue-500 hover:text-blue-700 transition"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteClick(record.interment_id)
                                  }
                                  className="text-gray-400 hover:text-red-500 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
