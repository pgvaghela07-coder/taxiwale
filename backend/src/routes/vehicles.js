const express = require("express");
const router = express.Router();
const {
  getUserVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");
const auth = require("../middleware/auth");

// Public routes (no auth required) - must be before /:id routes
router.get("/user/:userId", getUserVehicles);

// Protected routes (auth required)
router.get("/my-vehicles", auth, async (req, res) => {
  // Get current user's vehicles
  const { getUserVehicles } = require("../controllers/vehicleController");
  req.params.userId = req.userId;
  return getUserVehicles(req, res);
});

router.post("/", auth, createVehicle);
router.put("/:id", auth, updateVehicle);
router.delete("/:id", auth, deleteVehicle);

module.exports = router;

