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

// Public routes (no auth required) - MUST be before /:id route
router.get("/public/:id", getPublicProfile);

// Search route must be BEFORE /:id route to avoid conflicts
router.get("/search", auth, searchUsers);
router.get("/", auth, roleCheck("admin"), getUsers);
router.get("/:id", auth, getUser);
router.put("/:id", auth, roleCheck("admin"), updateUser);
router.delete("/:id", auth, roleCheck("admin"), deleteUser);

module.exports = router;
