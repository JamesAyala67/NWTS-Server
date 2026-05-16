const express = require("express");
const router = express.Router();
const db = require("../config/db");
// for handling file uploads (client files)
const fs = require("fs");
const multer = require("multer");
const path = require("path");
// Create Upload folder if it doesn't exist
const uploadDir = "../uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// For Client Page
// Create new client
router.post("/", async (req, res) => {
  try {
    const {
      client_id,
      first_name,
      middle_name,
      last_name,
      birthdate,
      civil_status,
      contact_number,
      province,
      city,
      barangay,
    } = req.body;

    const query =
      "INSERT INTO clients (client_id, first_name, middle_name, last_name, birthdate, civil_status, contact_number, province, city, barangay) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    await db.query(query, [
      client_id,
      first_name,
      middle_name,
      last_name,
      birthdate,
      civil_status,
      contact_number,
      province,
      city,
      barangay,
    ]);
    res.status(201).json({ message: "Client created successfully" });
  } catch (error) {
    console.error("Error creating client: ", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});
// Update client information
router.put("/:id", async (req, res) => {
  try {
    const clientID = req.params.id;
    const {
      first_name,
      middle_name,
      last_name,
      contact_number,
      civil_status,
      birthdate,
      province,
      city,
      barangay,
    } = req.body;
    // Update the selected client with a new information
    const query =
      "UPDATE clients SET first_name = ?, middle_name = ?, last_name = ?, contact_number = ?, civil_status = ?, birthdate = ?, province = ?, city = ?, barangay = ?, updated_at = NOW() WHERE client_id = ?";
    await db.query(query, [
      first_name,
      middle_name,
      last_name,
      contact_number,
      civil_status,
      birthdate,
      province,
      city,
      barangay,
      clientID,
    ]);

    res.json({ message: `Client ${clientID} updated successfully` });
  } catch (error) {
    console.error("Error updating client: ", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});
// Get all clients
router.get("/", async (req, res) => {
  try {
    // Fetch only those client that have not been soft deleted (is_deleted = FALSE)
    const [clients] = await db.query(
      "SELECT * FROM clients WHERE is_deleted = FALSE",
    );

    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients: ", error);
    res.status(500).json({ error: "Failed to fetch clients from database" });
  }
});
// Soft delete client
router.patch("/:id/delete", async (req, res) => {
  try {
    const clientId = req.params.id;
    // By changing the is_deleted to TRUE
    // The client will be hidden from the frontend
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

// For Client Dashboard
// Fetch the selected client with all of its related data
router.get("/:id", async (req, res) => {
  try {
    const clientId = req.params.id;
    // Fetch the selected client, for its basic info and to check if it exists
    const [clientRows] = await db.query(
      "SELECT * FROM clients WHERE client_id = ? AND is_deleted = FALSE",
      [clientId],
    );
    // if no client has been found, Return a 404 Error instead
    if (clientRows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const clientData = clientRows[0];
    // Fetch co-purchasers based on the selected Client
    const [coPurchasers] = await db.query(
      "SELECT * FROM co_purchaser WHERE client_id = ? AND is_deleted = FALSE",
      [clientId],
    );
    // Fetch contact persons based on the selected Client
    const [contactPersons] = await db.query(
      "SELECT * FROM contact_person WHERE client_id = ? AND is_deleted = FALSE",
      [clientId],
    );
    // Fetch transactions based on the selected Client
    const [transactions] = await db.query(
      "SELECT * FROM transactions WHERE client_id = ? AND is_deleted = FALSE ORDER BY date_created DESC",
      [clientId],
    );
    // Fetch client files based on the selected Client
    const [clientFiles] = await db.query(
      "SELECT * FROM client_files WHERE client_id = ? AND is_deleted = FALSE",
      [clientId],
    );
    // Combine all fetched data
    res.json({
      ...clientData,
      co_purchasers: coPurchasers,
      contact_persons: contactPersons,
      transactions: transactions,
      client_files: clientFiles,
    });
  } catch (error) {
    console.error("Error fetching client profile: ", error);
    res.status(500).json({ error: "Failed to fetch client profile" });
  }
});
// Add Client File Record
router.post("/:id/files", upload.single("file"), async (req, res) => {
  try {
    const { transaction_id, file_name } = req.body;
    const clientId = req.params.id;
    // Validation ta nauuyam na ako
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const filePath = req.file.path;
    const fileId = `FILE-${Date.now()}`;
    // Insert file record into the database
    const sql = `
      INSERT INTO client_files (file_id, client_id, transaction_id, file_name, file_path, is_deleted)
      VALUES (?, ?, ?, ?, ?, 0)
    `;
    await db.query(sql, [
      fileId,
      clientId,
      transaction_id,
      file_name,
      filePath,
    ]);
    res.status(201).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading file: ", error);
    res.status(500).json({ error: error.message });
  }
});
// Soft Delete Client File Record
router.delete("/files/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    // Set is_deleted to 1 to soft delete
    const query = "UPDATE client_files SET is_deleted = 1 WHERE file_id = ?";
    await db.query(query, [fileId]);

    res.json({
      message: `File ${fileId} has been successfully soft deleted`,
    });
  } catch (error) {
    console.error("Error soft deleting file: ", error);
    res.status(500).json({ error: "Failed to soft delete file" });
  }
});

module.exports = router;
