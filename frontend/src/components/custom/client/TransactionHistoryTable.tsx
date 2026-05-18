import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  CreditCard,
  Activity,
  Wrench,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TransactionHistoryTableProps {
  transactions: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onNewTransaction: () => void;
  onAction: (
    action: "payment" | "interment" | "maintenance" | "transfer",
    txn: any,
  ) => void;
}

export default function TransactionHistoryTable({
  transactions,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onNewTransaction,
  onAction,
}: TransactionHistoryTableProps) {
  return (
    <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 px-8 py-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#4a5a4a]" />
          <CardTitle className="text-lg font-bold text-gray-800 uppercase tracking-wide">
            Transaction History
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <Button
            onClick={onNewTransaction}
            className="bg-[#4a5a4a] hover:bg-[#3a4a3f] text-white shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" /> New Transaction
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search ID or Plot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-full sm:w-[200px] text-sm"
              />
            </div>
            <select
              className="h-9 px-3 py-1.5 text-sm border rounded-md border-gray-200 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#4a5a4a] text-white text-[10px] uppercase tracking-widest">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Plot</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Balance</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transactions.map((txn: any) => (
                <tr
                  key={txn.transaction_id}
                  className="border-b last:border-none hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-bold">{txn.transaction_id}</td>
                  <td className="p-4">{new Date().toLocaleDateString()}</td>
                  <td className="p-4">
                    {txn.plot_id} - {txn.plot_type}
                  </td>
                  <td className="p-4">
                    ₱{Number(txn.plot_price).toLocaleString()}
                  </td>
                  <td className="p-4">
                    ₱{Number(txn.remaining_balance).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        txn.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : txn.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : txn.status === "Transferred"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {txn.status !== "Transferred" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white border border-gray-200 shadow-xl rounded-md min-w-[160px] p-1"
                        >
                          {txn.remaining_balance > 0 && (
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center px-3 py-2 text-sm hover:bg-gray-100"
                              onSelect={() => {
                                setTimeout(() => onAction("payment", txn), 0);
                              }}
                            >
                              <CreditCard className="mr-2 h-4 w-4 text-green-600" />{" "}
                              Add Payment
                            </DropdownMenuItem>
                          )}
                          {txn.status === "Completed" && (
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center px-3 py-2 text-sm hover:bg-gray-100"
                              onSelect={() => {
                                setTimeout(() => onAction("interment", txn), 0);
                              }}
                            >
                              <Activity className="mr-2 h-4 w-4 text-indigo-600" />{" "}
                              Schedule Interment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center px-3 py-2 text-sm hover:bg-gray-100"
                            onSelect={() => {
                              setTimeout(() => onAction("maintenance", txn), 0);
                            }}
                          >
                            <Wrench className="mr-2 h-4 w-4 text-orange-600" />{" "}
                            Maintenance
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                            onSelect={() => {
                              setTimeout(() => onAction("transfer", txn), 0);
                            }}
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                            Plot
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center p-8 text-gray-400 italic text-sm">
              No transactions match your search/filter criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
