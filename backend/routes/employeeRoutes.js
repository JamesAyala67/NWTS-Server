const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Assuming this is a mysql2 pool instance
const bcrypt = require("bcrypt");

// ==========================================
// 1. ROUTE: GET /api/employees/dropdown
// PURPOSE: Fetch ONLY active staff for transaction/form dropdown elements
// ==========================================
router.get("/dropdown", async (req, res) => {
  try {
    const query = `
      SELECT employee_id, first_name, middle_name, last_name, role 
      FROM employee 
      WHERE is_deleted = 0
      ORDER BY last_name ASC
    `;
    const [employees] = await db.query(query);
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching dropdown employees:", error);
    res.status(500).json({ error: "Failed to fetch active staff listings." });
  }
});

// ==========================================
// 2. ROUTE: GET /api/employees
// PURPOSE: Admin Master Control List (Shows ALL employees so Admin can oversee soft-deleted ones)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const query = `
  SELECT employee_id, first_name, middle_name, last_name, username, role, contact_number, is_deleted 
  FROM employee 
  ORDER BY is_deleted ASC, last_name ASC
`;
    const [allEmployees] = await db.query(query);
    res.status(200).json(allEmployees);
  } catch (error) {
    console.error("Error fetching master employee log:", error);
    res.status(500).json({ error: "Failed to fetch system accounts." });
  }
});

// ==========================================
// 3. ROUTE: POST /api/employees/approve-action/:id
// PURPOSE: Atomic transaction approval for staged mutations
// ==========================================
router.post("/approve-action/:id", async (req, res) => {
  const { id } = req.params;

  // 1. Acquire an isolated, dedicated single connection from the pool
  const connection = await db.getConnection();

  try {
    // 2. Start the transaction context on our explicit connection block
    await connection.beginTransaction();

    // 3. Fetch request details using the isolated connection
    const [requests] = await connection.query(
      "SELECT * FROM pending_actions WHERE id = ? FOR UPDATE",
      [id],
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ error: "Staged action request target not found." });
    }

    const currentRequest = requests[0];

    // 4. Safely execute the requested change depending on type
    if (currentRequest.action_type === "SOFT_DELETE_EMPLOYEE") {
      await connection.query(
        "UPDATE employee SET is_deleted = 1 WHERE employee_id = ?",
        [currentRequest.target_id],
      );
    }

    // 5. Set tracking entry to APPROVED
    await connection.query(
      "UPDATE pending_actions SET status = 'APPROVED' WHERE id = ?",
      [id],
    );

    // 6. Everything succeeded; commit changes atomically
    await connection.commit();
    res
      .status(200)
      .json({ message: "Action successfully executed and committed." });
  } catch (error) {
    // Rollback changes on failure
    console.error("Transaction Error! Rolling back changes...", error);
    await connection.rollback();
    res
      .status(500)
      .json({ error: "Failed to cleanly process execution request." });
  } finally {
    // Release the single connection back to the global pool
    connection.release();
  }
});

// Account Creation
// ==========================================
// ROUTE: POST /api/employees
// PURPOSE: Create a new system employee
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      username,
      password,
      role,
      contact_number,
    } = req.body;

    // 1. Check if username already exists
    const [existing] = await db.query(
      "SELECT username FROM employee WHERE username = ?",
      [username],
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    // 2. Generate a unique Employee ID (e.g., EMP-1045)
    const empId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Hash the password securely
    const saltRounds = 12; // Matches your $2a$12$ format
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Insert into database
    const query = `
      INSERT INTO employee 
      (employee_id, first_name, last_name, middle_name, username, hash, role, contact_number, is_deleted) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    await db.query(query, [
      empId,
      first_name,
      last_name,
      middle_name,
      username,
      hashedPassword,
      role,
      contact_number,
    ]);

    res.status(201).json({
      message: "Employee account created successfully!",
      employee_id: empId,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ error: "Failed to create account." });
  }
});

// ==========================================
// ROUTE: PUT /api/employees/:id
// PURPOSE: Update existing employee details
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      middle_name,
      username,
      password,
      role,
      contact_number,
    } = req.body;

    // 1. Check if updating username conflicts with someone else
    const [existing] = await db.query(
      "SELECT employee_id FROM employee WHERE username = ? AND employee_id != ?",
      [username, id],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Username is already taken by another user." });
    }

    // 2. Build dynamic update query (Only update password if one was typed in)
    let query = `UPDATE employee SET first_name=?, last_name=?, middle_name=?, username=?, role=?, contact_number=?`;
    let queryParams = [
      first_name,
      last_name,
      middle_name,
      username,
      role,
      contact_number,
    ];

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 12);
      query += `, hash=?`;
      queryParams.push(hashedPassword);
    }

    query += ` WHERE employee_id=?`;
    queryParams.push(id);

    await db.query(query, queryParams);

    res.status(200).json({ message: "Employee account updated successfully!" });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ error: "Failed to update account." });
  }
});

// POST /api/employees/:id/soft-delete
router.post("/:id/soft-delete", async (req, res) => {
  try {
    await db.query("UPDATE employee SET is_deleted = 1 WHERE employee_id = ?", [
      req.params.id,
    ]);
    res.status(200).json({ message: "Employee deactivated." });
  } catch (error) {
    res.status(500).json({ error: "Failed to deactivate account." });
  }
});

module.exports = router;
