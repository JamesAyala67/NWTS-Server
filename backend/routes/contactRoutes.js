const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Add Co-Purchaser
router.post("/co-purchasers", async (req, res) => {
  try {
    const { client_id, name, contact_number } = req.body;
    const co_purchaser_id = `CP-${Date.now()}`;
    await db.query(
      "INSERT INTO co_purchaser (co_purchaser_id, client_id, name, contact_number) VALUES (?, ?, ?, ?)",
      [co_purchaser_id, client_id, name, contact_number],
    );
    res.status(201).json({ message: "Co-purchaser added!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add co-purchaser" });
  }
});
// Add Contact Person
router.post("/contact-persons", async (req, res) => {
  try {
    const { client_id, name, relation, contact_number } = req.body;
    const contact_id = `CN-${Date.now()}`;
    await db.query(
      "INSERT INTO contact_person (contact_id, client_id, name, relation, contact_number) VALUES (?, ?, ?, ?, ?)",
      [contact_id, client_id, name, relation, contact_number],
    );
    res.status(201).json({ message: "Contact person added!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add contact person" });
  }
});

module.exports = router;
