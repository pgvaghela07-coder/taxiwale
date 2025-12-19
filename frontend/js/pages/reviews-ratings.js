// Reviews & Ratings Page JavaScript
let currentUserId = null;
let currentPage = 1;
let totalPages = 1;
const reviewsPerPage = 10;

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentUserId = urlParams.get("userId");

  if (!currentUserId) {
    showError("User ID not found");
    return;
  }

  await loadRatingSummary();
  await loadReviews(1);
});

// Load rating summary
async function loadRatingSummary() {
  try {
    const response = await apiService.getRatingSummary(currentUserId);
    if (response.success && response.data) {
      displayRatingSummary(response.data);
    }
  } catch (error) {
    console.error("Error loading rating summary:", error);
  }
}

// Display rating summary
function displayRatingSummary(data) {
  const avgRating = data.averageRating || 0;
  const totalReviews = data.totalReviews || 0;

  document.getElementById("averageRating").textContent = avgRating.toFixed(1);
  document.getElementById("ratingText").textContent = `Based on ${totalReviews} rating${totalReviews !== 1 ? "s" : ""} & review${totalReviews !== 1 ? "s" : ""}`;

  // Display rating distribution
  if (data.percentages) {
    for (let i = 5; i >= 1; i--) {
      const percent = data.percentages[i] || 0;
      document.getElementById(`bar${i}`).style.width = `${percent}%`;
      document.getElementById(`percent${i}`).textContent = `${percent}%`;
    }
  }
}

// Load reviews
async function loadReviews(page) {
  try {
    showLoading();

    const response = await apiService.getUserReviews(currentUserId, page, reviewsPerPage);
    if (!response.success) {
      throw new Error(response.message || "Failed to load reviews");
    }

    const reviews = response.data || [];
    const pagination = response.pagination || {};

    currentPage = pagination.page || page;
    totalPages = pagination.pages || 1;

    displayReviews(reviews);
    updatePagination();

    hideLoading();
  } catch (error) {
    console.error("Error loading reviews:", error);
    showError(error.message || "Failed to load reviews");
  }
}

// Display reviews
function displayReviews(reviews) {
  const reviewsList = document.getElementById("reviewsList");

  if (reviews.length === 0) {
    reviewsList.innerHTML = '<div class="no-reviews">No reviews yet</div>';
    return;
  }

  reviewsList.innerHTML = reviews
    .map((review) => {
      const reviewer = review.reviewerUserId || {};
      const reviewerName = reviewer.name || "Anonymous";
      const reviewerAvatar = reviewer.profile?.avatar || null;
      const avatarUrl = reviewerAvatar
        ? reviewerAvatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=ff9900&color=1a1a1a`;

      const reviewDate = new Date(review.createdAt);
      const formattedDate = reviewDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const formattedTime = reviewDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const stars = "⭐".repeat(review.rating || 0);

      return `
        <div class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <img src="${avatarUrl}" alt="${reviewerName}" class="reviewer-avatar">
              <div class="reviewer-details">
                <h4 class="reviewer-name">${reviewerName}</h4>
                ${review.serviceName ? `<p class="service-name">${review.serviceName}</p>` : ""}
              </div>
            </div>
            <div class="review-rating">
              <span class="rating-value-small">${(review.rating || 0).toFixed(1)}</span>
              <span class="rating-stars">${stars}</span>
            </div>
          </div>
          <div class="review-date">${formattedDate} @ ${formattedTime}</div>
          ${review.reviewText ? `<div class="review-text">${review.reviewText}</div>` : ""}
          ${review.tags && review.tags.length > 0 ? `<div class="review-tags">${review.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>` : ""}
          ${review.pictures && review.pictures.length > 0 ? `<div class="review-pictures"><button class="view-pictures-btn" onclick="viewReviewPictures(${JSON.stringify(review.pictures).replace(/"/g, '&quot;')})">Click here to see review pictures</button></div>` : ""}
        </div>
      `;
    })
    .join("");
}

// Update pagination
function updatePagination() {
  const pagination = document.getElementById("pagination");
  const paginationInfo = document.getElementById("paginationInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";
  paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

// Load previous page
function loadPreviousPage() {
  if (currentPage > 1) {
    loadReviews(currentPage - 1);
  }
}

// Load next page
function loadNextPage() {
  if (currentPage < totalPages) {
    loadReviews(currentPage + 1);
  }
}

// View review pictures
function viewReviewPictures(pictures) {
  // Simple implementation - could be enhanced with a modal/lightbox
  if (pictures && pictures.length > 0) {
    const imageUrls = pictures.join("\n");
    alert(`Review Pictures:\n${imageUrls}\n\n(Full image viewer coming soon)`);
  }
}

// Show loading state
function showLoading() {
  const reviewsList = document.getElementById("reviewsList");
  reviewsList.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading reviews...</p>
    </div>
  `;
}

// Hide loading state
function hideLoading() {
  // Loading state is replaced by reviews, so nothing to hide
}

// Show error state
function showError(message) {
  const reviewsList = document.getElementById("reviewsList");
  reviewsList.innerHTML = `
    <div class="error-state">
      <p>${message}</p>
    </div>
  `;
}




















