const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Record a new transaction
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      transaction_id,
      client_id,
      plot_id,
      plot_type,
      plot_size,
      plot_price,
      downpayment,
      monthlypayment,
      remaining_balance,
      status,
      years_to_pay,
      prepared_by,
    } = req.body;

    await connection.beginTransaction();

    // Insert a new transaction record
    await connection.query(
      `INSERT INTO transactions 
      (transaction_id, client_id, plot_id, plot_type, plot_size, plot_price, downpayment, monthlypayment, remaining_balance, status, years_to_pay, prepared_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction_id,
        client_id,
        plot_id,
        plot_type,
        plot_size,
        plot_price,
        downpayment,
        monthlypayment,
        remaining_balance,
        status,
        years_to_pay,
        prepared_by,
      ],
    );

    // Update the plot status to ""Sold" after successful transaction recording
    // PS: Dae ko aram kung anong tama lalaag ko digdi
    await connection.query(
      "UPDATE plots SET status = 'Reserved' WHERE plot_id = ?",
      [plot_id],
    );

    await connection.commit();

    res
      .status(201)
      .json({ message: "Transaction saved and plot marked as Sold!" });
  } catch (error) {
    // UNDO EVERYTHING IF EITHER QUERY FAILS
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "Failed to save transaction" });
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
    // Send the combined Transaction and Payments data
    res.json({
      ...rows[0],
      payments: payments,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// Handles Plot Transfer between Clients (TANGAL NA NI SABI NI DAVID)
router.post("/transfer", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      old_transaction_id,
      new_client_id,
      plot_id,
      transfer_fee,
      prepared_by,
    } = req.body;

    await connection.beginTransaction();

    await connection.query(
      "UPDATE transactions SET status = 'Transferred' WHERE transaction_id = ?",
      [old_transaction_id],
    );

    const [oldTxnRows] = await connection.query(
      "SELECT plot_type, plot_size FROM transactions WHERE transaction_id = ?",
      [old_transaction_id],
    );

    if (oldTxnRows.length === 0)
      throw new Error("Original transaction not found.");
    const { plot_type, plot_size } = oldTxnRows[0];

    const new_transaction_id = `TXN-TRF-${Date.now()}`;
    await connection.query(
      `INSERT INTO transactions 
      (transaction_id, client_id, plot_id, plot_type, plot_size, plot_price, downpayment, monthlypayment, remaining_balance, status, years_to_pay, prepared_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        new_transaction_id,
        new_client_id,
        plot_id,
        plot_type,
        plot_size,
        transfer_fee || 0,
        0,
        0,
        0,
        "Completed",
        0,
        prepared_by,
      ],
    );

    await connection.commit();
    res.status(200).json({ message: "Plot successfully transferred!" });
  } catch (error) {
    await connection.rollback();
    console.error("Transfer error:", error);
    res.status(500).json({ error: "Failed to transfer plot." });
  } finally {
    connection.release();
  }
});

// log a maintenance for a specific transaction (Kaiba kani and Audit_Logs)
router.post("/maintenance", async (req, res) => {
  const connection = await db.getConnection(); // Get connection for transaction

  try {
    const {
      plot_id,
      transaction_id,
      description,
      cost,
      payment_status,
      scheduled_date,
      prepared_by,
    } = req.body;

    // Start SQL Transaction
    await connection.beginTransaction();

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const maintenance_id = `MNT-${Date.now()}-${randomSuffix}`;

    const insertLogQuery = `
      INSERT INTO maintenance_logs 
      (maintenance_id, plot_id, transaction_id, description, cost, payment_status, scheduled_date, prepared_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 1. Insert the maintenance log
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

    // 2. Update the Plot Status to "Maintenance"
    await connection.query(
      "UPDATE plots SET status = 'Maintenance' WHERE plot_id = ?",
      [plot_id],
    );

    // Commit both changes
    await connection.commit();

    res.status(201).json({
      message: "Maintenance scheduled and plot updated to Maintenance!",
    });
  } catch (error) {
    // If either query fails, undo everything
    await connection.rollback();
    console.error("Error logging maintenance:", error);
    res.status(500).json({ error: "Failed to schedule maintenance." });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
});

// Fetch all maintenance logs with associated transaction and client details (pKaiba kani ang Audit_logs)
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

// Fetch maintenance logs for a specific transaction (Kaiba kani ang Audit_Logs)
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

// Update maintenance payment status to "Paid" (Kaiba kani ang Audit_Logs)
router.patch("/maintenance/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE maintenance_logs SET payment_status = 'Paid' WHERE maintenance_id = ?",
      [id],
    );
    res.json({ message: "Maintenance marked as paid!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update status." });
  }
});
module.exports = router;
