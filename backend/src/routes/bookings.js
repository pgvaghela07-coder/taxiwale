const express = require("express");
const router = express.Router();
const {
  getBookings,
  getMyBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  assignBooking,
  closeBooking,
  addComment,
  getFilterOptions,
} = require("../controllers/bookingController");
const auth = require("../middleware/auth");

router.get("/filters", auth, getFilterOptions);
router.get("/my-bookings", auth, getMyBookings);
router.get("/", auth, getBookings);
router.get("/:id", auth, getBooking);
router.post("/", auth, createBooking);
router.put("/:id", auth, updateBooking);
router.delete("/:id", auth, deleteBooking);
router.post("/:id/assign", auth, assignBooking);
router.post("/:id/close", auth, closeBooking);
router.post("/:id/comment", auth, addComment);

module.exports = router;
