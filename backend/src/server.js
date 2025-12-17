// Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

connectDB().catch((err) => {
  console.error("Database connection failed:", err.message);
});

const app = express();
const server = http.createServer(app);

// ✅ SINGLE CORS CONFIG
const FRONTEND_ORIGIN = "https://taxiwalepartners.com";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Preflight
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers
const securityHeaders = require("./middleware/securityHeaders");
app.use(securityHeaders);

// ✅ Socket.IO CORS SAME AS EXPRESS
const io = socketIo(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () =>
    console.log("User disconnected:", socket.id)
  );
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/verification", require("./routes/verification"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/reviews", require("./routes/reviews"));

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 6301;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
