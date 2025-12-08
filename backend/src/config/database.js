const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      const error = new Error("MONGODB_URI not set in .env file");
      console.error("❌", error.message);
      console.error("💡 Please set MONGODB_URI in backend/.env file");
      console.error("   Example: MONGODB_URI=mongodb://localhost:27017/taxiwale");
      throw error; // Throw error to prevent server from starting
    }

    // Connect with timeout settings
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.error("\n💡 Solutions:");
    console.error("   1. Make sure MongoDB is running (local) or");
    console.error(
      "   2. Use MongoDB Atlas (cloud) - See backend/MONGODB_SETUP.md"
    );
    console.error("   3. Update MONGODB_URI in backend/.env file");
    console.error("\n❌ Server cannot start without database connection.\n");
    // Always throw error to prevent server from starting without DB
    throw error;
  }
};

module.exports = connectDB;
