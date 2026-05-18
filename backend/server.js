const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const path = require("path");

const app = express();

const authRoutes = require("./routes/authRoutes");
const auditRoutes = require("./routes/auditRoutes");

const clientsRoutes = require("./routes/clientsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const contactRoutes = require("./routes/contactRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const plotRoutes = require("./routes/plotsRoutes");
const intermentRoutes = require("./routes/intermentsRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("../uploads"));

// Login
app.use("/api/auth", authRoutes);
// Landing Page after login
app.use("/api/dashboard", dashboardRoutes);
// Main Routes
app.use("/api/clients", clientsRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/payments", paymentRoutes);
// Subroutes
app.use("/api/plots", plotRoutes);
app.use("/api/interments", intermentRoutes);

app.use("/api/employees", employeeRoutes);
// (Para sa Postman)
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/audit-logs", auditRoutes);

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
