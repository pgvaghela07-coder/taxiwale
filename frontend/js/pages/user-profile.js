// User Profile Page JavaScript
let currentUserId = null;
let profileData = null;

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
    ]);

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
  if (data.distribution) {
    [5, 4, 3, 2, 1].forEach(rating => {
      const percent = data.distribution[rating] || 0;
      const bar = document.getElementById(`bar${rating}`);
      const percentEl = document.getElementById(`percent${rating}`);
      if (bar) bar.style.width = `${percent}%`;
      if (percentEl) percentEl.textContent = `${percent}%`;
    });
    document.getElementById("ratingDistributionCard").style.display = "block";
  }
}

// Setup event listeners
function setupEventListeners() {
  // View reviews button
  const viewReviewsBtn = document.getElementById("viewReviewsBtn");
  if (viewReviewsBtn) {
    viewReviewsBtn.onclick = () => {
      window.location.href = `reviews-ratings.html?userId=${currentUserId}`;
    };
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
