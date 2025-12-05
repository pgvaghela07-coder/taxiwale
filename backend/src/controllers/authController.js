const User = require("../models/User");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const otpService = require("../services/otpService");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: "refresh" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
};

// Password validation
const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  try {
    const { mobile, userId } = req.body;

    // Find user
    let user;
    let validatedMobile;

    if (userId) {
      // If userId is provided, find user by ID
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please sign up first.",
        });
      }
      // Use mobile from user object or from request
      validatedMobile = mobile || user.mobile;
      if (!validatedMobile || !/^[0-9]{10}$/.test(validatedMobile)) {
        return res.status(400).json({
          success: false,
          message: "Invalid mobile number. Please enter a 10-digit number.",
        });
      }
    } else {
      // If no userId, mobile is required
      if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: "Invalid mobile number. Please enter a 10-digit number.",
        });
      }
      validatedMobile = mobile;
      user = await User.findOne({ mobile });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please sign up first.",
        });
      }
    }

    // Cooldown check removed for prototyping - allow unlimited OTP requests

    // Generate OTP
    const otp = await otpService.generateOTP();

    // Save OTP
    await otpService.saveOTP(user._id, otp);

    // Send OTP via SMS
    await otpService.sendOTP(validatedMobile, otp);

    res.json({
      success: true,
      message: "OTP sent successfully",
      userId: user._id,
      // Always return OTP for prototyping
      otp: otp,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { mobile, otp, userId } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    // Find user
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (mobile) {
      user = await User.findOne({ mobile });
    } else {
      return res.status(400).json({
        success: false,
        message: "Mobile number or User ID is required",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    const otpResult = await otpService.verifyOTP(user._id, otp);

    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.error || "Invalid or expired OTP",
      });
    }

    // Activate account and mark phone as verified (for signup flow)
    if (!user.is_phone_verified) {
      user.is_phone_verified = true;
      user.is_active = true;
      user.isVerified = true; // Legacy field
      await user.save();
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: "OTP verified successfully. Account activated.",
      token,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        is_phone_verified: user.is_phone_verified,
        is_email_verified: user.is_email_verified,
        is_active: user.is_active,
        role: user.role,
        isVerified: user.isVerified, // Legacy field
        verificationStatus: user.verificationStatus || {
          isVerified: false,
          aadhaar: { verified: false },
          drivingLicense: { verified: false },
        },
        profile: user.profile, // Include profile for profile completion check
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-otp -__v")
      .populate("wallet.transactions");

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

// @desc    Signup
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      businessName,
      dob,
      gender,
      mobile,
      email,
      password,
      confirmPassword,
    } = req.body;

    // Validation
    if (!firstName || firstName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "First name must be at least 2 characters long",
      });
    }

    if (!lastName || lastName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Last name must be at least 2 characters long",
      });
    }

    if (!businessName || businessName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Business name must be at least 2 characters long",
      });
    }

    if (!dob) {
      return res.status(400).json({
        success: false,
        message: "Date of birth is required",
      });
    }

    // Validate age (must be at least 18)
    const dobDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    const dayDiff = today.getDate() - dobDate.getDate();
    if (
      age < 18 ||
      (age === 18 && monthDiff < 0) ||
      (age === 18 && monthDiff === 0 && dayDiff < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 18 years old to register",
      });
    }

    if (
      !gender ||
      !["male", "female", "other", "prefer-not-to-say"].includes(gender)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid gender",
      });
    }

    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number. Please enter a 10-digit number.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (email && !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ mobile }, ...(email ? [{ email }] : [])],
    });

    if (existingUser) {
      if (existingUser.mobile === mobile) {
        return res.status(400).json({
          success: false,
          message: "An account with this mobile number already exists",
        });
      }
      if (email && existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists",
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Combine firstName and lastName for name field (for backward compatibility)
    // Ensure both are trimmed and not empty
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();

    // Validate combined name (should always pass if firstName and lastName are valid, but check anyway)
    if (!fullName || fullName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "First name and last name must be at least 2 characters each",
      });
    }

    // Create user (inactive until phone OTP is verified)
    const user = await User.create({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      name: fullName, // Keep name field for backward compatibility - ensure it's always valid
      businessName: businessName.trim(),
      dob: new Date(dob),
      gender,
      mobile,
      email: email ? email.trim().toLowerCase() : undefined,
      password_hash,
      is_active: false,
      is_phone_verified: false,
      is_email_verified: false,
      role: "client",
      "profile.isProfileComplete": false, // Profile not complete yet
    });

    // Generate and send OTP for phone verification
    const otp = await otpService.generateOTP();
    await otpService.saveOTP(user._id, otp);
    await otpService.sendOTP(mobile, otp);

    res.status(201).json({
      success: true,
      message:
        "Account created successfully. Please verify your phone number with OTP.",
      userId: user._id,
      // Always return OTP for prototyping
      otp: otp,
    });
  } catch (error) {
    console.error("Signup Error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = error.errors || {};
      let errorMessage = "Validation error";

      // Check for name field validation error specifically
      if (errors.name) {
        errorMessage = errors.name.message;
        // Map name validation error to a more user-friendly message
        if (
          errorMessage.includes("Name must be at least 2 characters") ||
          errorMessage.includes("Name is required")
        ) {
          return res.status(400).json({
            success: false,
            message:
              "First name and last name must be at least 2 characters each",
          });
        }
      } else {
        // Get first validation error
        const firstError = Object.values(errors)[0];
        errorMessage = firstError?.message || "Validation error";
      }

      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create account",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Validation
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Find user with password hash
    const user = await User.findOne({ mobile }).select("+password_hash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil(
        (user.locked_until - new Date()) / 1000 / 60
      );
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked. Please try again after ${lockTimeRemaining} minutes.`,
      });
    }

    // Check if account is active (phone verified)
    if (!user.is_active || !user.is_phone_verified) {
      return res.status(403).json({
        success: false,
        message:
          "Account is not activated. Please verify your phone number first.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await user.incrementFailedLogin();
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password",
      });
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLogin();

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        is_phone_verified: user.is_phone_verified,
        is_email_verified: user.is_email_verified,
        role: user.role,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to login",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to refresh token",
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message:
          "If an account exists with this mobile number, an OTP will be sent.",
      });
    }

    // Generate and send OTP
    const otp = await otpService.generateOTP();
    await otpService.saveOTP(user._id, otp);
    await otpService.sendOTP(mobile, otp);

    res.json({
      success: true,
      message: "OTP sent to your mobile number",
      // Always return OTP for prototyping
      otp: otp,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process request",
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { mobile, otp, newPassword, confirmPassword } = req.body;

    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mobile number, OTP, and new password are required",
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    const otpResult = await otpService.verifyOTP(user._id, otp);
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.error || "Invalid or expired OTP",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // In a more advanced implementation, you might want to blacklist the token
    // For now, client-side token removal is sufficient
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};
