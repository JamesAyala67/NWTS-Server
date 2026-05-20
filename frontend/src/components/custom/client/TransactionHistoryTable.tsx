import { Plus, Search, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TransactionHistoryTableProps {
  transactions: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onNewTransaction: () => void;
  onAction: (action: "interment", txn: any) => void;
  onPrClick: (txn: any) => void;
}

export default function TransactionHistoryTable({
  transactions,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onNewTransaction,
  onAction,
  onPrClick,
}: TransactionHistoryTableProps) {
  return (
    <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 px-6 md:px-8 py-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#4a5a4a]" />
          <CardTitle className="text-lg font-bold text-gray-800 uppercase tracking-wide">
            Transaction & Payment History
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 md:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <Button
            onClick={onNewTransaction}
            className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white shrink-0 shadow-sm focus:outline-none focus:ring-0"
          >
            <Plus className="mr-2 h-4 w-4" /> New Transaction
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search PR or SI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full sm:w-[220px] text-sm border-gray-200 shadow-sm"
              />
            </div>
            <select
              className="h-10 px-3 py-1.5 text-sm border rounded-md border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[#4a5a4a] focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Transaction">Transactions Only</option>{" "}
              <option value="Completed">Completed Plots</option>
              <option value="Pending">Pending Plots</option>
              <option value="Payment">Payments Only</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#4a5a4a] text-white text-[10px] uppercase tracking-widest">
              <tr>
                <th className="p-4 font-semibold rounded-tl-lg">Date</th>
                <th className="p-4 font-semibold">PR #</th>
                <th className="p-4 font-semibold">SI #</th>
                <th className="p-4 font-semibold">Plot Reference</th>
                <th className="p-4 font-semibold text-right">Amount / Price</th>
                <th className="p-4 font-semibold text-right">Balance</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center rounded-tr-lg">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transactions.map((item: any) => {
                // Dynamically detect if this row item is a Plot Purchase or a General Payment
                const isPayment = !!item.payment_id;

                // 1. Extract dynamic row values based on ledger entry type
                const itemDate = isPayment
                  ? item.payment_date
                  : item.date_created || item.transaction_date;
                const displayPrice = isPayment
                  ? item.amount_paid
                  : item.plot_price;
                const isIntermentAllowed =
                  !isPayment &&
                  (item.status === "Completed" ||
                    item.plot_type === "Mausoleum");

                return (
                  <tr
                    key={isPayment ? item.payment_id : item.transaction_id}
                    className={`border-b border-gray-100 last:border-none transition-colors ${
                      isPayment
                        ? "bg-[#fcfcfc]/60 hover:bg-[#f3f5f3]"
                        : "hover:bg-[#fcfaf7]"
                    }`}
                  >
                    {/* Date */}
                    <td className="p-4 text-gray-600 font-medium text-xs">
                      {new Date(itemDate || Date.now()).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </td>

                    {/* PR Number */}
                    <td className="p-4">
                      {isPayment ? (
                        // Render as plain text for Payments
                        <span className="font-bold text-slate-600">
                          {item.professional_receipt || "N/A"}
                        </span>
                      ) : (
                        // Render as a clickable button for Transactions
                        <button
                          onClick={() => onPrClick(item)}
                          className="font-bold text-[#4a5a4a] underline decoration-dotted underline-offset-4 hover:text-[#3a4a3f] transition-colors"
                          disabled={!item.professional_receipt}
                        >
                          {item.professional_receipt || "N/A"}
                        </button>
                      )}
                    </td>

                    {/* SI Number */}
                    <td className="p-4">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-mono">
                        {item.sales_invoice || "N/A"}
                      </span>
                    </td>

                    {/* Plot Reference */}
                    {/* Plot Reference */}
                    <td className="p-4 text-gray-800 font-medium">
                      {item.plot_id || "N/A"}{" "}
                      <span className="text-gray-400 font-normal text-xs ml-1">
                        ({item.plot_type || "N/A"})
                      </span>
                    </td>

                    {/* Amount / Price */}
                    <td
                      className={`p-4 text-right font-bold ${isPayment ? "text-emerald-600" : "text-gray-800"}`}
                    >
                      ₱
                      {Number(displayPrice).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Balance */}
                    <td className="p-4 text-right font-bold">
                      {isPayment ? (
                        <span className="text-gray-400 font-normal italic text-xs">
                          —
                        </span>
                      ) : (
                        <span className="text-orange-600">
                          ₱
                          {Number(item.remaining_balance).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {isPayment ? (
                        <span className="px-2.5 py-1 text-[11px] rounded-full font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700">
                          Paid
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-[11px] rounded-full font-bold uppercase tracking-wide ${
                            item.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : item.status === "Pending"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="p-4 text-center">
                      {isIntermentAllowed ? (
                        <Button
                          onClick={() => onAction("interment", item)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 text-xs shadow-sm"
                        >
                          Schedule Interment
                        </Button>
                      ) : (
                        <span className="text-gray-300 text-xs italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center p-8 text-gray-400 italic text-sm bg-gray-50">
              No transactions or payments match your search/filter criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
