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

app.use(cors({
  origin: "https://taxiwalepartners.com",
  credentials: true
}));


// Add FRONTEND_URL from env if defined
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// --------------- Global CORS Middleware ---------------
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, file://)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("❌ CORS Blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
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

// --------------- Start Server ---------------
const PORT = process.env.PORT || 6301;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Accessible on http://localhost:${PORT}`);
});
