const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.warn(
        "⚠️  MONGODB_URI not set in .env, skipping database connection"
      );
      console.warn("   For MongoDB Atlas, update MONGODB_URI in backend/.env");
      return; // Early return to prevent undefined connection attempts
    }

    // Connect with timeout settings
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.error("\n💡 Solutions:");
    console.error("   1. Make sure MongoDB is running (local) or");
    console.error(
      "   2. Use MongoDB Atlas (cloud) - See backend/MONGODB_SETUP.md"
    );
    console.error("   3. Update MONGODB_URI in backend/.env file");
    console.error(
      "\n⚠️  Server will continue but database operations will fail."
    );
    console.error("   Fix the connection and restart the server.\n");
    // Don't exit in development - allow server to start for testing
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
