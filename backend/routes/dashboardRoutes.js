const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Dashboard Summary
router.get("/summary", async (req, res) => {
  try {
    // A. Fetch infrastructure lot counts
    const inventoryPromise = db.query(
      `SELECT status, COUNT(*) as count FROM plots GROUP BY status`,
    );

    // B. Combine 8 most recent Transactions AND Payments into a single feed
    const recentActivityPromise = db.query(`
      (
        SELECT 
          'transaction' as record_type,
          t.transaction_id as id,
          t.client_id,
          CONCAT(c.first_name, ' ', c.last_name) AS client_name,
          t.date_created AS date,
          t.professional_receipt,
          t.sales_invoice,
          CONCAT('Block ', p.block, ' Lot ', p.lot) AS plot,
          p.plot_type,
          t.plot_price AS amount,
          t.remaining_balance,
          t.status
        FROM transactions t
        JOIN clients c ON t.client_id = c.client_id
        LEFT JOIN plots p ON t.plot_id = p.plot_id
        WHERE t.is_deleted = 0 AND c.is_deleted = 0
      )
      UNION ALL
      (
        SELECT 
          'payment' as record_type,
          pay.payment_id as id,
          t.client_id,
          CONCAT(c.first_name, ' ', c.last_name) AS client_name,
          pay.payment_date AS date,
          pay.professional_receipt, -- FIXED: Changed from pay.receipt_number
          t.sales_invoice,
          CONCAT('Block ', p.block, ' Lot ', p.lot) AS plot,
          p.plot_type,
          pay.amount_paid AS amount,
          t.remaining_balance,
          'Paid' AS status
        FROM payments pay
        JOIN transactions t ON pay.transaction_id = t.transaction_id
        JOIN clients c ON t.client_id = c.client_id
        LEFT JOIN plots p ON t.plot_id = p.plot_id
        WHERE t.is_deleted = 0 AND c.is_deleted = 0
      )
      ORDER BY date DESC
      LIMIT 8
    `);

    // C. Fetch Active Transactions to calculate Overdue logic
    const activeTransactionsPromise = db.query(`
      SELECT 
        t.transaction_id, t.client_id, CONCAT(c.first_name, ' ', c.last_name) AS client_name, 
        t.professional_receipt AS pr_number, t.sales_invoice AS si_number, 
        t.plot_price, t.downpayment, t.due_date,
        t.remaining_balance, t.monthlypayment, t.date_created
      FROM transactions t 
      JOIN clients c ON t.client_id = c.client_id
      WHERE t.is_deleted = 0 AND c.is_deleted = 0 
        AND t.remaining_balance > 0 
        AND t.status NOT IN ('Paid', 'Cleared', 'Fully Paid', 'Completed')
    `);

    // D. Operational Feed
    const activityPromise = db.query(
      `SELECT 'audit' AS log_type, action_description AS description, employee_id AS operator, date_time AS log_date FROM audit_logs`,
    );

    // E. Calendar: Interments
    const calendarIntermentsPromise = db.query(`
      SELECT date_of_interment AS date, CONCAT(first_name, ' ', last_name) AS deceased_name 
      FROM interments WHERE is_deleted = 0 AND date_of_interment IS NOT NULL
    `);

    const [
      [inventoryRows],
      [mixedTransactionsRows],
      [activeTxnRows],
      [activityRows],
      [intermentsRows],
    ] = await Promise.all([
      inventoryPromise,
      recentActivityPromise,
      activeTransactionsPromise,
      activityPromise,
      calendarIntermentsPromise,
    ]);

    let availableLots = 0;
    let occupiedLots = 0;

    inventoryRows.forEach((row) => {
      const currentStatus = row.status?.toLowerCase();
      if (currentStatus === "available") availableLots = row.count;
      if (currentStatus === "occupied" || currentStatus === "sold")
        occupiedLots = row.count;
    });

    // --- DYNAMIC DUE DATE & OVERDUE LOGIC ---
    const noticesRows = [];
    const duesRows = [];
    const today = new Date();

    activeTxnRows.forEach((txn) => {
      // 1. Use the exact due date stored in the database
      let nextDueDate = txn.due_date
        ? new Date(txn.due_date)
        : new Date(txn.date_created);
      if (!txn.due_date) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      // 2. Add to calendar (This ensures the dot stays there for the due date)
      duesRows.push({
        date: nextDueDate.toISOString().split("T")[0],
        client_name: txn.client_name,
      });

      // 3. Overdue check: If they paid for the month, the DB updates the due_date to next month,
      // making it > today, which automatically hides the overdue warning!
      if (nextDueDate < today) {
        const diffTime = Math.abs(today - nextDueDate);
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let monthsOverdue =
          (today.getFullYear() - nextDueDate.getFullYear()) * 12;
        monthsOverdue -= nextDueDate.getMonth();
        monthsOverdue += today.getMonth();

        // 1% Penalty per month overdue applied to remaining balance
        let penalty = 0;
        if (monthsOverdue > 0) {
          penalty = parseFloat(txn.monthlypayment) * 0.01 * monthsOverdue;
        }

        noticesRows.push({
          client_id: txn.client_id,
          client_name: txn.client_name,
          pr_number: txn.pr_number,
          si_number: txn.si_number,
          days_overdue: daysOverdue,
          remaining_balance: parseFloat(txn.monthlypayment) + penalty,
        });
      }
    });

    noticesRows.sort((a, b) => b.days_overdue - a.days_overdue);

    res.json({
      inventory: { available: availableLots, occupied: occupiedLots },
      recentTransactions: mixedTransactionsRows,
      overdueNotices: noticesRows.slice(0, 5),
      recentActivity: activityRows,
      calendarEvents: {
        interments: intermentsRows,
        due_dates: duesRows,
      },
    });
  } catch (error) {
    console.error("Master Operational Summary Stack Error:", error);
    res
      .status(500)
      .json({ error: "Failed to compile master records sequence" });
  }
});

// Inter-Connected Search Entry
router.get("/search-all", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") return res.json([]);

    const wildcardPattern = `%${q}%`;

    const [rows] = await db.query(
      `
      SELECT DISTINCT 
        c.client_id, 
        CONCAT(c.first_name, ' ', c.last_name) AS name, 
        c.contact_number,
        'Client Base' AS match_type,
        'Direct core identity registry match' AS context_details,
        CONCAT('/clients/', c.client_id) AS url
      FROM clients c
      WHERE c.is_deleted = 0 AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.contact_number LIKE ?)
      
      UNION
      
      SELECT DISTINCT 
        c.client_id, 
        CONCAT( t.professional_receipt, ' | ', t.sales_invoice) AS name, 
        c.contact_number,
        'Transaction Ledger' AS match_type,
        CONCAT('Linked via invoice. Balance: ₱', t.remaining_balance) AS context_details,
        CONCAT('/clients/', c.client_id) AS url
      FROM transactions t
      JOIN clients c ON t.client_id = c.client_id
      WHERE t.is_deleted = 0 AND c.is_deleted = 0 AND (t.professional_receipt LIKE ? OR t.sales_invoice LIKE ? OR t.transaction_id LIKE ?)

      UNION

      SELECT DISTINCT 
        c.client_id, 
        CONCAT(i.first_name, ' ', i.last_name) AS name, 
        c.contact_number,
        'Historical Interment' AS match_type,
        CONCAT('Family relative/contact: ', c.first_name, ' ', c.last_name) AS context_details,
        CONCAT('/clients/', c.client_id) AS url
      FROM interments i
      JOIN transactions t ON i.transaction_id = t.transaction_id
      JOIN clients c ON t.client_id = c.client_id
      WHERE i.is_deleted = 0 AND t.is_deleted = 0 AND c.is_deleted = 0 AND (i.first_name LIKE ? OR i.last_name LIKE ?)
      LIMIT 8
    `,
      [
        wildcardPattern,
        wildcardPattern,
        wildcardPattern,
        wildcardPattern,
        wildcardPattern,
        wildcardPattern,
        wildcardPattern,
        wildcardPattern,
      ],
    );

    res.json(rows);
  } catch (error) {
    console.error("Deep Matrix Global Entity Search Failure:", error);
    res
      .status(500)
      .json({ error: "Deep interconnected query logic error occurred" });
  }
});

module.exports = router;
