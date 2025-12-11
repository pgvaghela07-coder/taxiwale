const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but unique non-null
      // Will be auto-generated in pre-save hook
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      minlength: [2, "Business name must be at least 2 characters"],
      maxlength: [100, "Business name cannot exceed 100 characters"],
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allow multiple null emails but unique non-null emails
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password_hash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't return password by default
    },
    is_phone_verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["client", "staff", "admin"],
      default: "client",
      index: true,
    },
    is_active: {
      type: Boolean,
      default: false, // Account not active until phone OTP is verified
    },
    last_login_at: {
      type: Date,
    },
    failed_login_count: {
      type: Number,
      default: 0,
    },
    locked_until: {
      type: Date,
      default: null,
    },
    otp_code: {
      type: String,
    },
    otp_expires_at: {
      type: Date,
    },
    otp_attempts: {
      type: Number,
      default: 0,
    },
    otp_last_sent_at: {
      type: Date,
    },
    // Legacy fields for backward compatibility
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      aadhaar: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        aadhaarNumber: { type: String },
      },
      drivingLicense: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        dlNumber: { type: String },
      },
      digilocker: {
        connected: { type: Boolean, default: false },
        connectedAt: Date,
      },
    },
    profile: {
      avatar: String,
      coverImage: String, // Background/cover photo URL
      address: String,
      city: String,
      state: String,
      pincode: String,
      language: { type: String, default: "english" }, // Keep for backward compatibility
      languages: [String], // Array of languages: ["Hindi", "English", "Punjabi"]
      // Business Information
      businessDescription: String, // Company description
      businessOperationCity: String,
      businessOperationState: String,
      numberOfVehicles: { type: Number, default: 0 },
      vehicleTypes: [String], // e.g., ["Sedan", "SUV", "Hatchback"]
      gstNumber: String,
      panNumber: String,
      bankAccountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String,
      businessRegistrationNumber: String,
      businessType: String, // e.g., "Sole Proprietorship", "Partnership", "LLP", "Private Limited"
      yearsInBusiness: Number,
      experience: Number, // Years of experience (driving/business)
      serviceAreas: [String], // Cities/areas where they operate
      preferredTrips: [String], // Array of preferred trip types: ["round-trip", "airport", "one-way", "local-duty"]
      preferredRoutes: [String], // Array of preferred routes: ["Ludhiana → Amritsar", "Ludhiana → Delhi"]
      isProfileComplete: { type: Boolean, default: false },
    },
    wallet: {
      balance: { type: Number, default: 0 },
      transactions: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
      ],
    },
    // Legacy OTP field for backward compatibility
    otp: {
      code: String,
      expiresAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate userId
userSchema.pre("save", async function (next) {
  // Generate userId if not present
  if (!this.userId || this.userId === "") {
    try {
      // Get current max userId number
      const usersWithId = await mongoose.model("User").find({ 
        userId: { $exists: true, $ne: null, $ne: "" } 
      })
        .sort({ userId: -1 })
        .limit(1);
      
      let nextNumber = 1;
      if (usersWithId.length > 0) {
        const lastUserId = usersWithId[0].userId;
        const match = lastUserId.match(/P(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.userId = `P${String(nextNumber).padStart(6, "0")}`; // P000001, P000002, etc.
    } catch (error) {
      console.error("Error generating userId:", error);
      // Fallback: use timestamp-based ID
      this.userId = `P${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Indexes
userSchema.index({ userId: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ "verificationStatus.aadhaar.verified": 1 });
userSchema.index({ role: 1 });
userSchema.index({ is_phone_verified: 1 });
userSchema.index({ is_active: 1 });

// Virtual for created_at (using timestamps)
userSchema.virtual("created_at").get(function () {
  return this.createdAt;
});

// Virtual for updated_at (using timestamps)
userSchema.virtual("updated_at").get(function () {
  return this.updatedAt;
});

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  if (this.locked_until && this.locked_until > new Date()) {
    return true;
  }
  // Unlock if lock period has passed
  if (this.locked_until && this.locked_until <= new Date()) {
    this.locked_until = null;
    this.failed_login_count = 0;
    return false;
  }
  return false;
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedLogin = async function () {
  this.failed_login_count += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failed_login_count >= 5) {
    this.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  await this.save();
};

// Method to reset failed login attempts
userSchema.methods.resetFailedLogin = async function () {
  this.failed_login_count = 0;
  this.locked_until = null;
  await this.save();
};

module.exports = mongoose.model("User", userSchema);
