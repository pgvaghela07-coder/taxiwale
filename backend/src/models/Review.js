const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: String,
    tags: [String], // e.g., ["Excellent behaviour", "Highly recommended"]
    pictures: [String], // image URLs
    serviceName: String, // e.g., "Ana taxi service"
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
reviewSchema.index({ reviewedUserId: 1, createdAt: -1 });
reviewSchema.index({ reviewerUserId: 1 });

module.exports = mongoose.model("Review", reviewSchema);

