// backend/utils/auditLogger.js
const db = require("../config/db");

/**
 * Reusable function to record an audit log.
 * @param {string} employee_id - The ID of the admin/employee making the change
 * @param {string} action_type - e.g., 'CREATE CLIENT', 'EDIT CLIENT', 'DELETE CLIENT'
 * @param {string} description - A readable sentence of what happened
 * @param {string|null} client_id - Optional ID of the client involved
 * @param {Object} connection - The SQL transaction connection (optional, defaults to standard db pool)
 */
async function logAudit(
  employee_id,
  action_type,
  description,
  client_id = null,
  connection = db,
) {
  try {
    let client_id = null;
    let connection = db;

    // Smart parameter handling: detect if arg4 is a connection or a client_id string
    if (client_id && typeof client_id.query === "function") {
      connection = client_id;
    } else {
      if (typeof client_id === "string") client_id = client_id;
      if (connection && typeof connection.query === "function")
        connection = connection;
    }

    // Generate bulletproof ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const audit_id = `AUD-${Date.now()}-${randomSuffix}`;

    const query = `
      INSERT INTO audit_logs (audit_id, employee_id, client_id, action_type, action_description) 
      VALUES (?, ?, ?, ?, ?)
    `;

    await connection.query(query, [
      audit_id,
      employee_id,
      client_id,
      action_type,
      description,
    ]);
    return true;
  } catch (error) {
    console.error("Failed to write to audit log:", error);
    return false;
  }
}

module.exports = logAudit;
