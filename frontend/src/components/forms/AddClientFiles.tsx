import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function AddClientFiles({ clientId, transactions }: any) {
  // Changed state to hold an array of files instead of a single file
  const [files, setFiles] = useState<File[]>([]);
  const [txnId, setTxnId] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Append new accepted files to the existing array
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true, // Enabled multiple file selection
    maxSize: 5 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png"],
    },
  });

  const handleUpload = async () => {
    if (files.length === 0 || !txnId) {
      return toast.error("Please select files and a transaction");
    }

    try {
      setUploading(true);

      const employee_id = localStorage.getItem("employee_id") || "";
      const uploaded_by = localStorage.getItem("userName") || "";

      // Create an array of upload requests to run concurrently
      // This allows you to keep your backend setup exactly as it is (upload.single('file'))
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("transaction_id", txnId);
        formData.append("file_name", file.name);
        formData.append("employee_id", employee_id);
        formData.append("uploaded_by", uploaded_by);

        return axios.post(
          `http://localhost:3000/api/clients/${clientId}/files`,
          formData,
        );
      });

      await Promise.all(uploadPromises);

      toast.success("Documents saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setFiles([]);
      setTxnId("");
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error("Some uploads failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase">
          Associate with Transaction
        </label>
        <select
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          className="w-full p-2 border rounded-md text-sm"
        >
          <option value="">Select Transaction...</option>
          {transactions?.map((t: any) => (
            <option key={t.transaction_id} value={t.transaction_id}>
              {t.plot_id} ({t.transaction_id.substring(0, 8)})
            </option>
          ))}
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
          ${isDragActive ? "border-[#4a5a4a] bg-[#4a5a4a]/5" : "border-gray-200 hover:border-gray-300"}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {isDragActive
            ? "Drop them here!"
            : "Drag & drop files, or click to select"}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          PDF, JPG, or PNG (Max 5MB per file)
        </p>
      </div>

      {/* Render list of selected files */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <File className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="text-sm font-medium truncate">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 rounded-md hover:bg-red-50 transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={uploading || files.length === 0 || !txnId}
        className="w-full bg-[#4a5a4a]"
      >
        {uploading ? "Uploading Documents..." : "Upload Documents"}
      </Button>
    </div>
  );
}
