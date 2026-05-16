const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Record a new payment
router.post("/", async (req, res) => {
  try {
    const {
      transaction_id,
      amount_paid,
      payment_method,
      reference_number,
      recorded_by,
    } = req.body;
    const payment_id = `PAY-${Date.now()}`;

    // Insert a new payment record
    await db.query(
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

    // Update the transaction's remaining balance
    await db.query(
      "UPDATE transactions SET remaining_balance = remaining_balance - ? WHERE transaction_id = ?",
      [amount_paid, transaction_id],
    );

    // Check if the transaction is fully paid and update status if necessary
    const [updatedTxn] = await db.query(
      "SELECT remaining_balance FROM transactions WHERE transaction_id = ?",
      [transaction_id],
    );

    // If the remaining balance is zero or less, mark the transaction as Completed
    if (updatedTxn[0].remaining_balance <= 0) {
      await db.query(
        "UPDATE transactions SET status = 'Completed', remaining_balance = 0 WHERE transaction_id = ?",
        [transaction_id],
      );
    }

    res.status(201).json({ message: "Payment recorded successfully!" });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

module.exports = router;
