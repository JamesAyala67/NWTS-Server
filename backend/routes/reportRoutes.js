// routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const excel = require("exceljs");

router.get("/export-excel", async (req, res) => {
  try {
    const [transactions] = await db.query(`
      SELECT 
        t.transaction_id, 
        CONCAT(c.first_name, ' ', c.last_name) AS client_name,
        t.professional_receipt,
        t.sales_invoice,
        t.plot_id,
        t.plot_price,
        t.remaining_balance,
        t.status,
        t.date_created
      FROM transactions t
      JOIN clients c ON t.client_id = c.client_id
      WHERE t.is_deleted = 0
      ORDER BY t.date_created DESC
    `);

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("System Transactions");

    // Define Excel Columns
    worksheet.columns = [
      { header: "Transaction ID", key: "transaction_id", width: 18 },
      { header: "Client Name", key: "client_name", width: 30 },
      { header: "PR Number", key: "professional_receipt", width: 15 },
      { header: "SI Number", key: "sales_invoice", width: 15 },
      { header: "Plot ID", key: "plot_id", width: 15 },
      { header: "Plot Price", key: "plot_price", width: 15 },
      { header: "Balance", key: "remaining_balance", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Date Created", key: "date_created", width: 20 },
    ];

    // Add data to Excel
    worksheet.addRows(transactions);

    // Style the Header Row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAEFEA" },
    };

    // Set Response Headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=NWTS_Master_Report.xlsx",
    );

    // Send the file to the frontend
    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

module.exports = router;
