const express = require("express");
const router = express.Router();
const db = require("../config/db");
const logAudit = require("../utils/auditLogger");

// 1. GET ALL INTERMENTS (Ignores soft-deleted records)
router.get("/", async (req, res) => {
  try {
    const { transaction_id } = req.query;
    let query =
      "SELECT * FROM interments WHERE (is_deleted = 0 OR is_deleted IS NULL)";
    const queryParams = [];

    if (transaction_id) {
      query += " AND transaction_id = ?";
      queryParams.push(transaction_id);
    }

    query += " ORDER BY date_of_interment DESC";

    const [interments] = await db.query(query, queryParams);
    res.json(interments);
  } catch (error) {
    console.error("Error fetching interments:", error);
    res.status(500).json({ error: "Failed to fetch interments" });
  }
});

// 2. EDIT ROUTE (With Audit Tracking)
router.patch("/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { first_name, last_name, date_of_interment, location, employee_id } =
      req.body;

    await connection.beginTransaction();

    await connection.query(
      `UPDATE interments 
       SET first_name = ?, last_name = ?, date_of_interment = ?, location = ? 
       WHERE interment_id = ?`,
      [first_name, last_name, date_of_interment, location, id],
    );

    // Track modifications via audit logging
    const actionDescription = `Updated interment schedule details for record ${id} (${last_name}, ${first_name}).`;
    await logAudit(
      employee_id || "SYSTEM",
      "EDIT INTERMENT",
      actionDescription,
      null,
      connection,
    );

    await connection.commit();
    res.json({ message: "Interment updated successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating interment:", error);
    res.status(500).json({ error: "Failed to update interment" });
  } finally {
    if (connection) connection.release();
  }
});

// 3. SOFT DELETE ROUTE (With Audit Tracking)
router.patch("/:id/delete", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { employee_id } = req.body;

    await connection.beginTransaction();

    await connection.query(
      "UPDATE interments SET is_deleted = 1 WHERE interment_id = ?",
      [id],
    );

    const actionDescription = `Soft deleted interment record identifier: ${id}.`;
    await logAudit(
      employee_id || "SYSTEM",
      "SOFT_DELETE_INTERMENT",
      actionDescription,
      null,
      connection,
    );

    await connection.commit();
    res.json({ message: "Interment soft deleted successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error deleting interment:", error);
    res.status(500).json({ error: "Failed to delete interment" });
  } finally {
    if (connection) connection.release();
  }
});

// 4. CREATE SCHEDULED INTERMENT (Fixed Column Mapping for prepared_by)
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      plot_id,
      transaction_id,
      first_name,
      middle_name,
      last_name,
      date_of_birth,
      date_of_death,
      date_of_interment,
      professional_receipt,
      sales_invoice,
      location,
      remarks,
      employee_id, // Sent by client-side local-storage context
    } = req.body;

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const interment_id = `INT-${timestamp}-${randomSuffix}`;

    await connection.beginTransaction();

    // 1. Insert new interment record into table mapping 'prepared_by' properly
    await connection.query(
      `INSERT INTO interments 
      (interment_id, plot_id, transaction_id, professional_receipt, sales_invoice, first_name, middle_name, last_name, date_of_birth, date_of_death, date_of_interment, location, remarks, prepared_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        interment_id,
        plot_id,
        transaction_id,
        professional_receipt,
        sales_invoice,
        first_name,
        middle_name,
        last_name,
        date_of_birth,
        date_of_death,
        date_of_interment,
        location || "UGI",
        remarks || "N/A",
        employee_id || "EMP-001", // Populates required prepared_by database constraints
      ],
    );

    // 2. Update plot status to "Occupied"
    await connection.query(
      "UPDATE plots SET status = 'Occupied' WHERE plot_id = ?",
      [plot_id],
    );

    // 3. Create the Audit Log Entry
    const action_type = "SCHEDULE INTERMENT";
    const action_description = `Scheduled ${location || "UGI"} interment for ${last_name}, ${first_name} (Plot: ${plot_id}). ${professional_receipt}, ${sales_invoice}`;

    const auditSuccess = await logAudit(
      employee_id,
      action_type,
      action_description,
      transaction_id,
      connection,
    );

    if (!auditSuccess) throw new Error("Failed to write to audit log.");

    await connection.commit();

    res.status(201).json({
      message:
        "Interment successfully recorded, plot marked Occupied, and audit logged!",
      interment_id: interment_id,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error recording interment:", error);
    res.status(500).json({ error: "Failed to record interment" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
