// backend/utils/auditLogger.js
const db = require("../config/db");

/**
 * Reusable function to record an audit log.
 * Automatically handles flexible positional arguments for transactions and connections.
 * * @param {string} employee_id - The ID of the employee making the change
 * @param {string} action_type - e.g., 'CREATE TRANSACTION', 'RESTORE FILE'
 * @param {string} description - Readable summary of the action
 * @param {string|Object|null} idOrConnection - Optional ID string (Client/Txn) OR connection object
 * @param {Object|null} connectionParam - Optional database transaction connection
 */
async function logAudit(
  employee_id,
  action_type,
  description,
  idOrConnection = null,
  connectionParam = null,
) {
  try {
    let client_id = null;
    let transaction_id = null;
    let activeConnection = db; // Default to standard connection pool

    // Inspect the 4th argument
    if (idOrConnection && typeof idOrConnection.query === "function") {
      // If the 4th argument is a database connection object
      activeConnection = idOrConnection;
    } else if (typeof idOrConnection === "string") {
      // If the 4th argument is an ID string, check its prefix
      if (
        idOrConnection.startsWith("TXN") ||
        idOrConnection.startsWith("MNT")
      ) {
        transaction_id = idOrConnection;
      } else {
        client_id = idOrConnection;
      }
    }
    // Inspect the 5th argument
    if (connectionParam && typeof connectionParam.query === "function") {
      // If a dedicated transaction connection was passed as the 5th argument
      activeConnection = connectionParam;
    }

    // Generate ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const audit_id = `AUD-${Date.now()}-${randomSuffix}`;

    //
    const query = `
      INSERT INTO audit_logs (audit_id, employee_id, client_id, transaction_id, action_type, action_description) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await activeConnection.query(query, [
      audit_id,
      employee_id,
      client_id,
      transaction_id,
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
