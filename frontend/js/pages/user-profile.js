// User Profile Page JavaScript
let currentUserId = null;
let profileData = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentUserId = urlParams.get("userId");

  if (!currentUserId) {
    showError("User ID not found");
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

    // Load vehicles
    await loadUserVehicles();

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
      if (data.isVerified) {
        verifiedBadge.innerHTML = '<span class="verified-badge">✓ Verified</span>';
      } else {
        verifiedBadge.innerHTML = "";
      }
    }

    // User info card
    const companyNameEl = document.getElementById("companyName");
    if (companyNameEl) {
      companyNameEl.textContent = data.businessName || "-";
    }
    
    const emailIdEl = document.getElementById("emailId");
    if (emailIdEl) {
      emailIdEl.textContent = data.email || "-";
    }
    
    const cancelledCountEl = document.getElementById("cancelledCount");
    if (cancelledCountEl) {
      cancelledCountEl.textContent = data.bookingCancelledCount || 0;
    }

    // Rating summary
    const avgRating = data.rating?.average || 0;
    const totalReviews = data.rating?.totalReviews || 0;
    
    const avgRatingEl = document.getElementById("averageRating");
    if (avgRatingEl) {
      avgRatingEl.textContent = avgRating.toFixed(1);
    }
    
    const ratingTextEl = document.getElementById("ratingText");
    if (ratingTextEl) {
      ratingTextEl.textContent = `Based on ${totalReviews} rating${totalReviews !== 1 ? "s" : ""} & review${totalReviews !== 1 ? "s" : ""}`;
    }

    // Rating distribution
    if (totalReviews > 0 && data.rating?.percentages) {
      displayRatingDistribution(data.rating.percentages);
    }

    // About section
    const experienceItem = document.getElementById("experienceItem");
    if (experienceItem && data.profile?.experience) {
      experienceItem.style.display = "flex";
      const experienceValue = document.getElementById("experienceValue");
      if (experienceValue) {
        experienceValue.textContent = `${data.profile.experience} year${data.profile.experience !== 1 ? "s" : ""}`;
      }
    }

    const ageItem = document.getElementById("ageItem");
    if (ageItem && data.age) {
      ageItem.style.display = "flex";
      const ageValue = document.getElementById("ageValue");
      if (ageValue) {
        ageValue.textContent = `${data.age} yr`;
      }
    }

    if (data.profile?.businessDescription) {
      const descEl = document.getElementById("businessDescription");
      if (descEl) {
        descEl.style.display = "block";
        descEl.textContent = data.profile.businessDescription;
      }
    }

    // Preferred trips
    const preferredTripsSection = document.getElementById("preferredTripsSection");
    if (preferredTripsSection && data.profile?.preferredTrips && data.profile.preferredTrips.length > 0) {
      preferredTripsSection.style.display = "block";
      const chipsContainer = document.getElementById("preferredTripsChips");
      if (chipsContainer) {
        chipsContainer.innerHTML = data.profile.preferredTrips
          .map((trip) => `<span class="chip">${formatTripType(trip)}</span>`)
          .join("");
      }
    }

    // Preferred routes
    if (data.profile?.preferredRoutes && data.profile.preferredRoutes.length > 0) {
      const routesContainer = document.getElementById("preferredRoutesChips");
      if (routesContainer) {
        routesContainer.innerHTML = data.profile.preferredRoutes
          .map((route) => `<span class="chip">${route}</span>`)
          .join("");
      }
    }

    // Languages
    const languagesSection = document.getElementById("languagesSection");
    if (languagesSection && data.profile?.languages && data.profile.languages.length > 0) {
      languagesSection.style.display = "block";
      const languagesContainer = document.getElementById("languagesChips");
      if (languagesContainer) {
        languagesContainer.innerHTML = data.profile.languages
          .map((lang) => `<span class="chip">${lang}</span>`)
          .join("");
      }
    }
    
    console.log("✅ Profile display completed");
  } catch (error) {
    console.error("❌ Error in displayProfile:", error);
    throw error;
  }
}

// Display rating distribution
function displayRatingDistribution(percentages) {
  document.getElementById("ratingDistributionCard").style.display = "block";
  for (let i = 5; i >= 1; i--) {
    const percent = percentages[i] || 0;
    document.getElementById(`bar${i}`).style.width = `${percent}%`;
    document.getElementById(`percent${i}`).textContent = `${percent}%`;
  }
}

// Load user vehicles
async function loadUserVehicles() {
  try {
    const vehiclesResponse = await apiService.getUserVehicles(currentUserId);
    if (vehiclesResponse.success && vehiclesResponse.data.length > 0) {
      document.getElementById("vehiclesSection").style.display = "block";
      displayVehicles(vehiclesResponse.data);
    }
  } catch (error) {
    console.error("Error loading vehicles:", error);
    // Don't show error, just don't display vehicles section
  }
}

// Display vehicles
function displayVehicles(vehicles) {
  const vehiclesList = document.getElementById("vehiclesList");
  vehiclesList.innerHTML = vehicles
    .map((vehicle) => {
      const vehicleTypeEmoji = getVehicleTypeEmoji(vehicle.vehicleType);
      return `
        <div class="vehicle-card">
          <div class="vehicle-header">
            <h4>${vehicle.vehicleName || "Vehicle"}</h4>
            <span class="vehicle-price">₹${vehicle.pricePerKm || 0}/Km</span>
          </div>
          <div class="vehicle-details">
            <span class="vehicle-type">${vehicleTypeEmoji} ${vehicle.vehicleType || ""}</span>
            ${vehicle.vehicleAge ? `<span class="vehicle-age">Age: ${vehicle.vehicleAge}</span>` : ""}
          </div>
          ${vehicle.images && vehicle.images.length > 0 ? `<img src="${vehicle.images[0]}" alt="${vehicle.vehicleName}" class="vehicle-image">` : ""}
        </div>
      `;
    })
    .join("");
}

// Format trip type
function formatTripType(trip) {
  const tripMap = {
    "round-trip": "Round Trip",
    "airport": "Airport",
    "one-way": "One Way",
    "local-duty": "Local Duty",
  };
  return tripMap[trip] || trip;
}

// Get vehicle type emoji
function getVehicleTypeEmoji(type) {
  const emojiMap = {
    sedan: "🚙",
    suv: "🚗",
    hatchback: "🚗",
    luxury: "🚖",
    traveller: "🚐",
    bus: "🚌",
  };
  return emojiMap[type?.toLowerCase()] || "🚗";
}

// Setup event listeners
function setupEventListeners() {
  // Call button
  document.getElementById("callBtn").addEventListener("click", () => {
    if (profileData?.mobile) {
      window.location.href = `tel:${profileData.mobile}`;
    }
  });

  // WhatsApp button
  document.getElementById("whatsappBtn").addEventListener("click", () => {
    if (profileData?.mobile) {
      const message = encodeURIComponent(`Hello ${profileData.name || ""}`);
      window.open(`https://wa.me/${profileData.mobile}?text=${message}`, "_blank");
    }
  });

  // Share button
  document.getElementById("shareBtn").addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileData?.name || "User"}'s Profile`,
          text: `Check out ${profileData?.name || "this user"}'s profile`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  });

  // View reviews button
  document.getElementById("viewReviewsBtn").addEventListener("click", () => {
    window.location.href = `reviews-ratings.html?userId=${currentUserId}`;
  });
}

// Show loading state
function showLoading() {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  if (loadingState) loadingState.style.display = "flex";
  if (errorState) errorState.style.display = "none";
  
  // Hide content sections while loading
  const contentSections = document.querySelectorAll('.profile-header-section, .action-buttons, .info-card, .rating-summary-card, .rating-distribution-card, .about-card, .preferred-section, .languages-section, .vehicles-section');
  contentSections.forEach(section => {
    if (section) section.style.display = 'none';
  });
}

// Hide loading state
function hideLoading() {
  const loadingState = document.getElementById("loadingState");
  if (loadingState) loadingState.style.display = "none";
  
  // Show content sections after loading
  const contentSections = document.querySelectorAll('.profile-header-section, .action-buttons, .info-card, .rating-summary-card, .about-card');
  contentSections.forEach(section => {
    if (section) section.style.display = '';
  });
}

// Show error state
function showError(message) {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  const errorMessage = document.getElementById("errorMessage");
  
  if (loadingState) loadingState.style.display = "none";
  if (errorState) {
    errorState.style.display = "block";
    if (errorMessage) errorMessage.textContent = message;
  }
  
  console.error("Profile Error:", message);
}

