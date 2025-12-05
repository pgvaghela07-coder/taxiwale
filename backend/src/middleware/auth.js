const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // In development mode, allow token without database lookup
    if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
      try {
        const user = await User.findById(decoded.userId).select("-otp");
        if (user) {
          req.userId = decoded.userId;
          req.user = user;
          return next();
        }
      } catch (dbError) {
        console.warn("⚠️ Database error in auth, using development fallback:", dbError.message);
        // Fall through to development mode
      }
      
      // Development fallback: trust the token if it's valid
      req.userId = decoded.userId;
      req.user = {
        _id: decoded.userId,
        mobile: null,
        role: "client",
        isVerified: false
      };
      return next();
    }

    // Production mode - require database
    const user = await User.findById(decoded.userId).select("-otp");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

module.exports = auth;
