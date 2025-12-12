const Review = require("../models/Review");
const User = require("../models/User");

// @desc    Get user reviews
// @route   GET /api/reviews/:userId/reviews
// @access  Public
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

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

    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      reviewedUserId: user._id,
      isVisible: true,
    })
      .populate("reviewerUserId", "name mobile profile.avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      reviewedUserId: user._id,
      isVisible: true,
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get User Reviews Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Create review
// @route   POST /api/reviews/:userId/review
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviewerId = req.userId;
    const { rating, reviewText, tags, pictures, serviceName, bookingId } =
      req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Find reviewed user by _id or userId field
    let reviewedUser = await User.findById(userId);
    if (!reviewedUser) {
      reviewedUser = await User.findOne({ userId: userId });
    }
    if (!reviewedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent self-review
    if (reviewedUser._id.toString() === reviewerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot review yourself",
      });
    }

    // Check if reviewer has already reviewed this user
    const existingReview = await Review.findOne({
      reviewedUserId: reviewedUser._id,
      reviewerUserId: reviewerId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this user",
      });
    }

    const review = await Review.create({
      reviewedUserId: reviewedUser._id,
      reviewerUserId: reviewerId,
      rating,
      reviewText: reviewText || "",
      tags: tags || [],
      pictures: pictures || [],
      serviceName: serviceName || "",
      bookingId: bookingId || null,
      isVisible: true,
    });

    const populatedReview = await Review.findById(review._id).populate(
      "reviewerUserId",
      "name mobile profile.avatar"
    );

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: populatedReview,
    });
  } catch (error) {
    console.error("Create Review Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get rating summary
// @route   GET /api/reviews/:userId/rating-summary
// @access  Public
exports.getRatingSummary = async (req, res) => {
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

    const reviews = await Review.find({
      reviewedUserId: user._id,
      isVisible: true,
    });

    const totalReviews = reviews.length;
    let averageRating = 0;
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (totalReviews > 0) {
      const totalRating = reviews.reduce((sum, review) => {
        ratingDistribution[review.rating] =
          (ratingDistribution[review.rating] || 0) + 1;
        return sum + review.rating;
      }, 0);
      averageRating = totalRating / totalReviews;
    }

    // Calculate rating percentages
    const ratingPercentages = {};
    for (let i = 1; i <= 5; i++) {
      ratingPercentages[i] =
        totalReviews > 0
          ? Math.round((ratingDistribution[i] / totalReviews) * 100)
          : 0;
    }

    res.json({
      success: true,
      data: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews,
        distribution: ratingDistribution,
        percentages: ratingPercentages,
      },
    });
  } catch (error) {
    console.error("Get Rating Summary Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rating summary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};






