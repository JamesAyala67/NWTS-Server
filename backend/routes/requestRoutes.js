const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Soft delete request
router.post("/stage-deletion/:id", async (req, res) => {
  try {
    const targetEmployeeId = req.params.id;
    const { submitter_name } = req.body;

    // Fetch the target employee's name for the log
    const [emp] = await db.query(
      "SELECT first_name, last_name FROM employee WHERE employee_id = ?",
      [targetEmployeeId],
    );
    if (emp.length === 0)
      return res.status(404).json({ error: "Employee not found." });

    const targetName = `${emp[0].first_name} ${emp[0].last_name}`;
    const description = `Requested deactivation of account: ${targetName} (${targetEmployeeId})`;

    // Insert into pending actions table
    const query = `
      INSERT INTO pending_actions (action_type, target_id, description, submitted_by_name, status, created_at)
      VALUES ('SOFT_DELETE_EMPLOYEE', ?, ?, ?, 'PENDING', NOW())
    `;
    await db.query(query, [targetEmployeeId, description, submitter_name]);

    res
      .status(200)
      .json({ message: "Deletion request sent to Admin for approval." });
  } catch (error) {
    console.error("Error staging deletion:", error);
    res.status(500).json({ error: "Failed to stage request." });
  }
});

// Fetch pending request
router.get("/pending", async (req, res) => {
  try {
    const [requests] = await db.query(
      "SELECT * FROM pending_actions WHERE status = 'PENDING' ORDER BY created_at DESC",
    );
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch pending requests." });
  }
});

// Resolve request
router.post("/:id/resolve", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // "Accept" or "Cancel"

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [requests] = await connection.query(
      "SELECT * FROM pending_actions WHERE id = ? FOR UPDATE",
      [id],
    );
    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Request not found." });
    }

    const reqData = requests[0];

    if (action === "Accept") {
      // Pasigurado lng
      if (reqData.action_type === "SOFT_DELETE_EMPLOYEE") {
        await connection.query(
          "UPDATE employee SET is_deleted = 1 WHERE employee_id = ?",
          [reqData.target_id],
        );
      } else if (reqData.action_type === "SOFT_DELETE_CLIENT") {
        await connection.query(
          "UPDATE clients SET is_deleted = 1 WHERE client_id = ?",
          [reqData.target_id],
        );
      } else if (reqData.action_type === "SOFT_DELETE_COPURCHASER") {
        await connection.query(
          "UPDATE co_purchaser SET is_deleted = 1 WHERE co_purchaser_id = ?",
          [reqData.target_id],
        );
      } else if (reqData.action_type === "SOFT_DELETE_CONTACT") {
        await connection.query(
          "UPDATE contact_person SET is_deleted = 1 WHERE contact_id = ?",
          [reqData.target_id],
        );
      } else if (reqData.action_type === "SOFT_DELETE_FILE") {
        await connection.query(
          "UPDATE client_files SET is_deleted = 1 WHERE file_id = ?",
          [reqData.target_id],
        );
      } else if (reqData.action_type === "SOFT_DELETE_INTERMENT") {
        await connection.query(
          "UPDATE interments SET is_deleted = 1 WHERE interment_id = ?",
          [reqData.target_id],
        );
      }

      const data = reqData.payload ? JSON.parse(reqData.payload) : {};

      if (reqData.action_type === "EDIT_CLIENT") {
        await connection.query(
          `UPDATE clients SET 
            first_name = ?, last_name = ?, middle_name = ?, birthdate = ?, 
            civil_status = ?, contact_number = ?, province = ?, city = ?, 
            barangay = ?, edited_by = ? 
           WHERE client_id = ?`,
          [
            data.first_name,
            data.last_name,
            data.middle_name,
            data.birthdate,
            data.civil_status,
            data.contact_number,
            data.province,
            data.city,
            data.barangay,
            reqData.submitted_by_name,
            reqData.target_id,
          ],
        );
      } else if (reqData.action_type === "EDIT_INTERMENT") {
        await connection.query(
          `UPDATE interments SET 
            professional_receipt = ?, sales_invoice = ?, first_name = ?, last_name = ?, 
            middle_name = ?, date_of_birth = ?, date_of_death = ?, date_of_interment = ?, 
            location = ?, remarks = ? 
           WHERE interment_id = ?`,
          [
            data.professional_receipt,
            data.sales_invoice,
            data.first_name,
            data.last_name,
            data.middle_name,
            data.date_of_birth,
            data.date_of_death,
            data.date_of_interment,
            data.location,
            data.remarks,
            reqData.target_id,
          ],
        );
      } else if (reqData.action_type === "EDIT_PLOT") {
        await connection.query(
          `UPDATE plots SET block = ?, lot = ?, plot_type = ?, status = ?, price = ? WHERE plot_id = ?`,
          [
            data.block,
            data.lot,
            data.plot_type,
            data.status,
            data.price,
            reqData.target_id,
          ],
        );
      }

      // Mark as Approved
      await connection.query(
        "UPDATE pending_actions SET status = 'APPROVED' WHERE id = ?",
        [id],
      );
    } else {
      // Mark as Rejected
      await connection.query(
        "UPDATE pending_actions SET status = 'REJECTED' WHERE id = ?",
        [id],
      );
    }

    await connection.commit();
    res
      .status(200)
      .json({ message: `Request successfully ${action.toLowerCase()}ed.` });
  } catch (error) {
    await connection.rollback();
    console.error("Error resolving request:", error);
    res.status(500).json({ error: "Failed to resolve request." });
  } finally {
    connection.release();
  }
});

// Soft delete request: Client
router.post("/stage-client/:id", async (req, res) => {
  try {
    const targetClientId = req.params.id;
    const { submitter_name } = req.body;

    // Fetch the client's name to display in the Admin Queue
    const [client] = await db.query(
      "SELECT first_name, last_name FROM clients WHERE client_id = ?",
      [targetClientId],
    );
    if (client.length === 0)
      return res.status(404).json({ error: "Client not found." });

    const targetName = `${client[0].first_name} ${client[0].last_name}`;
    const description = `Requested deletion of Client Profile: ${targetName} (${targetClientId})`;

    // Insert into pending actions table
    const query = `
      INSERT INTO pending_actions (action_type, target_id, description, submitted_by_name, status, created_at)
      VALUES ('SOFT_DELETE_CLIENT', ?, ?, ?, 'PENDING', NOW())
    `;
    await db.query(query, [targetClientId, description, submitter_name]);

    res
      .status(200)
      .json({ message: "Client deletion request sent to Admin for approval." });
  } catch (error) {
    console.error("Error staging client deletion:", error);
    res.status(500).json({ error: "Failed to stage client request." });
  }
});

// Soft delete request: CoPurchaser
router.post("/stage-copurchaser/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { submitter_name } = req.body;

    const [cp] = await db.query(
      "SELECT first_name, last_name FROM co_purchaser WHERE co_purchaser_id = ?",
      [targetId],
    );
    if (cp.length === 0)
      return res.status(404).json({ error: "Record not found." });

    const description = `Requested deletion of Co-Purchaser: ${cp[0].first_name} ${cp[0].last_name} (${targetId})`;

    await db.query(
      `
      INSERT INTO pending_actions (action_type, target_id, description, submitted_by_name, status, created_at)
      VALUES ('SOFT_DELETE_COPURCHASER', ?, ?, ?, 'PENDING', NOW())
    `,
      [targetId, description, submitter_name],
    );

    res
      .status(200)
      .json({ message: "Co-Purchaser deletion request sent to Admin." });
  } catch (error) {
    res.status(500).json({ error: "Failed to stage request." });
  }
});

// Soft delete request: Contact Person
router.post("/stage-contact/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { submitter_name } = req.body;

    const [contact] = await db.query(
      "SELECT first_name, last_name FROM contact_person WHERE contact_id = ?",
      [targetId],
    );
    if (contact.length === 0)
      return res.status(404).json({ error: "Record not found." });

    const description = `Requested deletion of Contact Person: ${contact[0].first_name} ${contact[0].last_name} (${targetId})`;

    await db.query(
      `
      INSERT INTO pending_actions (action_type, target_id, description, submitted_by_name, status, created_at)
      VALUES ('SOFT_DELETE_CONTACT', ?, ?, ?, 'PENDING', NOW())
    `,
      [targetId, description, submitter_name],
    );

    res
      .status(200)
      .json({ message: "Contact deletion request sent to Admin." });
  } catch (error) {
    res.status(500).json({ error: "Failed to stage request." });
  }
});

// Soft delete request: Client Files
router.post("/stage-file/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { submitter_name } = req.body;

    const [file] = await db.query(
      "SELECT file_name FROM client_files WHERE file_id = ?",
      [targetId],
    );
    if (file.length === 0)
      return res.status(404).json({ error: "File not found." });

    const description = `Requested deletion of Document: '${file[0].file_name}' (${targetId})`;

    await db.query(
      `
      INSERT INTO pending_actions (action_type, target_id, description, submitted_by_name, status, created_at)
      VALUES ('SOFT_DELETE_FILE', ?, ?, ?, 'PENDING', NOW())
    `,
      [targetId, description, submitter_name],
    );

    res.status(200).json({ message: "File deletion request sent to Admin." });
  } catch (error) {
    res.status(500).json({ error: "Failed to stage file request." });
  }
});

// Soft delete requestL Interment
router.post("/stage-interment/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { submitter_name } = req.body;

    const [interment] = await db.query(
      "SELECT first_name, last_name FROM interments WHERE interment_id = ?",
      [targetId],
    );

    if (interment.length === 0)
      return res.status(404).json({ error: "Record not found." });

    const description = `Requested deletion of Interment Record for: ${interment[0].first_name} ${interment[0].last_name} (${targetId})`;

    await db.query(
      `
      INSERT INTO pending_actions (action_type, target_id, description, submitted_by_name, status, created_at)
      VALUES ('SOFT_DELETE_INTERMENT', ?, ?, ?, 'PENDING', NOW())
    `,
      [targetId, description, submitter_name],
    );

    res
      .status(200)
      .json({ message: "Interment deletion request sent to Admin." });
  } catch (error) {
    console.error("Interment staging error:", error); // Added this so it prints exactly why it fails in the terminal next time!
    res.status(500).json({ error: "Failed to stage interment request." });
  }
});

// EDIT
// Edit request: Client
router.post("/stage-edit-client/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { submitter_name, edit_data } = req.body;

    const description = `Requested change modifications for Client Profile: ${edit_data.first_name} ${edit_data.last_name} (${targetId})`;

    await db.query(
      `
      INSERT INTO pending_actions (action_type, target_id, description, payload, submitted_by_name, status, created_at)
      VALUES ('EDIT_CLIENT', ?, ?, ?, ?, 'PENDING', NOW())
    `,
      [targetId, description, JSON.stringify(edit_data), submitter_name],
    );

    res
      .status(200)
      .json({ message: "Client update request sent to Admin for review." });
  } catch (error) {
    res.status(500).json({ error: "Failed to stage client edit request." });
  }
});

// Edit request: Interments
router.post("/stage-edit-interment/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { submitter_name, edit_data } = req.body;

    const description = `Requested modifications for Interment Record: ${edit_data.first_name} ${edit_data.last_name} (${targetId})`;

    await db.query(
      `
      INSERT INTO pending_actions (action_type, target_id, description, payload, submitted_by_name, status, created_at)
      VALUES ('EDIT_INTERMENT', ?, ?, ?, ?, 'PENDING', NOW())
    `,
      [targetId, description, JSON.stringify(edit_data), submitter_name],
    );

    res.status(200).json({ message: "Interment edit request sent to Admin." });
  } catch (error) {
    res.status(500).json({ error: "Failed to stage interment edit request." });
  }
});

// Edit request: Plots
router.post("/stage-edit-plot/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { submitter_name, edit_data } = req.body;

    const description = `Requested adjustments for Plot Inventory Location: ${targetId} (Block ${edit_data.block} Lot ${edit_data.lot})`;

    await db.query(
      `
      INSERT INTO pending_actions (action_type, target_id, description, payload, submitted_by_name, status, created_at)
      VALUES ('EDIT_PLOT', ?, ?, ?, ?, 'PENDING', NOW())
    `,
      [targetId, description, JSON.stringify(edit_data), submitter_name],
    );

    res.status(200).json({ message: "Plot adjustment request sent to Admin." });
  } catch (error) {
    res.status(500).json({ error: "Failed to stage plot edit request." });
  }
});

module.exports = router;
