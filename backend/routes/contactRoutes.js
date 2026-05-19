const express = require("express");
const router = express.Router();
const db = require("../config/db");
const logAudit = require("../utils/auditLogger");

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
      prepared_by, // Staff name string from frontend dropdown
      employee_id, // Background user account identifier
    } = req.body;

    // Verify transaction exists
    const [txnCheck] = await db.query(
      "SELECT status, plot_id FROM transactions WHERE transaction_id = ?",
      [transaction_id],
    );

    if (txnCheck.length === 0) {
      return res
        .status(404)
        .json({ error: "Associated transaction not found." });
    }

    // NOTE: If you want to restrict to completed transactions only, uncomment below:
    // if (txnCheck[0].status !== "Completed") {
    //   return res.status(400).json({ error: "Co-purchasers can only be added to finalized transactions." });
    // }

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

    // Generate unique primary key
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const co_purchaser_id = `CP-${Date.now()}-${randomSuffix}`;

    const sql = `
      INSERT INTO co_purchaser 
      (co_purchaser_id, client_id, transaction_id, first_name, last_name, middle_name, contact_number, prepared_by, is_deleted) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    await db.query(sql, [
      co_purchaser_id,
      clientId,
      transaction_id,
      first_name,
      last_name,
      middle_name || "",
      contact_number,
      prepared_by,
    ]);

    // Format safe audit logger context target
    const activeEmployee =
      employee_id && employee_id.trim() !== "" ? employee_id : null;

    await logAudit(
      activeEmployee,
      "ADD CO-PURCHASER",
      `Linked co-purchaser ${first_name} ${last_name} to Plot ${txnCheck[0].plot_id} (Txn: ${transaction_id.substring(0, 8)}). Processed by ${prepared_by}.`,
      transaction_id, // Links directly into this transaction's history group
    );

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
      prepared_by, // Staff name string from frontend dropdown
      employee_id, // Background user account identifier
    } = req.body;

    // Verify transaction exists
    const [txnCheck] = await db.query(
      "SELECT status, plot_id FROM transactions WHERE transaction_id = ?",
      [transaction_id],
    );

    if (txnCheck.length === 0) {
      return res
        .status(404)
        .json({ error: "Associated transaction not found." });
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

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const contact_id = `CON-${Date.now()}-${randomSuffix}`;

    const sql = `
      INSERT INTO contact_person 
      (contact_id, client_id, transaction_id, first_name, last_name, middle_name, relation, contact_number, prepared_by, is_deleted) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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
      prepared_by,
    ]);

    const activeEmployee =
      employee_id && employee_id.trim() !== "" ? employee_id : null;

    await logAudit(
      activeEmployee,
      "ADD CONTACT PERSON",
      `Added contact person ${first_name} ${last_name} (${relation}) to Plot ${txnCheck[0].plot_id}. Processed by ${prepared_by}.`,
      transaction_id,
    );

    res.status(201).json({ message: "Contact person added successfully" });
  } catch (error) {
    console.error("Contact person error:", error);
    res.status(500).json({ error: "Failed to add contact person" });
  }
});

// Soft Delete Co-Purchaser
router.patch("/co-purchasers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { deleted_by, employee_id } = req.body;

    await db.query(
      "UPDATE co_purchaser SET is_deleted = 1  WHERE co_purchaser_id = ?",
      [id],
    );

    const activeEmployee =
      employee_id && employee_id.trim() !== "" ? employee_id : null;

    await logAudit(
      activeEmployee,
      "REMOVE CO-PURCHASER",
      `Soft deleted co-purchaser record ID: ${id}. Action executed by ${deleted_by}, (${activeEmployee || "System"}).`,
      null,
    );

    res.json({ message: "Co-purchaser removed successfully." });
  } catch (error) {
    console.error("Error removing co-purchaser:", error);
    res.status(500).json({ error: "Failed to remove co-purchaser" });
  }
});

// Soft Delete Contact Person
router.patch("/contact-persons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { deleted_by, employee_id } = req.body;

    await db.query(
      "UPDATE contact_person SET is_deleted = 1 WHERE contact_id = ?",
      [id],
    );

    const activeEmployee =
      employee_id && employee_id.trim() !== "" ? employee_id : null;

    await logAudit(
      activeEmployee,
      "REMOVE CONTACT PERSON",
      `Soft deleted contact person record ID: ${id}. Action executed by ${deleted_by}, (${employee_id || "System"}).`,
      null,
    );

    res.json({ message: "Contact person removed successfully." });
  } catch (error) {
    console.error("Error removing contact person:", error);
    res.status(500).json({ error: "Failed to remove contact person" });
  }
});

module.exports = router;
