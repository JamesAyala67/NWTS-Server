const express = require("express");
const router = express.Router();
const db = require("../config/db");
const logAudit = require("../utils/auditLogger");
const fs = require("fs");
const multer = require("multer");

const uploadDir = "../uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

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
      prepared_by,
      employee_id,
    } = req.body;

    const rawEmployee = employee_id;

    // Added prepared_by and explicit created_at timestamp execution
    const query = `
      INSERT INTO clients 
      (client_id, first_name, middle_name, last_name, birthdate, civil_status, contact_number, province, city, barangay, prepared_by, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

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
      prepared_by,
    ]);

    const activeEmployee =
      rawEmployee && rawEmployee.trim() !== "" ? rawEmployee : "EMP-001";

    await logAudit(
      activeEmployee,
      "CREATE CLIENT",
      `Created new client profile for ${last_name}, ${first_name}`,
      client_id,
    );

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
      edited_by,
      employee_id,
    } = req.body;

    const activeEmployee = employee_id || edited_by;

    // Added edited_by update matching tracking specifications
    const query = `
      UPDATE clients 
      SET first_name = ?, middle_name = ?, last_name = ?, contact_number = ?, civil_status = ?, birthdate = ?, province = ?, city = ?, barangay = ?, edited_by = ?, updated_at = NOW() 
      WHERE client_id = ?
    `;

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
      activeEmployee,
      clientID,
    ]);

    await logAudit(
      activeEmployee,
      "EDIT CLIENT",
      `Updated details for client ${first_name} ${last_name}`,
      clientID,
    );

    res.json({ message: `Client ${clientID} updated successfully` });
  } catch (error) {
    console.error("Error updating client: ", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Get all clients
router.get("/", async (req, res) => {
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

// Soft delete client
router.patch("/:id/delete", async (req, res) => {
  try {
    const clientId = req.params.id;
    const { deleted_by, employee_id } = req.body;
    const activeEmployee = employee_id || deleted_by;

    const query = "UPDATE clients SET is_deleted = TRUE WHERE client_id = ?";
    await db.query(query, [clientId]);

    await logAudit(
      activeEmployee,
      "SOFT-DELETED CLIENT",
      `Soft deleted client ID: ${clientId}`,
      clientId,
    );

    res.json({
      message: `Client ${clientId} has been successfully soft deleted`,
    });
  } catch (error) {
    console.error("Error soft deleting client: ", error);
    res.status(500).json({ error: "Failed on soft delete client" });
  }
});

// Fetch client layout dashboard profile
router.get("/:id", async (req, res) => {
  try {
    const clientId = req.params.id;
    const [clientRows] = await db.query(
      "SELECT * FROM clients WHERE client_id = ? AND is_deleted = FALSE",
      [clientId],
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const clientData = clientRows[0];

    const [coPurchasers] = await db.query(
      "SELECT * FROM co_purchaser WHERE client_id = ? AND is_deleted = FALSE",
      [clientId],
    );
    const [contactPersons] = await db.query(
      "SELECT * FROM contact_person WHERE client_id = ? AND is_deleted = FALSE",
      [clientId],
    );
    const [transactions] = await db.query(
      "SELECT * FROM transactions WHERE client_id = ? AND is_deleted = FALSE ORDER BY date_created DESC",
      [clientId],
    );
    const [clientFiles] = await db.query(
      "SELECT * FROM client_files WHERE client_id = ? AND is_deleted = FALSE",
      [clientId],
    );

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

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const filePath = req.file.path;
    const fileId = `FILE-${Date.now()}`;

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
    const query = "UPDATE client_files SET is_deleted = 1 WHERE file_id = ?";
    await db.query(query, [fileId]);

    res.json({ message: `File ${fileId} has been successfully soft deleted` });
  } catch (error) {
    console.error("Error soft deleting file: ", error);
    res.status(500).json({ error: "Failed to soft delete file" });
  }
});

module.exports = router;
