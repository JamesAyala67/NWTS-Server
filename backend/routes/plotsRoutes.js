const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fetch all plots
router.get("/", async (req, res) => {
  try {
    const [plots] = await db.query(
      "SELECT * FROM plots ORDER BY block, lot, plot_id",
    );
    res.json(plots);
  } catch (error) {
    console.error("Error fetching plots:", error);
    res.status(500).json({ error: "Failed to fetch plots" });
  }
});

// Fetch all plots with interment and transaction details for the map view
router.get("/maps", async (req, res) => {
  try {
    // This query fetches all plots and their related interment, transaction, and client info in one go
    const query = `
      SELECT 
        p.*, 
        i.interment_id, 
        i.first_name AS deceased_first, 
        i.middle_name AS deceased_middle, 
        i.last_name AS deceased_last, 
        i.date_of_birth,
        i.date_of_death,
        i.date_of_interment,
        c.first_name, 
        c.last_name, 
        c.contact_number,
        t.status AS transaction_status, 
        t.transaction_id
      FROM plots p
      LEFT JOIN interments i ON p.plot_id = i.plot_id
      LEFT JOIN transactions t ON p.plot_id = t.plot_id AND t.is_deleted = 0
      LEFT JOIN clients c ON t.client_id = c.client_id
      ORDER BY p.block, p.lot, p.plot_id
    `;

    const [rows] = await db.query(query);

    // Group the results by plot_id to consolidate interment and transaction details under each plot
    const groupedPlots = rows.reduce((acc, row) => {
      let plot = acc.find((p) => p.plot_id === row.plot_id);

      if (!plot) {
        plot = {
          plot_id: row.plot_id,
          block: row.block,
          lot: row.lot,
          plot_type: row.plot_type,
          status: row.status,
          price: row.price,
          // Add Owner Info here
          owner_name: row.first_name
            ? `${row.first_name} ${row.last_name}`
            : "No Owner",
          owner_contact: row.contact_number || "N/A",
          transaction_id: row.transaction_id,
          interments: [],
        };
        acc.push(plot);
      }

      if (row.interment_id) {
        // Prevent duplicate interment entries in the array
        const exists = plot.interments.some(
          (inter) => inter.interment_id === row.interment_id,
        );

        if (!exists) {
          // Format the full name cleanly in case your frontend still relies on a single string
          const middleInitial = row.deceased_middle
            ? ` ${row.deceased_middle} `
            : " ";
          const formattedFullName =
            `${row.deceased_first}${middleInitial}${row.deceased_last}`.trim();

          plot.interments.push({
            interment_id: row.interment_id,
            first_name: row.deceased_first,
            middle_name: row.deceased_middle,
            last_name: row.deceased_last,
            deceased_name: formattedFullName, // Included for backward compatibility with your frontend
            date_of_birth: row.date_of_birth,
            date_of_death: row.date_of_death,
            date_of_interment: row.date_of_interment,
          });
        }
      }

      return acc;
    }, []);

    res.json(groupedPlots);
  } catch (error) {
    console.error("Error fetching plots:", error);
    res.status(500).json({ error: "Failed to fetch plots" });
  }
});

// Responsible for creating a new plot
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

    // Insert a new plot record
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

// Bulk update plot prices by type (e.g., update all 'Lawn Type' plots to a new price only if they are currently 'Available')
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

// Update the status of a specific plot
router.put("/:plot_id/status", async (req, res) => {
  try {
    const { plot_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Missing new status." });
    }

    // dae pa finalize since dae ko pa tapus si nasa frontend

    const [result] = await db.query(
      "UPDATE plots SET status = ? WHERE plot_id = ?",
      [status, plot_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Plot not found." });
    }

    res.json({
      message: `Plot ${plot_id} status updated to ${status} successfully.`,
    });
  } catch (error) {
    console.error("Error updating plot status:", error);
    res.status(500).json({ error: "Failed to update plot status." });
  }
});

// Update plot details (excluding block and lot to preserve location integrity)
router.put("/maps/:plot_id/edit", async (req, res) => {
  try {
    const { plot_id } = req.params;
    // Removed block and lot from req.body
    const { plot_type, price, status } = req.body;

    // Backend Safety: Only allow these specific statuses
    const allowedStatuses = [
      "Available",
      "Occupied",
      "Reserved",
      "Maintenance",
    ];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status provided." });
    }

    // Removed block and lot from the UPDATE query
    const [result] = await db.query(
      "UPDATE plots SET plot_type = ?, price = ?, status = ? WHERE plot_id = ?",
      [plot_type, price, status, plot_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Plot not found." });
    }

    res.json({ message: "Plot details updated successfully!" });
  } catch (error) {
    console.error("Error updating plot details:", error);
    res.status(500).json({ error: "Failed to update plot details." });
  }
});

module.exports = router;
