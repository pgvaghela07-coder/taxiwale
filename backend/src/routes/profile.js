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

// Debug middleware - log all requests to profile routes
router.use((req, res, next) => {
  console.log("🔍 [PROFILE ROUTER] Request:", req.method, req.path);
  console.log("🔍 [PROFILE ROUTER] Original URL:", req.originalUrl);
  next();
});

// Public profile routes (MUST be before other routes to avoid route conflicts)
// Test route to verify routing works
router.get("/public/test", (req, res) => {
  console.log("✅ [TEST ROUTE] /public/test hit!");
  res.json({ success: true, message: "Public profile route is working" });
});

router.get("/public/:userId", (req, res, next) => {
  console.log("✅ [ROUTE MATCH] /public/:userId matched!");
  console.log("✅ [ROUTE MATCH] userId:", req.params.userId);
  next();
}, getPublicProfile);

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
