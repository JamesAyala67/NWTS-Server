router.post("/", auth, async (req, res) => {
  const { client_id, plot_id, plot_price, downpayment } = req.body;

  const id = crypto.randomUUID();

  await db.query(
    `INSERT INTO transactions
     (transaction_id, client_id, plot_id, plot_price, downpayment, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [id, client_id, plot_id, plot_price, downpayment],
  );

  // 🔥 AUDIT
  await db.query(
    `INSERT INTO audit_logs 
     (audit_id, employee_id, entity_type, entity_id, action)
     VALUES (?, ?, 'TRANSACTION', ?, 'CREATE TRANSACTION')`,
    [crypto.randomUUID(), req.user.id, id],
  );

  res.send("Transaction created");
});
