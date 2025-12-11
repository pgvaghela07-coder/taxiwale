const express = require("express");
const router = express.Router();
const {
  getUserReviews,
  createReview,
  getRatingSummary,
} = require("../controllers/reviewController");
const auth = require("../middleware/auth");

// Public routes (no auth required)
router.get("/:userId/reviews", getUserReviews);
router.get("/:userId/rating-summary", getRatingSummary);

// Protected routes (auth required)
router.post("/:userId/review", auth, createReview);

module.exports = router;



