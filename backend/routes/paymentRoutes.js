const express = require("express");
const router = express.Router();
const db = require("../config/db");

// For Audit Logging
const logAudit = require("../utils/auditLogger");

// Record a new payment
router.post("/", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      transaction_id,
      amount_paid,
      payment_method,
      reference_number,
      recorded_by,
    } = req.body;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const payment_id = `PAY-${Date.now()}-${randomSuffix}`;
    await connection.beginTransaction();

    // Insert a new payment record
    await connection.query(
      "INSERT INTO payments (payment_id, transaction_id, amount_paid, payment_method, reference_number, recorded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [
        payment_id,
        transaction_id,
        amount_paid,
        payment_method,
        reference_number,
        recorded_by,
      ],
    );

    // Update the transactions remaining balance
    await connection.query(
      "UPDATE transactions SET remaining_balance = remaining_balance - ? WHERE transaction_id = ?",
      [amount_paid, transaction_id],
    );

    // Check the new remaining balance
    const [updatedTxn] = await connection.query(
      "SELECT remaining_balance, plot_id FROM transactions WHERE transaction_id = ?",
      [transaction_id],
    );

    // If fully paid update Transaction status AND Plot status
    if (updatedTxn[0].remaining_balance <= 0) {
      // Mark transaction as Completed
      await connection.query(
        "UPDATE transactions SET status = 'Completed', remaining_balance = 0 WHERE transaction_id = ?",
        [transaction_id],
      );

      // Mark the plot as Occupied
      await connection.query(
        "UPDATE plots SET status = 'Occupied' WHERE plot_id = ?",
        [updatedTxn[0].plot_id],
      );
    }

    await logAudit(
      recorded_by,
      "ADD PAYMENT",
      `Recorded a payment of ₱${amount_paid} for Transaction ${transaction_id} via ${payment_method}.`,
      connection,
    );

    // Commit all changes to the database
    await connection.commit();
    res.status(201).json({ message: "Payment recorded successfully!" });
  } catch (error) {
    // If anything fails, undo all changes
    if (connection) await connection.rollback();
    console.error("Payment error:", error);
    res.status(500).json({ error: "Failed to record payment" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
