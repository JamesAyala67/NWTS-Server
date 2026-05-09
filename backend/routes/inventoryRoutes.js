const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1. GET: Fetch all inventory (Plots)
router.get("/", async (req, res) => {
  try {
    const [plots] = await db.query(
      "SELECT * FROM plots ORDER BY block, lot, plot_id",
    );
    res.json(plots);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// 2. POST: Add a new Plot to inventory
router.post("/", async (req, res) => {
  try {
    const { plot_id, block, lot, plot_type, price } = req.body;

    // Safety check to prevent duplicate plot IDs
    const [existingPlot] = await db.query(
      "SELECT * FROM plots WHERE plot_id = ?",
      [plot_id],
    );
    if (existingPlot.length > 0) {
      return res
        .status(400)
        .json({ error: "A plot with this ID already exists!" });
    }

    await db.query(
      "INSERT INTO plots (plot_id, block, lot, plot_type, price) VALUES (?, ?, ?, ?, ?)",
      [plot_id, block, lot, plot_type, price],
    );
    res.status(201).json({ message: "Plot successfully added to inventory!" });
  } catch (error) {
    console.error("Error adding plot:", error);
    res.status(500).json({ error: "Failed to add plot" });
  }
});

// 3. PUT: Your Custom Bulk Price Update
router.put("/bulk-price", async (req, res) => {
  try {
    const { plot_type, new_price } = req.body;

    if (!plot_type || !new_price) {
      return res.status(400).json({ error: "Missing plot type or new price." });
    }

    // Only updates 'Available' plots of the chosen type
    const [result] = await db.query(
      "UPDATE plots SET price = ? WHERE plot_type = ? AND status = 'Available'",
      [new_price, plot_type],
    );

    res.json({
      message: `Successfully updated prices!`,
      plots_affected: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating bulk prices:", error);
    res.status(500).json({ error: "Failed to update prices" });
  }
});

module.exports = router;
