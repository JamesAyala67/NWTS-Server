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

    // B. Fetch 5 most recent transactions
    const transactionsPromise = db.query(`
      SELECT 
        t.client_id,
        CONCAT(c.first_name, ' ', c.last_name) AS client_name, 
        t.date_created AS date, 
        CONCAT('Block ', p.block, ' Lot ', p.lot) AS plot, 
        t.monthlypayment AS amount, 
        t.status 
      FROM transactions t 
      JOIN clients c ON t.client_id = c.client_id 
      LEFT JOIN plots p ON t.plot_id = p.plot_id
      WHERE t.is_deleted = 0 AND c.is_deleted = 0 
      ORDER BY t.date_created DESC LIMIT 5
    `);

    // C. Strict Notice Evaluator: Unpaid items older than 30 Days (Excludes Cleared/Paid rows)
    const noticesPromise = db.query(`
      SELECT 
        t.client_id,
        CONCAT(c.first_name, ' ', c.last_name) AS client_name, 
        t.remaining_balance, 
        t.date_created AS due_date,
        DATEDIFF(NOW(), t.date_created) AS days_overdue
      FROM transactions t 
      JOIN clients c ON t.client_id = c.client_id
      WHERE t.is_deleted = 0 
        AND c.is_deleted = 0 
        AND t.remaining_balance > 0 
        AND t.status NOT IN ('Paid', 'Cleared') 
        AND t.date_created <= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY t.date_created ASC LIMIT 5
    `);

    // D. Blended Operational Activity Feed: Audit Logs + Maintenance Registers (FIXED SCHEMA COLUMNS)
    const activityPromise = db.query(`
      (SELECT 
        'audit' AS log_type, 
        action_description AS description, 
        employee_id AS operator, 
        date_time AS log_date 
       FROM audit_logs)
      UNION ALL
      (SELECT 
        'maintenance' AS log_type, 
        description AS description, 
        prepared_by AS operator, 
        created_at AS log_date 
       FROM maintenance_logs)
      ORDER BY log_date DESC LIMIT 10
    `);

    // E. Unified Operations Calendar: Interments + Maintenance schedules (FIXED SCHEMA COLUMNS)
    const calendarPromise = db.query(`
      SELECT 
        'interment' AS type, 
        date_of_interment AS date, 
        CONCAT(first_name, ' ', last_name) AS title 
      FROM interments 
      WHERE is_deleted = 0 AND date_of_interment IS NOT NULL
      UNION ALL
      SELECT 
        'maintenance' AS type, 
        scheduled_date AS date, 
        description AS title 
      FROM maintenance_logs 
      WHERE scheduled_date IS NOT NULL
    `);

    // Resolve query stack concurrently
    const [
      [inventoryRows],
      [transactionRows],
      [noticesRows],
      [activityRows],
      [calendarRows],
    ] = await Promise.all([
      inventoryPromise,
      transactionsPromise,
      noticesPromise,
      activityPromise,
      calendarPromise,
    ]);

    let availableLots = 0;
    let occupiedLots = 0;

    inventoryRows.forEach((row) => {
      const currentStatus = row.status?.toLowerCase();
      if (currentStatus === "available") availableLots = row.count;
      if (currentStatus === "occupied" || currentStatus === "sold")
        occupiedLots = row.count;
    });

    // Segment localized calendar matrices
    const intermentsList = calendarRows.filter(
      (item) => item.type === "interment",
    );
    const maintenanceList = calendarRows.filter(
      (item) => item.type === "maintenance",
    );

    res.json({
      inventory: { available: availableLots, occupied: occupiedLots },
      recentTransactions: transactionRows,
      overdueNotices: noticesRows,
      recentActivity: activityRows,
      calendarEvents: {
        interments: intermentsList,
        maintenance: maintenanceList,
      },
    });
  } catch (error) {
    console.error("Master Operational Summary Stack Error:", error);
    res
      .status(500)
      .json({ error: "Failed to compile master records sequence" });
  }
});

// Inter-Connected Search Entry - AAYUSIN PA PO
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
        'Direct core identity registry match' AS context_details
      FROM clients c
      WHERE c.is_deleted = 0 AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.contact_number LIKE ?)
      
      UNION
      
      SELECT DISTINCT 
        c.client_id, 
        CONCAT(c.first_name, ' ', c.last_name) AS name, 
        c.contact_number,
        'Active Ledger' AS match_type,
        CONCAT('Linked via historical invoice balance status: ', t.status) AS context_details
      FROM transactions t
      JOIN clients c ON t.client_id = c.client_id
      WHERE t.is_deleted = 0 AND c.is_deleted = 0 AND (t.status LIKE ?)

      UNION

      SELECT DISTINCT 
        c.client_id, 
        CONCAT(c.first_name, ' ', c.last_name) AS name, 
        c.contact_number,
        'Historical Interment' AS match_type,
        CONCAT('Linked family relative deceased record: ', i.first_name, ' ', i.last_name) AS context_details
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
