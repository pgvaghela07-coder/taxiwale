const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });
const User = require("../src/models/User");

async function generateUserIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all users without userId
    const users = await User.find({ 
      $or: [
        { userId: { $exists: false } }, 
        { userId: null }, 
        { userId: "" }
      ] 
    });
    console.log(`📝 Found ${users.length} users without userId`);

    if (users.length === 0) {
      console.log("✅ All users already have userIds");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Get current max userId number
    const usersWithId = await User.find({ 
      userId: { $exists: true, $ne: null, $ne: "" } 
    })
      .sort({ userId: -1 })
      .limit(1);
    
    let nextNumber = 1;
    if (usersWithId.length > 0) {
      const lastUserId = usersWithId[0].userId;
      const match = lastUserId.match(/P(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
        console.log(`📊 Last userId found: ${lastUserId}, starting from: P${String(nextNumber).padStart(6, "0")}`);
      }
    }

    // Generate IDs for users without userId
    for (let i = 0; i < users.length; i++) {
      const userId = `P${String(nextNumber + i).padStart(6, "0")}`;
      users[i].userId = userId;
      await users[i].save();
      console.log(`✅ Generated userId ${userId} for user: ${users[i].name} (${users[i].mobile})`);
    }

    console.log(`\n✅ Successfully generated ${users.length} userIds`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating userIds:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

generateUserIds();

