const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicleName: {
      type: String,
      required: true,
      trim: true,
    }, // e.g., "TOUR S CNG"
    vehicleType: {
      type: String,
      required: true,
      enum: ["sedan", "suv", "hatchback", "luxury", "traveller", "bus"],
    },
    pricePerKm: {
      type: Number,
      required: true,
      min: 0,
    }, // Price per kilometer
    vehicleAge: {
      type: String,
      trim: true,
    }, // e.g., "3 months"
    images: [String], // Vehicle image URLs
    registrationNumber: {
      type: String,
      trim: true,
    }, // Vehicle registration
    status: {
      type: String,
      enum: ["active", "assigned", "closed"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
vehicleSchema.index({ postedBy: 1, status: 1 });
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ status: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);




















