const User = require("../models/User");
const Verification = require("../models/Verification");
const otpService = require("../services/otpService");

// @desc    Verify Aadhaar
// @route   POST /api/verification/aadhaar
// @access  Private
exports.verifyAadhaar = async (req, res) => {
  try {
    const { aadhaarNumber, otp } = req.body;

    console.log(`🔍 Verify Aadhaar Request:`);
    console.log(`   userId: ${req.userId}`);
    console.log(`   aadhaarNumber: ${aadhaarNumber}`);
    console.log(`   otp: "${otp}" (type: ${typeof otp})`);

    if (!aadhaarNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar number and OTP are required",
      });
    }

    // Verify OTP using otpService (checks against stored OTP)
    const otpResult = await otpService.verifyOTP(req.userId, otp);

    console.log(`🔍 OTP Verification Result:`, otpResult);

    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.error || "Invalid Aadhaar OTP",
      });
    }

    // Update user verification status
    const user = await User.findById(req.userId);
    user.verificationStatus.aadhaar.verified = true;
    user.verificationStatus.aadhaar.verifiedAt = new Date();
    user.verificationStatus.aadhaar.aadhaarNumber = aadhaarNumber;

    // Check if all verifications are done
    if (user.verificationStatus.drivingLicense.verified) {
      user.isVerified = true;
    }

    await user.save();

    // Create verification record
    await Verification.create({
      userId: req.userId,
      type: "aadhaar",
      status: "verified",
      data: { aadhaarNumber },
      verifiedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Aadhaar verified successfully",
      data: {
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Verify Aadhaar Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify Aadhaar",
    });
  }
};

// @desc    Verify Driving License
// @route   POST /api/verification/driving-license
// @access  Private
exports.verifyDrivingLicense = async (req, res) => {
  try {
    const { dlNumber, otp } = req.body;

    console.log(`🔍 Verify DL Request:`);
    console.log(`   userId: ${req.userId}`);
    console.log(`   dlNumber: ${dlNumber}`);
    console.log(`   otp: "${otp}"`);

    if (!dlNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Driving license number and OTP are required",
      });
    }

    // Verify OTP using otpService (checks against stored OTP)
    const otpResult = await otpService.verifyOTP(req.userId, otp);

    console.log(`🔍 OTP Verification Result:`, otpResult);

    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.error || "Invalid DL OTP",
      });
    }

    // Update user verification status
    const user = await User.findById(req.userId);
    user.verificationStatus.drivingLicense.verified = true;
    user.verificationStatus.drivingLicense.verifiedAt = new Date();
    user.verificationStatus.drivingLicense.dlNumber = dlNumber;

    // Check if all verifications are done
    if (user.verificationStatus.aadhaar.verified) {
      user.isVerified = true;
    }

    await user.save();

    // Create verification record
    await Verification.create({
      userId: req.userId,
      type: "driving-license",
      status: "verified",
      data: { dlNumber },
      verifiedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Driving license verified successfully",
      data: {
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Verify DL Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify driving license",
    });
  }
};

// @desc    Connect DigiLocker
// @route   POST /api/verification/digilocker
// @access  Private
exports.connectDigiLocker = async (req, res) => {
  try {
    // In a real implementation, you would integrate with DigiLocker API
    // For now, simulate connection
    const user = await User.findById(req.userId);
    user.verificationStatus.digilocker.connected = true;
    user.verificationStatus.digilocker.connectedAt = new Date();
    await user.save();

    // Create verification record
    await Verification.create({
      userId: req.userId,
      type: "digilocker",
      status: "verified",
      data: { digilockerId: `DL${req.userId}` },
      verifiedAt: new Date(),
    });

    res.json({
      success: true,
      message: "DigiLocker connected successfully",
      data: {
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Connect DigiLocker Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to connect DigiLocker",
    });
  }
};

// @desc    Get verification status
// @route   GET /api/verification/status
// @access  Private
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Get Verification Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch verification status",
    });
  }
};
