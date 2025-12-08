// Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

// --------------- Allowed Origins ---------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5502",
  "http://127.0.0.1:5502",
  "https://taxiwale.onrender.com",
  "https://taxiwalepartners.com",           // Production frontend
  "https://www.taxiwalepartners.com",       // Production frontend with www
  "https://ranaak.com",                     // Your frontend added
  "https://ranaak.com/frontend/pages"       // In case routing needs it
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// --------------- Global CORS Middleware ---------------
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // mobile / postman support
    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.log("❌ CORS Blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers
const securityHeaders = require("./middleware/securityHeaders");
app.use(securityHeaders);

// --------------- Database Connection Middleware ---------------
// Check if database is connected before processing API requests (except health check)
app.use((req, res, next) => {
  // Allow health check and root endpoint without DB check
  if (req.path === "/health" || req.path === "/") {
    return next();
  }
  
  // For all API routes, check database connection
  if (req.path.startsWith("/api")) {
    const readyState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    if (readyState === 1) {
      // Connected - proceed
      return next();
    } else if (readyState === 2) {
      // Connecting - wait a bit and retry
      return setTimeout(() => {
        if (mongoose.connection.readyState === 1) {
          next();
        } else {
          res.status(503).json({
            success: false,
            message: "Database is connecting. Please try again in a moment.",
          });
        }
      }, 1000);
    } else {
      // Not connected (0 or 3)
      return res.status(503).json({
        success: false,
        message: "Database connection not available. Please check server configuration.",
        error: "Database connection failed",
        readyState: readyState
      });
    }
  }
  
  // For non-API routes, proceed
  next();
});

// --------------- Socket.IO ---------------
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
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
app.use("/api/profile", require("./routes/profile"));
app.use("/api/verification", require("./routes/verification"));
app.use("/api/chat", require("./routes/chat"));

// Health
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || "development" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Tripeaz Taxi Partners API",
    version: "1.0.0"
  });
});

// Error Handler
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

// Connect to database first, then start server
async function startServer() {
  try {
    console.log("🔄 Connecting to database...");
    console.log("📝 Checking MONGODB_URI...");
    
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set in .env file");
      console.error("💡 Please create backend/.env file with:");
      console.error("   MONGODB_URI=mongodb://localhost:27017/taxiwale");
      console.error("   Or use MongoDB Atlas:");
      console.error("   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taxiwale");
      process.exit(1);
    }
    
    console.log("✅ MONGODB_URI found");
    await connectDB();
    console.log("✅ Database connection established");
    
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database connection not ready after connect");
    }
    
    // Start server after database is connected
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Accessible on http://localhost:${PORT}`);
      console.log(`🔗 Allowed Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
      console.log(`📊 Database: ${mongoose.connection.name} (${mongoose.connection.host})`);
    });
  } catch (error) {
    console.error("\n❌ Failed to start server:", error.message);
    console.error("\n💡 Troubleshooting steps:");
    console.error("   1. Check if MONGODB_URI is set in backend/.env file");
    console.error("   2. Verify MongoDB is running (local) or Atlas cluster is active");
    console.error("   3. Check connection string format is correct");
    console.error("   4. For Atlas: Verify network access allows your IP");
    console.error("   5. For Atlas: Check username and password are correct");
    console.error("\n📖 See backend/MONGODB_SETUP.md for detailed setup guide\n");
    process.exit(1);
  }
}

startServer();


