import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// used in ClientDashboard to upload documents related to that said client
export default function AddClientFiles({ clientId, transactions }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [txnId, setTxnId] = useState("");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  // Restrict to pdf, jpg, png and max size 5MB
  // pwede pa yn maadjust pag ulayan nlng
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 5 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png"],
    },
  });

  const handleUpload = async () => {
    if (!file || !txnId)
      return toast.error("Please select a file and transaction");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("transaction_id", txnId);
    formData.append("file_name", file.name);

    try {
      setUploading(true);
      await axios.post(
        `http://localhost:3000/api/clients/${clientId}/files`,
        formData,
      );
      toast.success("Document saved!");
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      setFile(null);
    } catch (err) {
      toast.error("Upload failed");
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
          {transactions
            ?.filter((t: any) => t.status === "Completed")
            .map((t: any) => (
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
            ? "Drop it here!"
            : "Drag & drop a file, or click to select"}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          PDF, JPG, or PNG (Max 5MB)
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {file.name}
            </span>
          </div>
          <button onClick={() => setFile(null)}>
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={uploading || !file || !txnId}
        className="w-full bg-[#4a5a4a]"
      >
        {uploading ? "Uploading..." : "Complete Registration"}
      </Button>
    </div>
  );
}
