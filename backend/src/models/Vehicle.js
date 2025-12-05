const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      unique: true,
      // Not required - will be auto-generated in pre-save hook
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["sedan", "suv", "hatchback", "luxury"],
      required: true,
    },
    tripType: {
      type: String,
      enum: ["one-way", "round-trip"],
      required: true,
    },
    location: {
      city: { type: String, required: true },
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    availability: {
      date: Date,
      time: String,
      status: {
        type: String,
        enum: ["available-now", "available-later"],
        default: "available-now",
      },
    },
    commission: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    customRequirement: String,
    status: {
      type: String,
      enum: ["active", "assigned", "booked", "inactive"],
      default: "active",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: {
      type: Date,
    },
    closedFrom: {
      type: String,
      enum: ["bhade-ghaadi", "taxi-sanchalak", "cabswale", "whatsapp", "other"],
    },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate vehicle ID before save
vehicleSchema.pre("save", async function (next) {
  // Always generate vehicleId if not present
  if (!this.vehicleId || this.vehicleId === "") {
    try {
      const count = await mongoose.model("Vehicle").countDocuments();
      this.vehicleId = `FV${String(count + 1).padStart(6, "0")}`;
    } catch (error) {
      console.error("Error generating vehicleId:", error);
      // Fallback: use timestamp-based ID
      this.vehicleId = `FV${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Indexes
vehicleSchema.index({ postedBy: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ "location.city": 1 });
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ createdAt: -1 });
vehicleSchema.index({ assignedTo: 1 });
vehicleSchema.index({ vehicleId: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);
