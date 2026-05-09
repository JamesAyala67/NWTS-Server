const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Test to check if server is running
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running" });
});
// Get all clients
app.get("/api/clients", async (req, res) => {
  try {
    const [clients] = await db.query(
      "SELECT * FROM clients WHERE is_deleted = FALSE",
    );

    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients: ", error);
    res.status(500).json({ error: "Failed to fetch clients from database" });
  }
});
// Create new client
app.post("/api/clients", async (req, res) => {
  try {
    const {
      client_id,
      name,
      birthdate,
      civil_status,
      contact_number,
      address,
    } = req.body;

    const query =
      "INSERT INTO clients (client_id, name, birthdate, civil_status, contact_number, address) VALUES (?, ?, ?, ?, ?, ?)";

    await db.query(query, [
      client_id,
      name,
      birthdate,
      civil_status,
      contact_number,
      address,
    ]);
    res.status(201).json({ message: "Client created successful" });
  } catch (error) {
    console.error("Error creating client: ", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});
// Soft delete client
app.patch("/api/clients/:id/delete", async (req, res) => {
  try {
    const clientId = req.params.id;

    const query = "UPDATE clients SET is_deleted = TRUE WHERE client_id = ?";
    await db.query(query, [clientId]);

    res.json({
      message: `Client ${clientId} has been successfully soft deleted`,
    });
  } catch (error) {
    console.error("Error soft deleting cliend: ", error);
    res.status(500).json({ error: "Failed on soft delete client" });
  }
});
// Update client information
app.put("/api/clients/:id", async (req, res) => {
  try {
    const clientID = req.params.id;
    const { name, contact_number, civil_status } = req.body;

    const query =
      "UPDATE clients SET name = ?, contact_number = ?, civil_status = ?, updated_at = NOW() WHERE client_id = ?";
    await db.query(query, [name, contact_number, civil_status, clientID]);

    res.json({ message: `Client ${clientID} updated successfully` });
  } catch (error) {
    console.error("Error updating client: ", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
