const User = require("../models/User");
const mongoose = require("mongoose");
const roleCheck = require("../middleware/roleCheck");

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, isVerified, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select("-otp -__v")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-otp -__v")
      .populate("wallet.transactions");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-otp -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// @desc    Search users (for assignment)
// @route   GET /api/users/search?q=query
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    // Allow search from 1 character (for mobile numbers)
    if (!q || q.length < 1) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const query = q.trim();
    
    console.log("🔍 [searchUsers] ========== SEARCH START ==========");
    console.log("🔍 [searchUsers] Search query received:", query);
    
    // ULTRA SIMPLE APPROACH: Only search name and mobile
    // This guarantees ALL users (old and new) will be found
    // All users have name and mobile fields
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { mobile: { $regex: query, $options: "i" } },
      ]
    };
    
    // Try to add userId search, but make it optional
    // Use $exists check to safely search userId (without $type to avoid issues)
    try {
      const userIdCondition = {
        $and: [
          { userId: { $exists: true } },
          { userId: { $ne: null } },
          { userId: { $ne: "" } },
          { userId: { $regex: query, $options: "i" } }
        ]
      };
      searchQuery.$or.push(userIdCondition);
      console.log("✅ [searchUsers] Added userId search condition");
    } catch (e) {
      console.log("⚠️ [searchUsers] Could not add userId search (continuing with name/mobile only):", e.message);
    }
    
    // Also search by _id if query is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(query) && query.length === 24) {
      try {
        searchQuery.$or.push({ _id: new mongoose.Types.ObjectId(query) });
        console.log("🔍 [searchUsers] Added ObjectId search");
      } catch (e) {
        console.log("⚠️ [searchUsers] Invalid ObjectId format");
      }
    }
    
    console.log("🔍 [searchUsers] Final search query:", JSON.stringify(searchQuery, null, 2));
    
    // Execute search - this will find ALL users including old ones
    const users = await User.find(searchQuery)
      .select("userId name mobile _id")
      .limit(20)
      .sort({ createdAt: -1 });

    console.log("✅ [searchUsers] Found", users.length, "users");
    
    // Detailed logging of found users
    if (users.length > 0) {
      console.log("✅ [searchUsers] Users found:");
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. Name: "${user.name || 'N/A'}", Mobile: "${user.mobile || 'N/A'}", userId: ${user.userId || 'NONE'}, _id: ${user._id}`);
      });
    } else {
      // If no users found, investigate why
      console.log("⚠️ [searchUsers] No users found! Investigating...");
      
      // Check total users in database
      const totalCount = await User.countDocuments({});
      console.log("📊 [searchUsers] Total users in database:", totalCount);
      
      if (totalCount > 0) {
        // Get sample users to see their structure
        const sampleUsers = await User.find({})
          .select("name mobile userId _id createdAt")
          .limit(5)
          .sort({ createdAt: -1 });
        
        console.log("📊 [searchUsers] Sample users from DB (first 5):");
        sampleUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. Name: "${user.name}", Mobile: "${user.mobile}", userId: ${user.userId || 'NULL'}, Created: ${user.createdAt}`);
        });
        
        // Try a simple name search to verify it works
        const nameTest = await User.find({ name: { $regex: query, $options: "i" } })
          .select("name mobile")
          .limit(3);
        console.log("🔍 [searchUsers] Direct name search test found:", nameTest.length, "users");
        
        // Try a simple mobile search
        const mobileTest = await User.find({ mobile: { $regex: query, $options: "i" } })
          .select("name mobile")
          .limit(3);
        console.log("🔍 [searchUsers] Direct mobile search test found:", mobileTest.length, "users");
      } else {
        console.log("❌ [searchUsers] Database is empty - no users found!");
      }
    }
    
    console.log("🔍 [searchUsers] ========== SEARCH END ==========");

    res.json({
      success: true,
      data: users.map((user) => ({
        id: user.userId || user._id.toString(),
        userId: user.userId || user._id.toString(),
        name: user.name || "Unknown",
        mobile: user.mobile || "N/A",
      })),
    });
  } catch (error) {
    console.error("❌ [searchUsers] Search Users Error:", error);
    console.error("❌ [searchUsers] Search query was:", q);
    console.error("❌ [searchUsers] Error message:", error.message);
    console.error("❌ [searchUsers] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
