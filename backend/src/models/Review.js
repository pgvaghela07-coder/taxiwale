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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      trim: true,
    },
    tags: [String], // Review tags like "Excellent behaviour", "Highly recommended"
    pictures: [String], // Review picture URLs
    serviceName: {
      type: String,
      trim: true,
    }, // Service name (e.g., "Ana taxi service")
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    }, // Optional related booking
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
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isVisible: 1 });

module.exports = mongoose.model("Review", reviewSchema);






