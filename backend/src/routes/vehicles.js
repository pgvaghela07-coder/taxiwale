const express = require("express");
const router = express.Router();
const {
  getVehicles,
  getMyVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignVehicle,
  closeVehicle,
  addComment,
} = require("../controllers/vehicleController");
const auth = require("../middleware/auth");

router.get("/", auth, getVehicles);
router.get("/my-vehicles", auth, getMyVehicles);
router.get("/:id", auth, getVehicle);
router.post("/", auth, createVehicle);
router.put("/:id", auth, updateVehicle);
router.delete("/:id", auth, deleteVehicle);
router.post("/:id/assign", auth, assignVehicle);
router.post("/:id/close", auth, closeVehicle);
router.post("/:id/comment", auth, addComment);

module.exports = router;
