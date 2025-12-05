const axios = require("axios");
const User = require("../models/User");

class OTPService {
  constructor() {
    this.OTP_EXPIRY_MINUTES = 10; // OTP valid for 10 minutes
    this.OTP_MAX_ATTEMPTS = 5; // Max OTP verification attempts
    this.OTP_RESEND_COOLDOWN_SECONDS = 60; // 60 seconds cooldown between resends
  }

  async generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(mobile, otp) {
    // In development, just log the OTP
    if (process.env.NODE_ENV === "development") {
      console.log(`📱 OTP for ${mobile}: ${otp}`);
      return { success: true };
    }

    // In production, use Fast2SMS or similar service
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const response = await axios.post(
          "https://www.fast2sms.com/dev/bulkV2",
          {
            route: "otp",
            variables_values: otp,
            numbers: mobile,
          },
          {
            headers: {
              authorization: process.env.FAST2SMS_API_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        return response.data;
      } catch (error) {
        console.error("OTP Service Error:", error);
        // Don't throw error in development, just log
        if (process.env.NODE_ENV === "production") {
          throw new Error("Failed to send OTP");
        }
        return { success: true }; // Allow development to continue
      }
    }

    // Fallback: just log
    console.log(`📱 OTP for ${mobile}: ${otp}`);
    return { success: true };
  }

  async saveOTP(userId, otp) {
    try {
      // Ensure OTP is stored as string (no whitespace)
      const otpString = String(otp).trim();

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

      console.log(`💾 Saving OTP - userId: ${userId}, OTP: "${otpString}"`);

      const updateResult = await User.findByIdAndUpdate(
        userId,
        {
          otp_code: otpString,
          otp_expires_at: expiresAt,
          otp_attempts: 0, // Reset attempts when new OTP is sent
          otp_last_sent_at: new Date(),
          // Legacy field for backward compatibility
          "otp.code": otpString,
          "otp.expiresAt": expiresAt,
        },
        { new: true }
      );

      // Verify it was saved correctly
      const savedUser = await User.findById(userId).select("+otp_code");
      if (savedUser) {
        console.log(
          `✅ OTP Saved - userId: ${userId}, stored: "${savedUser.otp_code}"`
        );
      } else {
        console.error(
          `❌ OTP Save Failed - userId: ${userId}, user not found after save`
        );
      }
    } catch (error) {
      console.error(`❌ OTP Save Error - userId: ${userId}:`, error);
      // In development, don't throw if database is not connected
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Could not save OTP to database:", error.message);
        return;
      }
      throw error;
    }
  }

  async canResendOTP(userId) {
    // No cooldown for prototyping - always allow resend
    return { canResend: true };
  }

  async verifyOTP(userId, otp) {
    try {
      // Convert input OTP to string and trim whitespace
      const inputOTP = String(otp).trim();

      console.log(
        `🔍 OTP Verify Start - userId: ${userId}, inputOTP: "${inputOTP}"`
      );

      const user = await User.findById(userId).select(
        "+otp_code +otp_expires_at +otp_attempts"
      );

      if (!user) {
        console.error(`❌ OTP Verify: User not found - userId: ${userId}`);
        return { valid: false, error: "User not found" };
      }

      // Check if OTP exists
      if (!user.otp_code && !user.otp?.code) {
        console.error(`❌ OTP Verify: No OTP found - userId: ${userId}`);
        return {
          valid: false,
          error: "No OTP found. Please request a new OTP.",
        };
      }

      // Use new field or legacy field - convert to string and trim
      const storedOTP = String(user.otp_code || user.otp?.code || "").trim();
      const expiresAt = user.otp_expires_at || user.otp?.expiresAt;

      console.log(`🔍 OTP Verify Debug:`);
      console.log(`   userId: ${userId}`);
      console.log(
        `   storedOTP: "${storedOTP}" (type: ${typeof storedOTP}, length: ${
          storedOTP.length
        })`
      );
      console.log(
        `   inputOTP: "${inputOTP}" (type: ${typeof inputOTP}, length: ${
          inputOTP.length
        })`
      );
      console.log(`   exact match: ${storedOTP === inputOTP}`);

      // Check if OTP is expired
      if (expiresAt && new Date() > expiresAt) {
        console.error(
          `❌ OTP Verify: OTP expired - userId: ${userId}, expiresAt: ${expiresAt}`
        );
        return {
          valid: false,
          error: "OTP has expired. Please request a new OTP.",
        };
      }

      // Verify OTP (strict string comparison after trimming)
      if (storedOTP !== inputOTP) {
        console.error(`❌ OTP Verify: Mismatch - userId: ${userId}`);
        console.error(`   Expected: "${storedOTP}"`);
        console.error(`   Received: "${inputOTP}"`);
        return {
          valid: false,
          error: "Invalid OTP. Please try again.",
        };
      }

      console.log(`✅ OTP Verify: Success - userId: ${userId}`);

      // OTP is valid - clear OTP data
      await User.findByIdAndUpdate(userId, {
        $unset: {
          otp_code: 1,
          otp_expires_at: 1,
          otp_attempts: 1,
          otp_last_sent_at: 1,
          otp: 1, // Legacy field
        },
      });

      return { valid: true };
    } catch (error) {
      console.error(`❌ OTP Verify Error - userId: ${userId}:`, error);
      return { valid: false, error: "Failed to verify OTP" };
    }
  }
}

module.exports = new OTPService();
