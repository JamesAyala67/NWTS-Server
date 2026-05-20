const express = require("express");
const crypto = require("crypto"); // Used to generate unique IDs for audit_id
const router = express.Router();
const db = require("../config/db");

// Helper function to insert logs directly into your audit_logs table
async function logAction(
  employeeId,
  actionType,
  description,
  clientId = null,
  txnId = null,
) {
  try {
    const auditId = `AUD-${crypto.randomUUID().substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    await db.query(
      `INSERT INTO audit_logs (audit_id, employee_id, client_id, transaction_id, action_type, action_description, date_time) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [auditId, employeeId || null, clientId, txnId, actionType, description],
    );
  } catch (err) {
    console.error("Audit Logging Failure:", err);
  }
}

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
        const exists = plot.interments.some(
          (inter) => inter.interment_id === row.interment_id,
        );

        if (!exists) {
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
            deceased_name: formattedFullName,
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

// Responsible for creating a new plot (AUDITED)
router.post("/", async (req, res) => {
  try {
    const { plot_id, block, lot, plot_type, price, employee_id } = req.body;

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
      "INSERT INTO plots (plot_id, block, lot, plot_type, price, status) VALUES (?, ?, ?, ?, ?, 'Available')",
      [plot_id, block, lot, plot_type, price],
    );

    // Write to Audit Trail
    await logAction(
      employee_id,
      "CREATE_PLOT",
      `Added new plot inventory: ID ${plot_id} (Block ${block}, Lot ${lot}) assigned as '${plot_type}' at base price ₱${Number(price).toLocaleString()}`,
    );

    res.status(201).json({ message: "Plot successfully added to inventory!" });
  } catch (error) {
    console.error("Error adding plot:", error);
    res.status(500).json({ error: "Failed to add plot" });
  }
});

// Bulk update plot prices by type (AUDITED)
router.put("/bulk-price", async (req, res) => {
  try {
    const { plot_type, new_price, employee_id } = req.body;

    if (!plot_type || new_price === undefined || new_price === null) {
      return res.status(400).json({ error: "Missing plot type or new price." });
    }

    const [result] = await db.query(
      "UPDATE plots SET price = ? WHERE plot_type = ? AND status = 'Available'",
      [new_price, plot_type],
    );

    // Write to Audit Trail if changes were actually applied
    if (result.affectedRows > 0) {
      await logAction(
        employee_id,
        "BULK_PRICE_UPDATE",
        `Performed a batch price override on all Available '${plot_type}' plots to ₱${Number(new_price).toLocaleString()}. Affected rows count: ${result.affectedRows}`,
      );
    }

    res.json({
      message: `Successfully updated prices!`,
      plots_affected: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating bulk prices:", error);
    res.status(500).json({ error: "Failed to update prices" });
  }
});

// Update the status of a specific plot (AUDITED)
router.put("/:plot_id/status", async (req, res) => {
  try {
    const { plot_id } = req.params;
    const { status, employee_id } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Missing new status." });
    }

    // Fetch original status for more informative descriptive trail
    const [original] = await db.query(
      "SELECT status FROM plots WHERE plot_id = ?",
      [plot_id],
    );
    if (original.length === 0) {
      return res.status(404).json({ error: "Plot not found." });
    }

    await db.query("UPDATE plots SET status = ? WHERE plot_id = ?", [
      status,
      plot_id,
    ]);

    // Write to Audit Trail
    await logAction(
      employee_id,
      "UPDATE_PLOT_STATUS",
      `Changed Plot ${plot_id} status assignment from '${original[0].status}' to '${status}'`,
    );

    res.json({
      message: `Plot ${plot_id} status updated to ${status} successfully.`,
    });
  } catch (error) {
    console.error("Error updating plot status:", error);
    res.status(500).json({ error: "Failed to update plot status." });
  }
});

// Update plot details (AUDITED)
router.put("/maps/:plot_id/edit", async (req, res) => {
  try {
    const { plot_id } = req.params;
    const { plot_type, price, status, employee_id } = req.body;

    const allowedStatuses = ["Available", "Occupied", "Reserved"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status provided." });
    }

    // Fetch original state before override
    const [original] = await db.query("SELECT * FROM plots WHERE plot_id = ?", [
      plot_id,
    ]);
    if (original.length === 0) {
      return res.status(404).json({ error: "Plot not found." });
    }

    await db.query(
      "UPDATE plots SET plot_type = ?, price = ?, status = ? WHERE plot_id = ?",
      [plot_type, price, status, plot_id],
    );

    // Write to Audit Trail
    await logAction(
      employee_id,
      "EDIT_PLOT_DETAILS",
      `Modified attributes on Plot ${plot_id}. Type: '${original[0].plot_type}' ➔ '${plot_type}', Base Price: ₱${Number(original[0].price).toLocaleString()} ➔ ₱${Number(price).toLocaleString()}, Status: '${original[0].status}' ➔ '${status}'`,
    );

    res.json({ message: "Plot details updated successfully!" });
  } catch (error) {
    console.error("Error updating plot details:", error);
    res.status(500).json({ error: "Failed to update plot details." });
  }
});

module.exports = router;
