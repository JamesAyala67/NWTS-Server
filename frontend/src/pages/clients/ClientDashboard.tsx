import { useState } from "react";
import AddTransaction from "../../components/forms/AddTransaction";
import AddCoPurchaser from "../../components/forms/AddCoPurchaser";
import AddContactPerson from "../../components/forms/AddContactPerson";
import AddPayment from "../../components/forms/AddPayment";
import ScheduleInterment from "../../components/forms/ScheduleInterment";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Plus, X } from "lucide-react";

export default function ClientDashboard() {
  const { id } = useParams();

  const [activeDrawer, setActiveDrawer] = useState<
    "transaction" | "copurchaser" | "contact" | "payment" | "interment" | null
  >(null);

  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  // Fetch the bundled data from our new Express route
  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const response = await axios.get(
        `http://localhost:3000/api/clients/${id}`,
      );
      return response.data;
    },
  });

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading client profile...
      </div>
    );
  if (isError || !client)
    return (
      <div className="p-8 text-center text-red-500">Error loading client.</div>
    );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/" className="text-blue-500 hover:underline mb-6 inline-block">
        &larr; Back to Client List
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- MAIN PROFILE CARD --- */}
        <div className="border rounded-lg p-6 shadow-sm bg-white">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">
            Client Profile
          </h2>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {client.name}
            </p>
            <p>
              <strong>Contact:</strong> {client.contact_number}
            </p>
            <p>
              <strong>Civil Status:</strong> {client.civil_status}
            </p>
            <p>
              <strong>Address:</strong> {client.address}
            </p>
          </div>
        </div>

        {/* --- SECONDARY CONTACTS CARD --- */}
        <div className="border rounded-lg p-6 shadow-sm bg-white space-y-6">
          {/* Co-Purchasers Section */}
          <div>
            <div className="flex justify-between items-center mb-2 border-b pb-1">
              <h3 className="text-lg font-bold">Co-Purchasers</h3>
              <button
                onClick={() => setActiveDrawer("copurchaser")}
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>

            {client.co_purchasers.length === 0 ? (
              <p className="text-sm text-gray-500">No co-purchasers listed.</p>
            ) : (
              <ul className="space-y-2">
                {client.co_purchasers.map((cp: any) => (
                  <li
                    key={cp.co_purchaser_id}
                    className="text-sm bg-gray-50 p-2 rounded"
                  >
                    <strong>{cp.name}</strong> - {cp.contact_number}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contact Persons Section */}
          <div>
            <div className="flex justify-between items-center mb-2 border-b pb-1">
              <h3 className="text-lg font-bold">Contact Persons</h3>
              <button
                onClick={() => setActiveDrawer("contact")}
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {client.contact_persons.length === 0 ? (
              <p className="text-sm text-gray-500">
                No contact persons listed.
              </p>
            ) : (
              <ul className="space-y-2">
                {client.contact_persons.map((contact: any) => (
                  <li
                    key={contact.contact_id}
                    className="text-sm bg-gray-50 p-2 rounded"
                  >
                    <strong>{contact.name}</strong> ({contact.relation}) -{" "}
                    {contact.contact_number}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      {/* --- TRANSACTION HISTORY CARD --- */}

      <div className="border rounded-lg p-6 shadow-sm bg-white mt-6">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">
          Transaction History
        </h2>

        <button
          onClick={() => setActiveDrawer("transaction")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> New Transaction
        </button>

        {!client.transactions || client.transactions.length === 0 ? (
          <p className="text-sm text-gray-500">
            No transactions found for this client.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Plot</th>
                  <th className="p-2 border">Price</th>
                  <th className="p-2 border">Balance</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border text-center">Action</th>{" "}
                </tr>
              </thead>
              <tbody>
                {client.transactions.map((txn: any) => (
                  <tr
                    key={txn.transaction_id}
                    className="text-sm border-b hover:bg-gray-50"
                  >
                    <td className="p-2 font-mono">{txn.transaction_id}</td>
                    <td className="p-2">
                      {new Date(txn.date_created).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      {txn.plot_id} <br />
                      <span className="text-xs text-gray-500">
                        {txn.plot_type} ({txn.plot_size})
                      </span>
                    </td>
                    <td className="p-2">
                      ₱{Number(txn.plot_price).toLocaleString()}
                    </td>
                    <td className="p-2 text-red-600 font-bold">
                      ₱{Number(txn.remaining_balance).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          txn.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>

                    {/* NEW: The Action Button */}
                    <td className="p-2 text-center">
                      {txn.remaining_balance > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedTxn(txn);
                            setActiveDrawer("payment");
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 transition"
                        >
                          Pay
                        </button>
                      ) : (
                        /* CHANGE THIS PART BELOW */
                        <button
                          onClick={() => {
                            setSelectedTxn(txn);
                            setActiveDrawer("interment");
                          }}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-700 transition"
                        >
                          🪦 Schedule
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* --- DYNAMIC SLIDE-OUT DRAWER --- */}
      {activeDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setActiveDrawer(null)}
          ></div>

          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto transform transition-transform border-l">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold">
                {activeDrawer === "transaction" && "Record New Transaction"}
                {activeDrawer === "copurchaser" && "Add Co-Purchaser"}
                {activeDrawer === "contact" && "Add Contact Person"}
                {activeDrawer === "payment" && "Record Payment"}
                {activeDrawer === "interment" && "Schedule Interment"}{" "}
                {/* ADD THIS */}
              </h2>
              <button
                onClick={() => setActiveDrawer(null)}
                className="text-gray-500 hover:text-red-500 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {id && activeDrawer === "transaction" && (
                <AddTransaction clientId={id} />
              )}
              {id && activeDrawer === "copurchaser" && (
                <AddCoPurchaser clientId={id} />
              )}
              {id && activeDrawer === "contact" && (
                <AddContactPerson clientId={id} />
              )}

              {/* NEW: Pass the selected transaction details to the form */}
              {activeDrawer === "payment" && selectedTxn && (
                <AddPayment
                  transactionId={selectedTxn.transaction_id}
                  currentBalance={selectedTxn.remaining_balance}
                />
              )}

              {activeDrawer === "interment" && selectedTxn && (
                <ScheduleInterment
                  plotId={selectedTxn.plot_id}
                  transactionId={selectedTxn.transaction_id}
                  onSuccess={() => {
                    setActiveDrawer(null);
                    window.location.reload();
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div> // Closing div for ClientDashboard
  );
}
