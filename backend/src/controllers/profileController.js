const User = require("../models/User");
const Transaction = require("../models/Transaction");

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
// @route   GET /api/users/public/:id
// @access  Public
exports.getPublicProfile = async (req, res) => {
  try {
    // Handle both :userId (from profile route) and :id (from users route)
    const userId = req.params.userId || req.params.id;
    
    // Validate userId is present
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user by _id or userId field
    let user = null;
    const mongoose = require('mongoose');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);

    if (isValidObjectId) {
      user = await User.findById(userId);
    }

    if (!user) {
      user = await User.findOne({ userId: userId });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return public profile data (exclude sensitive info)
    res.json({
      success: true,
      data: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        mobile: user.mobile,
        email: user.email,
        dob: user.dob,
        profile: user.profile,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Public Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
