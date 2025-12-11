const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getWallet,
  addWalletTransaction,
  generateQR,
} = require("../controllers/profileController");
const auth = require("../middleware/auth");

router.get("/", auth, getProfile);
router.put("/", auth, updateProfile);
router.put("/update", auth, updateProfile); // Alias for compatibility
router.get("/wallet", auth, getWallet);
router.post("/wallet/transaction", auth, addWalletTransaction);
router.get("/qr", auth, generateQR);

module.exports = router;
