// User Profile Page JavaScript
let currentUserId = null;
let profileData = null;
let currentPage = 1;
let totalPages = 1;
const reviewsPerPage = 10;
let allReviews = []; // Store all reviews
let showAllReviews = false; // Track if all reviews are shown

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentUserId = urlParams.get("userId");

  if (!currentUserId) {
    showError("User ID not found in URL");
    return;
  }

  await loadUserProfile();
  setupEventListeners();
});

// Load user profile data
async function loadUserProfile() {
  try {
    showLoading();
    console.log("Loading profile for userId:", currentUserId);

    // Load profile data
    const profileResponse = await apiService.getPublicProfile(currentUserId);
    console.log("Profile API Response:", profileResponse);

    if (!profileResponse) {
      throw new Error("No response from server");
    }

    if (!profileResponse.success) {
      throw new Error(profileResponse.message || "Failed to load profile");
    }

    profileData = profileResponse.data;
    console.log("Profile Data:", profileData);

    if (!profileData) {
      throw new Error("No profile data received");
    }

    displayProfile(profileData);

    // Load additional data
    await Promise.all([
      loadUserVehicles(),
      loadRatingSummary(),
      loadPartnerScore(),
    ]);

    // Load reviews (don't wait for it, let it load in background)
    loadReviews(1).catch(error => {
      console.error("Failed to load reviews:", error);
      // Error is already handled in loadReviews function
    });

    hideLoading();
  } catch (error) {
    console.error("Error loading profile:", error);
    hideLoading();
    showError(error.message || "Failed to load profile. Please check console for details.");
  }
}

// Display profile data
function displayProfile(data) {
  try {
    console.log("Displaying profile data:", data);
    
    // Cover image
    const coverImage = document.getElementById("coverImage");
    if (coverImage) {
      if (data.profile?.coverImage) {
        coverImage.style.backgroundImage = `url(${data.profile.coverImage})`;
      } else {
        coverImage.style.backgroundColor = "#e0e0e0";
      }
    }

    // Profile avatar
    const avatar = document.getElementById("profileAvatarLarge");
    if (avatar) {
      if (data.profile?.avatar) {
        avatar.innerHTML = `<img src="${data.profile.avatar}" alt="${data.name || ''}">`;
      } else {
        const firstLetter = (data.name || "U").charAt(0).toUpperCase();
        avatar.innerHTML = `<div class="avatar-placeholder">${firstLetter}</div>`;
      }
    }

    // Name and location
    const nameEl = document.getElementById("profileName");
    if (nameEl) {
      nameEl.textContent = data.name || "Unknown User";
    }
    
    const locationInfo = document.getElementById("locationInfo");
    if (locationInfo) {
      if (data.profile?.city || data.profile?.state) {
        locationInfo.textContent = `${data.profile.city || ""}${data.profile.city && data.profile.state ? ", " : ""}${data.profile.state || ""}`;
      } else {
        locationInfo.textContent = "";
      }
    }

    // Verified badge
    const verifiedBadge = document.getElementById("verifiedBadge");
    if (verifiedBadge) {
      if (data.isVerified || data.verificationStatus?.aadhaar?.verified) {
        verifiedBadge.innerHTML = '<span class="verified-badge">✓ Verified</span>';
      } else {
        verifiedBadge.innerHTML = '';
      }
    }

    // Company name
    const companyName = document.getElementById("companyName");
    if (companyName) {
      companyName.textContent = data.businessName || "-";
    }

    // Email
    const emailId = document.getElementById("emailId");
    if (emailId) {
      emailId.textContent = data.email || "-";
    }

    // About section
    if (data.profile?.businessDescription) {
      const businessDesc = document.getElementById("businessDescription");
      if (businessDesc) {
        businessDesc.textContent = data.profile.businessDescription;
        businessDesc.parentElement.style.display = "block";
      }
    }

    // Experience
    if (data.profile?.experience) {
      const experienceValue = document.getElementById("experienceValue");
      if (experienceValue) {
        experienceValue.textContent = `${data.profile.experience} years`;
        document.getElementById("experienceItem").style.display = "flex";
      }
    }

    // Age calculation from DOB
    if (data.dob) {
      const ageItem = document.getElementById("ageItem");
      const ageValue = document.getElementById("ageValue");
      if (ageItem && ageValue) {
        const dob = new Date(data.dob);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        ageValue.textContent = `${age} years`;
        ageItem.style.display = "flex";
      }
    }

    // Preferred trips and routes
    if (data.profile?.preferredTrips && data.profile.preferredTrips.length > 0) {
      const tripsChips = document.getElementById("preferredTripsChips");
      if (tripsChips) {
        tripsChips.innerHTML = data.profile.preferredTrips.map(trip => 
          `<span class="chip">${trip}</span>`
        ).join('');
        document.getElementById("preferredTripsSection").style.display = "block";
      }
    }

    if (data.profile?.preferredRoutes && data.profile.preferredRoutes.length > 0) {
      const routesChips = document.getElementById("preferredRoutesChips");
      if (routesChips) {
        routesChips.innerHTML = data.profile.preferredRoutes.map(route => 
          `<span class="chip">${route}</span>`
        ).join('');
        document.getElementById("preferredTripsSection").style.display = "block";
      }
    }

    // Languages
    if (data.profile?.languages && data.profile.languages.length > 0) {
      const languagesChips = document.getElementById("languagesChips");
      if (languagesChips) {
        languagesChips.innerHTML = data.profile.languages.map(lang => 
          `<span class="chip">${lang}</span>`
        ).join('');
        document.getElementById("languagesSection").style.display = "block";
      }
    }

    // Setup action buttons
    if (data.mobile) {
      const callBtn = document.getElementById("callBtn");
      const whatsappBtn = document.getElementById("whatsappBtn");
      if (callBtn) {
        callBtn.onclick = () => window.location.href = `tel:${data.mobile}`;
      }
      if (whatsappBtn) {
        whatsappBtn.onclick = () => window.open(`https://wa.me/91${data.mobile}`, '_blank');
      }
    }

  } catch (error) {
    console.error("Error displaying profile:", error);
    throw error;
  }
}

// Load user vehicles
async function loadUserVehicles() {
  try {
    const vehiclesResponse = await apiService.getUserVehicles(currentUserId);
    if (vehiclesResponse && vehiclesResponse.success && vehiclesResponse.data) {
      const vehicles = Array.isArray(vehiclesResponse.data) ? vehiclesResponse.data : [];
      displayVehicles(vehicles);
    }
  } catch (error) {
    console.error("Error loading vehicles:", error);
  }
}

// Display vehicles
function displayVehicles(vehicles) {
  const vehiclesList = document.getElementById("vehiclesList");
  if (!vehiclesList) return;

  if (vehicles.length === 0) {
    document.getElementById("vehiclesSection").style.display = "none";
    return;
  }

  vehiclesList.innerHTML = vehicles.map(vehicle => {
    const emoji = getVehicleTypeEmoji(vehicle.vehicleType);
    return `
      <div class="vehicle-item">
        <span class="vehicle-emoji">${emoji}</span>
        <span class="vehicle-name">${vehicle.vehicleType || 'Vehicle'}</span>
      </div>
    `;
  }).join('');

  document.getElementById("vehiclesSection").style.display = "block";
}

// Get vehicle type emoji
function getVehicleTypeEmoji(type) {
  const emojiMap = {
    sedan: "🚗",
    suv: "🚙",
    hatchback: "🚕",
    luxury: "🏎️",
    traveller: "🚐",
    bus: "🚌"
  };
  return emojiMap[type?.toLowerCase()] || "🚗";
}

// Load rating summary
async function loadRatingSummary() {
  try {
    const ratingResponse = await apiService.getRatingSummary(currentUserId);
    if (ratingResponse && ratingResponse.success && ratingResponse.data) {
      displayRatingSummary(ratingResponse.data);
    }
  } catch (error) {
    console.error("Error loading rating summary:", error);
  }
}

// Display rating summary
function displayRatingSummary(data) {
  const averageRating = document.getElementById("averageRating");
  const ratingText = document.getElementById("ratingText");
  
  if (averageRating) {
    averageRating.textContent = (data.averageRating || 0).toFixed(1);
  }
  
  if (ratingText) {
    const totalRatings = data.totalRatings || 0;
    ratingText.textContent = `Based on ${totalRatings} rating${totalRatings !== 1 ? 's' : ''} & review${totalRatings !== 1 ? 's' : ''}`;
  }

  // Display rating distribution if available
  if (data.percentages || data.distribution) {
    const distribution = data.percentages || data.distribution || {};
    [5, 4, 3, 2, 1].forEach(rating => {
      const percent = distribution[rating] || 0;
      const bar = document.getElementById(`bar${rating}`);
      const percentEl = document.getElementById(`percent${rating}`);
      if (bar) bar.style.width = `${percent}%`;
      if (percentEl) percentEl.textContent = `${percent}%`;
    });
    const ratingDistributionCard = document.getElementById("ratingDistributionCard");
    if (ratingDistributionCard) {
      ratingDistributionCard.style.display = "block";
    }
  }
}

// Load partner score
async function loadPartnerScore() {
  try {
    const response = await apiService.getPartnerScore(currentUserId);
    if (response && response.success && response.data) {
      displayPartnerScore(response.data);
    }
  } catch (error) {
    console.error("Error loading partner score:", error);
  }
}

// Display partner score
function displayPartnerScore(data) {
  const partnerScoreCard = document.getElementById("partnerScoreCard");
  const warningCard = document.getElementById("warningCard");
  const warningMessage = document.getElementById("warningMessage");

  if (!data.hasMinimumRatings) {
    // Show warning for < 5 ratings
    if (warningCard) {
      warningCard.style.display = "flex";
      if (warningMessage) {
        warningMessage.textContent = data.warning.message;
      }
    }
    if (partnerScoreCard) {
      partnerScoreCard.style.display = "none";
    }
  } else {
    // Show partner score for 5+ ratings
    if (warningCard) {
      warningCard.style.display = "none";
    }
    if (partnerScoreCard) {
      partnerScoreCard.style.display = "block";
      
      const scoreValue = document.getElementById("partnerScoreValue");
      const scoreCategory = document.getElementById("partnerScoreCategory");
      const scoreDescription = document.getElementById("partnerScoreDescription");
      
      if (scoreValue) {
        scoreValue.textContent = data.partnerScore;
      }
      
      if (scoreCategory) {
        scoreCategory.textContent = data.scoreCategory;
        // Add category class for styling
        scoreCategory.className = `score-category category-${data.scoreCategory.toLowerCase().replace(' ', '-')}`;
      }
      
      if (scoreDescription) {
        scoreDescription.textContent = `Based on ${data.totalRatings} ratings. Score range: 300-900 (similar to CIBIL score).`;
      }
    }
  }
}

// Load reviews
async function loadReviews(page) {
  try {
    const reviewsList = document.getElementById("reviewsList");
    if (!reviewsList) return;

    showReviewsLoading();

    const response = await apiService.getUserReviews(currentUserId, page, reviewsPerPage);
    
    // Handle API response
    if (!response || !response.success) {
      const errorMessage = response?.message || "Failed to load reviews. Please try again later.";
      throw new Error(errorMessage);
    }

    const reviews = response.data || [];
    const pagination = response.pagination || {};

    currentPage = pagination.page || page;
    totalPages = pagination.pages || 1;

    // Store all reviews
    allReviews = reviews;
    showAllReviews = false; // Reset to show only 2 initially

    displayReviews(reviews);
    updatePagination();

    hideReviewsLoading();
  } catch (error) {
    console.error("Error loading reviews:", error);
    
    // Extract a user-friendly error message
    let errorMessage = "Failed to load reviews";
    
    if (error.message) {
      // Remove "Request failed:" prefix if present
      errorMessage = error.message.replace(/^Request failed:\s*/i, "").trim();
      
      // If message is empty or just "Request failed", use default
      if (!errorMessage || errorMessage.toLowerCase() === "request failed") {
        errorMessage = "Unable to load reviews at this time. Please try again later.";
      }
    }
    
    showReviewsError(errorMessage);
  }
}

// Display reviews
function displayReviews(reviews) {
  const reviewsList = document.getElementById("reviewsList");
  if (!reviewsList) return;

  if (reviews.length === 0) {
    reviewsList.innerHTML = '<div class="no-reviews">No reviews yet</div>';
    return;
  }

  // Determine which reviews to show
  const reviewsToShow = showAllReviews ? reviews : reviews.slice(0, 2);
  const hasMoreReviews = reviews.length > 2;

  const reviewsHTML = reviewsToShow
    .map((review) => {
      const reviewer = review.reviewerUserId || {};
      const reviewerName = reviewer.name || "Anonymous";
      const reviewerAvatar = reviewer.profile?.avatar || null;
      const avatarUrl = reviewerAvatar
        ? reviewerAvatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=ffb300&color=ffffff`;

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

  // Add Read More button if there are more reviews
  let readMoreButton = "";
  if (hasMoreReviews) {
    if (!showAllReviews) {
      readMoreButton = `
        <div class="read-more-container" style="text-align: center; margin-top: 20px;">
          <button class="read-more-btn" id="readMoreBtn" onclick="toggleAllReviews()">
            Read More (${reviews.length - 2} more reviews)
          </button>
        </div>
      `;
    } else {
      readMoreButton = `
        <div class="read-more-container" style="text-align: center; margin-top: 20px;">
          <button class="read-more-btn" id="readMoreBtn" onclick="toggleAllReviews()">
            Show Less
          </button>
        </div>
      `;
    }
  }

  reviewsList.innerHTML = reviewsHTML + readMoreButton;
}

// Toggle between showing 2 reviews and all reviews
function toggleAllReviews() {
  showAllReviews = !showAllReviews;
  displayReviews(allReviews);
}

// Make function globally accessible
window.toggleAllReviews = toggleAllReviews;

// Update pagination
function updatePagination() {
  const pagination = document.getElementById("pagination");
  const paginationInfo = document.getElementById("paginationInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (!pagination || !paginationInfo || !prevBtn || !nextBtn) return;

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
  if (pictures && pictures.length > 0) {
    const imageUrls = pictures.join("\n");
    alert(`Review Pictures:\n${imageUrls}\n\n(Full image viewer coming soon)`);
  }
}

// Show reviews loading state
function showReviewsLoading() {
  const reviewsList = document.getElementById("reviewsList");
  if (reviewsList) {
    reviewsList.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    `;
  }
}

// Hide reviews loading state
function hideReviewsLoading() {
  // Loading state is replaced by reviews
}

// Show reviews error state
function showReviewsError(message) {
  const reviewsList = document.getElementById("reviewsList");
  if (reviewsList) {
    reviewsList.innerHTML = `
      <div class="error-state">
        <p class="error-message-text">${message}</p>
        <button class="retry-btn" onclick="loadReviews(1)">Retry</button>
      </div>
    `;
  }
}

// Handle back button click
function handleBackButton() {
  try {
    // Check if we have a referrer from the same origin
    const referrer = document.referrer;
    
    // If we have a referrer from the same site, use browser back
    if (referrer && referrer.includes(window.location.origin)) {
      window.history.back();
    } else {
      // No referrer or external referrer, go to index page (main dashboard)
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error handling back button:", error);
    // Fallback to index page on any error
    window.location.href = "index.html";
  }
}

// Setup event listeners
function setupEventListeners() {
  // Back button
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.onclick = handleBackButton;
  }

  // Pagination buttons
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if (prevBtn) {
    prevBtn.onclick = loadPreviousPage;
  }
  if (nextBtn) {
    nextBtn.onclick = loadNextPage;
  }

  // Write Review button
  const writeReviewBtn = document.getElementById("writeReviewBtn");
  if (writeReviewBtn) {
    writeReviewBtn.onclick = openReviewModal;
  }

  // Close Review Modal
  const closeReviewModal = document.getElementById("closeReviewModal");
  if (closeReviewModal) {
    closeReviewModal.onclick = closeReviewModalFunc;
  }

  // Review Modal Overlay click to close
  const reviewModal = document.getElementById("reviewModal");
  if (reviewModal) {
    reviewModal.onclick = (e) => {
      if (e.target === reviewModal) {
        closeReviewModalFunc();
      }
    };
  }

  // Star Rating
  setupStarRating();

  // Review Text Character Count
  const reviewText = document.getElementById("reviewText");
  if (reviewText) {
    reviewText.addEventListener("input", updateCharCount);
  }

  // Review Form Submit
  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", handleReviewSubmit);
  }

  // Share button
  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.onclick = async () => {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${profileData?.name || 'User'}'s Profile`,
            text: `Check out ${profileData?.name || 'this user'}'s profile`,
            url: url
          });
        } catch (error) {
          console.log("Share cancelled");
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
          alert("Profile link copied to clipboard!");
        });
      }
    };
  }
}

// Open Review Modal
function openReviewModal() {
  // Check if user is logged in
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login to write a review");
    // Redirect to login or show login modal
    window.location.href = "index.html";
    return;
  }

  const reviewModal = document.getElementById("reviewModal");
  if (reviewModal) {
    reviewModal.classList.add("show");
    // Reset form
    resetReviewForm();
  }
}

// Close Review Modal
function closeReviewModalFunc() {
  const reviewModal = document.getElementById("reviewModal");
  if (reviewModal) {
    reviewModal.classList.remove("show");
  }
}

// Setup Star Rating
function setupStarRating() {
  const starRating = document.getElementById("starRating");
  const selectedRating = document.getElementById("selectedRating");
  if (!starRating || !selectedRating) return;

  const stars = starRating.querySelectorAll(".star");
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = parseInt(star.getAttribute("data-rating"));
      selectedRating.value = rating;
      updateStarDisplay(rating);
    });

    star.addEventListener("mouseenter", () => {
      const rating = parseInt(star.getAttribute("data-rating"));
      highlightStars(rating);
    });
  });

  starRating.addEventListener("mouseleave", () => {
    const currentRating = parseInt(selectedRating.value) || 0;
    updateStarDisplay(currentRating);
  });
}

// Update Star Display
function updateStarDisplay(rating) {
  const starRating = document.getElementById("starRating");
  if (!starRating) return;

  starRating.setAttribute("data-rating", rating);
  const stars = starRating.querySelectorAll(".star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

// Highlight Stars on Hover
function highlightStars(rating) {
  const starRating = document.getElementById("starRating");
  if (!starRating) return;

  const stars = starRating.querySelectorAll(".star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.style.filter = "none";
    } else {
      star.style.filter = "grayscale(100%) opacity(0.5)";
    }
  });
}

// Update Character Count
function updateCharCount() {
  const reviewText = document.getElementById("reviewText");
  const charCount = document.getElementById("charCount");
  if (reviewText && charCount) {
    const count = reviewText.value.length;
    charCount.textContent = count;
    if (count > 500) {
      charCount.style.color = "#ef4444";
    } else {
      charCount.style.color = "var(--color-silver)";
    }
  }
}

// Reset Review Form
function resetReviewForm() {
  const form = document.getElementById("reviewForm");
  if (form) {
    form.reset();
  }
  const selectedRating = document.getElementById("selectedRating");
  if (selectedRating) {
    selectedRating.value = "";
  }
  updateStarDisplay(0);
  updateCharCount();
  const errorMsg = document.getElementById("reviewFormError");
  if (errorMsg) {
    errorMsg.style.display = "none";
    errorMsg.textContent = "";
  }
}

// Handle Review Submit
async function handleReviewSubmit(event) {
  event.preventDefault();

  const submitBtn = document.getElementById("submitReviewBtn");
  const errorMsg = document.getElementById("reviewFormError");
  const ratingError = document.getElementById("ratingError");

  // Reset errors
  if (errorMsg) {
    errorMsg.style.display = "none";
    errorMsg.textContent = "";
  }
  if (ratingError) {
    ratingError.textContent = "";
  }

  // Get form values
  const rating = parseInt(document.getElementById("selectedRating").value);
  const reviewText = document.getElementById("reviewText").value.trim();
  const serviceName = document.getElementById("serviceName").value.trim();

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    if (ratingError) {
      ratingError.textContent = "Please select a rating";
      ratingError.style.display = "block";
    }
    return;
  }

  // Get selected tags
  const tagCheckboxes = document.querySelectorAll(".tag-checkbox input[type='checkbox']:checked");
  const tags = Array.from(tagCheckboxes).map(cb => cb.value);

  // Prepare review data
  const reviewData = {
    rating,
    reviewText: reviewText || "",
    tags: tags,
    serviceName: serviceName || "",
  };

  // Disable submit button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
  }

  try {
    const response = await apiService.createReview(currentUserId, reviewData);
    
    if (response.success) {
      // Show success message
      alert("Review submitted successfully!");
      
      // Close modal
      closeReviewModalFunc();
      
      // Reload reviews and rating summary
      await Promise.all([
        loadReviews(1),
        loadRatingSummary()
      ]);
    } else {
      throw new Error(response.message || "Failed to submit review");
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    
    // Show error message
    let errorMessage = "Failed to submit review";
    if (error.message) {
      errorMessage = error.message.replace(/^Request failed:\s*/i, "").trim();
      if (!errorMessage || errorMessage.toLowerCase() === "request failed") {
        errorMessage = "Unable to submit review. Please try again later.";
      }
    }
    
    if (errorMsg) {
      errorMsg.textContent = errorMessage;
      errorMsg.style.display = "block";
    }
  } finally {
    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
    }
  }
}

// Show loading state
function showLoading() {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  if (loadingState) loadingState.style.display = "block";
  if (errorState) errorState.style.display = "none";
}

// Hide loading state
function hideLoading() {
  const loadingState = document.getElementById("loadingState");
  if (loadingState) loadingState.style.display = "none";
}

// Show error state
function showError(message) {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  const errorMessage = document.getElementById("errorMessage");
  
  if (loadingState) loadingState.style.display = "none";
  if (errorState) errorState.style.display = "block";
  if (errorMessage) errorMessage.textContent = message;
}
