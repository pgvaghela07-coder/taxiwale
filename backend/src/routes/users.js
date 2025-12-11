const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  searchUsers,
} = require("../controllers/userController");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Search route must be BEFORE /:id route to avoid conflicts
router.get("/search", auth, searchUsers);
router.get("/", auth, roleCheck("admin"), getUsers);
router.get("/:id", auth, getUser);
router.put("/:id", auth, roleCheck("admin"), updateUser);
router.delete("/:id", auth, roleCheck("admin"), deleteUser);

module.exports = router;
