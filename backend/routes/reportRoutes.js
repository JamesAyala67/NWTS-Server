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

    // Set column widths
    worksheet.getColumn(1).width = 18;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 15;
    worksheet.getColumn(9).width = 20;

    // Add title "CURRENT REPORT" in row 1, merged across all columns
    worksheet.mergeCells("A1:I1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "CURRENT REPORT";
    titleCell.font = { bold: true, size: 19 };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB6D7A8" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "center" };
    titleCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    };

    // Set title row height for better visibility
    worksheet.getRow(1).height = 30;

    // Add column headers in row 2 with different colors for each column
    const headerRow = worksheet.getRow(2);
    headerRow.height = 25;

    const headers = [
      { value: "Transaction ID", color: "FFEA9999" },
      { value: "Client Name", color: "FFF9CB9C" },
      { value: "PR Number", color: "FFFFE599" },
      { value: "SI Number", color: "FFA2C4C9" },
      { value: "Plot ID", color: "FFA4C2F4" },
      { value: "Plot Price", color: "FF9FC5E8" },
      { value: "Balance", color: "FFB4A7D6" },
      { value: "Status", color: "FFD5A6BD" },
      { value: "Date Created", color: "FFDD7E6B" },
    ];

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header.value;
      cell.font = { bold: true, size: 11 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: header.color },
      };
      cell.alignment = { horizontal: "center", vertical: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    });

    // Add data rows starting from row 3 with lighter colors matching each column
    const dataColors = [
      "FFF4CCCC", // Transaction ID - lighter red
      "FFFCE5CD", // Client Name - lighter orange
      "FFFFF2CC", // PR Number - lighter yellow
      "FFD0E0E3", // SI Number - lighter cyan
      "FFC9DAF8", // Plot ID - lighter blue
      "FFCFE2F3", // Plot Price - lighter blue 2
      "FFD9D2E9", // Balance - lighter purple
      "FFEAD1DC", // Status - lighter pink
      "FFE6B8AF", // Date Created - lighter red-brown
    ];

    transactions.forEach((transaction, rowIndex) => {
      const dataRow = worksheet.getRow(3 + rowIndex);
      dataRow.height = 20;

      // Add each cell with its corresponding column color
      const values = [
        transaction.transaction_id,
        transaction.client_name,
        transaction.professional_receipt,
        transaction.sales_invoice,
        transaction.plot_id,
        transaction.plot_price,
        transaction.remaining_balance,
        transaction.status,
        transaction.date_created,
      ];

      values.forEach((value, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        cell.value = value;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: dataColors[colIndex] },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
          bottom: { style: "thin" },
        };

        // Center align specific columns
        if (
          colIndex === 0 ||
          colIndex === 2 ||
          colIndex === 3 ||
          colIndex === 4 ||
          colIndex === 7
        ) {
          // Transaction ID, PR Number, SI Number, Plot ID, Status
          cell.alignment = { horizontal: "center", vertical: "center" };
        } else if (colIndex === 5 || colIndex === 6) {
          // Plot Price, Balance - right align for numbers
          cell.alignment = { horizontal: "right", vertical: "center" };
          // Format as currency
          cell.numFmt = "#,##0.00";
        } else {
          // Others - left align with vertical center
          cell.alignment = { horizontal: "left", vertical: "center" };
        }
      });
    });

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
