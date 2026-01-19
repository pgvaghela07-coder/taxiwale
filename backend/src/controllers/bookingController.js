const Booking = require("../models/Booking");
const User = require("../models/User");
const Review = require("../models/Review");
const mongoose = require("mongoose");
const emailService = require("../services/emailService");

// Helper function to calculate Partner Score
function calculatePartnerScore(distribution, totalRatings) {
  const percentages = {
    5: ((distribution[5] || 0) / totalRatings) * 100,
    4: ((distribution[4] || 0) / totalRatings) * 100,
    3: ((distribution[3] || 0) / totalRatings) * 100,
    2: ((distribution[2] || 0) / totalRatings) * 100,
    1: ((distribution[1] || 0) / totalRatings) * 100,
  };

  let score = 300; // Base score
  
  score += percentages[5] * 6;
  score += percentages[4] * 3;
  score += percentages[3] * 1;
  score += percentages[2] * 0.5;
  
  if (percentages[1] > 20) {
    const excessNegative = percentages[1] - 20;
    score -= excessNegative * 2;
  }
  
  const lowRatings = percentages[1] + percentages[2];
  if (lowRatings > 30) {
    const excessLow = lowRatings - 30;
    score -= excessLow * 1;
  }
  
  const partnerScore = Math.min(900, Math.max(300, Math.round(score)));
  return partnerScore;
}

// Helper function to check if user has poor partner score (300-549)
async function checkPoorPartnerScore(userId) {
  try {
    const reviews = await Review.find({
      reviewedUserId: userId,
      isVisible: true,
    });

    const totalRatings = reviews.length;
    
    // If less than 5 ratings, consider as poor score
    if (totalRatings < 5) {
      return {
        hasPoorScore: true,
        message: "This profile have poor partners score. We do not guarantee reliability for advance payments. Please get references before making advance payments."
      };
    }

    // Calculate rating distribution
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach(review => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    // Calculate Partner Score (300-900 range)
    const partnerScore = calculatePartnerScore(ratingDistribution, totalRatings);

    // Check if score is between 300-549 (Poor or Very Poor)
    if (partnerScore >= 300 && partnerScore <= 549) {
      return {
        hasPoorScore: true,
        message: "This profile have poor partners score. We do not guarantee reliability for advance payments. Please get references before making advance payments."
      };
    }

    return {
      hasPoorScore: false,
      message: null
    };
  } catch (error) {
    console.error("Error checking partner score:", error);
    return {
      hasPoorScore: false,
      message: null
    };
  }
}

// Helper function to add warning note to booking
async function addWarningNoteToBooking(booking) {
  if (booking.postedBy && booking.postedBy._id) {
    const warningCheck = await checkPoorPartnerScore(booking.postedBy._id);
    if (warningCheck.hasPoorScore) {
      booking = booking.toObject ? booking.toObject() : booking;
      booking.warningNote = warningCheck.message;
      return booking;
    }
  }
  return booking;
}

// Helper function to add warning notes to multiple bookings
async function addWarningNotesToBookings(bookings) {
  const bookingsWithWarnings = await Promise.all(
    bookings.map(async (booking) => {
      return await addWarningNoteToBooking(booking);
    })
  );
  return bookingsWithWarnings;
}

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    const {
      status,
      vehicleType,
      tripType,
      pickupCity,
      dropCity,
      page = 1,
      limit = 100, // Initial load: 100 bookings, then 20 per page for pagination
      sort = "-createdAt",
    } = req.query;

    // Build filter - show active and assigned bookings by default (all available bookings)
    const filter = {};
    if (status) {
      // If status is explicitly provided, use it
      filter.status = status;
    } else {
      // By default, show active and assigned bookings (all available bookings for partners to take)
      filter.status = { $in: ["active", "assigned"] };
    }
    if (vehicleType) filter.vehicleType = vehicleType;
    if (tripType) filter.tripType = tripType;
    if (pickupCity) filter["pickup.city"] = new RegExp(pickupCity, "i");
    if (dropCity) filter["drop.city"] = new RegExp(dropCity, "i");

    console.log("🔍 [getBookings] Filter applied:", JSON.stringify(filter, null, 2));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate("postedBy", "name mobile profile.avatar verificationStatus")
      .populate("assignedTo", "name mobile")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);
    
    console.log(`📊 [getBookings] Found ${bookings.length} bookings (total: ${total}) with filter:`, filter);

    // Add warning notes for bookings with poor partner scores
    const bookingsWithWarnings = await addWarningNotesToBookings(bookings);

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bookingsWithWarnings,
    });
  } catch (error) {
    console.error("Get Bookings Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// @desc    Get user's own bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = "-createdAt" } = req.query;
    
    // Validate userId is present
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    
    console.log('🔍 [getMyBookings] Request received:', {
      userId: req.userId,
      userIdType: typeof req.userId,
      status: status,
      page: page,
      limit: limit
    });
    
    // Convert userId to ObjectId to ensure type matching
    let userIdFilter;
    try {
      if (mongoose.Types.ObjectId.isValid(req.userId)) {
        userIdFilter = new mongoose.Types.ObjectId(req.userId);
      } else {
        userIdFilter = req.userId;
      }
    } catch (err) {
      console.error('❌ [getMyBookings] Error converting userId:', err);
      userIdFilter = req.userId;
    }
    
    // STRICTLY filter by logged-in user's bookings only
    // Use $or to handle both ObjectId and string formats for backward compatibility
    const filter = {
      $or: [
        { postedBy: userIdFilter },
        { postedBy: req.userId },
        // Handle string comparison for old data
        { $expr: { $eq: [{ $toString: "$postedBy" }, req.userId.toString()] } }
      ]
    };
    
    // Add status filter if provided
    if (status) {
      if (status === 'pending') {
        // Pending = active or assigned bookings
        filter.status = { $in: ['active', 'assigned'] };
        console.log('✅ [getMyBookings] Filter set for pending: active or assigned');
      } else if (status === 'history') {
        // History = closed or cancelled bookings that were assigned
        filter.status = { $in: ['closed', 'cancelled'] };
        filter.assignedTo = { $exists: true };
        console.log('✅ [getMyBookings] Filter set for history: closed/cancelled with assignedTo');
      } else {
        filter.status = status;
        console.log('✅ [getMyBookings] Filter set for custom status:', status);
      }
    } else {
      // If no status provided, show all bookings (active, assigned, closed, cancelled) for this user
      console.log('ℹ️ [getMyBookings] No status filter, showing all bookings for user');
    }
    
    console.log('🔒 [getMyBookings] STRICT USER FILTER applied - only bookings for userId:', req.userId);
    console.log('🔍 [getMyBookings] Final filter:', JSON.stringify(filter, null, 2));
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await Booking.find(filter)
      .populate("postedBy", "name mobile profile.avatar")
      .populate("assignedTo", "name mobile")
      .populate("comments.userId", "name mobile")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(filter);
    
    console.log('📊 [getMyBookings] Query results:', {
      found: bookings.length,
      total: total,
      filter: filter
    });
    console.log('📋 [getMyBookings] Bookings data:', bookings.map(b => ({
      id: b._id,
      status: b.status,
      bookingId: b.bookingId,
      postedBy: b.postedBy?._id
    })));
    
    // Add warning notes for bookings with poor partner scores
    const bookingsWithWarnings = await addWarningNotesToBookings(bookings);
    
    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bookingsWithWarnings,
    });
  } catch (error) {
    console.error("❌ [getMyBookings] Error:", error);
    console.error("❌ [getMyBookings] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch your bookings",
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("postedBy", "name mobile profile.avatar verificationStatus")
      .populate("assignedTo", "name mobile")
      .populate("comments.userId", "name mobile");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Log customRequirement for debugging
    console.log("📝 [getBooking] customRequirement:", booking.customRequirement);

    // Add warning note if user has poor partner score
    const bookingWithWarning = await addWarningNoteToBooking(booking);

    res.json({
      success: true,
      data: bookingWithWarning,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const bookingData = {
        ...req.body,
        postedBy: req.userId,
      };

      // Clear bookingId to force regeneration on each retry
      if (retryCount > 0) {
        delete bookingData.bookingId;
      }

      console.log(`Creating booking (attempt ${retryCount + 1}) with data:`, JSON.stringify(bookingData, null, 2));

      const booking = await Booking.create(bookingData);

      // Populate user data
      await booking.populate("postedBy", "name mobile email");

      // Send confirmation email
      const user = await User.findById(req.userId);
      if (user && user.email) {
        try {
          await emailService.sendBookingConfirmation(user.email, booking);
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
        }
      }

      // Add warning note if user has poor partner score
      const bookingWithWarning = await addWarningNoteToBooking(booking);

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: bookingWithWarning,
      });
    } catch (error) {
      console.error(`Create Booking Error (attempt ${retryCount + 1}):`, error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        errors: error.errors,
      });

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => e.message).join(', ');
        return res.status(400).json({
          success: false,
          message: `Validation error: ${errors}`,
          error: error.message,
        });
      }

      // Handle duplicate key errors - retry with new ID
      if (error.code === 11000) {
        retryCount++;
        console.log(`⚠️ Duplicate booking ID detected, retrying (attempt ${retryCount}/${maxRetries})...`);
        if (retryCount >= maxRetries) {
          console.error("❌ Max retries reached for duplicate booking ID");
          // Try one more time with a completely unique timestamp-based ID
          try {
            const bookingData = {
              ...req.body,
              postedBy: req.userId,
              bookingId: `BW${Date.now()}${Math.floor(Math.random() * 10000)}`, // Force unique ID
            };
            const booking = await Booking.create(bookingData);
            await booking.populate("postedBy", "name mobile email");
            // Add warning note if user has poor partner score
            const bookingWithWarning = await addWarningNoteToBooking(booking);
            return res.status(201).json({
              success: true,
              message: "Booking created successfully",
              data: bookingWithWarning,
            });
          } catch (finalError) {
            console.error("❌ Final attempt also failed:", finalError);
            return res.status(400).json({
              success: false,
              message: "Unable to create booking. Please try again in a moment.",
              error: finalError.message,
            });
          }
        }
        // Wait longer before retrying to allow ID generation to catch up
        await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
        continue; // Retry the creation
      }

      // For other errors, return immediately
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create booking",
        error: error.message,
      });
    }
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin
    if (
      booking.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("postedBy", "name mobile");

    // Add warning note if user has poor partner score
    const bookingWithWarning = await addWarningNoteToBooking(booking);

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: bookingWithWarning,
    });
  } catch (error) {
    console.error("Update Booking Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking",
    });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin
    if (
      booking.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this booking",
      });
    }

    await booking.deleteOne();

    res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
    });
  }
};

// @desc    Assign booking to partner
// @route   POST /api/bookings/:id/assign
// @access  Private
exports.assignBooking = async (req, res) => {
  try {
    const { partnerId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin
    if (
      booking.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to assign this booking",
      });
    }

    booking.assignedTo = partnerId;
    booking.status = "assigned";
    booking.assignedAt = new Date();
    await booking.save();

    // Populate postedBy for warning check
    await booking.populate("postedBy", "name mobile");

    // Add warning note if user has poor partner score
    const bookingWithWarning = await addWarningNoteToBooking(booking);

    res.json({
      success: true,
      message: "Booking assigned successfully",
      data: bookingWithWarning,
    });
  } catch (error) {
    console.error("Assign Booking Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign booking",
    });
  }
};

// @desc    Close booking
// @route   POST /api/bookings/:id/close
// @access  Private
exports.closeBooking = async (req, res) => {
  try {
    const { closedFrom, reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin
    if (
      booking.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to close this booking",
      });
    }

    booking.status = "closed";
    booking.closedFrom = closedFrom;
    if (reason) {
      booking.comments.push({
        userId: req.userId,
        text: reason,
      });
    }
    await booking.save();

    // Populate postedBy for warning check
    await booking.populate("postedBy", "name mobile");

    // Add warning note if user has poor partner score
    const bookingWithWarning = await addWarningNoteToBooking(booking);

    res.json({
      success: true,
      message: "Booking closed successfully",
      data: bookingWithWarning,
    });
  } catch (error) {
    console.error("Close Booking Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close booking",
    });
  }
};

// @desc    Add comment to booking
// @route   POST /api/bookings/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.comments.push({
      userId: req.userId,
      text,
    });
    await booking.save();

    // Populate postedBy for warning check
    await booking.populate("postedBy", "name mobile");

    // Add warning note if user has poor partner score
    const bookingWithWarning = await addWarningNoteToBooking(booking);

    res.json({
      success: true,
      message: "Comment added successfully",
      data: bookingWithWarning,
    });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
};

// @desc    Get filter options
// @route   GET /api/bookings/filters
// @access  Private
exports.getFilterOptions = async (req, res) => {
  try {
    const cities = await Booking.distinct("pickup.city");
    const vehicleTypes = await Booking.distinct("vehicleType");
    const tripTypes = await Booking.distinct("tripType");

    res.json({
      success: true,
      data: {
        cities: cities.sort(),
        vehicleTypes,
        tripTypes,
      },
    });
  } catch (error) {
    console.error("Get Filter Options Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch filter options",
    });
  }
};
