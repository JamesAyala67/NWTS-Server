const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const logAudit = require("../utils/auditLogger");

// Responsible for Login and authentication of employees
router.post("/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    // Find
    const [employees] = await db.query(
      "SELECT * FROM employee WHERE username = ? AND is_deleted = 0",
      [username],
    );

    if (employees.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = employees[0];
    const isMatch = await bcrypt.compare(password, user.hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    // Combine name
    const fullName = user.middle_name
      ? `${user.first_name} ${user.middle_name} ${user.last_name}`
      : `${user.first_name} ${user.last_name}`;

    const tokenPayload = {
      employee_id: user.employee_id,
      name: fullName,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, "YOUR_SUPER_SECRET_KEY", {
      expiresIn: "8h",
    });

    await logAudit(
      user.employee_id,
      "EMPLOYEE LOGIN",
      `${fullName} logged in to the system as ${user.role}.`,
    );

    // Send back to frontend
    res.json({
      message: "Login successful",
      token,
      user: {
        employee_id: user.employee_id,
        name: fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
