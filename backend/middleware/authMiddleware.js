const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // 1. Get the token from the request header
  const authHeader = req.headers.authorization;

  // 2. Check if the token exists and is formatted properly
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // Extract the actual token string (removing the "Bearer " part)
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify the token using your exact same secret key
    const decoded = jwt.verify(token, "YOUR_SUPER_SECRET_KEY");

    // 4. Attach the decoded user payload to the request object
    // Now, any route after this can access req.user.employee_id!
    req.user = decoded;

    // 5. Pass control to the next function (the actual route)
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Invalid or expired token. Please log in again." });
  }
};

module.exports = verifyToken;

// SAMPLE CODE FOR FRONTEND
// const fetchAuditLogs = async () => {
//   const token = localStorage.getItem("token"); // Grab the ticket!

//   try {
//     const response = await axios.get("http://localhost:3000/api/audit-logs", {
//       headers: {
//         Authorization: `Bearer ${token}` // Show the ticket to the bouncer
//       }
//     });
//     setLogs(response.data);
//   } catch (error) {
//     console.error("Failed to fetch logs", error);
//   }
// };
