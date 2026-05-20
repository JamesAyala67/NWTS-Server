// pages/request/RequestPage.tsx
import React from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
  },
});

export default function RequestPage() {
  const queryClient = useQueryClient();

  // 1. Fetch pending requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["pending-requests"],
    queryFn: async () => {
      const res = await api.get("/requests/pending");
      return res.data;
    },
  });

  // 2. Resolve request mutation logic
  const resolveRequest = useMutation({
    mutationFn: async ({
      requestId,
      disposition,
    }: {
      requestId: number;
      disposition: "Accept" | "Cancel";
    }) => {
      await api.post(`/requests/${requestId}/resolve`, { action: disposition });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: () => {
      alert("Something went wrong resolving the request.");
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        Syncing request queue...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#2A3B2E]">
          Administrative Approvals
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, approve, or reject operational changes staged by front-office
          staff.
        </p>
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-200 shadow-sm mt-8">
          <div className="h-16 w-16 bg-[#E8F0EA] rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-[#4A5D4E]" />
          </div>
          <h3 className="text-lg font-bold text-[#2A3B2E]">All Caught Up!</h3>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-sm">
            There are currently no pending requests requiring administrator
            authorization.
          </p>
        </div>
      ) : (
        /* Queue List */
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {requests.length} Pending Actions
            </span>
          </div>

          {requests.map((req: any) => (
            <div
              key={req.id}
              className="bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all hover:border-gray-200 hover:shadow-md"
            >
              <div className="space-y-3 w-full">
                {/* Badge Row */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                      req.action_type.includes("DELETE")
                        ? "bg-red-50 text-red-700 border border-red-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {req.action_type.replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                    <Clock className="h-3 w-3" />
                    {new Date(req.created_at).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {/* Content Row */}
                <div>
                  <h3 className="text-base font-bold text-[#2A3B2E] flex items-start gap-2">
                    {req.action_type.includes("DELETE") && (
                      <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    {req.description}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted by:{" "}
                    <span className="font-bold text-[#4A5D4E]">
                      {req.submitted_by_name}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                <Button
                  onClick={() =>
                    resolveRequest.mutate({
                      requestId: req.id,
                      disposition: "Cancel",
                    })
                  }
                  disabled={resolveRequest.isPending}
                  variant="outline"
                  className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11"
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Reject
                </Button>

                <Button
                  onClick={() =>
                    resolveRequest.mutate({
                      requestId: req.id,
                      disposition: "Accept",
                    })
                  }
                  disabled={resolveRequest.isPending}
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-11"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
