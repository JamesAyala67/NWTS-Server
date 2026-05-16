const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/summary", async (req, res) => {
  try {
    // Fetch inventory summary (available vs occupied)
    const inventoryPromise = db.query(
      `SELECT status, COUNT(*) as count FROM plots GROUP BY status`,
    );
    // Fetch recent transactions with client name and plot details
    const transactionsPromise = db.query(`
      SELECT c.name AS client_name, t.date_created AS date, CONCAT('Block ', p.block, ' Lot ', p.lot) AS plot, t.monthlypayment AS amount, t.status 
      FROM transactions t JOIN clients c ON t.client_id = c.client_id LEFT JOIN plots p ON t.plot_id = p.plot_id
      WHERE t.is_deleted = 0 AND c.is_deleted = 0 ORDER BY t.date_created DESC LIMIT 5
    `);
    // Fetch notices for clients with overdue payments (over 30 days)
    const noticesPromise = db.query(`
      SELECT c.name AS client_name, t.remaining_balance, t.date_created
      FROM transactions t JOIN clients c ON t.client_id = c.client_id
      WHERE t.is_deleted = 0 AND c.is_deleted = 0 AND t.remaining_balance > 0 AND t.status NOT IN ('Paid', 'Cleared') AND t.date_created <= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY t.date_created ASC LIMIT 3
    `);
    // Fetch scheduled interment for the current month
    const intermentsPromise = db.query(`
      SELECT deceased_name, date_of_interment 
      FROM interments 
      WHERE date_of_interment IS NOT NULL
        AND MONTH(date_of_interment) = MONTH(CURRENT_DATE())
        AND YEAR(date_of_interment) = YEAR(CURRENT_DATE())
    `);
    // Run all queries
    const [[inventoryRows], [transactionRows], [noticesRows], [intermentRows]] =
      await Promise.all([
        inventoryPromise,
        transactionsPromise,
        noticesPromise,
        intermentsPromise,
      ]);

    let availableLots = 0;
    let occupiedLots = 0;

    inventoryRows.forEach((row) => {
      const currentStatus = row.status?.toLowerCase();
      if (currentStatus === "available") availableLots = row.count;
      if (currentStatus === "occupied" || currentStatus === "sold")
        occupiedLots = row.count;
    });

    res.json({
      inventory: { available: availableLots, occupied: occupiedLots },
      recentTransactions: transactionRows,
      notices: noticesRows,
      interments: intermentRows,
    });
  } catch (error) {
    console.error("Dashboard DB Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

module.exports = router;
