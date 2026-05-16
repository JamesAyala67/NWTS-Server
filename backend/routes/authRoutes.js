const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Responsible for Login and authentication of employees
router.post("/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    // find employee who will log in
    // Madagdag pa digdi ki role base
    const [employees] = await db.query(
      "SELECT * FROM employee WHERE username = ? AND is_deleted = 0",
      [username],
    );
    // If no user found
    if (employees.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const user = employees[0];
    // compare the password with the stored hash
    const isMatch = await bcrypt.compare(password, user.hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    // Create JWT token
    // NOTE: NEVER put passwords in the token payload!
    const tokenPayload = {
      employee_id: user.employee_id,
      name: user.name,
      username: user.username,
      role: role,
    };
    // Sign the token (expires in 8 hours for a standard shift)
    const token = jwt.sign(tokenPayload, "YOUR_SUPER_SECRET_KEY", {
      expiresIn: "8h",
    });
    // Send back to frontend
    res.json({
      message: "Login successful",
      token,
      user: { name: user.name, role: role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
