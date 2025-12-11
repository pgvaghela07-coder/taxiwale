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

// @desc    Get public profile
// @route   GET /api/profile/public/:userId
// @access  Public
exports.getPublicProfile = async (req, res) => {
  // #region agent log
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(__dirname, '..', '..', '..', '.cursor', 'debug.log');
  try {
    fs.appendFileSync(logPath, JSON.stringify({
      id: `log_${Date.now()}_entry`,
      timestamp: Date.now(),
      location: 'profileController.js:238',
      message: 'getPublicProfile called',
      data: { userId: req.params.userId, route: req.route?.path, method: req.method },
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C'
    }) + '\n');
  } catch (e) {
    console.error('Log write error:', e.message);
  }
  // #endregion
  try {
    // Handle both :userId (from profile route) and :id (from users route)
    const userId = req.params.userId || req.params.id;
    
    // Validate userId is present
    if (!userId) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({
          id: `log_${Date.now()}_missing_userid`,
          timestamp: Date.now(),
          location: 'profileController.js:262',
          message: 'userId missing from params',
          data: { params: req.params },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E'
        }) + '\n');
      } catch (e) {}
      // #endregion
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({
        id: `log_${Date.now()}_extracted`,
        timestamp: Date.now(),
        location: 'profileController.js:275',
        message: 'userId extracted from params',
        data: { extractedUserId: userId, userIdParam: req.params.userId, idParam: req.params.id, type: typeof userId, length: userId?.length },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E'
      }) + '\n');
    } catch (e) {}
    // #endregion

    // Find user by _id or userId field
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({
        id: `log_${Date.now()}_before_find`,
        timestamp: Date.now(),
        location: 'profileController.js:243',
        message: 'Before findById query',
        data: { userId, isValidObjectId: require('mongoose').Types.ObjectId.isValid(userId) },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D'
      }) + '\n');
    } catch (e) {}
    // #endregion
    let user = await User.findById(userId);
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({
        id: `log_${Date.now()}_after_findbyid`,
        timestamp: Date.now(),
        location: 'profileController.js:243',
        message: 'After findById query',
        data: { found: !!user, userId: user?._id?.toString() || null },
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      }) + '\n');
    } catch (e) {}
    // #endregion
    if (!user) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({
          id: `log_${Date.now()}_before_findone`,
          timestamp: Date.now(),
          location: 'profileController.js:245',
          message: 'Before findOne by userId field',
          data: { userId },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        }) + '\n');
      } catch (e) {}
      // #endregion
      user = await User.findOne({ userId: userId });
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({
          id: `log_${Date.now()}_after_findone`,
          timestamp: Date.now(),
          location: 'profileController.js:245',
          message: 'After findOne by userId field',
          data: { found: !!user, userId: user?.userId || null, _id: user?._id?.toString() || null },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        }) + '\n');
      } catch (e) {}
      // #endregion
    }
    if (!user) {
      // #region agent log
      try {
        fs.appendFileSync(logPath, JSON.stringify({
          id: `log_${Date.now()}_not_found`,
          timestamp: Date.now(),
          location: 'profileController.js:247',
          message: 'User not found - returning 404',
          data: { userId, searchedBy_id: true, searchedByUserIdField: true },
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        }) + '\n');
      } catch (e) {}
      // #endregion
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate age from dob
    let age = null;
    if (user.dob) {
      const today = new Date();
      const birthDate = new Date(user.dob);
      age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Count trips posted
    const tripsPostedCount = await Booking.countDocuments({
      postedBy: user._id,
    });

    // Count booking cancelled
    const bookingCancelledCount = await Booking.countDocuments({
      postedBy: user._id,
      status: "cancelled",
    });

    // Get reviews and calculate ratings
    const reviews = await Review.find({
      reviewedUserId: user._id,
      isVisible: true,
    });

    const totalReviews = reviews.length;
    let averageRating = 0;
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (totalReviews > 0) {
      const totalRating = reviews.reduce((sum, review) => {
        ratingDistribution[review.rating] =
          (ratingDistribution[review.rating] || 0) + 1;
        return sum + review.rating;
      }, 0);
      averageRating = totalRating / totalReviews;
    }

    // Calculate rating percentages
    const ratingPercentages = {};
    for (let i = 1; i <= 5; i++) {
      ratingPercentages[i] =
        totalReviews > 0
          ? Math.round((ratingDistribution[i] / totalReviews) * 100)
          : 0;
    }

    // Return public profile data
    res.json({
      success: true,
      data: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        businessName: user.businessName,
        email: user.email,
        mobile: user.mobile,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        role: user.role,
        profile: {
          avatar: user.profile?.avatar,
          coverImage: user.profile?.coverImage,
          address: user.profile?.address,
          city: user.profile?.city,
          state: user.profile?.state,
          businessDescription: user.profile?.businessDescription,
          experience: user.profile?.experience,
          preferredTrips: user.profile?.preferredTrips || [],
          preferredRoutes: user.profile?.preferredRoutes || [],
          languages: user.profile?.languages || [],
        },
        dob: user.dob,
        age,
        tripsPostedCount,
        bookingCancelledCount,
        rating: {
          average: parseFloat(averageRating.toFixed(1)),
          totalReviews,
          distribution: ratingDistribution,
          percentages: ratingPercentages,
        },
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Public Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch public profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
