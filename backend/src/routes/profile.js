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
router.get("/public/:userId", (req, res, next) => {
  // #region agent log
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(__dirname, '..', '..', '..', '.cursor', 'debug.log');
  try {
    fs.appendFileSync(logPath, JSON.stringify({
      id: `log_${Date.now()}_route_match`,
      timestamp: Date.now(),
      location: 'routes/profile.js:14',
      message: 'Route /public/:userId matched',
      data: { userId: req.params.userId, method: req.method, path: req.path, originalUrl: req.originalUrl },
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C'
    }) + '\n');
  } catch (e) {}
  // #endregion
  next();
}, getPublicProfile);

// Protected routes (auth required)
router.get("/", auth, getProfile);
router.put("/", auth, updateProfile);
router.put("/update", auth, updateProfile); // Alias for compatibility
router.get("/wallet", auth, getWallet);
router.post("/wallet/transaction", auth, addWalletTransaction);
router.get("/qr", auth, generateQR);

module.exports = router;
