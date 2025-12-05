const express = require("express");
const router = express.Router();
const {
  signup,
  sendOTP,
  verifyOTP,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} = require("../controllers/authController");
const auth = require("../middleware/auth");
const {
  signupLimiter,
  otpLimiter,
  loginLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimiter");

// Public routes
router.post("/signup", signup); // Rate limiting removed for prototyping
router.post("/send-otp", sendOTP); // Rate limiting removed for prototyping
router.post("/verify-otp", verifyOTP); // Rate limiting removed for prototyping
router.post("/login", loginLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

// Protected routes
router.get("/me", auth, getMe);
router.post("/logout", auth, logout);

module.exports = router;
