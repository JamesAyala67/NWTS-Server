import { useState } from "react";
import axios from "axios";

export default function AddContactPerson({ clientId }: { clientId: string }) {
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    contact_number: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/contact-persons", {
        ...formData,
        client_id: clientId,
      });
      window.location.reload();
    } catch (error) {
      alert("Error saving contact person");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Full Name</label>
        <input
          type="text"
          className="border p-2 rounded"
          required
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">
          Relation (e.g., Spouse, Child)
        </label>
        <input
          type="text"
          className="border p-2 rounded"
          required
          onChange={(e) =>
            setFormData({ ...formData, relation: e.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">Contact Number</label>
        <input
          type="text"
          className="border p-2 rounded"
          required
          onChange={(e) =>
            setFormData({ ...formData, contact_number: e.target.value })
          }
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-2 rounded"
      >
        Save Contact Person
      </button>
    </form>
  );
}
