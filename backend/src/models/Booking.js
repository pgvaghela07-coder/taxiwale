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
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const Booking = mongoose.model("Booking");
        
        // Get the highest bookingId number
        const lastBooking = await Booking.findOne(
          { bookingId: { $exists: true, $ne: null, $ne: "" } },
          { bookingId: 1 }
        )
          .sort({ bookingId: -1 })
          .limit(1);

        let nextNumber = 1;
        if (lastBooking && lastBooking.bookingId) {
          // Extract number from bookingId (format: BW000001)
          const match = lastBooking.bookingId.match(/BW(\d{6})/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }

        // Generate candidate ID with sequential number
        const candidateId = `BW${String(nextNumber).padStart(6, "0")}`;

        // Check if this ID already exists
        const exists = await Booking.findOne({ bookingId: candidateId });
        if (!exists) {
          this.bookingId = candidateId;
          break; // Success - exit loop
        } else {
          // If exists, increment more aggressively and try again
          attempts++;
          nextNumber += attempts; // Increment by attempt count to skip ahead faster
          // Small delay to avoid tight loop and allow other saves to complete
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        }
      } catch (error) {
        console.error("Error generating bookingId:", error);
        attempts++;
        if (attempts >= maxAttempts) {
          // Fallback: use timestamp + random for absolute uniqueness
          const timestamp = Date.now().toString().slice(-10);
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
          this.bookingId = `BW${timestamp}${random}`;
          break;
        }
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Final safety check - if still no ID, use timestamp-based
    if (!this.bookingId || this.bookingId === "") {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
      this.bookingId = `BW${timestamp}${random}`;
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
