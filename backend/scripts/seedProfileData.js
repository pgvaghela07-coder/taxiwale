require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
const Review = require("../src/models/Review");
const Vehicle = require("../src/models/Vehicle");
const Booking = require("../src/models/Booking");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error("❌ MONGODB_URI not set in .env file");
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
};

async function seedData() {
  try {
    await connectDB();

    console.log("\n🌱 Starting to seed profile data...\n");

    // Find existing users or create new ones
    let user1 = await User.findOne({ mobile: "9876543210" });
    let user2 = await User.findOne({ mobile: "9876543211" });
    let user3 = await User.findOne({ mobile: "9876543212" });

    // Create User 1 - Abdul Wahid (from reference photo)
    if (!user1) {
      const hashedPassword1 = await bcrypt.hash("password123", 10);
      user1 = await User.create({
        firstName: "Abdul",
        lastName: "Wahid",
        name: "Abdul wahid",
        businessName: "Taimoor Travels",
        dob: new Date("1988-05-15"),
        gender: "male",
        mobile: "9876543210",
        email: "abdul.whid98@gmail.com",
        password_hash: hashedPassword1,
        is_phone_verified: true,
        is_active: true,
        isVerified: true,
        role: "client",
        verificationStatus: {
          aadhaar: {
            verified: true,
            verifiedAt: new Date(),
          },
          drivingLicense: {
            verified: true,
            verifiedAt: new Date(),
          },
        },
        profile: {
          avatar: "https://ui-avatars.com/api/?name=Abdul+Wahid&background=ff9900&color=1a1a1a&size=200",
          coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          address: "Ludhiana, Punjab",
          city: "Ludhiana",
          state: "Punjab",
          pincode: "141001",
          businessDescription: "Professional taxi service provider with years of experience. Specialized in airport transfers, round trips, and local duty services.",
          experience: 13,
          preferredTrips: ["round-trip", "airport", "one-way", "local-duty"],
          preferredRoutes: [
            "Ludhiana → Amritsar",
            "Ludhiana → Delhi",
            "Ludhiana → Chandigarh Airport",
            "Ludhiana → Amritsar Airport",
          ],
          languages: ["Hindi", "English", "Punjabi", "Urdu"],
          businessOperationCity: "Ludhiana",
          businessOperationState: "Punjab",
          numberOfVehicles: 2,
          vehicleTypes: ["Sedan", "SUV"],
        },
      });
      console.log("✅ Created User 1: Abdul wahid");
    } else {
      // Update existing user with profile data
      user1.profile = {
        ...user1.profile,
        coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        businessDescription: "Professional taxi service provider with years of experience. Specialized in airport transfers, round trips, and local duty services.",
        experience: 13,
        preferredTrips: ["round-trip", "airport", "one-way", "local-duty"],
        preferredRoutes: [
          "Ludhiana → Amritsar",
          "Ludhiana → Delhi",
          "Ludhiana → Chandigarh Airport",
          "Ludhiana → Amritsar Airport",
        ],
        languages: ["Hindi", "English", "Punjabi", "Urdu"],
      };
      await user1.save();
      console.log("✅ Updated User 1: Abdul wahid");
    }

    // Create User 2 - Vishal Kumar Nagpal
    if (!user2) {
      const hashedPassword2 = await bcrypt.hash("password123", 10);
      user2 = await User.create({
        firstName: "Vishal",
        lastName: "Kumar Nagpal",
        name: "Vishal Kumar Nagpal",
        businessName: "SUKH TRAVELS",
        dob: new Date("1987-03-20"),
        gender: "male",
        mobile: "9876543211",
        email: "vishal.nagpal@example.com",
        password_hash: hashedPassword2,
        is_phone_verified: true,
        is_active: true,
        isVerified: true,
        role: "client",
        verificationStatus: {
          aadhaar: {
            verified: true,
            verifiedAt: new Date(),
          },
          drivingLicense: {
            verified: true,
            verifiedAt: new Date(),
          },
        },
        profile: {
          avatar: "https://ui-avatars.com/api/?name=Vishal+Kumar+Nagpal&background=ff9900&color=1a1a1a&size=200",
          coverImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
          address: "Ludhiana, Punjab",
          city: "Ludhiana",
          state: "Punjab",
          pincode: "141001",
          businessDescription: "My Driving Experience Is 13 Years, My Route Ludhiana To Delhi Airport, CHANDIGARH Airport, Amritsar airport, Aadampur Airport",
          experience: 13,
          preferredTrips: ["round-trip", "airport", "one-way", "local-duty"],
          preferredRoutes: [
            "Ludhiana → Delhi Airport",
            "Ludhiana → Chandigarh Airport",
            "Ludhiana → Amritsar Airport",
            "Ludhiana → Aadampur Airport",
          ],
          languages: ["Hindi", "English", "Punjabi"],
          businessOperationCity: "Ludhiana",
          businessOperationState: "Punjab",
          numberOfVehicles: 1,
          vehicleTypes: ["Sedan"],
        },
      });
      console.log("✅ Created User 2: Vishal Kumar Nagpal");
    } else {
      user2.profile = {
        ...user2.profile,
        coverImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
        businessDescription: "My Driving Experience Is 13 Years, My Route Ludhiana To Delhi Airport, CHANDIGARH Airport, Amritsar airport, Aadampur Airport",
        experience: 13,
        preferredTrips: ["round-trip", "airport", "one-way", "local-duty"],
        preferredRoutes: [
          "Ludhiana → Delhi Airport",
          "Ludhiana → Chandigarh Airport",
          "Ludhiana → Amritsar Airport",
          "Ludhiana → Aadampur Airport",
        ],
        languages: ["Hindi", "English", "Punjabi"],
      };
      await user2.save();
      console.log("✅ Updated User 2: Vishal Kumar Nagpal");
    }

    // Create User 3 - Reviewer user
    if (!user3) {
      const hashedPassword3 = await bcrypt.hash("password123", 10);
      user3 = await User.create({
        firstName: "Rakesh",
        lastName: "Kumar Meena",
        name: "Rakesh Kumar Meena",
        businessName: "Ana taxi service",
        dob: new Date("1990-01-10"),
        gender: "male",
        mobile: "9876543212",
        email: "rakesh.meena@example.com",
        password_hash: hashedPassword3,
        is_phone_verified: true,
        is_active: true,
        isVerified: false,
        role: "client",
        profile: {
          avatar: "https://ui-avatars.com/api/?name=Rakesh+Kumar+Meena&background=ff9900&color=1a1a1a&size=200",
          city: "Delhi",
          state: "Delhi",
        },
      });
      console.log("✅ Created User 3: Rakesh Kumar Meena");
    }

    // Create some bookings for user1 (skip if already exist to avoid duplicate ID errors)
    const existingBookings = await Booking.countDocuments({ postedBy: user1._id });
    if (existingBookings === 0) {
      try {
        await Booking.create([
          {
            postedBy: user1._id,
            tripType: "round-trip",
            vehicleType: "sedan",
            pickup: {
              city: "Ludhiana",
              location: "Ludhiana Bus Stand",
            },
            drop: {
              city: "Amritsar",
              location: "Golden Temple",
            },
            dateTime: new Date(),
            amount: { bookingAmount: 5000 },
            status: "active",
          },
          {
            postedBy: user1._id,
            tripType: "one-way",
            vehicleType: "suv",
            pickup: {
              city: "Ludhiana",
              location: "Ludhiana Railway Station",
            },
            drop: {
              city: "Delhi",
              location: "Delhi Airport",
            },
            dateTime: new Date(),
            amount: { bookingAmount: 8000 },
            status: "cancelled",
          },
        ]);
        console.log("✅ Created bookings for User 1");
      } catch (bookingError) {
        if (bookingError.code === 11000) {
          console.log("⚠️  Bookings already exist, skipping...");
        } else {
          throw bookingError;
        }
      }
    } else {
      console.log("✅ Bookings already exist for User 1");
    }

    // Create reviews for user1
    const existingReviews = await Review.countDocuments({ reviewedUserId: user1._id });
    if (existingReviews === 0) {
      await Review.create([
        {
          reviewedUserId: user1._id,
          reviewerUserId: user3._id,
          rating: 5,
          reviewText: "Excellent service! Very professional driver and comfortable ride.",
          tags: ["Excellent behaviour", "Highly recommended to everyone"],
          serviceName: "Ana taxi service",
          isVisible: true,
        },
        {
          reviewedUserId: user1._id,
          reviewerUserId: user2._id,
          rating: 5,
          reviewText: "Great experience. On time and very courteous.",
          tags: ["Excellent behaviour", "Highly recommended to everyone"],
          serviceName: "Paradise tour and travels",
          isVisible: true,
        },
        {
          reviewedUserId: user1._id,
          reviewerUserId: user3._id,
          rating: 5,
          reviewText: "Best taxi service in Ludhiana. Will definitely use again.",
          tags: ["Excellent behaviour"],
          serviceName: "Balaji tour & Trevlar",
          isVisible: true,
        },
        {
          reviewedUserId: user1._id,
          reviewerUserId: user2._id,
          rating: 5,
          reviewText: "Very satisfied with the service. Clean car and safe driving.",
          tags: ["Highly recommended to everyone"],
          serviceName: "Ana taxi service",
          isVisible: true,
        },
        {
          reviewedUserId: user1._id,
          reviewerUserId: user3._id,
          rating: 5,
          reviewText: "Outstanding service! Professional and reliable.",
          tags: ["Excellent behaviour", "Highly recommended to everyone"],
          serviceName: "Paradise tour and travels",
          isVisible: true,
        },
      ]);
      console.log("✅ Created 5 reviews for User 1");
    }

    // Create vehicles for user1
    const existingVehicles = await Vehicle.countDocuments({ postedBy: user1._id });
    if (existingVehicles === 0) {
      try {
        await Vehicle.create({
          postedBy: user1._id,
          vehicleName: "TOUR S CNG",
          vehicleType: "sedan",
          pricePerKm: 15,
          vehicleAge: "3 months",
          images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"],
          registrationNumber: "PB 01F 8463",
          status: "active",
        });
        console.log("✅ Created vehicle for User 1");
      } catch (vehicleError) {
        if (vehicleError.code === 11000) {
          console.log("⚠️  Vehicle already exists, skipping...");
        } else {
          throw vehicleError;
        }
      }
    } else {
      console.log("✅ Vehicles already exist for User 1");
    }

    // Create vehicles for user2
    const existingVehicles2 = await Vehicle.countDocuments({ postedBy: user2._id });
    if (existingVehicles2 === 0) {
      try {
        await Vehicle.create({
          postedBy: user2._id,
          vehicleName: "SUKH TRAVELS Sedan",
          vehicleType: "sedan",
          pricePerKm: 15,
          vehicleAge: "6 months",
          images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"],
          registrationNumber: "PB 10A 1234",
          status: "active",
        });
        console.log("✅ Created vehicle for User 2");
      } catch (vehicleError) {
        if (vehicleError.code === 11000) {
          console.log("⚠️  Vehicle already exists, skipping...");
        } else {
          throw vehicleError;
        }
      }
    } else {
      console.log("✅ Vehicles already exist for User 2");
    }

    console.log("\n✅ Seed data created successfully!");
    console.log("\n📋 Test Users Created:");
    console.log(`   User 1: ${user1.name} (Mobile: ${user1.mobile})`);
    console.log(`   User 2: ${user2.name} (Mobile: ${user2.mobile})`);
    console.log(`   User 3: ${user3.name} (Mobile: ${user3.mobile})`);
    console.log(`\n   User IDs:`);
    console.log(`   User 1 ID: ${user1._id}`);
    console.log(`   User 2 ID: ${user2._id}`);
    console.log(`\n   Test profile URL: http://localhost:5502/frontend/pages/user-profile.html?userId=${user1._id}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedData();

