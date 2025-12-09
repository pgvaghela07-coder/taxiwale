// User Profile Page JavaScript

let currentUserId = null;
let currentUserData = null;
let userMobile = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Get userId from URL params
  const urlParams = new URLSearchParams(window.location.search);
  currentUserId = urlParams.get("userId");

  if (!currentUserId) {
    showError("User ID not provided");
    return;
  }

  loadUserProfile();
});

// Load user profile data
async function loadUserProfile() {
  try {
    showLoading();
    hideError();
    hideContent();

    if (!currentUserId) {
      throw new Error("User ID is required");
    }

    console.log("Loading profile for userId:", currentUserId);

    const apiService = new ApiService();
    const response = await apiService.getPublicProfile(currentUserId);

    console.log("Profile API response:", response);

    if (response.success && response.data) {
      currentUserData = response.data;
      userMobile = currentUserData.mobile;
      displayProfile(response.data);
      loadUserVehicles(currentUserId);
      hideLoading();
      showContent();
    } else {
      const errorMsg = response.message || "Failed to load profile";
      console.error("Profile API error:", errorMsg, response);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    const errorMessage = error.message || "Failed to load user profile. Please check if the user exists.";
    showError(errorMessage);
    hideLoading();
  }
}

// Display profile data in UI
function displayProfile(user) {
  // Profile header
  const avatar = document.getElementById("profileAvatar");
  if (avatar) {
    if (user.profile?.avatar) {
      avatar.src = user.profile.avatar;
    } else {
      // Generate avatar from name
      const name = user.name || "User";
      avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=ff9900&color=1a1a1a&size=200`;
    }
    avatar.alt = user.name || "Profile";
  }

  // Name
  const nameEl = document.getElementById("profileName");
  if (nameEl) {
    nameEl.textContent = user.name || "Unknown User";
  }

  // Location
  const locationEl = document.getElementById("profileLocation");
  if (locationEl) {
    const city = user.profile?.city || "";
    const state = user.profile?.state || "";
    locationEl.textContent = city && state ? `${city}, ${state}` : city || state || "Location not specified";
  }

  // Verified badge
  const verifiedBadge = document.getElementById("verifiedBadge");
  if (verifiedBadge) {
    if (user.verificationStatus?.isVerified) {
      verifiedBadge.style.display = "flex";
    } else {
      verifiedBadge.style.display = "none";
    }
  }

  // Profile details
  document.getElementById("businessName").textContent =
    user.businessName || "-";
  document.getElementById("businessDescription").textContent =
    user.profile?.businessDescription || "-";
  document.getElementById("tripsPosted").textContent =
    user.tripsPostedCount || 0;
  document.getElementById("memberSince").textContent = formatDate(
    user.memberSince
  );
  document.getElementById("email").textContent = user.email || "-";
  document.getElementById("phoneNumber").textContent = formatPhoneNumber(
    user.mobile || ""
  );
  document.getElementById("address").textContent =
    user.profile?.address || "-";

  // About section
  const experience = user.profile?.yearsInBusiness || 0;
  document.getElementById("experience").textContent =
    experience > 0 ? `${experience} year(s)` : "-";
  const age = user.age || user.profile?.age;
  document.getElementById("age").textContent = age ? `${age} yr` : "-";

  // Preferred trips and routes
  displayPreferredTripsAndRoutes(user.profile);

  // Languages
  displayLanguages(user.profile?.languages || []);

  // Rating summary
  displayRatingSummary(user.rating);
}

// Display preferred trips and routes
function displayPreferredTripsAndRoutes(profile) {
  const container = document.getElementById("preferredTags");
  if (!container) return;

  const trips = profile?.preferredTrips || [];
  const routes = profile?.preferredRoutes || [];
  const allItems = [...trips, ...routes];

  if (allItems.length === 0) {
    container.innerHTML = '<p class="no-data-text">No preferred trips/routes specified</p>';
    return;
  }

  container.innerHTML = allItems
    .map((item) => {
      const icon = item.includes("->") || item.includes("→") ? "🛣️" : 
                   item.toLowerCase().includes("airport") ? "✈️" :
                   item.toLowerCase().includes("round") ? "↔️" :
                   item.toLowerCase().includes("one way") ? "→" :
                   item.toLowerCase().includes("local") ? "🚗" : "📍";
      return `<span class="tag-item">${icon} ${item}</span>`;
    })
    .join("");
}

// Display languages
function displayLanguages(languages) {
  const container = document.getElementById("languagesContent");
  if (!container) return;

  if (!languages || languages.length === 0) {
    container.innerHTML = '<p class="no-data-text">Languages not specified</p>';
    return;
  }

  container.innerHTML = `<div class="languages-list">${languages
    .map((lang) => `<span class="language-tag">${lang}</span>`)
    .join("")}</div>`;
}

// Display rating summary
function displayRatingSummary(rating) {
  if (!rating) return;

  const avgRating = document.getElementById("averageRating");
  if (avgRating) {
    avgRating.textContent = rating.average.toFixed(1);
  }

  const starsEl = document.getElementById("ratingStars");
  if (starsEl) {
    const fullStars = Math.floor(rating.average);
    const hasHalfStar = rating.average % 1 >= 0.5;
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
    starsEl.innerHTML = starsHTML;
  }

  const reviewsCount = document.getElementById("reviewsCount");
  if (reviewsCount) {
    reviewsCount.textContent = `Based on ${rating.total} ratings & reviews`;
  }
}

// Load user vehicles
async function loadUserVehicles(userId) {
  try {
    const apiService = new ApiService();
    // Note: We need to check if there's an endpoint to get vehicles by userId
    // For now, we'll show a placeholder
    const container = document.getElementById("vehiclesContainer");
    if (container) {
      container.innerHTML = '<p class="no-data-text">Vehicle listing feature coming soon</p>';
    }
  } catch (error) {
    console.error("Error loading vehicles:", error);
    const container = document.getElementById("vehiclesContainer");
    if (container) {
      container.innerHTML = '<p class="no-data-text">Failed to load vehicles</p>';
    }
  }
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "-";
  }
}

// Format phone number
function formatPhoneNumber(mobile) {
  if (!mobile) return "-";
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return mobile;
}

// Action button handlers
function handleCall() {
  if (!userMobile) {
    alert("Phone number not available");
    return;
  }
  window.location.href = `tel:${userMobile}`;
}

function handleWhatsApp() {
  if (!userMobile) {
    alert("Phone number not available");
    return;
  }
  const message = encodeURIComponent(
    `Hello! I'm interested in your taxi services.`
  );
  const whatsappUrl = `https://wa.me/91${userMobile.replace(/\D/g, "")}?text=${message}`;
  window.open(whatsappUrl, "_blank");
}

function handleShare() {
  if (navigator.share) {
    navigator.share({
      title: `${currentUserData?.name || "User"}'s Profile`,
      text: `Check out ${currentUserData?.name || "this user"}'s profile on Tripeaz Taxi Partners`,
      url: window.location.href,
    }).catch((error) => {
      console.error("Error sharing:", error);
      copyToClipboard();
    });
  } else {
    copyToClipboard();
  }
}

function copyToClipboard() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    alert("Profile link copied to clipboard!");
  }).catch(() => {
    alert("Failed to copy link. Please copy manually: " + url);
  });
}

// Navigation functions
function openReviewsPage() {
  if (!currentUserId) return;
  window.location.href = `reviews-ratings.html?userId=${currentUserId}`;
}

function goBack() {
  window.history.back();
}

function navigateToTab(tabName) {
  if (tabName === "fab") {
    // Handle FAB click - could open a menu or navigate
    return;
  }
  window.location.href = `dashboard.html#${tabName}`;
}

function showPreferredDetails() {
  // Could show a modal with more details
  alert("Preferred trips and routes details");
}

function showLanguagesDetails() {
  // Could show a modal with more details
  alert("Languages details");
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
  const content = document.getElementById("profileContent");
  if (content) content.style.display = "block";
}

function hideContent() {
  const content = document.getElementById("profileContent");
  if (content) content.style.display = "none";
}

// Make functions globally accessible
window.handleCall = handleCall;
window.handleWhatsApp = handleWhatsApp;
window.handleShare = handleShare;
window.openReviewsPage = openReviewsPage;
window.goBack = goBack;
window.navigateToTab = navigateToTab;
window.showPreferredDetails = showPreferredDetails;
window.showLanguagesDetails = showLanguagesDetails;
window.loadUserProfile = loadUserProfile;

