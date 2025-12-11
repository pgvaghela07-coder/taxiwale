const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  searchUsers,
} = require("../controllers/userController");
const { getPublicProfile } = require("../controllers/profileController");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Public routes (no auth required) - must be before /:id route
router.get("/public/:id", (req, res, next) => {
  // #region agent log
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(__dirname, '..', '..', '..', '.cursor', 'debug.log');
  try {
    fs.appendFileSync(logPath, JSON.stringify({
      id: `log_${Date.now()}_route_match_users`,
      timestamp: Date.now(),
      location: 'routes/users.js:15',
      message: 'Route /public/:id matched (users)',
      data: { id: req.params.id, method: req.method, path: req.path, originalUrl: req.originalUrl },
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C'
    }) + '\n');
  } catch (e) {}
  // #endregion
  next();
}, getPublicProfile);

// Search route must be BEFORE /:id route to avoid conflicts
router.get("/search", auth, searchUsers);
router.get("/", auth, roleCheck("admin"), getUsers);
router.get("/:id", auth, getUser);
router.put("/:id", auth, roleCheck("admin"), updateUser);
router.delete("/:id", auth, roleCheck("admin"), deleteUser);

module.exports = router;
