// Script to check/list all users in the database
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");

// Import User model
const User = require(path.join(__dirname, "../src/models/User"));

const checkUsers = async () => {
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
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log("");

    // Count total users
    const totalUsers = await User.countDocuments({});
    console.log(`📊 Total Users in Database: ${totalUsers}`);
    console.log("");

    if (totalUsers === 0) {
      console.log("ℹ️  No users found in the database");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get all users
    console.log("📋 Fetching all users...");
    const users = await User.find({})
      .select("-otp -__v")
      .sort({ createdAt: -1 });

    console.log("");
    console.log("=".repeat(80));
    console.log("👥 USER LIST");
    console.log("=".repeat(80));
    console.log("");

    // Display users
    users.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   User ID: ${user.userId || "N/A"}`);
      console.log(`   Name: ${user.name || "N/A"}`);
      console.log(`   First Name: ${user.firstName || "N/A"}`);
      console.log(`   Last Name: ${user.lastName || "N/A"}`);
      console.log(`   Mobile: ${user.mobile || "N/A"}`);
      console.log(`   Email: ${user.email || "N/A"}`);
      console.log(`   Role: ${user.role || "N/A"}`);
      console.log(`   Verified: ${user.isVerified ? "✅ Yes" : "❌ No"}`);
      console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}`);
      console.log(`   Business Name: ${user.businessName || "N/A"}`);
      console.log("");
    });

    // Summary
    console.log("=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Users: ${totalUsers}`);
    
    const verifiedCount = await User.countDocuments({ isVerified: true });
    const unverifiedCount = await User.countDocuments({ isVerified: false });
    console.log(`Verified Users: ${verifiedCount}`);
    console.log(`Unverified Users: ${unverifiedCount}`);
    
    const partnerCount = await User.countDocuments({ role: "partner" });
    const adminCount = await User.countDocuments({ role: "admin" });
    console.log(`Partners: ${partnerCount}`);
    console.log(`Admins: ${adminCount}`);
    console.log("");

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    console.log("✨ User check completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking users:", error.message);
    if (error.name === "MongoServerSelectionError") {
      console.error("   Could not connect to MongoDB. Please check your MONGODB_URI in .env");
    }
    console.error("   Full error:", error);
    process.exit(1);
  }
};

// Run the script
checkUsers();
















