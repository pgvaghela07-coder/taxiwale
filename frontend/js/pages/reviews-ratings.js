// Reviews & Ratings Page JavaScript

let currentUserId = null;
let currentPage = 1;
let totalPages = 1;
let ratingData = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Get userId from URL params
  const urlParams = new URLSearchParams(window.location.search);
  currentUserId = urlParams.get("userId");

  if (!currentUserId) {
    showError("User ID not provided");
    return;
  }

  loadReviews();
  loadRatingSummary();
});

// Load rating summary from profile
async function loadRatingSummary() {
  try {
    const apiService = new ApiService();
    const response = await apiService.getPublicProfile(currentUserId);

    if (response.success && response.data && response.data.rating) {
      ratingData = response.data.rating;
      displayRatingSummary(ratingData);
    }
  } catch (error) {
    console.error("Error loading rating summary:", error);
  }
}

// Display rating summary
function displayRatingSummary(rating) {
  if (!rating) return;

  const avgRating = document.getElementById("averageRating");
  if (avgRating) {
    avgRating.textContent = rating.average.toFixed(1);
  }

  const reviewsSummary = document.getElementById("reviewsSummaryText");
  if (reviewsSummary) {
    reviewsSummary.textContent = `Based on ${rating.total} ratings & reviews`;
  }

  // Display distribution chart
  renderRatingDistribution(rating.distribution, rating.total);
}

// Render rating distribution chart
function renderRatingDistribution(distribution, total) {
  const container = document.getElementById("distributionChart");
  if (!container || !distribution) return;

  const stars = [5, 4, 3, 2, 1];
  container.innerHTML = stars
    .map((star) => {
      const count = distribution[star] || 0;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

      return `
        <div class="distribution-row">
          <span class="star-label">${star} Star</span>
          <div class="distribution-bar-container">
            <div class="distribution-bar" style="width: ${percentage}%"></div>
          </div>
          <span class="distribution-percentage">${percentage}%</span>
        </div>
      `;
    })
    .join("");
}

// Load reviews
async function loadReviews(page = 1) {
  try {
    showLoading();
    hideError();
    hideContent();

    currentPage = page;
    const apiService = new ApiService();
    const response = await apiService.getUserReviews(currentUserId, page, 10);

    if (response.success && response.data) {
      displayReviews(response.data);
      updatePagination(response.pagination);
      hideLoading();
      showContent();
    } else {
      throw new Error(response.message || "Failed to load reviews");
    }
  } catch (error) {
    console.error("Error loading reviews:", error);
    showError(error.message || "Failed to load reviews");
    hideLoading();
  }
}

// Display reviews list
function displayReviews(reviews) {
  const container = document.getElementById("reviewsList");
  if (!container) return;

  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<p class="no-reviews-text">No reviews yet</p>';
    return;
  }

  container.innerHTML = reviews
    .map((review) => {
      const reviewer = review.reviewerUserId || {};
      const reviewerName = reviewer.name || "Anonymous";
      const reviewerAvatar = reviewer.profile?.avatar
        ? reviewer.profile.avatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            reviewerName
          )}&background=ff9900&color=1a1a1a&size=100`;

      const serviceName = review.serviceName || "Service";
      const reviewDate = formatReviewDate(review.createdAt);
      const rating = review.rating || 0;
      const tags = review.tags || [];
      const reviewText = review.reviewText || "";
      const hasPictures = review.pictures && review.pictures.length > 0;

      return `
        <div class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <img src="${reviewerAvatar}" alt="${reviewerName}" class="reviewer-avatar" />
              <div class="reviewer-details">
                <h4 class="reviewer-name">${reviewerName}</h4>
                <p class="service-name">${serviceName}</p>
                <p class="review-date">${reviewDate}</p>
              </div>
            </div>
            <div class="review-rating">
              <span class="rating-number">${rating.toFixed(1)}</span>
              <div class="rating-stars-small">
                ${generateStars(rating)}
              </div>
            </div>
          </div>
          ${reviewText ? `<p class="review-text">${reviewText}</p>` : ""}
          ${
            tags.length > 0
              ? `<div class="review-tags">${tags
                  .map(
                    (tag) =>
                      `<span class="review-tag">${tag}</span>`
                  )
                  .join("")}</div>`
              : ""
          }
          ${
            hasPictures
              ? `<button class="review-pictures-btn" onclick="showReviewPictures('${review._id}')">Click here to see review pictures</button>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

// Generate star rating display
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHTML = "";

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHTML += '<span class="star filled">⭐</span>';
    } else if (i === fullStars && hasHalfStar) {
      starsHTML += '<span class="star half">⭐</span>';
    } else {
      starsHTML += '<span class="star">⭐</span>';
    }
  }
  return starsHTML;
}

// Format review date
function formatReviewDate(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-IN", { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${month} ${day}, ${year} @ ${time}`;
  } catch (error) {
    return "";
  }
}

// Update pagination controls
function updatePagination(pagination) {
  if (!pagination) return;

  totalPages = pagination.pages || 1;
  const container = document.getElementById("paginationContainer");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const info = document.getElementById("paginationInfo");

  if (totalPages <= 1) {
    if (container) container.style.display = "none";
    return;
  }

  if (container) container.style.display = "flex";
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  if (info) {
    info.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

// Handle pagination
function handlePagination(direction) {
  if (direction === "prev" && currentPage > 1) {
    loadReviews(currentPage - 1);
  } else if (direction === "next" && currentPage < totalPages) {
    loadReviews(currentPage + 1);
  }
}

// Show review pictures (placeholder)
function showReviewPictures(reviewId) {
  alert("Review pictures feature coming soon");
}

// Navigation functions
function goBack() {
  window.history.back();
}

function navigateToTab(tabName) {
  if (tabName === "fab") {
    return;
  }
  window.location.href = `dashboard.html#${tabName}`;
}

// UI State Management
function showLoading() {
  const loading = document.getElementById("loadingContainer");
  if (loading) loading.style.display = "flex";
}

function hideLoading() {
  const loading = document.getElementById("loadingContainer");
  if (loading) loading.style.display = "none";
}

function showError(message) {
  const error = document.getElementById("errorContainer");
  const errorMsg = document.getElementById("errorMessage");
  if (error) error.style.display = "flex";
  if (errorMsg && message) errorMsg.textContent = message;
}

function hideError() {
  const error = document.getElementById("errorContainer");
  if (error) error.style.display = "none";
}

function showContent() {
  const content = document.getElementById("reviewsContent");
  if (content) content.style.display = "block";
}

function hideContent() {
  const content = document.getElementById("reviewsContent");
  if (content) content.style.display = "none";
}

// Make functions globally accessible
window.goBack = goBack;
window.navigateToTab = navigateToTab;
window.handlePagination = handlePagination;
window.showReviewPictures = showReviewPictures;
window.loadReviews = loadReviews;

