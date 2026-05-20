const express = require("express");
const router = express.Router();
const db = require("../config/db");
const logAudit = require("../utils/auditLogger");

// Record a new transaction
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  const transactionDate = req.body.transaction_date
    ? new Date(req.body.transaction_date)
    : new Date();

  const dueDate = new Date(transactionDate);
  dueDate.setMonth(dueDate.getMonth() + 1);

  // Format the date for MySQL (YYYY-MM-DD)
  const formattedDueDate = dueDate.toISOString().split("T")[0];

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

    // --- DOUBLE BOOKING GUARD ---
    // Lock the plot row for the duration of this transaction.
    // Any concurrent request trying to book the same plot will block here
    // until this transaction commits or rolls back, preventing race conditions.
    const [plotRows] = await connection.query(
      "SELECT status FROM plots WHERE plot_id = ? FOR UPDATE",
      [plot_id],
    );

    if (plotRows.length === 0) {
      throw new Error("Plot not found.");
    }

    if (plotRows[0].status !== "Available") {
      const err = new Error(
        `Plot ${plot_id} is no longer available (status: ${plotRows[0].status}). Please select a different plot.`,
      );
      err.statusCode = 409;
      throw err;
    }
    // --- END DOUBLE BOOKING GUARD ---

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
      (transaction_id, client_id, professional_receipt, sales_invoice, plot_id, plot_type, plot_size, plot_price, downpayment, monthlypayment, remaining_balance, status, years_to_pay, remarks, prepared_by, due_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction_id,
        client_id,
        professional_receipt || "",
        sales_invoice || "",
        plot_id,
        plot_type,
        plot_size,
        plot_price,
        downpayment,
        monthlypayment,
        remaining_balance,
        status || "Pending",
        years_to_pay || 0,
        remarks || "",
        prepared_by,
        formattedDueDate,
      ],
    );

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
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
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
