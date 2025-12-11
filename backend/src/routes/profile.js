const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getWallet,
  addWalletTransaction,
  generateQR,
  getPublicProfile,
} = require("../controllers/profileController");
const auth = require("../middleware/auth");

// Public routes (no auth required)
router.get("/public/:userId", getPublicProfile);

// Protected routes (auth required)
router.get("/", auth, getProfile);
router.put("/", auth, updateProfile);
router.put("/update", auth, updateProfile); // Alias for compatibility
router.get("/wallet", auth, getWallet);
router.post("/wallet/transaction", auth, addWalletTransaction);
router.get("/qr", auth, generateQR);

module.exports = router;
