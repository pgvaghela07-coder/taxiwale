// Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Connect DB
connectDB().catch((err) => {
  console.error(
    "Database connection failed, but server will continue:",
    err.message
  );
});

const app = express();
const server = http.createServer(app);

// --------------- Allowed Origins ---------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5502",
  "http://127.0.0.1:5502",
  "https://taxiwale.onrender.com",
  "https://taxiwalepartners.com", // Backend domain
  "https://www.taxiwalepartners.com", // Backend domain with www
  "https://www.taxiwalepartners.com", // Your frontend added
  "https://www.taxiwalepartners.com/frontend/pages", // In case routing needs it
  "https://ranaak.com", // Frontend domain
  "https://www.ranaak.com", // Frontend domain with www
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// --------------- Global CORS Middleware ---------------
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile / postman support
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("❌ CORS Blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers
const securityHeaders = require("./middleware/securityHeaders");
app.use(securityHeaders);

// --------------- Socket.IO ---------------
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => console.log("User disconnected:", socket.id));

  socket.on("booking:update", (data) => {
    io.emit("booking:updated", data);
  });
});

// --------------- Routes ---------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/verification", require("./routes/verification"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/reviews", require("./routes/reviews"));

// Health
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Tripeaz Taxi Partners API",
    version: "1.0.0",
  });
});

// Error Handler
app.use(errorHandler);

// --------------- Start Server with Auto Free Port ---------------

const net = require("net");

function findAvailablePort(startPort, callback) {
  const server = net.createServer();
  server.listen(startPort, () => {
    server.close(() => callback(startPort)); // Port free है
  });

  server.on("error", () => {
    // Port busy है → अगला port check करो
    findAvailablePort(startPort + 1, callback);
  });
}

const START_PORT = parseInt(process.env.PORT) || 5000;

findAvailablePort(START_PORT, (port) => {
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌍 Accessible on http://localhost:${port}`);
  });
});
