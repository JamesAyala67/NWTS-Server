const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.post("/", async (req, res) => {
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

    // 1. Save the transaction
    await db.query(
      "INSERT INTO transactions (transaction_id, client_id, plot_id, plot_type, plot_size, plot_price, downpayment, monthlypayment, remaining_balance, status, years_to_pay, prepared_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

    // 2. NEW LOGIC: Instantly mark the plot as 'Sold' in the inventory!
    await db.query("UPDATE plots SET status = 'Sold' WHERE plot_id = ?", [
      plot_id,
    ]);

    res
      .status(201)
      .json({ message: "Transaction saved and plot marked as Sold!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save transaction" });
  }
});

module.exports = router;
