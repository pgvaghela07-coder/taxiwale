const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getWallet,
  addWalletTransaction,
  generateQR,
  getPublicProfile,
  getUserReviews,
  createReview,
} = require("../controllers/profileController");
const auth = require("../middleware/auth");

// Public profile routes (MUST be before other routes to avoid route conflicts)
router.get("/public/:userId", getPublicProfile);

// Protected routes
router.get("/", auth, getProfile);
router.put("/", auth, updateProfile);
router.put("/update", auth, updateProfile); // Alias for compatibility
router.get("/wallet", auth, getWallet);
router.post("/wallet/transaction", auth, addWalletTransaction);
router.get("/qr", auth, generateQR);

// User-specific routes (must come after /public/:userId)
router.get("/:userId/reviews", getUserReviews);
router.post("/:userId/review", auth, createReview);

module.exports = router;
