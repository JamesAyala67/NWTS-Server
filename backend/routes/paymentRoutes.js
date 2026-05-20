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
      professional_receipt, // Grab the PR string from frontend
      sales_invoice, // Grab the SI string from frontend
      amount_paid,
      payment_method,
      reference_number,
      recorded_by,
      employee_id, // Safely extract the system user's ID
    } = req.body;

    const activeEmployee =
      employee_id && employee_id.trim() !== "" ? employee_id : null;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const payment_id = `PAY-${Date.now()}-${randomSuffix}`;

    await connection.beginTransaction();

    // Insert a new payment record (Updated with professional_receipt and sales_invoice columns)
    await connection.query(
      "INSERT INTO payments (payment_id, transaction_id, professional_receipt, sales_invoice, amount_paid, payment_method, reference_number, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        payment_id,
        transaction_id,
        professional_receipt,
        sales_invoice,
        amount_paid,
        payment_method,
        reference_number,
        recorded_by,
      ],
    );

    // Update the transaction's remaining balance AND advance the due date by 1 month
    await connection.query(
      `UPDATE transactions 
       SET remaining_balance = remaining_balance - ?, 
           due_date = DATE_ADD(COALESCE(due_date, date_created), INTERVAL 1 MONTH) 
       WHERE transaction_id = ?`,
      [amount_paid, transaction_id]
    );

    // Check the new remaining balance
    const [updatedTxn] = await connection.query(
      "SELECT remaining_balance, plot_id FROM transactions WHERE transaction_id = ?",
      [transaction_id],
    );

    let completionNote = "";

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

      completionNote =
        " Transaction is now fully paid. Plot status updated to Occupied.";
    }

    // Dynamic description identifying the specific logged-in system executor vs selected field agent
    const systemLoggerNote = ` Prepared by/Assisting staff: ${recorded_by}.`;

    // Execute Audit Log safely within the SQL transaction
    await logAudit(
      activeEmployee,
      "ADD PAYMENT",
      `Recorded a payment of ₱${Number(amount_paid).toLocaleString()} for ${professional_receipt}, ${sales_invoice} via ${payment_method}.${systemLoggerNote}${completionNote}`,
      transaction_id,
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
