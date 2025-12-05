// Script to delete all users from the database
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");

// Import User model
const User = require(path.join(__dirname, "../src/models/User"));

const deleteAllUsers = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error("❌ MONGODB_URI not set in .env");
      console.error("   Please set MONGODB_URI in backend/.env file");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB");

    // Count users before deletion
    const countBefore = await User.countDocuments({});
    console.log(`📊 Found ${countBefore} user(s) in the database`);

    if (countBefore === 0) {
      console.log("ℹ️  No users to delete");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Delete all users
    console.log("🗑️  Deleting all users...");
    const result = await User.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} user(s) from the database`);

    // Verify deletion
    const countAfter = await User.countDocuments({});
    console.log(`📊 Remaining users: ${countAfter}`);

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    console.log("✨ All users have been deleted successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error deleting users:", error.message);
    if (error.name === "MongoServerSelectionError") {
      console.error("   Could not connect to MongoDB. Please check your MONGODB_URI in .env");
    }
    process.exit(1);
  }
};

// Run the script
deleteAllUsers();
