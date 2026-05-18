import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns"; // Make sure to npm install date-fns if you haven't!

interface AuditLog {
  audit_id: string;
  employee_id: string;
  action_type: string;
  action_description: string;
  date_time: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/audit-logs",
        );
        setLogs(response.data);
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading)
    return <div className="p-4 text-gray-500">Loading system logs...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-[#4a5a4a]">System Audit Logs</h2>
        <p className="text-sm text-gray-500">
          Track all administrative actions and system changes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">User (ID)</th>
              <th className="px-6 py-3">Action Type</th>
              <th className="px-6 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-gray-500 font-medium"
                >
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.audit_id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {format(new Date(log.date_time), "MMM dd, yyyy - hh:mm a")}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                      {log.employee_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                      {log.action_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {log.action_description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
