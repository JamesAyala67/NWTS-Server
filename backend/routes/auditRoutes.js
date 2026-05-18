const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fetch all audit logs for the admin dashboard
router.get("/", async (req, res) => {
  try {
    // We join with the employees/users table if you have one to get their name
    const query = `
      SELECT audit_id, employee_id, action_type, action_description, date_time 
      FROM audit_logs 
      ORDER BY date_time DESC 
      LIMIT 100
    `;
    const [logs] = await db.query(query);

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs." });
  }
});

module.exports = router;
