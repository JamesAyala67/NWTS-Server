import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const user = jwt.verify(token, "secretkey");
    req.user = user;
    next();
  } catch {
    res.sendStatus(403);
  }
};
