const Vehicle = require("../models/Vehicle");
const mongoose = require("mongoose");

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res) => {
  try {
    const {
      status,
      vehicleType,
      tripType,
      city,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    // Build filter
    const filter = { visibility: "public", status: "active" };

    if (status) filter.status = status;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (tripType) filter.tripType = tripType;
    if (city) filter["location.city"] = new RegExp(city, "i");

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vehicles = await Vehicle.find(filter)
      .populate("postedBy", "name mobile profile.avatar verificationStatus")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments(filter);

    res.json({
      success: true,
      count: vehicles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: vehicles,
    });
  } catch (error) {
    console.error("Get Vehicles Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
    });
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "postedBy",
      "name mobile profile.avatar verificationStatus"
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Log customRequirement for debugging
    console.log("📝 [getVehicle] customRequirement:", vehicle.customRequirement);

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Get Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
    });
  }
};

// @desc    Create vehicle
// @route   POST /api/vehicles
// @access  Private
exports.createVehicle = async (req, res) => {
  try {
    // Convert userId to ObjectId explicitly to ensure type matching
    let userIdFilter;
    try {
      userIdFilter = mongoose.Types.ObjectId.isValid(req.userId) 
        ? new mongoose.Types.ObjectId(req.userId) 
        : req.userId;
    } catch (err) {
      console.error('❌ [createVehicle] Error converting userId to ObjectId:', err);
      userIdFilter = req.userId; // Fallback to original
    }
    
    console.log('🔍 [createVehicle] Creating vehicle with userId:', userIdFilter, 'Type:', typeof userIdFilter);
    
    const vehicleData = {
      ...req.body,
      postedBy: userIdFilter,
    };

    const vehicle = await Vehicle.create(vehicleData);
    await vehicle.populate("postedBy", "name mobile");
    
    console.log('✅ [createVehicle] Vehicle created successfully:', {
      id: vehicle._id,
      status: vehicle.status,
      postedBy: vehicle.postedBy?._id,
      vehicleType: vehicle.vehicleType
    });

    res.status(201).json({
      success: true,
      message: "Vehicle posted successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("❌ [createVehicle] Create Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to post vehicle",
      error: error.message,
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
exports.updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if user owns the vehicle or is admin
    if (
      vehicle.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this vehicle",
      });
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("postedBy", "name mobile");

    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Update Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if user owns the vehicle or is admin
    if (
      vehicle.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this vehicle",
      });
    }

    await vehicle.deleteOne();

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
    });
  }
};

// @desc    Get user's own vehicles
// @route   GET /api/vehicles/my-vehicles
// @access  Private
exports.getMyVehicles = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = "-createdAt" } = req.query;
    
    console.log('🔍 [getMyVehicles] Request received:', {
      userId: req.userId,
      userIdType: typeof req.userId,
      status: status,
      page: page,
      limit: limit
    });
    
    // Validate Vehicle model is available
    if (!Vehicle) {
      console.error('❌ [getMyVehicles] Vehicle model is not defined!');
      return res.status(500).json({
        success: false,
        message: "Internal server error: Vehicle model not available",
      });
    }
    
    // Validate database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [getMyVehicles] Database not connected! State:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: "Database connection error",
      });
    }
    
    // Handle edge case: undefined userId (should be caught by auth middleware, but just in case)
    if (!req.userId) {
      console.error('❌ [getMyVehicles] No userId in request');
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    
    // Convert userId to ObjectId explicitly to ensure type matching
    // Mongoose can handle both string and ObjectId, but we'll be explicit
    let userIdFilter;
    let userIdString;
    try {
      // Try to convert to ObjectId if valid
      if (mongoose.Types.ObjectId.isValid(req.userId)) {
        userIdFilter = new mongoose.Types.ObjectId(req.userId);
        userIdString = req.userId.toString();
      } else {
        // If not valid ObjectId, use as string
        userIdFilter = req.userId;
        userIdString = req.userId;
      }
    } catch (err) {
      console.error('❌ [getMyVehicles] Error converting userId:', err);
      userIdFilter = req.userId;
      userIdString = req.userId.toString();
    }
    
    console.log('🔍 [getMyVehicles] req.userId:', req.userId, 'Type:', typeof req.userId);
    console.log('🔍 [getMyVehicles] userIdFilter:', userIdFilter, 'Type:', typeof userIdFilter);
    console.log('🔍 [getMyVehicles] userIdString:', userIdString);
    
    // DEBUG: Check all vehicles in database (no filters at all)
    try {
      const totalVehicles = await Vehicle.countDocuments({});
      console.log('🔍 [getMyVehicles] Total vehicles in database:', totalVehicles);
    } catch (debugError) {
      console.error('⚠️ [getMyVehicles] Error counting all vehicles:', debugError.message);
    }
    
    // DEBUG: Check all vehicles in database for this user (without status filter)
    // Try both ObjectId and string formats to catch old data
    try {
      const allUserVehiclesObjectId = await Vehicle.find({ postedBy: userIdFilter }).select('_id status vehicleType createdAt postedBy');
      const allUserVehiclesString = await Vehicle.find({ postedBy: userIdString }).select('_id status vehicleType createdAt postedBy');
      const allUserVehiclesDirect = await Vehicle.find({ postedBy: req.userId }).select('_id status vehicleType createdAt postedBy');
      
      console.log('🔍 [getMyVehicles] Vehicles found with ObjectId filter:', allUserVehiclesObjectId.length);
      console.log('🔍 [getMyVehicles] Vehicles found with string filter:', allUserVehiclesString.length);
      console.log('🔍 [getMyVehicles] Vehicles found with direct req.userId:', allUserVehiclesDirect.length);
      
      // Combine and remove duplicates
      const allUserVehicles = [...allUserVehiclesObjectId, ...allUserVehiclesString, ...allUserVehiclesDirect];
      const uniqueVehicles = allUserVehicles.filter((v, index, self) => 
        index === self.findIndex((t) => t._id.toString() === v._id.toString())
      );
      
      console.log('🔍 [getMyVehicles] All unique vehicles for user (no status filter):', uniqueVehicles.length);
      console.log('🔍 [getMyVehicles] All vehicles details:', uniqueVehicles.map(v => ({
        id: v._id.toString(),
        status: v.status,
        vehicleType: v.vehicleType,
        postedBy: v.postedBy ? v.postedBy.toString() : 'null',
        postedByType: typeof v.postedBy,
        createdAt: v.createdAt
      })));
    } catch (debugError) {
      console.error('⚠️ [getMyVehicles] Error in debug query:', debugError.message);
      console.error('⚠️ [getMyVehicles] Debug error stack:', debugError.stack);
    }
    
    // STRICTLY filter by logged-in user's vehicles only
    // Use $or to handle both ObjectId and string formats for backward compatibility
    // This ensures only the authenticated user's vehicles are returned
    const filter = {
      $or: [
        { postedBy: userIdFilter },
        { postedBy: userIdString },
        { postedBy: req.userId },
        // Handle string comparison for old data (catches cases where postedBy is ObjectId but we have string)
        { $expr: { $eq: [{ $toString: "$postedBy" }, userIdString] } }
      ]
    };
    
    console.log('🔒 [getMyVehicles] STRICT USER FILTER applied - only vehicles for userId:', req.userId);
    
    // Add status filter if provided
    // MongoDB will AND the $or condition with the status condition
    if (status) {
      if (status === 'pending') {
        // Pending = active or assigned vehicles
        filter.status = { $in: ['active', 'assigned'] };
        console.log('✅ [getMyVehicles] Filter set for pending: active or assigned');
      } else if (status === 'history') {
        // History = booked or inactive vehicles (assigned entries that were completed)
        // Only show entries that were assigned
        filter.status = { $in: ['booked', 'inactive'] };
        filter.assignedTo = { $exists: true };
        console.log('✅ [getMyVehicles] Filter set for history: booked/inactive with assignedTo');
      } else {
        filter.status = status;
        console.log('✅ [getMyVehicles] Filter set for custom status:', status);
      }
    } else {
      console.log('ℹ️ [getMyVehicles] No status filter, showing all vehicles');
    }
    
    console.log('🔍 [getMyVehicles] Final filter:', JSON.stringify(filter, null, 2));
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 [getMyVehicles] About to execute query with filter:', JSON.stringify(filter, null, 2));
    
    // Execute query - try with the $or filter first
    let vehicles;
    let finalFilter = filter;
    try {
      vehicles = await Vehicle.find(filter)
        .populate("postedBy", "name mobile")
        .populate("assignedTo", "name mobile")
        .populate("comments.userId", "name mobile")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
      
      console.log('✅ [getMyVehicles] Query with $or executed, found:', vehicles.length);
    } catch (queryError) {
      console.error('⚠️ [getMyVehicles] Error with $or query, trying simple query:', queryError.message);
      // Fallback to simple query - Mongoose will handle ObjectId conversion
      finalFilter = { postedBy: req.userId };
      if (status === 'pending') {
        finalFilter.status = { $in: ['active', 'assigned'] };
      } else if (status === 'history') {
        finalFilter.status = { $in: ['booked', 'inactive'] };
        finalFilter.assignedTo = { $exists: true };
      } else if (status) {
        finalFilter.status = status;
      }
      
      console.log('🔍 [getMyVehicles] Using fallback filter:', JSON.stringify(finalFilter, null, 2));
      
      vehicles = await Vehicle.find(finalFilter)
        .populate("postedBy", "name mobile")
        .populate("assignedTo", "name mobile")
        .populate("comments.userId", "name mobile")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
      
      console.log('✅ [getMyVehicles] Simple query executed, found:', vehicles.length);
    }
    
    console.log('✅ [getMyVehicles] Query executed successfully');
    
    const total = await Vehicle.countDocuments(finalFilter);
    
    console.log('✅ [getMyVehicles] Count documents executed successfully');
    
    console.log('📊 [getMyVehicles] Query results:', {
      found: vehicles.length,
      total: total,
      filter: filter
    });
    console.log('🚗 [getMyVehicles] Vehicles data:', vehicles.map(v => ({
      id: v._id,
      status: v.status,
      vehicleType: v.vehicleType,
      postedBy: v.postedBy?._id
    })));
    
    console.log('✅ [getMyVehicles] Preparing response...');
    
    res.json({
      success: true,
      count: vehicles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: vehicles,
    });
    
    console.log('✅ [getMyVehicles] Response sent successfully');
  } catch (error) {
    console.error("❌ [getMyVehicles] Error occurred:", error);
    console.error("❌ [getMyVehicles] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      userId: req.userId,
      userIdType: typeof req.userId,
      status: req.query.status,
      filter: req.query.status ? `{ postedBy: ${req.userId}, status: ${req.query.status} }` : `{ postedBy: ${req.userId} }`
    });
    
    // Check if Vehicle model is available
    if (!Vehicle) {
      console.error("❌ [getMyVehicles] Vehicle model is not defined!");
    }
    
    // Check database connection (mongoose already imported at top)
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ [getMyVehicles] Database not connected! State:", mongoose.connection.readyState);
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch your vehicles",
      error: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
};

// @desc    Assign vehicle to partner
// @route   POST /api/vehicles/:id/assign
// @access  Private
exports.assignVehicle = async (req, res) => {
  try {
    const { partnerId } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if user owns the vehicle or is admin
    if (
      vehicle.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to assign this vehicle",
      });
    }

    vehicle.assignedTo = partnerId;
    vehicle.status = "assigned";
    vehicle.assignedAt = new Date();
    await vehicle.save();

    await vehicle.populate("assignedTo", "name mobile");

    res.json({
      success: true,
      message: "Vehicle assigned successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Assign Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign vehicle",
    });
  }
};

// @desc    Close vehicle
// @route   POST /api/vehicles/:id/close
// @access  Private
exports.closeVehicle = async (req, res) => {
  try {
    const { closedFrom, reason } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if user owns the vehicle or is admin
    if (
      vehicle.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to close this vehicle",
      });
    }

    vehicle.status = "booked";
    vehicle.closedFrom = closedFrom;
    if (reason) {
      vehicle.comments.push({
        userId: req.userId,
        text: reason,
      });
    }
    await vehicle.save();

    await vehicle.populate("comments.userId", "name mobile");

    res.json({
      success: true,
      message: "Vehicle closed successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Close Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close vehicle",
    });
  }
};

// @desc    Add comment to vehicle
// @route   POST /api/vehicles/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    vehicle.comments.push({
      userId: req.userId,
      text,
    });
    await vehicle.save();

    await vehicle.populate("comments.userId", "name mobile");

    res.json({
      success: true,
      message: "Comment added successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
};
