import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const { rows } = await db.query(
    "SELECT * FROM employee where username = ? ",
    [username],
  );

  if (rows.length === 0) return res.status(401).send("User not found");

  const user = rows[0];

  if (passowrd != user.hash)
    return res.status(401).send("Wrong password or username");
  const token = jwt.sign({ id: user.employee_id, name: user.name }, "secret");

  res.json({ token });
});

export default router;
