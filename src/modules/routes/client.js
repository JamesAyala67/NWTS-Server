import express from "express";
import { db } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { name, contact_number, address, birtdate, civil_status } = req.body;
  const id = crypto.randomUUID();

  await db.query(
    "INSERT INTO clients (client_id, name, contact_number, address, birtdate, civil_status) VALUES (?, ?, ?, ?, ?, ?)",
    [id, name, contact_number, address, birtdate, civil_status],
  );

  await db.query(
    "INSERT INTO audit_logs (audit_id, employee_id, entity_type, entity_id, action) VALUES (?, ?, `CLIENT`, ?, `CREATE CLIEANT`)",
    [crypto.randomUUID(), req.user.id, id],
  );

  res.sendStatus("Client Create");
});

router.get("/", auth, async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM clients WHERE is_deleted = FALSE",
  );

  res.json(rows);
});

router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { name, contact_number } = req.body;

  await db.query(
    "UPDATE clients SET name = ?, contact_number = ? WHERE client_id = ?",
    [name, contact_number, id],
  );

  await db.query(
    "INSERT INTO audit_logs (audit_id, employee_id, entity_type, entity_id, action) VALUES (?, ?, `CLIENT`, ?, `UPDATE CLIENT`)",
    [crypto.randomUUID(), req.user.id, id],
  );

  res.sendStatus("Updated");
});

router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  await db.query("UPDATE clients SET is_deleted = TRUE WHERE client_id=?", [
    id,
  ]);

  res.send("Soft deleted");
});
