const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Add Co-Purchaser
router.post("/:id/co-purchasers", async (req, res) => {
  try {
    const clientId = req.params.id;
    const {
      transaction_id,
      first_name,
      last_name,
      middle_name,
      contact_number,
    } = req.body;

    // Ensure that Transaction is Completed before allowing co-purchaser assignment
    const [txnCheck] = await db.query(
      "SELECT status FROM transactions WHERE transaction_id = ?",
      [transaction_id],
    );

    if (txnCheck.length === 0 || txnCheck[0].status !== "Completed") {
      return res.status(400).json({
        error: "Co-purchasers can only be added to Completed transactions.",
      });
    }

    // Ensures only one active co-purchaser is allowed per transaction
    const [existing] = await db.query(
      "SELECT co_purchaser_id FROM co_purchaser WHERE transaction_id = ? AND is_deleted = 0",
      [transaction_id],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "This transaction already has an active co-purchaser assigned.",
      });
    }

    // Genereate ID PS: babaguhon pa ni dae ko pa aram kung ano trip nindo
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const co_purchaser_id = `CP-${Date.now()}-${randomSuffix}`;
    const sql = `
      INSERT INTO co_purchaser 
      (co_purchaser_id, client_id, transaction_id, first_name, last_name, middle_name, contact_number, is_deleted) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `;
    await db.query(sql, [
      co_purchaser_id,
      clientId,
      transaction_id,
      first_name,
      last_name,
      middle_name || "",
      contact_number,
    ]);

    res.status(201).json({ message: "Co-purchaser added successfully" });
  } catch (error) {
    console.error("Co-purchaser error:", error);
    res.status(500).json({ error: "Failed to add co-purchaser" });
  }
});

// Add Contact Person
router.post("/:id/contact-persons", async (req, res) => {
  try {
    const clientId = req.params.id;
    const {
      transaction_id,
      first_name,
      last_name,
      middle_name,
      relation,
      contact_number,
    } = req.body;

    // Ensure that Transaction is Completed before allowing contact person assignment
    const [txnCheck] = await db.query(
      "SELECT status FROM transactions WHERE transaction_id = ?",
      [transaction_id],
    );

    if (txnCheck.length === 0 || txnCheck[0].status !== "Completed") {
      return res.status(400).json({
        error: "Contact persons can only be added to Completed transactions.",
      });
    }

    // Ensures only one active contact person is allowed per transaction
    const [existing] = await db.query(
      "SELECT contact_id FROM contact_person WHERE transaction_id = ? AND is_deleted = 0",
      [transaction_id],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error:
          "This transaction already has an active contact person assigned.",
      });
    }

    // Genereate ID PS: babaguhon pa ni dae ko pa aram kung ano trip nindo
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const contact_id = `CON-${Date.now()}-${randomSuffix}`;
    const sql = `
      INSERT INTO contact_person 
      (contact_id, client_id, transaction_id, first_name, last_name, middle_name, relation, contact_number, is_deleted) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    await db.query(sql, [
      contact_id,
      clientId,
      transaction_id,
      first_name,
      last_name,
      middle_name || "",
      relation,
      contact_number,
    ]);

    res.status(201).json({ message: "Contact person added successfully" });
  } catch (error) {
    console.error("Contact person error:", error);
    res.status(500).json({ error: "Failed to add contact person" });
  }
});

// Soft Delete Co-Purchaser
router.delete("/co-purchasers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE co_purchaser SET is_deleted = 1 WHERE co_purchaser_id = ?",
      [id],
    );
    res.json({ message: "Co-purchaser removed (soft delete)" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove co-purchaser" });
  }
});

// Soft Delete Contact Person
router.delete("/contact-persons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE contact_person SET is_deleted = 1 WHERE contact_id = ?",
      [id],
    );
    res.json({ message: "Contact person removed (soft delete)" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove contact person" });
  }
});

module.exports = router;
