const express = require("express");
const router = express.Router();
const db = require("../config/db");
const logAudit = require("../utils/auditLogger");

// Record a new transaction
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      client_id,
      professional_receipt,
      sales_invoice,
      plot_id,
      plot_type,
      plot_size,
      plot_price,
      downpayment,
      monthlypayment,
      remaining_balance,
      status,
      years_to_pay,
      remarks,
      prepared_by,
      employee_id,
    } = req.body;

    const activeEmployee = employee_id || prepared_by || "EMP-001";

    await connection.beginTransaction();

    // Actually fetch the last transaction ID from the database
    const [lastTxn] = await connection.query(
      "SELECT transaction_id FROM transactions ORDER BY transaction_id DESC LIMIT 1",
    );

    let transaction_id = "TXN-0001";
    if (lastTxn.length > 0 && lastTxn[0].transaction_id) {
      const lastNumber = parseInt(lastTxn[0].transaction_id.split("-")[1] || 0);
      transaction_id = `TXN-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    // Insert new transaction record
    await connection.query(
      `INSERT INTO transactions 
      (transaction_id, client_id, professional_receipt, sales_invoice, plot_id, plot_type, plot_size, plot_price, downpayment, monthlypayment, remaining_balance, status, years_to_pay, remarks, prepared_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction_id,
        client_id,
        professional_receipt,
        sales_invoice,
        plot_id,
        plot_type,
        plot_size,
        plot_price,
        downpayment,
        monthlypayment,
        remaining_balance,
        status,
        years_to_pay,
        remarks,
        prepared_by,
      ],
    );

    // Added the missing [client_id] parameter
    const [clients] = await connection.query(
      "SELECT * FROM clients WHERE is_deleted = FALSE AND client_id = ?",
      [client_id],
    );

    if (clients.length === 0) {
      throw new Error("Client not found");
    }

    // Update the plot status to Reserved
    await connection.query(
      "UPDATE plots SET status = 'Reserved' WHERE plot_id = ?",
      [plot_id],
    );

    // Properly extracted names from the database result, not the string ID
    const client = clients[0];
    const middleInitial = client.middle_name
      ? `${client.middle_name.charAt(0)}.`
      : "";
    const fullname =
      `${client.last_name}, ${client.first_name} ${middleInitial}`.trim();

    // Write to Audit Logs
    await logAudit(
      activeEmployee,
      "CREATE TRANSACTION",
      `Created transaction ${professional_receipt}, ${sales_invoice} for ${fullname} (Plot: ${plot_id}). Balance: ₱${remaining_balance}`,
      transaction_id,
      connection,
    );

    await connection.commit();

    res.status(201).json({
      message: "Transaction saved and plot marked as Reserved",
      transaction_id,
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res
      .status(500)
      .json({ error: error.message || "Failed to save transaction" });
  } finally {
    connection.release();
  }
});

// Handles Transaction with its associated details
router.get("/:id", async (req, res) => {
  try {
    const transactionId = req.params.id;

    // Fetch Transaction, Plots, and Client Details
    const [rows] = await db.query(
      `SELECT t.*, p.block, p.lot, c.first_name, c.last_name 
       FROM transactions t
       JOIN plots p ON t.plot_id = p.plot_id
       JOIN clients c ON t.client_id = c.client_id
       WHERE t.transaction_id = ?`,
      [transactionId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Fetch all associated payments for this Transaction
    const [payments] = await db.query(
      "SELECT * FROM payments WHERE transaction_id = ? ORDER BY payment_date DESC",
      [transactionId],
    );

    res.json({
      ...rows[0],
      payments: payments,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// Log a maintenance for a specific transaction
router.post("/maintenance", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      plot_id,
      transaction_id,
      description,
      cost,
      payment_status,
      scheduled_date,
      prepared_by,
      employee_id,
    } = req.body;

    const activeEmployee = employee_id || prepared_by || "EMP-001";

    await connection.beginTransaction();

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const maintenance_id = `MNT-${Date.now()}-${randomSuffix}`;

    const insertLogQuery = `
      INSERT INTO maintenance_logs 
      (maintenance_id, plot_id, transaction_id, description, cost, payment_status, scheduled_date, prepared_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Insert new Maintenance Record
    await connection.query(insertLogQuery, [
      maintenance_id,
      plot_id,
      transaction_id,
      description,
      cost || 0,
      payment_status || "Pending",
      scheduled_date,
      prepared_by || "Admin",
    ]);

    // Update the Plot Status to Maintenance
    await connection.query(
      "UPDATE plots SET status = 'Maintenance' WHERE plot_id = ?",
      [plot_id],
    );

    // Write to Audit Logs
    await logAudit(
      activeEmployee,
      "SCHEDULE MAINTENANCE",
      `Scheduled maintenance tasks for Plot ${plot_id}. Status set to Pending.`,
      transaction_id,
      connection,
    );

    await connection.commit();

    res.status(201).json({
      message: "Maintenance scheduled and plot updated to Maintenance!",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error logging maintenance:", error);
    res.status(500).json({ error: "Failed to schedule maintenance." });
  } finally {
    connection.release();
  }
});

// Fetch all maintenance logs with associated transaction and client details
router.get("/maintenance", async (req, res) => {
  try {
    const query = `
      SELECT m.*, t.client_id, c.first_name, c.last_name 
      FROM maintenance_logs m
      LEFT JOIN transactions t ON m.transaction_id = t.transaction_id
      LEFT JOIN clients c ON t.client_id = c.client_id
      ORDER BY m.created_at DESC
    `;
    const [logs] = await db.query(query);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching maintenance logs:", error);
    res.status(500).json({ error: "Failed to fetch maintenance logs." });
  }
});

// Fetch maintenance logs for a specific transaction
router.get("/:transactionId/maintenance", async (req, res) => {
  try {
    const { transactionId } = req.params;
    const query = `
      SELECT * FROM maintenance_logs 
      WHERE transaction_id = ? 
      ORDER BY scheduled_date DESC
    `;
    const [logs] = await db.query(query, [transactionId]);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching transaction maintenance logs:", error);
    res.status(500).json({ error: "Failed to fetch maintenance logs." });
  }
});

// Update maintenance payment status to Paid
router.patch("/maintenance/:id/pay", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const employee_id =
      req.body.employee_id || req.body.prepared_by || "EMP-001";

    await connection.beginTransaction();

    // Fetch the maintenance log to find out which plot we are dealing with
    const [logRows] = await connection.query(
      "SELECT plot_id, transaction_id FROM maintenance_logs WHERE maintenance_id = ?",
      [id],
    );

    if (logRows.length === 0) {
      throw new Error("Maintenance log not found.");
    }

    const { plot_id, transaction_id } = logRows[0];

    // Mark the maintenance as Paid
    await connection.query(
      "UPDATE maintenance_logs SET payment_status = 'Paid' WHERE maintenance_id = ?",
      [id],
    );

    // Figure out what the plot status should be reverted to
    const revertedStatus = transaction_id ? "Occupied" : "Available";

    // Update the Plot Status
    await connection.query("UPDATE plots SET status = ? WHERE plot_id = ?", [
      revertedStatus,
      plot_id,
    ]);

    // Write to Audit Logs
    await logAudit(
      employee_id,
      "COMPLETE MAINTENANCE",
      `Marked maintenance ${id} as Paid and reverted Plot ${plot_id} to ${revertedStatus}.`,
      transaction_id,
      connection,
    );

    await connection.commit();
    res.json({
      message: `Maintenance marked as paid and plot reverted to ${revertedStatus}!`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating maintenance status:", error);
    res.status(500).json({ error: "Failed to update status." });
  } finally {
    connection.release();
  }
});

// Update Transaction Remarks
router.patch("/:id/remarks", async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // Update the remarks in the database
    const [result] = await db.query(
      "UPDATE transactions SET remarks = ? WHERE transaction_id = ?",
      [remarks, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    res.json({ message: "Remarks updated successfully!" });
  } catch (error) {
    console.error("Error updating remarks:", error);
    res.status(500).json({ error: "Failed to update remarks." });
  }
});

module.exports = router;
