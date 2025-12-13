require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// -------------------- CORS --------------------
app.use(
  cors({
    origin: "https://taxiwalepartners.com",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- STATIC FILES --------------------
// Serve CSS, JS, images, and HTML from frontend directory
const frontendPath = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(frontendPath));

// -------------------- HTML ROUTES --------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "pages", "index.html"));
});

// fallback for all other pages (like dashboard.html, signup.html etc.)
app.get("*", (req, res) => {
  // If user visits /dashboard, /signup, /profile etc.
  const requestedPath = path.join(frontendPath, req.path);
  res.sendFile(requestedPath);
});

// -------------------- FIXED PORT --------------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Frontend running on port ${PORT}`);
});
