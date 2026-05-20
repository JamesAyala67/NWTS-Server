// This component is responsible for rendering a modal that allows users to edit the details of a specific plot

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import type { Plot } from "../../pages/plots/PlotsMap";

interface EditPlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlot: Plot;
  onSuccess: (newStatus: string) => void;
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

export default function EditPlotModal({
  isOpen,
  onClose,
  selectedPlot: plot,
  onSuccess,
}: EditPlotModalProps) {
  const [plotType, setPlotType] = useState("");
  const [price, setPrice] = useState<number | "">(0);
  const [status, setStatus] = useState("");

  // Sync state when plot changes
  useEffect(() => {
    if (plot) {
      setPlotType(plot.plot_type || "");
      setPrice(plot.price || 0);
      setStatus(plot.status || "Available");
    }
  }, [plot]);

  // Handle the API call to update the database
  const updatePlotMutation = useMutation({
    mutationFn: async (payload: {
      plot_type: string;
      price: number;
      status: string;
    }) => {
      // Make a PUT request to update the plot details in the backend
      return api.put(
        `${API_BASE_URL}/plots/maps/${plot.plot_id}/edit`,
        payload,
      );
    },
    onSuccess: (_, variables) => {
      toast.success("Plot details updated successfully!");
      onSuccess(variables.status);
      onClose();
    },
    onError: () => {
      toast.error("Failed to update plot details.");
    },
  });

  if (!plot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-200 shadow-xl rounded-xl font-sans">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1e293b] flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-[#4a5a4a]" /> Update Plot Details
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Updating details for plot{" "}
            <strong className="text-[#4a5a4a] font-mono">{plot.plot_id}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Read Only ID */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-gray-500">
              Plot ID (Immutable)
            </Label>
            <Input
              value={plot.plot_id}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-gray-700">
              Plot Type
            </Label>
            <select
              value={plotType}
              onChange={(e) => setPlotType(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="Lawn Type">Lawn Type</option>
              <option value="Kennedy Type">Kennedy Type</option>
              <option value="Family Type">Family Type</option>
              <option value="Mausoleum">Mausoleum</option>
              <option value="Mini Mausoleum">Mini Mausoleum</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-gray-700">
              Price (₱)
            </Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-gray-700">
              Status
            </Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Reserved">Reserved</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="bg-white"
            onClick={onClose}
            disabled={updatePlotMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              updatePlotMutation.mutate({
                plot_type: plotType,
                price: Number(price),
                status,
              })
            }
            disabled={updatePlotMutation.isPending}
            className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white"
          >
            {updatePlotMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
