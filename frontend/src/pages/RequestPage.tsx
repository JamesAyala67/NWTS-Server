// pages/request/RequestPage.tsx
import React from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
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

  // Utility to clean up accidental backend template-string object interpolation bugs
  const sanitizeDescription = (desc: string) => {
    if (!desc) return "No operational details provided.";
    return desc
      .replace(/\(object Object\)/g, "")
      .replace(/undefined undefined/g, "")
      .replace(/undefined/g, "")
      .replace(/,\s*,/g, ",")
      .replace(/:\s*,/g, ":")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/,$/, "");
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-400 font-medium text-sm animate-pulse">
        Syncing administrative request queue...
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FDFCF8] font-sans p-2 md:p-4 space-y-6">
      {/* Dynamic Page Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#2A3B2E]">
          Administrative Approvals
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Review, approve, or reject operational changes requested by team members.
        </p>
      </div>

      {/* Empty State Handler */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm mt-8">
          <div className="h-16 w-16 bg-[#E8F0EA] rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-[#4A5D4E]" />
          </div>
          <h3 className="text-lg font-bold text-[#2A3B2E]">All Caught Up!</h3>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-sm font-medium">
            There are currently no pending requests requiring administrator authorization.
          </p>
        </div>
      ) : (
        /* Render Staged Changes List Queue */
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-amber-700/80 uppercase tracking-widest">
              {requests.length} Pending Actions
            </span>
          </div>

          {requests.map((req: any) => {
            const isDeleteAction = req.action_type?.toUpperCase().includes("DELETE");

            return (
              <div
                key={req.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4 w-full">
                  {/* Left Side: Layout Avatar matching the Screenshot Context */}
                  <div
                    className={`h-12 w-12 rounded-full shrink-0 flex items-center justify-center ${
                      isDeleteAction ? "bg-[#FDF3F2] text-[#C94A47]" : "bg-[#F5EFE6] text-[#8A7665]"
                    }`}
                  >
                    {isDeleteAction ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>

                  {/* Operational Details Container */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Contextual Badges styled following the exact design blueprint */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                          isDeleteAction
                            ? "bg-[#FDF3F2] text-[#C94A47]"
                            : "bg-[#F5EFE6] text-[#8A7665]"
                        }`}
                      >
                        {req.action_type?.replace(/_/g, " ")}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(req.created_at).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-[#2A3B2E] break-words leading-snug">
                      {sanitizeDescription(req.description)}
                    </h3>
                    
                    <p className="text-xs md:text-sm text-gray-400 font-medium">
                      Submitted by:{" "}
                      <span className="font-bold text-[#4A5D4E]">
                        {req.submitted_by_name || "Unknown Staff"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Side: Primary Action Triggers */}
                <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 border-t lg:border-t-0 border-gray-50 pt-4 lg:pt-0">
                  <Button
                    onClick={() =>
                      resolveRequest.mutate({
                        requestId: req.id,
                        disposition: "Cancel",
                      })
                    }
                    disabled={resolveRequest.isPending}
                    variant="outline"
                    className="flex-1 lg:flex-none border-red-200 text-red-500 hover:bg-red-50/50 hover:text-red-600 rounded-xl px-5 font-bold text-sm h-10 transition active:scale-98"
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
                    className="flex-1 lg:flex-none bg-[#2E3F33] hover:bg-[#223026] text-white shadow-sm rounded-xl px-5 font-bold text-sm h-10 transition active:scale-98"
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" /> Approve
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}