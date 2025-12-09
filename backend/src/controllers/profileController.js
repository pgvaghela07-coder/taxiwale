const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Review = require("../models/Review");
const Booking = require("../models/Booking");

// @desc    Get profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-otp -__v -password_hash -otp_code -otp_expires_at -otp_attempts -otp_last_sent_at -failed_login_count -locked_until");

    // Populate wallet transactions if they exist
    if (user.wallet && user.wallet.transactions && user.wallet.transactions.length > 0) {
      try {
        await user.populate("wallet.transactions");
      } catch (populateError) {
        console.warn("Warning: Could not populate wallet transactions:", populateError.message);
        // Continue without populating transactions
      }
    }

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
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Update profile
// @route   PUT /api/profile
// @route   PUT /api/profile/update
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { profile, name, email } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update name if provided
    if (name) {
      user.name = name.trim();
    }

    // Update email if provided
    if (email) {
      user.email = email.trim().toLowerCase();
    }

    // Update profile fields
    if (profile) {
      if (profile.businessOperationCity) user.profile.businessOperationCity = profile.businessOperationCity;
      if (profile.businessOperationState) user.profile.businessOperationState = profile.businessOperationState;
      if (profile.address) user.profile.address = profile.address;
      if (profile.city) user.profile.city = profile.city;
      if (profile.state) user.profile.state = profile.state;
      if (profile.pincode) user.profile.pincode = profile.pincode;
      if (profile.numberOfVehicles !== undefined) user.profile.numberOfVehicles = profile.numberOfVehicles;
      if (profile.vehicleTypes) user.profile.vehicleTypes = profile.vehicleTypes;
      if (profile.businessType) user.profile.businessType = profile.businessType;
      if (profile.yearsInBusiness !== undefined) user.profile.yearsInBusiness = profile.yearsInBusiness;
      if (profile.serviceAreas) user.profile.serviceAreas = profile.serviceAreas;
      if (profile.gstNumber) user.profile.gstNumber = profile.gstNumber;
      if (profile.panNumber) user.profile.panNumber = profile.panNumber;
      if (profile.businessRegistrationNumber) user.profile.businessRegistrationNumber = profile.businessRegistrationNumber;
      if (profile.bankName) user.profile.bankName = profile.bankName;
      if (profile.bankAccountNumber) user.profile.bankAccountNumber = profile.bankAccountNumber;
      if (profile.ifscCode) user.profile.ifscCode = profile.ifscCode;
      if (profile.accountHolderName) user.profile.accountHolderName = profile.accountHolderName;
      if (profile.isProfileComplete !== undefined) user.profile.isProfileComplete = profile.isProfileComplete;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        businessName: user.businessName,
        mobile: user.mobile,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

// @desc    Get wallet
// @route   GET /api/profile/wallet
// @access  Private
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "wallet.transactions",
      options: { sort: { createdAt: -1 }, limit: 50 },
    });

    res.json({
      success: true,
      data: {
        balance: user.wallet.balance,
        transactions: user.wallet.transactions,
      },
    });
  } catch (error) {
    console.error("Get Wallet Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wallet",
    });
  }
};

// @desc    Add wallet transaction
// @route   POST /api/profile/wallet/transaction
// @access  Private
exports.addWalletTransaction = async (req, res) => {
  try {
    const { type, amount, description, bookingId, paymentMethod, paymentId } =
      req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: "Type and amount are required",
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      amount,
      description,
      bookingId,
      paymentMethod,
      paymentId,
      status: "completed",
    });

    // Update wallet balance
    const user = await User.findById(req.userId);
    if (type === "credit") {
      user.wallet.balance += amount;
    } else {
      user.wallet.balance -= amount;
    }
    user.wallet.transactions.push(transaction._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      data: {
        transaction,
        newBalance: user.wallet.balance,
      },
    });
  } catch (error) {
    console.error("Add Wallet Transaction Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add transaction",
    });
  }
};

// @desc    Generate profile QR code
// @route   GET /api/profile/qr
// @access  Private
exports.generateQR = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // In a real implementation, you would use a QR code library
    // For now, return a URL that can be used to generate QR
    const qrData = {
      userId: user._id,
      mobile: user.mobile,
      name: user.name,
    };

    res.json({
      success: true,
      data: {
        qrData: JSON.stringify(qrData),
        // In production, generate actual QR code image
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          JSON.stringify(qrData)
        )}`,
      },
    });
  } catch (error) {
    console.error("Generate QR Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate QR code",
    });
  }
};

// @desc    Get public user profile by userId or _id
// @route   GET /api/profile/public/:userId
// @access  Public
exports.getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const mongoose = require("mongoose");

    console.log("🔍 [getPublicProfile] ========== START ==========");
    console.log("🔍 [getPublicProfile] Request received for userId:", userId);
    console.log("🔍 [getPublicProfile] Request params:", JSON.stringify(req.params));
    console.log("🔍 [getPublicProfile] Request URL:", req.originalUrl);
    console.log("🔍 [getPublicProfile] Request path:", req.path);
    console.log("🔍 [getPublicProfile] Request method:", req.method);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user by userId or _id
    let user = null;
    
    // First try to find by _id (ObjectId) - most common case
    if (mongoose.Types.ObjectId.isValid(userId)) {
      try {
        user = await User.findById(userId);
        console.log("🔍 [getPublicProfile] Searched by _id:", user ? `Found: ${user.name}` : "Not found");
      } catch (err) {
        console.error("❌ [getPublicProfile] Error searching by _id:", err.message);
      }
    }
    
    // If not found, try finding by userId field (if it's a string like P000001)
    if (!user && userId && !mongoose.Types.ObjectId.isValid(userId)) {
      try {
        user = await User.findOne({ userId });
        console.log("🔍 [getPublicProfile] Searched by userId field:", user ? `Found: ${user.name}` : "Not found");
      } catch (err) {
        console.error("❌ [getPublicProfile] Error searching by userId field:", err.message);
      }
    }

    if (!user) {
      console.log("❌ [getPublicProfile] User not found with ID:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ [getPublicProfile] User found:", user.name, user._id);

    // Calculate trips posted count
    const tripsPostedCount = await Booking.countDocuments({
      postedBy: user._id,
    });

    // Calculate age from dob
    let age = null;
    if (user.dob) {
      age = Math.floor(
        (new Date() - new Date(user.dob)) / (365.25 * 24 * 60 * 60 * 1000)
      );
    }

    // Get reviews and calculate ratings
    const reviews = await Review.find({
      reviewedUserId: user._id,
      isVisible: true,
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    const totalReviews = reviews.length;

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    // Check verification status
    const isVerified =
      user.isVerified ||
      user.verificationStatus?.aadhaar?.verified ||
      user.verificationStatus?.drivingLicense?.verified ||
      false;

    res.json({
      success: true,
      data: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        businessName: user.businessName,
        mobile: user.mobile,
        email: user.email,
        profile: {
          avatar: user.profile?.avatar,
          address: user.profile?.address,
          city: user.profile?.city,
          state: user.profile?.state,
          businessDescription: user.profile?.businessDescription,
          yearsInBusiness: user.profile?.yearsInBusiness,
          preferredTrips: user.profile?.preferredTrips || [],
          preferredRoutes: user.profile?.preferredRoutes || [],
          languages: user.profile?.languages || [],
          numberOfVehicles: user.profile?.numberOfVehicles || 0,
          vehicleTypes: user.profile?.vehicleTypes || [],
        },
        verificationStatus: {
          isVerified: isVerified,
        },
        age: age || user.profile?.age,
        tripsPostedCount,
        memberSince: user.createdAt,
        rating: {
          average: parseFloat(avgRating.toFixed(1)),
          total: totalReviews,
          distribution: ratingDistribution,
        },
      },
    });
    console.log("✅ [getPublicProfile] ========== SUCCESS ==========");
  } catch (error) {
    console.error("❌ [getPublicProfile] ========== ERROR ==========");
    console.error("❌ [getPublicProfile] Error:", error);
    console.error("❌ [getPublicProfile] Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/profile/:userId/reviews
// @access  Public
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Find user by userId or _id
    let user = await User.findOne({ userId });
    if (!user) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
      reviewedUserId: user._id,
      isVisible: true,
    })
      .populate("reviewerUserId", "name profile.avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      reviewedUserId: user._id,
      isVisible: true,
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get User Reviews Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Create a review
// @route   POST /api/profile/:userId/review
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating, reviewText, tags, pictures, serviceName, bookingId } =
      req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Find reviewed user
    let reviewedUser = await User.findOne({ userId });
    if (!reviewedUser) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(userId)) {
        reviewedUser = await User.findById(userId);
      }
    }

    if (!reviewedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if reviewer already reviewed this user
    const existingReview = await Review.findOne({
      reviewedUserId: reviewedUser._id,
      reviewerUserId: req.userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this user",
      });
    }

    // Prevent self-review
    if (reviewedUser._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot review yourself",
      });
    }

    // Create review
    const review = await Review.create({
      reviewedUserId: reviewedUser._id,
      reviewerUserId: req.userId,
      bookingId,
      rating,
      reviewText,
      tags: tags || [],
      pictures: pictures || [],
      serviceName,
    });

    await review.populate("reviewerUserId", "name profile.avatar");

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    console.error("Create Review Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
