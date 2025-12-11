// Script to check profile loading issue
// Checks if user exists in database and what data is available
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");

// Import models
const User = require(path.join(__dirname, "../src/models/User"));
const Booking = require(path.join(__dirname, "../src/models/Booking"));

const checkProfileIssue = async () => {
  try {
    // Connect to database
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error("❌ MONGODB_URI not set in .env");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB\n");

    // Get userId from command line argument or use test ID
    const testUserId = process.argv[2] || "693a6ea672813b7970e6f3a8";
    console.log(`🔍 Checking for User ID: ${testUserId}\n`);

    // Check 1: Find user by MongoDB _id
    console.log("=".repeat(80));
    console.log("CHECK 1: Find by MongoDB _id");
    console.log("=".repeat(80));
    let userById = null;
    if (mongoose.Types.ObjectId.isValid(testUserId)) {
      userById = await User.findById(testUserId);
      if (userById) {
        console.log("✅ User found by _id:");
        console.log(`   _id: ${userById._id}`);
        console.log(`   userId: ${userById.userId || "N/A"}`);
        console.log(`   name: ${userById.name || "N/A"}`);
        console.log(`   mobile: ${userById.mobile || "N/A"}`);
        console.log(`   email: ${userById.email || "N/A"}`);
        console.log(`   role: ${userById.role || "N/A"}`);
        console.log(`   isVerified: ${userById.isVerified || false}`);
        console.log(`   profile.avatar: ${userById.profile?.avatar || "N/A"}`);
        console.log(`   profile.city: ${userById.profile?.city || "N/A"}`);
        console.log(`   profile.state: ${userById.profile?.state || "N/A"}`);
      } else {
        console.log("❌ User NOT found by _id");
      }
    } else {
      console.log("⚠️  Invalid MongoDB ObjectId format");
    }

    // Check 2: Find user by userId field
    console.log("\n" + "=".repeat(80));
    console.log("CHECK 2: Find by userId field");
    console.log("=".repeat(80));
    const userByUserId = await User.findOne({ userId: testUserId });
    if (userByUserId) {
      console.log("✅ User found by userId field:");
      console.log(`   _id: ${userByUserId._id}`);
      console.log(`   userId: ${userByUserId.userId}`);
      console.log(`   name: ${userByUserId.name || "N/A"}`);
      console.log(`   mobile: ${userByUserId.mobile || "N/A"}`);
    } else {
      console.log("❌ User NOT found by userId field");
    }

    // Check 3: Check bookings to see what postedBy contains
    console.log("\n" + "=".repeat(80));
    console.log("CHECK 3: Check Bookings - postedBy field");
    console.log("=".repeat(80));
    const bookings = await Booking.find({})
      .populate("postedBy", "name mobile userId _id")
      .limit(5)
      .sort({ createdAt: -1 });

    console.log(`📋 Found ${bookings.length} recent bookings:\n`);
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`);
      console.log(`   _id: ${booking._id}`);
      console.log(`   postedBy (raw): ${booking.postedBy}`);
      console.log(`   postedBy (type): ${typeof booking.postedBy}`);
      
      if (booking.postedBy) {
        if (typeof booking.postedBy === 'object') {
          console.log(`   postedBy._id: ${booking.postedBy._id}`);
          console.log(`   postedBy.userId: ${booking.postedBy.userId || "N/A"}`);
          console.log(`   postedBy.name: ${booking.postedBy.name || "N/A"}`);
          console.log(`   postedBy.mobile: ${booking.postedBy.mobile || "N/A"}`);
        } else {
          console.log(`   postedBy (string/ObjectId): ${booking.postedBy}`);
        }
      } else {
        console.log(`   postedBy: null or undefined`);
      }
      console.log("");
    });

    // Check 4: Try to find user that matches testUserId in any booking
    console.log("=".repeat(80));
    console.log("CHECK 4: Find bookings with matching userId");
    console.log("=".repeat(80));
    let matchingBookings = [];
    
    if (mongoose.Types.ObjectId.isValid(testUserId)) {
      matchingBookings = await Booking.find({ postedBy: testUserId })
        .populate("postedBy", "name mobile userId _id")
        .limit(3);
    }
    
    if (matchingBookings.length > 0) {
      console.log(`✅ Found ${matchingBookings.length} bookings with postedBy = ${testUserId}`);
      matchingBookings.forEach((booking, index) => {
        console.log(`\n   Booking ${index + 1}:`);
        console.log(`   Booking ID: ${booking._id}`);
        if (booking.postedBy) {
          console.log(`   Posted By User: ${booking.postedBy.name || "N/A"} (${booking.postedBy._id})`);
        }
      });
    } else {
      console.log(`❌ No bookings found with postedBy = ${testUserId}`);
    }

    // Check 5: List all users with their _id and userId
    console.log("\n" + "=".repeat(80));
    console.log("CHECK 5: All Users Summary");
    console.log("=".repeat(80));
    const allUsers = await User.find({})
      .select("_id userId name mobile")
      .limit(10)
      .sort({ createdAt: -1 });
    
    console.log(`📊 Showing ${allUsers.length} recent users:\n`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || "N/A"}`);
      console.log(`   _id: ${user._id}`);
      console.log(`   userId: ${user.userId || "N/A"}`);
      console.log(`   mobile: ${user.mobile || "N/A"}`);
      console.log("");
    });

    // Summary
    console.log("=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`Test User ID: ${testUserId}`);
    console.log(`Found by _id: ${userById ? "✅ Yes" : "❌ No"}`);
    console.log(`Found by userId field: ${userByUserId ? "✅ Yes" : "❌ No"}`);
    console.log(`Bookings with this userId: ${matchingBookings.length}`);
    
    if (!userById && !userByUserId) {
      console.log("\n⚠️  ISSUE: User not found in database!");
      console.log("   This is why profile is not showing.");
    } else if (userById || userByUserId) {
      const foundUser = userById || userByUserId;
      console.log("\n✅ User exists in database:");
      console.log(`   _id: ${foundUser._id}`);
      console.log(`   userId: ${foundUser.userId || "N/A"}`);
      console.log(`   name: ${foundUser.name || "N/A"}`);
      console.log("\n💡 If profile still not showing, check:");
      console.log("   1. API endpoint is working");
      console.log("   2. Controller is handling both _id and userId");
      console.log("   3. Frontend is passing correct userId");
    }

    // Close connection
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("   Full error:", error);
    process.exit(1);
  }
};

// Run the script
checkProfileIssue();

