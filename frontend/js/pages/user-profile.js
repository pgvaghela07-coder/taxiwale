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

    // Load profile data
    const profileResponse = await apiService.getPublicProfile(currentUserId);
    if (!profileResponse.success) {
      throw new Error(profileResponse.message || "Failed to load profile");
    }

    profileData = profileResponse.data;
    displayProfile(profileData);

    // Load vehicles
    await loadUserVehicles();

    hideLoading();
  } catch (error) {
    console.error("Error loading profile:", error);
    showError(error.message || "Failed to load profile");
  }
}

// Display profile data
function displayProfile(data) {
  // Cover image
  const coverImage = document.getElementById("coverImage");
  if (data.profile?.coverImage) {
    coverImage.style.backgroundImage = `url(${data.profile.coverImage})`;
  } else {
    coverImage.style.backgroundColor = "#e0e0e0";
  }

  // Profile avatar
  const avatar = document.getElementById("profileAvatarLarge");
  if (data.profile?.avatar) {
    avatar.innerHTML = `<img src="${data.profile.avatar}" alt="${data.name}">`;
  } else {
    const firstLetter = (data.name || "U").charAt(0).toUpperCase();
    avatar.innerHTML = `<div class="avatar-placeholder">${firstLetter}</div>`;
  }

  // Name and location
  document.getElementById("profileName").textContent = data.name || "Unknown User";
  const locationInfo = document.getElementById("locationInfo");
  if (data.profile?.city || data.profile?.state) {
    locationInfo.textContent = `${data.profile.city || ""}${data.profile.city && data.profile.state ? ", " : ""}${data.profile.state || ""}`;
  }

  // Verified badge
  const verifiedBadge = document.getElementById("verifiedBadge");
  if (data.isVerified) {
    verifiedBadge.innerHTML = '<span class="verified-badge">✓ Verified</span>';
  }

  // User info card
  document.getElementById("companyName").textContent = data.businessName || "-";
  document.getElementById("emailId").textContent = data.email || "-";
  document.getElementById("cancelledCount").textContent = data.bookingCancelledCount || 0;

  // Rating summary
  const avgRating = data.rating?.average || 0;
  const totalReviews = data.rating?.totalReviews || 0;
  document.getElementById("averageRating").textContent = avgRating.toFixed(1);
  document.getElementById("ratingText").textContent = `Based on ${totalReviews} rating${totalReviews !== 1 ? "s" : ""} & review${totalReviews !== 1 ? "s" : ""}`;

  // Rating distribution
  if (totalReviews > 0 && data.rating?.percentages) {
    displayRatingDistribution(data.rating.percentages);
  }

  // About section
  if (data.profile?.experience) {
    document.getElementById("experienceItem").style.display = "flex";
    document.getElementById("experienceValue").textContent = `${data.profile.experience} year${data.profile.experience !== 1 ? "s" : ""}`;
  }

  if (data.age) {
    document.getElementById("ageItem").style.display = "flex";
    document.getElementById("ageValue").textContent = `${data.age} yr`;
  }

  if (data.profile?.businessDescription) {
    const descEl = document.getElementById("businessDescription");
    descEl.style.display = "block";
    descEl.textContent = data.profile.businessDescription;
  }

  // Preferred trips
  if (data.profile?.preferredTrips && data.profile.preferredTrips.length > 0) {
    document.getElementById("preferredTripsSection").style.display = "block";
    const chipsContainer = document.getElementById("preferredTripsChips");
    chipsContainer.innerHTML = data.profile.preferredTrips
      .map(
        (trip) =>
          `<span class="chip">${formatTripType(trip)}</span>`
      )
      .join("");
  }

  // Preferred routes
  if (data.profile?.preferredRoutes && data.profile.preferredRoutes.length > 0) {
    const routesContainer = document.getElementById("preferredRoutesChips");
    routesContainer.innerHTML = data.profile.preferredRoutes
      .map((route) => `<span class="chip">${route}</span>`)
      .join("");
  }

  // Languages
  if (data.profile?.languages && data.profile.languages.length > 0) {
    document.getElementById("languagesSection").style.display = "block";
    const languagesContainer = document.getElementById("languagesChips");
    languagesContainer.innerHTML = data.profile.languages
      .map((lang) => `<span class="chip">${lang}</span>`)
      .join("");
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
  document.getElementById("loadingState").style.display = "flex";
  document.getElementById("errorState").style.display = "none";
}

// Hide loading state
function hideLoading() {
  document.getElementById("loadingState").style.display = "none";
}

// Show error state
function showError(message) {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("errorState").style.display = "block";
  document.getElementById("errorMessage").textContent = message;
}

