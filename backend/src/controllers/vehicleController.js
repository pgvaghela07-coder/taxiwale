const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

// @desc    Get user vehicles
// @route   GET /api/vehicles/user/:userId
// @access  Public
exports.getUserVehicles = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by _id or userId field
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ userId: userId });
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const vehicles = await Vehicle.find({
      postedBy: user._id,
      status: "active",
    })
      .populate("postedBy", "name mobile profile.avatar")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
    });
  } catch (error) {
    console.error("Get User Vehicles Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Create vehicle
// @route   POST /api/vehicles
// @access  Private
exports.createVehicle = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      vehicleName,
      vehicleType,
      pricePerKm,
      vehicleAge,
      images,
      registrationNumber,
    } = req.body;

    if (!vehicleName || !vehicleType || !pricePerKm) {
      return res.status(400).json({
        success: false,
        message: "Vehicle name, type, and price per km are required",
      });
    }

    const vehicle = await Vehicle.create({
      postedBy: userId,
      vehicleName,
      vehicleType,
      pricePerKm,
      vehicleAge: vehicleAge || "",
      images: images || [],
      registrationNumber: registrationNumber || "",
      status: "active",
    });

    const populatedVehicle = await Vehicle.findById(vehicle._id).populate(
      "postedBy",
      "name mobile profile.avatar"
    );

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: populatedVehicle,
    });
  } catch (error) {
    console.error("Create Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      vehicleName,
      vehicleType,
      pricePerKm,
      vehicleAge,
      images,
      registrationNumber,
      status,
    } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if user owns the vehicle
    if (vehicle.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own vehicles",
      });
    }

    if (vehicleName) vehicle.vehicleName = vehicleName;
    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (pricePerKm !== undefined) vehicle.pricePerKm = pricePerKm;
    if (vehicleAge !== undefined) vehicle.vehicleAge = vehicleAge;
    if (images) vehicle.images = images;
    if (registrationNumber !== undefined)
      vehicle.registrationNumber = registrationNumber;
    if (status) vehicle.status = status;

    await vehicle.save();

    const populatedVehicle = await Vehicle.findById(vehicle._id).populate(
      "postedBy",
      "name mobile profile.avatar"
    );

    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: populatedVehicle,
    });
  } catch (error) {
    console.error("Update Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if user owns the vehicle
    if (vehicle.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own vehicles",
      });
    }

    await Vehicle.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};







