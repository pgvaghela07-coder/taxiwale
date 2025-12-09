const Booking = require("../models/Booking");
const User = require("../models/User");
const mongoose = require("mongoose");
const emailService = require("../services/emailService");

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
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    // Build filter - only show active bookings by default
    const filter = { 
      status: status || "active" // Only show active bookings unless status is specified
    };
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

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bookings,
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
    
    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bookings,
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

    res.json({
      success: true,
      data: booking,
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

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking,
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
            return res.status(201).json({
              success: true,
              message: "Booking created successfully",
              data: booking,
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

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
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

    res.json({
      success: true,
      message: "Booking assigned successfully",
      data: booking,
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

    res.json({
      success: true,
      message: "Booking closed successfully",
      data: booking,
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

    res.json({
      success: true,
      message: "Comment added successfully",
      data: booking,
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
