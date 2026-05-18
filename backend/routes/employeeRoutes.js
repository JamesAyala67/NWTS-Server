const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Route: GET /api/employees
// Purpose: Fetch a list of active employees for dropdowns
router.get("/", async (req, res) => {
  try {
    // Only fetch active employees, and explicitly choose columns (never send passwords to the frontend!)
    const query = `
      SELECT employee_id, first_name, middle_name, last_name, role 
      FROM employee 
      WHERE is_deleted = 0
      ORDER BY last_name ASC
    `;

    const [employees] = await db.query(query);
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees data." });
  }
});

module.exports = router;
