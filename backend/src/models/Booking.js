const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      // Not required - will be auto-generated in pre-save hook
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tripType: {
      type: String,
      enum: ["one-way", "round-trip"],
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["sedan", "suv", "hatchback", "luxury", "traveller", "bus"],
      required: true,
    },
    pickup: {
      city: { type: String, required: true },
      location: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    drop: {
      city: { type: String, required: true },
      location: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    dateTime: {
      type: Date,
      required: true,
    },
    amount: {
      bookingAmount: { type: Number, required: true },
    },
    customRequirement: String,
    status: {
      type: String,
      enum: ["active", "assigned", "closed", "cancelled"],
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

// Generate booking ID before save
bookingSchema.pre("save", async function (next) {
  // Always generate bookingId if not present
  if (!this.bookingId || this.bookingId === "") {
    try {
      const count = await mongoose.model("Booking").countDocuments();
      this.bookingId = `BW${String(count + 1).padStart(6, "0")}`;
    } catch (error) {
      console.error("Error generating bookingId:", error);
      // Fallback: use timestamp-based ID
      this.bookingId = `BW${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Indexes
bookingSchema.index({ postedBy: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ "pickup.city": 1 });
bookingSchema.index({ "drop.city": 1 });
bookingSchema.index({ vehicleType: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
