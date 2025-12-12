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

// Helper function to calculate Partner Score
function calculatePartnerScore(distribution, totalRatings) {
  // Calculate percentage of each rating
  const percentages = {
    5: ((distribution[5] || 0) / totalRatings) * 100,
    4: ((distribution[4] || 0) / totalRatings) * 100,
    3: ((distribution[3] || 0) / totalRatings) * 100,
    2: ((distribution[2] || 0) / totalRatings) * 100,
    1: ((distribution[1] || 0) / totalRatings) * 100,
  };

  // Score calculation based on rating distribution
  // Higher weight to positive ratings (5-star, 4-star)
  // Lower weight to negative ratings (1-star, 2-star)
  // Formula: 
  // - Base score: 300
  // - 5-star ratings contribute: percentage * 6 (max 600 points if 100% 5-star)
  // - 4-star ratings contribute: percentage * 3 (max 300 points if 100% 4-star)
  // - 3-star ratings contribute: percentage * 1 (max 100 points if 100% 3-star)
  // - 2-star ratings contribute: percentage * 0.5 (max 50 points if 100% 2-star)
  // - 1-star ratings contribute: percentage * 0 (no points, only penalty)
  
  let score = 300; // Base score
  
  // Add points for positive ratings
  score += percentages[5] * 6;  // 5-star: 0-600 points
  score += percentages[4] * 3;  // 4-star: 0-300 points
  score += percentages[3] * 1;   // 3-star: 0-100 points
  score += percentages[2] * 0.5; // 2-star: 0-50 points
  // 1-star gives 0 points (already accounted in base)
  
  // Penalty for negative ratings (1-star and 2-star reduce score)
  // If more than 20% are 1-star, apply penalty
  if (percentages[1] > 20) {
    const excessNegative = percentages[1] - 20;
    score -= excessNegative * 2; // Penalty for excessive 1-star ratings
  }
  
  // If more than 30% are 2-star or below, apply penalty
  const lowRatings = percentages[1] + percentages[2];
  if (lowRatings > 30) {
    const excessLow = lowRatings - 30;
    score -= excessLow * 1; // Penalty for excessive low ratings
  }
  
  // Ensure score is within bounds (300-900)
  const partnerScore = Math.min(900, Math.max(300, Math.round(score)));

  return partnerScore;
}

// Helper function to categorize score
function getScoreCategory(score) {
  if (score >= 750) return "Excellent";
  if (score >= 650) return "Good";
  if (score >= 550) return "Fair";
  if (score >= 450) return "Poor";
  return "Very Poor";
}

// @desc    Get partner score
// @route   GET /api/reviews/:userId/partner-score
// @access  Public
exports.getPartnerScore = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
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

    const totalRatings = reviews.length;
    
    // If less than 5 ratings, return warning
    if (totalRatings < 5) {
      return res.json({
        success: true,
        data: {
          hasMinimumRatings: false,
          totalRatings,
          partnerScore: null,
          scoreCategory: null,
          warning: {
            message: "This profile has less than 5 ratings. We do not guarantee reliability for advance payments. Please get references before making advance payments.",
            showWarning: true
          }
        },
      });
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

    // Calculate Partner Score (similar to CIBIL: 300-900 range)
    const partnerScore = calculatePartnerScore(ratingDistribution, totalRatings);

    // Determine score category
    const scoreCategory = getScoreCategory(partnerScore);

    res.json({
      success: true,
      data: {
        hasMinimumRatings: true,
        totalRatings,
        partnerScore,
        scoreCategory,
        ratingDistribution,
        warning: {
          message: null,
          showWarning: false
        }
      },
    });
  } catch (error) {
    console.error("Get Partner Score Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate partner score",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};







