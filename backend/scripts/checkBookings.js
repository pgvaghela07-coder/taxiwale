// Script to check/list all bookings in the database
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");

// Import models
const Booking = require(path.join(__dirname, "../src/models/Booking"));
const User = require(path.join(__dirname, "../src/models/User"));

const checkBookings = async () => {
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

    // Count total bookings
    const totalBookings = await Booking.countDocuments({});
    console.log(`📊 Total Bookings in Database: ${totalBookings}`);
    console.log("");

    if (totalBookings === 0) {
      console.log("ℹ️  No bookings found in the database");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get all bookings with populated postedBy
    console.log("📋 Fetching all bookings...");
    const bookings = await Booking.find({})
      .populate("postedBy", "name mobile userId _id")
      .populate("assignedTo", "name mobile userId _id")
      .sort({ createdAt: -1 });

    console.log("");
    console.log("=".repeat(80));
    console.log("📋 BOOKING LIST");
    console.log("=".repeat(80));
    console.log("");

    // Display bookings
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking Details:`);
      console.log(`   Booking ID: ${booking.bookingId || "N/A"}`);
      console.log(`   MongoDB ID: ${booking._id}`);
      console.log(`   Status: ${booking.status || "N/A"}`);
      console.log(`   Visibility: ${booking.visibility || "N/A"}`);
      console.log(`   Trip Type: ${booking.tripType || "N/A"}`);
      console.log(`   Vehicle Type: ${booking.vehicleType || "N/A"}`);
      console.log(`   Pickup: ${booking.pickup?.city || "N/A"} - ${booking.pickup?.location || "N/A"}`);
      console.log(`   Drop: ${booking.drop?.city || "N/A"} - ${booking.drop?.location || "N/A"}`);
      console.log(`   Date/Time: ${booking.dateTime ? new Date(booking.dateTime).toLocaleString() : "N/A"}`);
      console.log(`   Amount: ₹${booking.amount?.bookingAmount || "N/A"}`);
      
      // Posted By info
      if (booking.postedBy) {
        if (typeof booking.postedBy === 'object') {
          console.log(`   Posted By: ${booking.postedBy.name || "N/A"} (ID: ${booking.postedBy._id}, UserID: ${booking.postedBy.userId || "N/A"}, Mobile: ${booking.postedBy.mobile || "N/A"})`);
        } else {
          console.log(`   Posted By (ObjectId): ${booking.postedBy}`);
        }
      } else {
        console.log(`   Posted By: ❌ NOT SET`);
      }
      
      // Assigned To info
      if (booking.assignedTo) {
        if (typeof booking.assignedTo === 'object') {
          console.log(`   Assigned To: ${booking.assignedTo.name || "N/A"} (ID: ${booking.assignedTo._id}, UserID: ${booking.assignedTo.userId || "N/A"})`);
        } else {
          console.log(`   Assigned To (ObjectId): ${booking.assignedTo}`);
        }
      } else {
        console.log(`   Assigned To: Not assigned`);
      }
      
      console.log(`   Created: ${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A"}`);
      console.log("");
    });

    // Summary
    console.log("=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Bookings: ${totalBookings}`);
    
    const activeCount = await Booking.countDocuments({ status: "active" });
    const assignedCount = await Booking.countDocuments({ status: "assigned" });
    const closedCount = await Booking.countDocuments({ status: "closed" });
    const cancelledCount = await Booking.countDocuments({ status: "cancelled" });
    
    console.log(`Active: ${activeCount}`);
    console.log(`Assigned: ${assignedCount}`);
    console.log(`Closed: ${closedCount}`);
    console.log(`Cancelled: ${cancelledCount}`);
    
    const publicCount = await Booking.countDocuments({ visibility: "public" });
    const privateCount = await Booking.countDocuments({ visibility: "private" });
    console.log(`Public: ${publicCount}`);
    console.log(`Private: ${privateCount}`);
    
    // Check bookings without postedBy
    const bookingsWithoutPostedBy = await Booking.countDocuments({ postedBy: { $exists: false } });
    if (bookingsWithoutPostedBy > 0) {
      console.log(`⚠️  Bookings without postedBy: ${bookingsWithoutPostedBy}`);
    }
    
    console.log("");

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    console.log("✨ Booking check completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking bookings:", error.message);
    if (error.name === "MongoServerSelectionError") {
      console.error("   Could not connect to MongoDB. Please check your MONGODB_URI in .env");
    }
    console.error("   Full error:", error);
    process.exit(1);
  }
};

// Run the script
checkBookings();



































