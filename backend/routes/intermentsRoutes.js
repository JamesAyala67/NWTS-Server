const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all interments
router.get("/", async (req, res) => {
  try {
    const [interments] = await db.query(
      "SELECT * FROM interments ORDER BY date_of_interment DESC",
    );
    res.json(interments);
  } catch (error) {
    console.error("Error fetching interments:", error);
    res.status(500).json({ error: "Failed to fetch interments" });
  }
});

// Schedule/Record a new interment
router.post("/", async (req, res) => {
  try {
    const {
      plot_id,
      transaction_id,
      deceased_name,
      date_of_birth,
      date_of_death,
      date_of_interment,
    } = req.body;

    // 1. Save the deceased person's record
    await db.query(
      "INSERT INTO interments (plot_id, transaction_id, deceased_name, date_of_birth, date_of_death, date_of_interment) VALUES (?, ?, ?, ?, ?, ?)",
      [
        plot_id,
        transaction_id,
        deceased_name,
        date_of_birth,
        date_of_death,
        date_of_interment,
      ],
    );

    // 2. Change the physical plot status to 'Occupied'
    await db.query("UPDATE plots SET status = 'Occupied' WHERE plot_id = ?", [
      plot_id,
    ]);

    res
      .status(201)
      .json({
        message: "Interment successfully recorded and plot marked as Occupied!",
      });
  } catch (error) {
    console.error("Error recording interment:", error);
    res.status(500).json({ error: "Failed to record interment" });
  }
});

module.exports = router;
