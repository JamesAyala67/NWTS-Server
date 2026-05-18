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
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      plot_id,
      transaction_id,
      first_name,
      middle_name,
      last_name,
      date_of_birth,
      date_of_death,
      date_of_interment,
    } = req.body;

    // PS: dae pa sigurado
    // Generate the custom Primary Key
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const interment_id = `INT-${Date.now()}-${randomSuffix}`;

    await connection.beginTransaction();

    // Insert new interment record
    await connection.query(
      `INSERT INTO interments 
      (interment_id, plot_id, transaction_id, first_name, middle_name, last_name, date_of_birth, date_of_death, date_of_interment) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        interment_id,
        plot_id,
        transaction_id,
        first_name,
        middle_name,
        last_name,
        date_of_birth,
        date_of_death,
        date_of_interment,
      ],
    );

    // tig duwa ko na para sigurado mapalitan HAHAHAHAHA
    // Change the plot status to "Occupied"
    await connection.query(
      "UPDATE plots SET status = 'Occupied' WHERE plot_id = ?",
      [plot_id],
    );

    await connection.commit();

    res.status(201).json({
      message: "Interment successfully recorded and plot marked as Occupied!",
      interment_id: interment_id,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error recording interment:", error);
    res.status(500).json({ error: "Failed to record interment" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
