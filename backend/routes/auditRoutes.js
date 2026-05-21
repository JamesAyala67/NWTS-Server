const express = require("express");
const router = express.Router();
const db = require("../config/db");
const logAudit = require("../utils/auditLogger");

// Fetch Audit Logs with Filtering, Searching, and Pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, action_type, tab } = req.query;

    let conditions = ["1=1"];
    let queryParams = [];

    if (tab === "System Events") {
      conditions.push("a.action_type IN ('EMPLOYEE LOGIN', 'EMPLOYEE LOGOUT')");
    } else if (tab === "Deleted Records") {
      conditions.push(
        "a.action_type IN ('SOFT-DELETED CLIENT', 'REMOVE CO-PURCHASER', 'REMOVE CONTACT PERSON', 'DELETE FILE')",
      );
    }

    if (search) {
      conditions.push(
        "(a.action_description LIKE ? OR a.audit_id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)",
      );
      const searchWildcard = `%${search}%`;
      queryParams.push(
        searchWildcard,
        searchWildcard,
        searchWildcard,
        searchWildcard,
      );
    }

    if (action_type && action_type !== "All Actions") {
      conditions.push("a.action_type = ?");
      queryParams.push(action_type);
    }

    const whereClause = conditions.join(" AND ");

    const dataQuery = `
      SELECT 
        a.audit_id, 
        a.employee_id, 
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        a.action_type, 
        a.action_description, 
        a.date_time 
      FROM audit_logs a
      LEFT JOIN employee e ON a.employee_id = e.employee_id
      WHERE ${whereClause}
      ORDER BY a.date_time DESC 
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs a
      LEFT JOIN employee e ON a.employee_id = e.employee_id
      WHERE ${whereClause}
    `;

    const [totalRows] = await db.query(countQuery, queryParams);
    const totalLogs = totalRows[0].total;

    queryParams.push(limit, offset);
    const [logs] = await db.query(dataQuery, queryParams);

    res.status(200).json({
      logs,
      pagination: {
        totalLogs,
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs." });
  }
});

// Fetch Top Card Analytics
router.get("/summary-stats", async (req, res) => {
  try {
    const [[{ totalLogs }]] = await db.query(
      "SELECT COUNT(*) as totalLogs FROM audit_logs",
    );

    const [clientFilesCount] = await db.query(
      "SELECT COUNT(*) as count FROM client_files WHERE is_deleted = 1",
    );
    const [clientsCount] = await db.query(
      "SELECT COUNT(*) as count FROM clients WHERE is_deleted = 1",
    );
    const [coPurchasersCount] = await db.query(
      "SELECT COUNT(*) as count FROM co_purchaser WHERE is_deleted = 1",
    );
    const [contactsCount] = await db.query(
      "SELECT COUNT(*) as count FROM contact_person WHERE is_deleted = 1",
    );
    const deletedRecords =
      clientFilesCount[0].count +
      clientsCount[0].count +
      coPurchasersCount[0].count +
      contactsCount[0].count;

    const [[{ activeUsers }]] = await db.query(`
      SELECT COUNT(DISTINCT employee_id) as activeUsers 
      FROM audit_logs 
      WHERE action_type = 'EMPLOYEE LOGIN' AND date_time >= NOW() - INTERVAL 1 DAY
    `);

    res.status(200).json({
      totalLogs,
      deletedRecords,
      activeUsers: activeUsers || 1,
    });
  } catch (error) {
    console.error("Error generating metrics:", error);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// Fetch soft-deleted rows using a UNION query
router.get("/deleted-records", async (req, res) => {
  try {
    const { category, search } = req.query;
    let queryParams = [];

    let unionQueries = [];

    if (!category || category === "All" || category === "Files") {
      unionQueries.push(`
        SELECT file_id AS id, file_id AS record_id, 'Files' AS record_type, file_name AS record_name, 'System' AS deleted_by_name, 'EMP-001' AS deleted_by_id, file_created AS deleted_at 
        FROM client_files WHERE is_deleted = 1
      `);
    }
    if (!category || category === "All" || category === "Clients") {
      unionQueries.push(`
        SELECT client_id AS id, client_id AS record_id, 'Clients' AS record_type, CONCAT(first_name, ' ', last_name) AS record_name, edited_by AS deleted_by_name, edited_by AS deleted_by_id, updated_at AS deleted_at 
        FROM clients WHERE is_deleted = 1
      `);
    }
    if (!category || category === "All" || category === "Contacts") {
      unionQueries.push(`
        SELECT co_purchaser_id AS id, co_purchaser_id AS record_id, 'Co-Purchaser' AS record_type, CONCAT(first_name, ' ', last_name) AS record_name, prepared_by AS deleted_by_name, prepared_by AS deleted_by_id, NOW() AS deleted_at 
        FROM co_purchaser WHERE is_deleted = 1
      `);
      unionQueries.push(`
        SELECT contact_id AS id, contact_id AS record_id, 'Contact Person' AS record_type, CONCAT(first_name, ' ', last_name) AS record_name, prepared_by AS deleted_by_name, prepared_by AS deleted_by_id, NOW() AS deleted_at 
        FROM contact_person WHERE is_deleted = 1
      `);
    }
    if (unionQueries.length === 0) {
      return res.status(200).json([]);
    }

    let finalQuery = unionQueries.join(" UNION ALL ");

    if (search) {
      finalQuery = `SELECT * FROM (${finalQuery}) AS combined WHERE record_name LIKE ? OR record_id LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    finalQuery += " ORDER BY deleted_at DESC";

    const [records] = await db.query(finalQuery, queryParams);
    res.status(200).json(records);
  } catch (error) {
    console.error("Error reading soft deletes:", error);
    res.status(500).json({ error: "Failed to gather soft-deleted records." });
  }
});

// Restore soft-deleted record
router.post("/restore", async (req, res) => {
  try {
    const { record_id, record_type, employee_id, restored_by } = req.body;
    let targetTable = "";
    let idColumn = "";

    switch (record_type) {
      case "Files":
        targetTable = "client_files";
        idColumn = "file_id";
        break;
      case "Clients":
        targetTable = "clients";
        idColumn = "client_id";
        break;
      case "Co-Purchaser":
        targetTable = "co_purchaser";
        idColumn = "co_purchaser_id";
        break;
      case "Contact Person":
        targetTable = "contact_person";
        idColumn = "contact_id";
        break;
      default:
        return res
          .status(400)
          .json({ error: "Invalid record type context requested." });
    }

    await db.query(
      `UPDATE ${targetTable} SET is_deleted = 0 WHERE ${idColumn} = ?`,
      [record_id],
    );

    await logAudit(
      employee_id || null,
      "RESTORE RECORD",
      `${restored_by || "Admin"} restored soft-deleted ${record_type} record with ID: ${record_id}.`,
      record_type === "Clients" ? record_id : null,
    );

    res
      .status(200)
      .json({ message: "Record successfully recovered and normalized." });
  } catch (error) {
    console.error("Error executing restore:", error);
    res.status(500).json({ error: "Failed to execute recovery process." });
  }
});

module.exports = router;
