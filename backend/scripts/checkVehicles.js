// Script to check/list all vehicles in the database
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");

// Import Vehicle model
const Vehicle = require(path.join(__dirname, "../src/models/Vehicle"));
const User = require(path.join(__dirname, "../src/models/User"));

const checkVehicles = async () => {
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

    // Count total vehicles
    const totalVehicles = await Vehicle.countDocuments({});
    console.log(`📊 Total Vehicles in Database: ${totalVehicles}`);
    console.log("");

    if (totalVehicles === 0) {
      console.log("ℹ️  No vehicles found in the database");
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get all vehicles with populated postedBy and assignedTo
    console.log("📋 Fetching all vehicles...");
    const vehicles = await Vehicle.find({})
      .populate("postedBy", "name mobile userId _id")
      .populate("assignedTo", "name mobile userId _id")
      .sort({ createdAt: -1 });

    console.log("");
    console.log("=".repeat(80));
    console.log("🚗 VEHICLE LIST");
    console.log("=".repeat(80));
    console.log("");

    // Display vehicles
    vehicles.forEach((vehicle, index) => {
      console.log(`${index + 1}. Vehicle Details:`);
      console.log(`   Vehicle ID: ${vehicle.vehicleId || "N/A"}`);
      console.log(`   MongoDB ID: ${vehicle._id}`);
      console.log(`   Status: ${vehicle.status || "N/A"}`);
      console.log(`   Vehicle Type: ${vehicle.vehicleType || "N/A"}`);
      console.log(`   Trip Type: ${vehicle.tripType || "N/A"}`);
      console.log(`   Location: ${vehicle.location?.city || "N/A"}`);
      
      // Availability info
      if (vehicle.availability) {
        console.log(`   Availability Date: ${vehicle.availability.date ? new Date(vehicle.availability.date).toLocaleString() : "N/A"}`);
        console.log(`   Availability Time: ${vehicle.availability.time || "N/A"}`);
        console.log(`   Availability Status: ${vehicle.availability.status || "N/A"}`);
      } else {
        console.log(`   Availability: Not set`);
      }
      
      console.log(`   Commission: ${vehicle.commission || 0}%`);
      console.log(`   Custom Requirement: ${vehicle.customRequirement || "None"}`);
      
      // Posted By info
      if (vehicle.postedBy) {
        if (typeof vehicle.postedBy === 'object') {
          console.log(`   Posted By: ${vehicle.postedBy.name || "N/A"} (ID: ${vehicle.postedBy._id}, UserID: ${vehicle.postedBy.userId || "N/A"}, Mobile: ${vehicle.postedBy.mobile || "N/A"})`);
        } else {
          console.log(`   Posted By (ObjectId): ${vehicle.postedBy}`);
        }
      } else {
        console.log(`   Posted By: ❌ NOT SET`);
      }
      
      // Assigned To info
      if (vehicle.assignedTo) {
        if (typeof vehicle.assignedTo === 'object') {
          console.log(`   Assigned To: ${vehicle.assignedTo.name || "N/A"} (ID: ${vehicle.assignedTo._id}, UserID: ${vehicle.assignedTo.userId || "N/A"})`);
          console.log(`   Assigned At: ${vehicle.assignedAt ? new Date(vehicle.assignedAt).toLocaleString() : "N/A"}`);
        } else {
          console.log(`   Assigned To (ObjectId): ${vehicle.assignedTo}`);
        }
      } else {
        console.log(`   Assigned To: Not assigned`);
      }
      
      console.log(`   Created: ${vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString() : "N/A"}`);
      console.log(`   Updated: ${vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : "N/A"}`);
      console.log("");
    });

    // Summary
    console.log("=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Vehicles: ${totalVehicles}`);
    
    const activeCount = await Vehicle.countDocuments({ status: "active" });
    const assignedCount = await Vehicle.countDocuments({ status: "assigned" });
    const bookedCount = await Vehicle.countDocuments({ status: "booked" });
    const inactiveCount = await Vehicle.countDocuments({ status: "inactive" });
    
    console.log(`Active: ${activeCount}`);
    console.log(`Assigned: ${assignedCount}`);
    console.log(`Booked: ${bookedCount}`);
    console.log(`Inactive: ${inactiveCount}`);
    
    // Count by vehicle type
    const sedanCount = await Vehicle.countDocuments({ vehicleType: "sedan" });
    const suvCount = await Vehicle.countDocuments({ vehicleType: "suv" });
    const hatchbackCount = await Vehicle.countDocuments({ vehicleType: "hatchback" });
    const luxuryCount = await Vehicle.countDocuments({ vehicleType: "luxury" });
    const travellerCount = await Vehicle.countDocuments({ vehicleType: "traveller" });
    const busCount = await Vehicle.countDocuments({ vehicleType: "bus" });
    
    console.log("");
    console.log("Vehicle Types:");
    console.log(`  Sedan: ${sedanCount}`);
    console.log(`  SUV: ${suvCount}`);
    console.log(`  Hatchback: ${hatchbackCount}`);
    console.log(`  Luxury: ${luxuryCount}`);
    console.log(`  Traveller: ${travellerCount}`);
    console.log(`  Bus: ${busCount}`);
    
    // Count by trip type
    const oneWayCount = await Vehicle.countDocuments({ tripType: "one-way" });
    const roundTripCount = await Vehicle.countDocuments({ tripType: "round-trip" });
    
    console.log("");
    console.log("Trip Types:");
    console.log(`  One Way: ${oneWayCount}`);
    console.log(`  Round Trip: ${roundTripCount}`);
    
    // Count by availability status
    const availableNowCount = await Vehicle.countDocuments({ "availability.status": "available-now" });
    const availableLaterCount = await Vehicle.countDocuments({ "availability.status": "available-later" });
    
    console.log("");
    console.log("Availability Status:");
    console.log(`  Available Now: ${availableNowCount}`);
    console.log(`  Available Later: ${availableLaterCount}`);
    
    // Check vehicles without postedBy
    const vehiclesWithoutPostedBy = await Vehicle.countDocuments({ postedBy: { $exists: false } });
    if (vehiclesWithoutPostedBy > 0) {
      console.log(`⚠️  Vehicles without postedBy: ${vehiclesWithoutPostedBy}`);
    }
    
    console.log("");

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    console.log("✨ Vehicle check completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking vehicles:", error.message);
    if (error.name === "MongoServerSelectionError") {
      console.error("   Could not connect to MongoDB. Please check your MONGODB_URI in .env");
    }
    console.error("   Full error:", error);
    process.exit(1);
  }
};

// Run the script
checkVehicles();


















