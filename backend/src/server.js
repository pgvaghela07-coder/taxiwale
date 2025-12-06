// Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Connect Database (non-blocking - server will start even if DB fails)
connectDB().catch((err) => {
  console.error(
    "Database connection failed, but server will continue:",
    err.message
  );
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow all localhost and local network origins in development
      if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
        const isLocalhost =
          !origin ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          origin.includes("192.168.") || // Local network IPs
          origin.includes("10.") || // Private network IPs
          origin.includes("172.16.") || // Private network IPs
          origin.includes("172.17.") ||
          origin.includes("172.18.") ||
          origin.includes("172.19.") ||
          origin.includes("172.20.") ||
          origin.includes("172.21.") ||
          origin.includes("172.22.") ||
          origin.includes("172.23.") ||
          origin.includes("172.24.") ||
          origin.includes("172.25.") ||
          origin.includes("172.26.") ||
          origin.includes("172.27.") ||
          origin.includes("172.28.") ||
          origin.includes("172.29.") ||
          origin.includes("172.30.") ||
          origin.includes("172.31.");
        if (isLocalhost) {
          return callback(null, true);
        }
      }
      const allowed = process.env.FRONTEND_URL || "http://localhost:3000";
      callback(null, true);
    },
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // In development, allow all localhost, 127.0.0.1, and local network IPs
      if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
        const isLocalhost =
          !origin ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          origin.includes("0.0.0.0") ||
          origin.includes("192.168.") || // Local network IPs
          origin.includes("10.") || // Private network IPs
          origin.includes("172.16.") || // Private network IPs
          origin.includes("172.17.") ||
          origin.includes("172.18.") ||
          origin.includes("172.19.") ||
          origin.includes("172.20.") ||
          origin.includes("172.21.") ||
          origin.includes("172.22.") ||
          origin.includes("172.23.") ||
          origin.includes("172.24.") ||
          origin.includes("172.25.") ||
          origin.includes("172.26.") ||
          origin.includes("172.27.") ||
          origin.includes("172.28.") ||
          origin.includes("172.29.") ||
          origin.includes("172.30.") ||
          origin.includes("172.31.");
        if (isLocalhost) {
          return callback(null, true);
        }
      }

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5502",
  "http://127.0.0.1:5502",
  "https://taxiwale.onrender.com", 
  "https://ranaak.com"                // <--- ADD THIS
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);  // mobile / postman support

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders:["Content-Type","Authorization"]
}));

);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
const securityHeaders = require("./middleware/securityHeaders");
app.use(securityHeaders);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/verification", require("./routes/verification"));
app.use("/api/chat", require("./routes/chat"));

// Health check
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
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      bookings: "/api/bookings",
      vehicles: "/api/vehicles",
      profile: "/api/profile",
      verification: "/api/verification",
      chat: "/api/chat",
    },
  });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  // Handle real-time booking updates
  socket.on("booking:update", (data) => {
    io.emit("booking:updated", data);
  });
});

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// Listen on all network interfaces (0.0.0.0) to allow access from other devices on the network
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 Accessible on: http://localhost:${PORT} or http://YOUR_IP:${PORT}`
  );
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
  console.log(`\n📱 To access from phone:`);
  console.log(
    `   1. Find your computer's IP: ipconfig (Windows) or ifconfig (Mac/Linux)`
  );
  console.log(`   2. On phone browser, open: http://YOUR_IP:PORT`);
  console.log(
    `   3. Set API URL in browser console: localStorage.setItem('API_BASE_URL', 'http://YOUR_IP:${PORT}/api')`
  );
});
