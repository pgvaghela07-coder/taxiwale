// ===== GLOBAL VARIABLES =====
let activeTab = "available";

// Data storage for bookings and vehicles (for WhatsApp interest messages)
const dashboardBookingsMap = new Map(); // Store booking objects by _id
const dashboardVehiclesMap = new Map(); // Store vehicle objects by _id

// ===== TIME FORMATTING HELPER =====
/**
 * Formats time difference as relative time string
 * Rules:
 * - Less than 1 minute → "Just now"
 * - 1-59 minutes → "X minutes ago"
 * - 60+ minutes (but < 24 hours) → "X hours ago" (whole hours only)
 * - 24+ hours → "X days ago"
 * @param {Date} dateTime - The date/time to calculate from
 * @returns {string} Formatted time string
 */
function formatTimeAgo(dateTime) {
  const now = new Date();
  const diffMs = now - dateTime;

  // Less than 1 minute (60 seconds)
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) {
    return "Just now";
  }

  // 1-59 minutes
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }

  // 60+ minutes, convert to hours (whole hours only, no minutes)
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  // 24+ hours, convert to days
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
}

// ===== PAGE LOAD =====
window.addEventListener("DOMContentLoaded", async () => {
  // Check combined status (profile + verification) and show banner/popup if needed
  await checkCombinedStatus();

  // Apply card restrictions
  applyCardRestrictions();

  // Re-check combined status periodically (every 30 seconds)
  setInterval(async () => {
    await checkCombinedStatus();
  }, 30000);

  // Check if there's a target tab to switch to
  const targetTab = sessionStorage.getItem("targetTab");
  if (targetTab) {
    // Switch to the target tab
    switchTab(targetTab);
    // Clear the stored target tab
    sessionStorage.removeItem("targetTab");
  } else {
    // Set default tab
    switchTab("available");
  }

  // Populate city dropdown
  populateCityDropdown();

  // Initialize filter section if on available tab
  if (activeTab === "available") {
    setTimeout(() => {
      initFilterSection();
    }, 200);
    
    // Fallback: Ensure bookings are loaded after a delay
    setTimeout(() => {
      const bookingCards = document.getElementById("bookingCards");
      if (bookingCards && typeof loadBookingsFromAPI === "function") {
        console.log("🔄 Fallback: Loading bookings from API...");
        // Check if container is still showing loading state (means bookings weren't loaded)
        const isLoading = bookingCards.querySelector(".loading-bookings");
        if (isLoading || bookingCards.children.length === 0) {
          loadBookingsFromAPI();
        }
      }
    }, 1000);
  }

  console.log("🚖 Tripeaz Taxi Partners - Dashboard loaded");
});

// ===== CHECK COMBINED STATUS (PROFILE + VERIFICATION) =====
async function checkCombinedStatus() {
  try {
    // ALWAYS fetch fresh data from API first (especially after login)
    // This ensures we have the latest verification status from database
    let userData = null;

    if (typeof apiService !== "undefined") {
      try {
        const response = await apiService.request("/auth/me");
        if (response.success && response.user) {
          userData = response.user;
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      } catch (error) {
        console.error("Error fetching user data from API:", error);
        // Fallback to localStorage if API fails
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          userData = JSON.parse(storedUser);
        }
      }
    } else {
      // Fallback to localStorage if apiService not available
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        userData = JSON.parse(storedUser);
      }
    }

    if (!userData) {
      return;
    }

    // Check profile completion status
    const isProfileComplete = userData.profile?.isProfileComplete || false;
    const profileSkipped = sessionStorage.getItem("profileSkipped") === "true";

    // Check document verification status
    const aadhaarVerified =
      userData.verificationStatus?.aadhaar?.verified || false;
    const dlVerified =
      userData.verificationStatus?.drivingLicense?.verified || false;
    const bothVerified = aadhaarVerified && dlVerified;
    const verificationSkipped =
      sessionStorage.getItem("verificationSkipped") === "true";

    // Determine if warnings should be shown
    const profilePending = !isProfileComplete && profileSkipped;
    const docsPending = !bothVerified && verificationSkipped;
    const shouldShowWarning = profilePending || docsPending;

    if (shouldShowWarning) {
      showCombinedWarning(
        profilePending,
        docsPending,
        isProfileComplete,
        bothVerified
      );
    } else {
      hideCombinedWarning();
      // Clear skip flags if both are complete
      if (isProfileComplete && bothVerified) {
        sessionStorage.removeItem("profileSkipped");
        sessionStorage.removeItem("verificationSkipped");
      }
    }
  } catch (error) {
    console.error("Error checking combined status:", error);
  }
}

// ===== SHOW COMBINED WARNING =====
function showCombinedWarning(
  profilePending,
  docsPending,
  isProfileComplete,
  bothVerified
) {
  const popup = document.getElementById("combinedWarningPopup");
  const banner = document.getElementById("combinedStickyBanner");
  const statusDetails = document.getElementById("statusDetails");
  const bannerStatusItems = document.getElementById("bannerStatusItems");
  const restrictionsList = document.getElementById("restrictionsList");
  const primaryActionBtn = document.getElementById("primaryActionBtn");
  const bannerText = document.getElementById("combinedBannerText");
  const warningSubtitle = document.getElementById("warningSubtitle");

  // Clear existing status items in popup
  if (statusDetails) {
    statusDetails.innerHTML = "";
  }

  // Clear existing status items in banner
  if (bannerStatusItems) {
    bannerStatusItems.innerHTML = "";
  }

  // Build status items for POPUP
  if (profilePending) {
    const profileItem = document.createElement("div");
    profileItem.className = "status-item";
    profileItem.id = "profileStatusItem";
    profileItem.innerHTML = `
      <span class="status-icon pending-icon">🟠</span>
      <span class="status-text">Profile Information - Incomplete</span>
    `;
    if (statusDetails) statusDetails.appendChild(profileItem);
  }

  if (docsPending) {
    const docsItem = document.createElement("div");
    docsItem.className = "status-item";
    docsItem.id = "docStatusItem";
    docsItem.innerHTML = `
      <span class="status-icon pending-icon">🟠</span>
      <span class="status-text">Document Verification - Pending</span>
    `;
    if (statusDetails) statusDetails.appendChild(docsItem);
  }

  // Build status items for BANNER (compact format)
  if (profilePending) {
    const bannerProfileItem = document.createElement("span");
    bannerProfileItem.className = "banner-status-badge";
    bannerProfileItem.innerHTML = `🟠 Profile Incomplete`;
    if (bannerStatusItems) bannerStatusItems.appendChild(bannerProfileItem);
  }

  if (docsPending) {
    const bannerDocsItem = document.createElement("span");
    bannerDocsItem.className = "banner-status-badge";
    bannerDocsItem.innerHTML = `🟠 Documents Pending`;
    if (bannerStatusItems) bannerStatusItems.appendChild(bannerDocsItem);
  }

  // Add separator between status items in banner if both are present
  if (profilePending && docsPending && bannerStatusItems) {
    const separator = document.createElement("span");
    separator.className = "banner-status-separator";
    separator.textContent = "•";
    // Insert separator between items
    const firstItem = bannerStatusItems.querySelector(
      ".banner-status-badge:first-child"
    );
    if (firstItem && firstItem.nextSibling) {
      bannerStatusItems.insertBefore(separator, firstItem.nextSibling);
    }
  }

  // Show/hide banner text and status items based on what's pending
  if (bannerStatusItems && bannerStatusItems.children.length > 0) {
    // Hide generic text, show status items
    if (bannerText) bannerText.style.display = "none";
    if (bannerStatusItems) bannerStatusItems.style.display = "flex";
  } else {
    // Show generic text, hide status items
    if (bannerText) bannerText.style.display = "block";
    if (bannerStatusItems) bannerStatusItems.style.display = "none";
  }

  // Update subtitle and button text
  if (profilePending && docsPending) {
    if (warningSubtitle)
      warningSubtitle.textContent =
        "Complete your profile and verify documents to unlock all features";
    if (primaryActionBtn) primaryActionBtn.textContent = "Complete Profile Now";
  } else if (profilePending) {
    if (warningSubtitle)
      warningSubtitle.textContent =
        "Complete your profile to unlock all features";
    if (primaryActionBtn) primaryActionBtn.textContent = "Complete Profile Now";
  } else if (docsPending) {
    if (warningSubtitle)
      warningSubtitle.textContent =
        "Verify your documents to unlock all features";
    if (primaryActionBtn) primaryActionBtn.textContent = "Verify Documents Now";
  }

  // Show popup and banner
  if (popup) {
    // Check if user recently skipped (within last 5 minutes)
    const skippedUntil = sessionStorage.getItem("warningSkippedUntil");
    const now = Date.now();

    if (!skippedUntil || now > parseInt(skippedUntil)) {
      popup.classList.add("show");
    }
  }

  if (banner) {
    banner.classList.add("show");
    document.body.classList.add("has-banner");
  }
}

// ===== HIDE COMBINED WARNING =====
function hideCombinedWarning() {
  const popup = document.getElementById("combinedWarningPopup");
  const banner = document.getElementById("combinedStickyBanner");

  if (popup) {
    popup.classList.remove("show");
  }

  if (banner) {
    banner.classList.remove("show");
    document.body.classList.remove("has-banner");
  }
}

// ===== HANDLE PRIMARY ACTION =====
function handlePrimaryAction() {
  // Get current status
  const profilePending = sessionStorage.getItem("profileSkipped") === "true";
  const docsPending = sessionStorage.getItem("verificationSkipped") === "true";

  if (profilePending) {
    // Redirect to profile completion
    window.location.href = "profile-completion.html";
  } else if (docsPending) {
    // Redirect to verification
    window.location.href = "verification.html";
  }
}

// ===== HANDLE BANNER CLICK =====
function handleBannerClick() {
  handlePrimaryAction();
}

// ===== SKIP FOR NOW =====
function skipForNow() {
  hideCombinedWarning();
  // Hide for 5 minutes, then show again
  sessionStorage.setItem("warningSkippedUntil", Date.now() + 5 * 60 * 1000);

  // Show again after 5 minutes
  setTimeout(() => {
    checkCombinedStatus();
  }, 5 * 60 * 1000);
}

// ===== APPLY CARD RESTRICTIONS =====
function applyCardRestrictions() {
  // Check if restrictions should be applied
  const profileSkipped = sessionStorage.getItem("profileSkipped") === "true";
  const verificationSkipped =
    sessionStorage.getItem("verificationSkipped") === "true";

  // Get user data to check actual status
  const storedUser = localStorage.getItem("user");
  let userData = null;
  if (storedUser) {
    userData = JSON.parse(storedUser);
  }

  const isProfileComplete = userData?.profile?.isProfileComplete || false;
  const aadhaarVerified =
    userData?.verificationStatus?.aadhaar?.verified || false;
  const dlVerified =
    userData?.verificationStatus?.drivingLicense?.verified || false;
  const bothVerified = aadhaarVerified && dlVerified;

  const profilePending = !isProfileComplete && profileSkipped;
  const docsPending = !bothVerified && verificationSkipped;
  const shouldRestrict = profilePending || docsPending;

  if (shouldRestrict) {
    // Add restricted class to all cards
    const bookingCards = document.querySelectorAll(".booking-card");
    const vehicleCards = document.querySelectorAll(".vehicle-card");

    bookingCards.forEach((card) => {
      card.classList.add("restricted-card");
      // Add click handler
      card.addEventListener("click", handleRestrictedCardClick);

      // Add handlers for action buttons
      const whatsappBtn = card.querySelector(".whatsapp-btn");
      const callBtn = card.querySelector(".call-btn");

      if (whatsappBtn) {
        whatsappBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleRestrictedAction();
        });
      }

      if (callBtn) {
        callBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleRestrictedAction();
        });
      }
    });

    vehicleCards.forEach((card) => {
      card.classList.add("restricted-card");
      // Add click handler
      card.addEventListener("click", handleRestrictedCardClick);

      // Add handlers for action buttons
      const whatsappBtn = card.querySelector(".whatsapp-btn");
      const callBtn = card.querySelector(".call-btn");

      if (whatsappBtn) {
        whatsappBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleRestrictedAction();
        });
      }

      if (callBtn) {
        callBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleRestrictedAction();
        });
      }
    });
  } else {
    removeCardRestrictions();
  }
}

// ===== REMOVE CARD RESTRICTIONS =====
function removeCardRestrictions() {
  const bookingCards = document.querySelectorAll(".booking-card");
  const vehicleCards = document.querySelectorAll(".vehicle-card");

  bookingCards.forEach((card) => {
    card.classList.remove("restricted-card");
    // Remove event listeners by cloning
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
  });

  vehicleCards.forEach((card) => {
    card.classList.remove("restricted-card");
    // Remove event listeners by cloning
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
  });
}

// ===== HANDLE RESTRICTED CARD CLICK =====
function handleRestrictedCardClick(e) {
  // Don't trigger if clicking on action buttons
  if (e.target.closest(".action-btn")) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  // Show combined warning popup
  const popup = document.getElementById("combinedWarningPopup");
  if (popup) {
    popup.classList.add("show");
  }
}

// ===== HANDLE RESTRICTED ACTION =====
function handleRestrictedAction() {
  // Show combined warning popup
  const popup = document.getElementById("combinedWarningPopup");
  if (popup) {
    popup.classList.add("show");
  }
}

// ===== UPDATE VERIFICATION POPUP STATUS =====
function updateVerificationPopupStatus(aadhaarVerified, dlVerified) {
  const aadhaarItem = document.getElementById("aadhaarStatusItem");
  const dlItem = document.getElementById("dlStatusItem");

  if (aadhaarItem) {
    const statusIcon = aadhaarItem.querySelector(".status-icon");
    const statusText = aadhaarItem.querySelector(".status-text");
    if (aadhaarVerified) {
      statusIcon.className = "status-icon verified-icon";
      statusIcon.textContent = "✅";
      statusText.textContent = "Aadhaar Verification - Verified";
    } else {
      statusIcon.className = "status-icon pending-icon";
      statusIcon.textContent = "🟠";
      statusText.textContent = "Aadhaar Verification - Pending";
    }
  }

  if (dlItem) {
    const statusIcon = dlItem.querySelector(".status-icon");
    const statusText = dlItem.querySelector(".status-text");
    if (dlVerified) {
      statusIcon.className = "status-icon verified-icon";
      statusIcon.textContent = "✅";
      statusText.textContent = "Driving License Verification - Verified";
    } else {
      statusIcon.className = "status-icon pending-icon";
      statusIcon.textContent = "🟠";
      statusText.textContent = "Driving License Verification - Pending";
    }
  }
}

// ===== VERIFICATION POPUP FUNCTIONS =====
function goToVerification() {
  window.location.href = "verification.html";
}

function skipVerificationForNow() {
  const verificationPopup = document.getElementById("verificationPopup");
  if (verificationPopup) {
    verificationPopup.classList.remove("show");
    // Hide for 5 minutes, then show again
    sessionStorage.setItem(
      "verificationSkippedUntil",
      Date.now() + 5 * 60 * 1000
    );

    // Show again after 5 minutes
    setTimeout(() => {
      checkVerificationStatus();
    }, 5 * 60 * 1000);
  }
}

// ===== TAB SWITCHING =====
function switchTab(tabName) {
  activeTab = tabName;

  // Remove active class from all tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Add active class to clicked tab
  const clickedTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (clickedTab) {
    clickedTab.classList.add("active");
  }

  // Update content
  updateMainContent(tabName);
}

// ===== UPDATE MAIN CONTENT =====
function updateMainContent(tabName) {
  const mainContent = document.getElementById("mainContent");

  // Add null check
  if (!mainContent) {
    console.error("mainContent element not found");
    // Wait a bit and try again if DOM might not be ready
    setTimeout(() => {
      const retryContent = document.getElementById("mainContent");
      if (retryContent) {
        updateMainContent(tabName);
      }
    }, 100);
    return;
  }

  let contentHTML = "";

  switch (tabName) {
    case "available":
      contentHTML = createBookingAvailableContent();
      break;
    case "features":
      // Redirect to separate features page
      window.location.href = "features.html";
      return;
    case "bookings":
      // Redirect to separate my-bookings page
      window.location.href = "my-bookings.html";
      return;
    case "profile":
      // Redirect to separate profile page
      window.location.href = "profile.html";
      return;
  }

  mainContent.innerHTML = contentHTML;

  // Initialize banner slider if on available tab
  if (tabName === "available") {
    // Force load bookings after a short delay
    setTimeout(() => {
      const bookingCards = document.getElementById("bookingCards");
      if (bookingCards && typeof loadBookingsFromAPI === "function") {
        console.log("🚀 Direct call: Loading bookings...");
        loadBookingsFromAPI();
      }
    }, 100);
    
    setTimeout(() => {
      initBannerSlider();
      initFilterSection();

      // Function to load the appropriate view
      const loadView = () => {
        // Check which view is active (bookings or vehicles)
        const vehiclesViewBtn = document.querySelector(
          '.view-btn[data-view="vehicles"]'
        );
        const bookingsViewBtn = document.querySelector(
          '.view-btn[data-view="bookings"]'
        );
        
        // Check which view button is active
        const isVehiclesViewActive = vehiclesViewBtn && vehiclesViewBtn.classList.contains("active");
        const isBookingsViewActive = bookingsViewBtn && bookingsViewBtn.classList.contains("active");

        // Check if containers exist
        const bookingCards = document.getElementById("bookingCards");
        const vehiclesCards = document.getElementById("vehiclesCards");

        console.log("🔍 View check:", {
          isVehiclesViewActive,
          isBookingsViewActive,
          bookingCardsExists: !!bookingCards,
          vehiclesCardsExists: !!vehiclesCards
        });

        // Function to actually load data
        const executeLoad = () => {
          // Always prioritize bookings view by default
          if (bookingCards) {
            // Only load vehicles if vehicles view is explicitly active
            if (isVehiclesViewActive && vehiclesCards) {
              console.log("🚗 Loading vehicles...");
              loadVehiclesFromAPI();
            } else {
              // Default to bookings view - always load bookings
              console.log("📋 Loading bookings (default view)...");
              loadBookingsFromAPI();
            }
          } else {
            console.warn("⚠️ bookingCards container not found, retrying...");
            // Retry after a bit more time
            setTimeout(() => {
              const retryBookingCards = document.getElementById("bookingCards");
              const retryVehiclesCards = document.getElementById("vehiclesCards");
              if (retryBookingCards) {
                if (isVehiclesViewActive && retryVehiclesCards) {
                  loadVehiclesFromAPI();
                } else {
                  loadBookingsFromAPI();
                }
              } else {
                console.error("❌ bookingCards container still not found after retry");
              }
            }, 500);
          }
        };

        // Ensure API service is loaded first
        if (typeof apiService !== "undefined") {
          executeLoad();
        } else {
          // Load API service first, then load appropriate view
          console.log("📦 Loading API service...");
          const script = document.createElement("script");
          script.src = "js/services/api.js";
          script.onload = () => {
            console.log("✅ API service loaded");
            executeLoad();
          };
          script.onerror = () => {
            console.error("❌ Failed to load API service");
          };
          document.head.appendChild(script);
        }
      };

      // Try loading immediately
      loadView();

      // Also try after delays in case DOM isn't ready
      setTimeout(loadView, 300);
      setTimeout(loadView, 600);
    }, 200);
  }
}

// ===== LOAD BOOKINGS FROM API =====
async function loadBookingsFromAPI() {
  console.log("🔄 loadBookingsFromAPI called");
  const container = document.getElementById("bookingCards");
  if (!container) {
    console.warn("⚠️ bookingCards container not found");
    return;
  }
  console.log("✅ bookingCards container found");

  // Show loading state
  container.innerHTML = `
    <div class="loading-bookings" style="text-align: center; padding: 40px; color: #bdbdbd;">
      <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
      <p>Loading bookings...</p>
    </div>
  `;

  try {
    // Check if API service is available
    if (typeof apiService === "undefined") {
      throw new Error("API service not loaded");
    }

    // Get current filters from filterState (if exists)
    const filters = {};
    if (typeof filterState !== "undefined") {
      // Vehicle filter - check vehicles array (not vehicleType)
      if (
        filterState.vehicles &&
        filterState.vehicles.length > 0 &&
        !filterState.vehicles.includes("all")
      ) {
        // Use first selected vehicle (or can support multiple)
        filters.vehicleType = filterState.vehicles[0];
      }
      // Pickup city filter
      if (
        filterState.pickupLocations &&
        filterState.pickupLocations.length > 0 &&
        !filterState.pickupLocations.includes("all")
      ) {
        filters.pickupCity = filterState.pickupLocations[0];
      }
      // Drop city filter
      if (
        filterState.dropLocations &&
        filterState.dropLocations.length > 0 &&
        !filterState.dropLocations.includes("all")
      ) {
        filters.dropCity = filterState.dropLocations[0];
      }
    }

    // Fetch ALL bookings from API (public, active bookings)
    // This shows all available bookings that users can take
    console.log("📤 Calling apiService.getBookings with filters:", filters);
    const response = await apiService.getBookings(filters);
    console.log("📦 API Response:", response);
    console.log("📦 API Response type:", typeof response);
    console.log("📦 API Response is array:", Array.isArray(response));

    // Handle different response formats (same as my-bookings.js)
    let bookings = [];
    console.log("🔍 [DEBUG] Full response object:", JSON.stringify(response, null, 2));
    console.log("🔍 [DEBUG] Response keys:", Object.keys(response || {}));
    
    if (Array.isArray(response)) {
      bookings = response;
      console.log("✅ Response is direct array, count:", bookings.length);
    } else if (response && response.data && Array.isArray(response.data)) {
      bookings = response.data;
      console.log("✅ Response has data array, count:", bookings.length);
      console.log("🔍 [DEBUG] First booking in data:", bookings[0]);
    } else if (response && response.bookings && Array.isArray(response.bookings)) {
      bookings = response.bookings;
      console.log("✅ Response has bookings array, count:", bookings.length);
    } else {
      console.warn("⚠️ Unexpected response format:", response);
      console.warn("⚠️ Response structure:", {
        hasSuccess: !!response?.success,
        hasData: !!response?.data,
        dataType: typeof response?.data,
        isDataArray: Array.isArray(response?.data),
        hasBookings: !!response?.bookings,
        responseKeys: Object.keys(response || {})
      });
      // Try to extract from nested structure
      if (response && response.success && response.data) {
        bookings = Array.isArray(response.data) ? response.data : [];
        console.log("✅ Extracted from response.success.data, count:", bookings.length);
      } else if (response && response.success === true && response.count === 0) {
        console.log("ℹ️ API returned success but count is 0 - no bookings in database");
        bookings = [];
      }
    }

    console.log("📋 Final bookings extracted:", bookings.length);
    
    // ===== COMPREHENSIVE BOOKINGS CONSOLE LOG =====
    console.log("=".repeat(80));
    console.log("📊 ALL BOOKINGS FROM DATABASE:");
    console.log("=".repeat(80));
    console.log(`Total Bookings: ${bookings.length}`);
    console.log("");
    
    if (bookings.length > 0) {
      bookings.forEach((booking, index) => {
        console.log(`\n📋 Booking #${index + 1}:`);
        console.log("─".repeat(80));
        console.log("ID:", booking._id);
        console.log("Booking ID:", booking.bookingId || "N/A");
        console.log("Status:", booking.status || "N/A");
        console.log("Trip Type:", booking.tripType || "N/A");
        console.log("Vehicle Type:", booking.vehicleType || "N/A");
        console.log("Date & Time:", booking.dateTime ? new Date(booking.dateTime).toLocaleString() : "N/A");
        console.log("Pickup City:", booking.pickup?.city || "N/A");
        console.log("Pickup Location:", booking.pickup?.location || "N/A");
        console.log("Drop City:", booking.drop?.city || "N/A");
        console.log("Drop Location:", booking.drop?.location || "N/A");
        console.log("Amount:", booking.amount?.bookingAmount ? `₹${booking.amount.bookingAmount}` : "N/A");
        console.log("Custom Requirement:", booking.customRequirement || "None");
        console.log("Posted By:", booking.postedBy?.name || "N/A", `(${booking.postedBy?.mobile || "N/A"})`);
        console.log("Posted By ID:", booking.postedBy?._id || booking.postedBy || "N/A");
        console.log("Assigned To:", booking.assignedTo?.name || booking.assignedTo || "Not Assigned");
        console.log("Created At:", booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A");
        console.log("Updated At:", booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : "N/A");
        console.log("Full Booking Object:", booking);
      });
    } else {
      console.log("⚠️ No bookings found in database");
    }
    
    console.log("=".repeat(80));
    console.log("📊 END OF BOOKINGS LIST");
    console.log("=".repeat(80));
    // ===== END OF CONSOLE LOG =====
    
    if (bookings.length > 0) {
      console.log("📋 First booking sample:", bookings[0]);
    }

    // Store bookings in Map for WhatsApp interest functionality
    dashboardBookingsMap.clear(); // Clear previous data
    bookings.forEach((booking) => {
      if (booking._id) {
        // Convert _id to string to ensure consistent key format
        const bookingIdKey = booking._id.toString
          ? booking._id.toString()
          : String(booking._id);
        dashboardBookingsMap.set(bookingIdKey, booking);
      }
    });
    console.log("💾 Stored", dashboardBookingsMap.size, "bookings in Map");

    if (bookings.length === 0) {
      console.warn("⚠️ No bookings found in response");
      console.log("🔍 [DEBUG] Checking why no bookings:", {
        responseSuccess: response?.success,
        responseCount: response?.count,
        responseTotal: response?.total,
        responseDataLength: response?.data?.length,
        filtersApplied: filters
      });
      
      container.innerHTML = `
        <div class="no-bookings" style="text-align: center; padding: 60px 20px; color: #bdbdbd;">
          <div style="font-size: 64px; margin-bottom: 16px;">📋</div>
          <h3 style="margin-bottom: 8px; color: #757575;">No bookings available</h3>
          <p style="margin-bottom: 8px;">Check back later for new booking opportunities</p>
          <p style="font-size: 12px; color: #757575; margin-bottom: 16px;">
            ${response?.total === 0 ? "No active bookings found in database" : "No bookings match the current filters"}
          </p>
          <button onclick="loadBookingsFromAPI()" style="padding: 12px 24px; background: #ff9900; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 16px;">
            🔄 Refresh
          </button>
        </div>
      `;
      updateResultsCount(0);
      return;
    }

    console.log("🎨 Rendering", bookings.length, "booking cards...");
    
    // Render booking cards
    try {
      const cardsHTML = bookings
        .map((booking) => {
          try {
            return createBookingCard(booking);
          } catch (cardError) {
            console.error("❌ Error creating card for booking:", booking._id, cardError);
            return ""; // Skip invalid bookings
          }
        })
        .filter(card => card !== "") // Remove empty cards
        .join("");
      
      if (cardsHTML) {
        container.innerHTML = cardsHTML;
        console.log("✅ Successfully rendered", bookings.length, "booking cards");
        console.log("✅ Container ID:", container.id);
        console.log("✅ Cards HTML length:", cardsHTML.length, "characters");
        
        // Verify cards are actually in DOM
        const renderedCards = container.querySelectorAll(".booking-card");
        console.log("✅ Rendered cards count in DOM:", renderedCards.length);
        
        if (renderedCards.length !== bookings.length) {
          console.warn("⚠️ Mismatch: Expected", bookings.length, "cards but found", renderedCards.length, "in DOM");
        }
      } else {
        throw new Error("No valid booking cards generated");
      }
    } catch (renderError) {
      console.error("❌ Error rendering booking cards:", renderError);
      container.innerHTML = `
        <div class="error-bookings" style="text-align: center; padding: 60px 20px; color: #f44336;">
          <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
          <h3 style="margin-bottom: 8px;">Error rendering bookings</h3>
          <p style="margin-bottom: 16px; color: #bdbdbd;">${renderError.message}</p>
          <button onclick="loadBookingsFromAPI()" style="padding: 12px 24px; background: #ff9900; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
            🔄 Retry
          </button>
        </div>
      `;
      return;
    }

    // Update results count
    if (typeof updateResultsCount === "function") {
      updateResultsCount(bookings.length);
    }

    // Final summary log
    console.log("=".repeat(80));
    console.log("✅ BOOKINGS DISPLAY SUMMARY:");
    console.log("=".repeat(80));
    console.log(`📊 Total Bookings Fetched: ${bookings.length}`);
    console.log(`📊 Total Bookings Rendered: ${container.querySelectorAll(".booking-card").length}`);
    console.log(`📊 Container: ${container.id}`);
    console.log(`📊 All bookings are now visible on dashboard with same style`);
    console.log("=".repeat(80));

    // Re-initialize filter handlers if needed
    if (typeof initFilterSection === "function") {
      initFilterSection();
    }
  } catch (error) {
    console.error("❌ Error loading bookings:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    let errorMessage = error.message || "Please try again later";
    if (error.message && error.message.includes("token")) {
      errorMessage = "Please login to view bookings";
    } else if (error.message && error.message.includes("Network")) {
      errorMessage = "Cannot connect to server. Please check your connection.";
    }
    
    container.innerHTML = `
      <div class="error-bookings" style="text-align: center; padding: 60px 20px; color: #f44336;">
        <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
        <h3 style="margin-bottom: 8px;">Failed to load bookings</h3>
        <p style="margin-bottom: 16px; color: #bdbdbd;">${errorMessage}</p>
        <button onclick="loadBookingsFromAPI()" style="padding: 12px 24px; background: #ff9900; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
          🔄 Retry
        </button>
      </div>
    `;
  }
}

// ===== DEBUG HELPER FUNCTION =====
// Call this from browser console: debugBookings()
window.debugBookings = function() {
  console.log("🔍 Debugging bookings loading...");
  console.log("1. Checking container:", document.getElementById("bookingCards"));
  console.log("2. Checking API service:", typeof apiService);
  console.log("3. Active tab:", activeTab);
  console.log("4. Calling loadBookingsFromAPI...");
  loadBookingsFromAPI();
};

// ===== LOAD VEHICLES FROM API =====
// loadVehiclesFromAPI function removed - free vehicles section removed

// ===== CREATE BOOKING CARD FROM API DATA =====
function createBookingCard(booking) {
  const postedBy = booking.postedBy || {};
  const userName = postedBy.name || "Unknown User";
  const userMobile = postedBy.mobile || "";
  const isVerified = postedBy.isVerified || false;

  // Format date and time
  const dateTime = new Date(booking.dateTime);
  const formattedDate = dateTime.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = dateTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Calculate time ago using helper function
  const timeAgo = formatTimeAgo(dateTime);

  // Trip type icon and text
  const tripTypeIcon = booking.tripType === "round-trip" ? "↔" : "→";
  const tripTypeText =
    booking.tripType === "round-trip" ? "Round Trip" : "One Way";

  // Vehicle type emoji
  const vehicleEmojis = {
    sedan: "🚙",
    suv: "🚗",
    hatchback: "🚗",
    luxury: "🚖",
    traveller: "🚐",
    bus: "🚌",
  };
  const vehicleEmoji =
    vehicleEmojis[booking.vehicleType?.toLowerCase()] || "🚗";
  const vehicleTypeText = booking.vehicleType
    ? booking.vehicleType.charAt(0).toUpperCase() + booking.vehicleType.slice(1)
    : "Vehicle";

  // Format amount
  const amount = booking.amount?.bookingAmount || booking.bookingAmount || 0;
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

  // Requirements/Notes
  const requirements = booking.requirements || [];
  const customRequirement = booking.customRequirement || "";
  const notes =
    customRequirement ||
    (requirements.length > 0
      ? requirements.join(", ")
      : "No special requirements");

  // Avatar URL
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName
  )}&background=ff9900&color=1a1a1a`;

  // Booking ID
  const bookingId =
    booking.bookingId || booking._id?.toString().slice(-6) || "N/A";

  // Check if card should be restricted
  const profileSkipped = sessionStorage.getItem("profileSkipped") === "true";
  const verificationSkipped =
    sessionStorage.getItem("verificationSkipped") === "true";
  const restrictedClass =
    profileSkipped || verificationSkipped ? " restricted-card" : "";

  return `
    <div class="booking-card${restrictedClass}" 
         data-vehicle="${booking.vehicleType || ""}" 
         data-city="${booking.pickup?.city?.toLowerCase() || ""}"
         data-booking-id="${booking._id || ""}">
      <div class="card-header">
        <div class="user-info">
          <div class="user-avatar" onclick="openUserProfile('${booking.postedBy?._id || booking.postedBy || ""}')" style="cursor: pointer;" title="View Profile">
            <img src="${avatarUrl}" alt="${userName}">
          </div>
          <div class="user-details">
            <div class="user-name-row">
              <h4 class="user-name">${userName}</h4>
              ${
                isVerified
                  ? '<span class="verified-badge">✓ Verified</span>'
                  : ""
              }
            </div>
            <div class="id-rating-row">
              <p class="booking-id">#${bookingId}</p>
              <div class="rating-section">
                <span class="gold-stars">⭐⭐⭐⭐⭐</span>
                <span class="review-count">(0 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card-body">
        <div class="pickup-row">
          <span class="pickup-label">Pickup:</span>
          <span class="pickup-value">${formattedDate} • ${formattedTime}</span>
          <span class="upload-time">${timeAgo}</span>
        </div>

        <div class="trip-summary-container">
          <span class="type-icon">${tripTypeIcon}</span>
          <span class="trip-type-text">${tripTypeText}</span>
          <div class="price-section">
            <span class="trip-price">${formattedAmount}</span>
          </div>
        </div>

        <div class="route-container">
          <div class="route-left">
            <div class="route-stop">
              <span class="pin-icon">📍</span>
              <span>${
                booking.pickup?.city || booking.pickupCity || "N/A"
              }</span>
            </div>
            ${
              booking.tripType === "round-trip"
                ? `
              <div class="route-arrows">
                <span class="arrow-down">↓</span>
                <span class="arrow-up">↑</span>
              </div>
            `
                : '<div class="route-arrow">↓</div>'
            }
            <div class="route-stop">
              <span class="pin-icon">📍</span>
              <span>${booking.drop?.city || booking.dropCity || "N/A"}</span>
            </div>
          </div>
          <div class="vehicle-badge">
            <span class="vehicle-icon">${vehicleEmoji}</span>
            <span>${vehicleTypeText} Required</span>
          </div>
        </div>

        <div class="notes-card">
          <span class="notes-label">Notes:</span>
          <span>${notes}</span>
        </div>
      </div>

      <div class="card-footer">
        <button class="action-btn whatsapp-btn" onclick="contactBookingWhatsApp('${
          booking._id
        }', '${userMobile}')">
          <span class="btn-icon">💬</span>
          <span>WhatsApp</span>
        </button>
        <button class="action-btn call-btn" onclick="contactCall('${userMobile}')">
          <span class="btn-icon">📞</span>
          <span>Call</span>
        </button>
      </div>
    </div>
  `;
}

// ===== CREATE VEHICLE CARD FROM API DATA =====
function createVehicleCard(vehicle) {
  const postedBy = vehicle.postedBy || {};
  const userName = postedBy.name || "Unknown User";
  const userMobile = postedBy.mobile || "";
  const isVerified =
    postedBy.isVerified || postedBy.verificationStatus === "verified" || false;

  // Format availability date and time
  const availabilityDate = vehicle.availability?.date
    ? new Date(vehicle.availability.date)
    : new Date();
  const availabilityTime = vehicle.availability?.time || "";
  const formattedDate = availabilityDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  let formattedTime = "";
  if (availabilityTime) {
    const [hours, minutes] = availabilityTime.split(":");
    const timeDate = new Date();
    timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    formattedTime = timeDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Calculate time ago for when vehicle was posted using helper function
  const createdAt = vehicle.createdAt
    ? new Date(vehicle.createdAt)
    : new Date();
  const timeAgo = formatTimeAgo(createdAt);

  // Availability status
  const availabilityStatus = vehicle.availability?.status || "available-later";
  const isAvailableNow = availabilityStatus === "available-now";
  const availabilityBadgeClass = isAvailableNow
    ? "active-now"
    : "available-later";
  const availabilityText = isAvailableNow ? "Available Now" : "Available Later";

  // Vehicle type emoji mapping
  const vehicleEmojis = {
    sedan: "🚙",
    suv: "🚗",
    hatchback: "🚐",
    traveller: "🚌",
    bus: "🚍",
    luxury: "✨",
  };
  const vehicleEmoji =
    vehicleEmojis[vehicle.vehicleType?.toLowerCase()] || "🚗";
  const vehicleTypeText = vehicle.vehicleType
    ? vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)
    : "Vehicle";

  // Trip type text
  const tripTypeText =
    vehicle.tripType === "round-trip" ? "Round Trip" : "One Way";

  // Location
  const locationCity = vehicle.location?.city || "N/A";
  const locationAddress = vehicle.location?.address || "";

  // Commission
  const commission = vehicle.commission || 0;
  const commissionText = commission > 0 ? `${commission}% commission` : "";

  // Requirements/Notes
  const requirements = vehicle.requirements || [];
  const customRequirement = vehicle.customRequirement || "";
  const notes =
    customRequirement ||
    (requirements.length > 0
      ? requirements.join(", ")
      : "No special requirements");

  // Status badge (for dashboard, vehicles are always available/active)
  const statusClass = "active-status";
  const statusText = availabilityText;

  // Vehicle ID (similar to booking ID) - display ID for frontend
  const vehicleDisplayId =
    vehicle.vehicleId || vehicle._id?.toString().slice(-6) || "N/A";

  // Trip type icon (matching booking card style)
  const tripTypeIcon = vehicle.tripType === "round-trip" ? "↔" : "→";

  // Check if card should be restricted
  const profileSkipped = sessionStorage.getItem("profileSkipped") === "true";
  const verificationSkipped =
    sessionStorage.getItem("verificationSkipped") === "true";
  const restrictedClass =
    profileSkipped || verificationSkipped ? " restricted-card" : "";

  return `
    <div class="vehicle-manage-card${restrictedClass}" data-vehicle-id="${
    vehicle._id
  }" data-vehicle-type="${vehicle.vehicleType || ""}">
      <!-- Header Row with Vehicle ID, Trip Type, and Status (similar to booking card) -->
      <div class="card-header-row">
        <span class="booking-id">#${vehicleDisplayId}</span>
        <span class="trip-badge">${tripTypeText}</span>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>

      <!-- Meta Row with Date/Time and Time Ago -->
      <div class="card-meta-row">
        <div class="meta-left">
          ${
            formattedDate && formattedTime
              ? `
          <span class="meta-icon">📅</span>
          <span class="meta-text">${formattedDate}, ${formattedTime}</span>
          `
              : ""
          }
        </div>
        <span class="upload-time">${timeAgo}</span>
      </div>

      <!-- Trip Summary Row (matching booking card) -->
      <div class="trip-summary-container">
        <span class="type-icon">${tripTypeIcon}</span>
        <span class="trip-type-text">${tripTypeText}</span>
        <div class="price-section">
          ${
            commissionText
              ? `<span class="trip-price">${commissionText}</span>`
              : '<span class="trip-price">Free</span>'
          }
        </div>
      </div>

      <!-- Route Block (matching booking card structure) -->
      <div class="route-container-bookings">
        <div class="route-left">
          <div class="route-stop">
            <span class="pin-icon">📍</span>
            <span>${locationCity}</span>
          </div>
        </div>
        <div class="vehicle-badge">
          <span class="vehicle-icon">${vehicleEmoji}</span>
          <span>${vehicleTypeText}</span>
        </div>
      </div>

      <!-- Notes Card -->
      <div class="notes-card">
        <span class="notes-label">Notes:</span>
        <span>${notes}</span>
      </div>

      <!-- Action Buttons Row (Dashboard - WhatsApp & Call) -->
      <div class="card-actions-row-1">
        <button class="action-btn whatsapp-btn" onclick="contactVehicleWhatsApp('${
          vehicle._id
        }', '${userMobile}')" aria-label="Contact via WhatsApp">
          <span class="btn-icon">💬</span> WhatsApp
        </button>
        <button class="action-btn call-btn" onclick="contactCall('${userMobile}')" aria-label="Call">
          <span class="btn-icon">📞</span> Call
        </button>
      </div>
    </div>
  `;
}

// ===== NAVIGATION HELPER =====
function navigateToTab(tabName) {
  // Store the target tab name in session storage
  sessionStorage.setItem("targetTab", tabName);
  // Navigate to dashboard
  window.location.href = "dashboard.html";
}

// ===== FLOATING ACTION BUTTON =====
function handleFABClick() {
  // Redirect to FAB popup functionality
  toggleFABPopup();
}

// ===== SUPPORT MODAL =====
function handleSupportClick() {
  document.getElementById("supportModal").classList.add("show");
}

function closeSupportModal() {
  document.getElementById("supportModal").classList.remove("show");
}

// ===== MESSAGE BUTTON =====
function handleMessageClick() {
  // Open chatbot/messaging interface
  toggleChatbot();
}

function contactSupport() {
  closeSupportModal();
  toggleChatbot(); // Open chatbot instead of alert
}

function callSupport() {
  // Support phone number
  const supportNumber = "+919103774717"; // Format: +91 followed by number
  const telUrl = `tel:${supportNumber}`;

  // Open phone dialer
  window.location.href = telUrl;
  closeSupportModal();
}

function emailSupport() {
  alert("✉️ Email Support\n\nsupport@tripeaztaxi.com");
  closeSupportModal();
}

function whatsappSupport() {
  // WhatsApp support number (format: country code + number without + or spaces)
  const supportNumber = "919103774717"; // +91-9103774717 without + and dashes
  const message = encodeURIComponent(
    "Hello! I need help with Tripeaz Taxi Partners."
  );
  const whatsappUrl = `https://wa.me/${supportNumber}?text=${message}`;

  // Open WhatsApp in new tab
  window.open(whatsappUrl, "_blank");
  closeSupportModal();
}

// ===== CLOSE WARNING BANNER =====
function closeWarningBanner() {
  const banner = document.getElementById("warningBanner");
  banner.classList.add("hidden");
  document.body.classList.remove("has-banner");
}

// ===== FEATURE CLICK HANDLER =====
function handleFeatureClick(featureId) {
  console.log(`Feature clicked: ${featureId}`);
  // Add analytics tracking
  // onFeatureOpen(featureId);

  // Show appropriate action based on feature
  alert(
    `Opening feature: ${featureId
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())}`
  );
}

// ===== CREATE BOOKING AVAILABLE CONTENT =====
function createBookingAvailableContent() {
  return `
    <!-- Main Container -->
    <div class="booking-available-container">
    <!-- Banner Slider -->
    <div class="banner-slider-container">
      <div class="banner-slider" id="bannerSlider">
        <div class="banner-slide active">
          <div class="banner-content-slide">
            <h3>🎉 Welcome to Tripeaz Taxi Partners</h3>
            <p>Earn more with verified bookings</p>
          </div>
        </div>
        <div class="banner-slide">
          <div class="banner-content-slide">
            <h3>⚡ Instant Payments</h3>
            <p>Get paid immediately after trips</p>
          </div>
        </div>
        <div class="banner-slide">
          <div class="banner-content-slide">
            <h3>🛡️ 100% Verified Users</h3>
            <p>Safe and secure partner network</p>
          </div>
        </div>
      </div>
      <div class="banner-dots" id="bannerDots"></div>
    </div>


    <!-- Filter Section -->
    <div class="filter-section-bar" id="filterSectionBar">
      <div class="filter-row-container">
        <!-- Vehicle Type Dropdown -->
        <div class="filter-dropdown-wrapper">
          <label class="filter-label" for="vehicleTypeFilter">Vehicle Type</label>
          <div class="custom-dropdown" id="vehicleTypeDropdown" tabindex="0" aria-label="Filter by Vehicle Type">
            <div class="dropdown-trigger" onclick="toggleVehicleDropdown(event)">
              <span class="dropdown-text" id="vehicleTypeText">All Vehicle</span>
              <span class="dropdown-arrow">▼</span>
            </div>
            <div class="dropdown-menu" id="vehicleTypeMenu">
              <div class="dropdown-search" onclick="event.stopPropagation()">
                <input type="text" class="search-input" placeholder="Search..." onkeyup="filterVehicleOptions(event)" onclick="event.stopPropagation()">
              </div>
              <div class="dropdown-options">
                <div class="dropdown-option" data-value="all" onclick="event.stopPropagation(); selectVehicleOption('all')">
                  <span class="checkbox-custom"></span>
                  <span class="option-icon">🚗</span>
                  <span class="option-text">All Vehicle</span>
                </div>
                <div class="dropdown-option" data-value="sedan" onclick="event.stopPropagation(); selectVehicleOption('sedan')">
                  <span class="checkbox-custom"></span>
                  <span class="option-icon">🚘</span>
                  <span class="option-text">Sedan</span>
                </div>
                <div class="dropdown-option" data-value="suv" onclick="event.stopPropagation(); selectVehicleOption('suv')">
                  <span class="checkbox-custom"></span>
                  <span class="option-icon">🚙</span>
                  <span class="option-text">SUV</span>
                </div>
                <div class="dropdown-option" data-value="hatchback" onclick="event.stopPropagation(); selectVehicleOption('hatchback')">
                  <span class="checkbox-custom"></span>
                  <span class="option-icon">🚗</span>
                  <span class="option-text">Hatchback</span>
                </div>
                <div class="dropdown-option" data-value="luxury" onclick="event.stopPropagation(); selectVehicleOption('luxury')">
                  <span class="checkbox-custom"></span>
                  <span class="option-icon">🚖</span>
                  <span class="option-text">Luxury</span>
                </div>
                <div class="dropdown-option" data-value="traveller" onclick="event.stopPropagation(); selectVehicleOption('traveller')">
                  <span class="checkbox-custom"></span>
                  <span class="option-icon">🚐</span>
                  <span class="option-text">Traveller</span>
                </div>
                <div class="dropdown-option" data-value="bus" onclick="event.stopPropagation(); selectVehicleOption('bus')">
                  <span class="checkbox-custom"></span>
                  <span class="option-icon">🚌</span>
                  <span class="option-text">Bus</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pickup City Dropdown -->
        <div class="filter-dropdown-wrapper">
          <label class="filter-label" for="pickupFilter">Pickup</label>
          <div class="custom-dropdown" id="pickupDropdown" tabindex="0" aria-label="Filter by Pickup City">
            <div class="dropdown-trigger" onclick="togglePickupDropdown(event)">
              <span class="dropdown-text" id="pickupFilterText">All Cities</span>
              <span class="dropdown-arrow">▼</span>
            </div>
            <div class="dropdown-menu" id="pickupFilterMenu">
              <div class="dropdown-search" onclick="event.stopPropagation()">
                <input type="text" class="search-input" id="pickupSearchInput" placeholder="Search cities..." onkeyup="filterCityOptions(event, 'pickup')" onclick="event.stopPropagation()">
              </div>
              <div class="dropdown-options" id="pickupOptions">
                <!-- Pickup cities will be populated dynamically -->
              </div>
            </div>
          </div>
        </div>

        <!-- Drop City Dropdown -->
        <div class="filter-dropdown-wrapper">
          <label class="filter-label" for="dropFilter">Drop</label>
          <div class="custom-dropdown" id="dropDropdown" tabindex="0" aria-label="Filter by Drop City">
            <div class="dropdown-trigger" onclick="toggleDropDropdown(event)">
              <span class="dropdown-text" id="dropFilterText">All Cities</span>
              <span class="dropdown-arrow">▼</span>
            </div>
            <div class="dropdown-menu" id="dropFilterMenu">
              <div class="dropdown-search" onclick="event.stopPropagation()">
                <input type="text" class="search-input" id="dropSearchInput" placeholder="Search cities..." onkeyup="filterCityOptions(event, 'drop')" onclick="event.stopPropagation()">
              </div>
              <div class="dropdown-options" id="dropOptions">
                <!-- Drop cities will be populated dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Chips Container -->
      <div class="filter-chips-container" id="filterChipsContainer">
        <!-- Chips will be dynamically added here -->
      </div>
    </div>

    <!-- Chat Bot Floater -->
    <div class="chatbot-floater" onclick="toggleChatbot()">
      <span class="chatbot-icon">💬</span>
    </div>

    <!-- Chat Bot Window -->
    <div class="chatbot-window" id="chatbotWindow">
      <div class="chatbot-header">
        <h3>Customer Support</h3>
        <button class="close-chatbot-btn" onclick="toggleChatbot()" aria-label="Close chat">✕</button>
      </div>
      <div class="chatbot-messages" id="chatbotMessages">
        <div class="chat-message bot-message">
          <p>Hello! 👋 Welcome to Tripeaz Taxi Partners. How can I help you today?</p>
        </div>
      </div>
      <div class="chatbot-input-container">
        <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Type your message..." onkeypress="handleChatInput(event)">
        <button class="chatbot-send-btn" onclick="sendChatMessage()">
          <span class="send-icon">📤</span>
        </button>
      </div>
    </div>

    <!-- Booking View -->
    <div class="bookings-view" id="bookingsView">

      <!-- Expandable Filter Sheet (Hidden by default) -->
      <div class="filter-sheet-overlay" id="filterSheetOverlay" onclick="closeFilterSheet()">
        <div class="filter-sheet" id="filterSheet" onclick="event.stopPropagation()">
          <div class="filter-sheet-header">
            <h3>Filter & Sort</h3>
            <button class="close-sheet-btn" onclick="closeFilterSheet()" aria-label="Close filters">✕</button>
          </div>

          <div class="filter-sheet-content">
            <!-- Trip Type -->
            <div class="filter-section">
              <h4>Trip Type</h4>
              <div class="filter-chips-row">
                <button class="filter-chip" data-category="trip" data-value="all" onclick="toggleChip(this)">🔄 All</button>
                <button class="filter-chip" data-category="trip" data-value="oneway" onclick="toggleChip(this)">→ One Way</button>
                <button class="filter-chip" data-category="trip" data-value="round" onclick="toggleChip(this)">↔ Round Trip</button>
              </div>
            </div>

            <!-- Vehicle Type -->
            <div class="filter-section">
              <h4>Vehicle Type</h4>
              <div class="filter-chips-row">
                <button class="filter-chip" data-category="vehicle" data-value="all" onclick="toggleChip(this)">🚗 All</button>
                <button class="filter-chip" data-category="vehicle" data-value="sedan" onclick="toggleChip(this)">🚗 Sedan</button>
                <button class="filter-chip" data-category="vehicle" data-value="suv" onclick="toggleChip(this)">🚙 SUV</button>
                <button class="filter-chip" data-category="vehicle" data-value="hatchback" onclick="toggleChip(this)">🚘 Hatchback</button>
                <button class="filter-chip" data-category="vehicle" data-value="luxury" onclick="toggleChip(this)">⭐ Luxury</button>
              </div>
            </div>

            <!-- Verification -->
            <div class="filter-section">
              <h4>Verification</h4>
              <div class="filter-chips-row">
                <button class="filter-chip" data-category="verified" data-value="all" onclick="toggleChip(this)">✓ All Users</button>
                <button class="filter-chip" data-category="verified" data-value="verified" onclick="toggleChip(this)">✅ Verified Only</button>
              </div>
            </div>

          </div>

          <div class="filter-sheet-footer">
            <button class="clear-all-btn" onclick="clearAllFilters()">Clear All</button>
            <button class="apply-btn" onclick="applyFilters()">Apply</button>
          </div>
        </div>
      </div>

      <!-- Booking Cards (Will be populated from API) -->
      <div class="booking-cards-container" id="bookingCards">
        <div class="loading-bookings" style="text-align: center; padding: 40px; color: #bdbdbd;">
          <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
          <p>Loading bookings...</p>
              </div>
      </div>
    </div>
  `;
}

// ===== BANNER SLIDER LOGIC =====
let currentBannerIndex = 0;
let bannerInterval;

function initBannerSlider() {
  const slides = document.querySelectorAll(".banner-slide");
  const dotsContainer = document.getElementById("bannerDots");

  if (!slides.length || !dotsContainer) return;

  // Create dots
  slides.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.className = "banner-dot" + (index === 0 ? " active" : "");
    dot.onclick = () => goToBanner(index);
    dotsContainer.appendChild(dot);
  });

  // Auto-slide
  bannerInterval = setInterval(() => {
    currentBannerIndex = (currentBannerIndex + 1) % slides.length;
    updateBannerSlide();
  }, 4000);
}

function goToBanner(index) {
  currentBannerIndex = index;
  updateBannerSlide();
  clearInterval(bannerInterval);
  bannerInterval = setInterval(() => {
    currentBannerIndex = (currentBannerIndex + 1) % 3;
    updateBannerSlide();
  }, 4000);
}

function updateBannerSlide() {
  const slides = document.querySelectorAll(".banner-slide");
  const dots = document.querySelectorAll(".banner-dot");

  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === currentBannerIndex);
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentBannerIndex);
  });
}

// ===== SWITCH VIEW =====
function switchView(view) {
  // Only bookings view is supported now
  if (view === "bookings") {
    const bookingsView = document.getElementById("bookingsView");
    if (bookingsView) {
      bookingsView.style.opacity = "0";
      setTimeout(() => {
        bookingsView.style.opacity = "1";
        // Load bookings when bookings view becomes visible
        const bookingCards = document.getElementById("bookingCards");
        if (bookingCards) {
          // Check if API service is available, then load bookings
          if (typeof apiService !== "undefined") {
            loadBookingsFromAPI();
          } else {
            // Load API service first, then load bookings
            const script = document.createElement("script");
            script.src = "js/services/api.js";
            script.onload = () => {
              loadBookingsFromAPI();
            };
            document.head.appendChild(script);
          }
        }
      }, 10);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}

function updateBannerSlide() {
  const slides = document.querySelectorAll(".banner-slide");
  const dots = document.querySelectorAll(".banner-dot");

  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === currentBannerIndex);
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentBannerIndex);
  });
}

// ===== SWITCH VIEW =====
function switchView(view) {
  // Only bookings view is supported now
  if (view === "bookings") {
    const bookingsView = document.getElementById("bookingsView");
    if (bookingsView) {
      bookingsView.style.opacity = "0";
      setTimeout(() => {
        bookingsView.style.opacity = "1";
        // Load bookings when bookings view becomes visible
        const bookingCards = document.getElementById("bookingCards");
        if (bookingCards) {
          // Check if API service is available, then load bookings
          if (typeof apiService !== "undefined") {
            loadBookingsFromAPI();
          } else {
            // Load API service first, then load bookings
            const script = document.createElement("script");
            script.src = "js/services/api.js";
            script.onload = () => {
              loadBookingsFromAPI();
            };
            document.head.appendChild(script);
          }
        }
      }, 10);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}

// ===== CITY DATA =====
const gujaratCities = [
  "All Cities",
  "Ahmedabad",
  "Gandhinagar",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Bhavnagar",
  "Jamnagar",
  "Junagadh",
  "Anand",
  "Nadiad",
  "Mehsana",
  "Himmatnagar",
  "Kalol",
  "Gondal",
  "Porbandar",
  "Morbi",
  "Botad",
  "Amreli",
  "Veraval",
  "Somnath",
  "Bhuj",
  "Gandhidham",
  "Mundra",
  "Palanpur",
  "Patan",
  "Godhra",
  "Dahod",
  "Bharuch",
  "Navsari",
  "Valsad",
  "Vapi",
  "Surendranagar",
  "Dwarka",
  "Kheda",
  "Modasa",
  "Kapadvanj",
  "Wankaner",
];

// ===== POPULATE CITY DROPDOWN =====
function populateCityDropdown() {
  const cityFilter = document.getElementById("cityFilter");
  const cityFilterLarge = document.getElementById("cityFilterLarge");
  const bookingCityFilter = document.getElementById("bookingCityFilter");

  if (cityFilter) {
    cityFilter.innerHTML = "";
    gujaratCities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city === "All Cities" ? "all" : city.toLowerCase();
      option.textContent = city;
      cityFilter.appendChild(option);
    });
  }

  if (cityFilterLarge) {
    cityFilterLarge.innerHTML = "";
    gujaratCities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city === "All Cities" ? "all" : city.toLowerCase();
      option.textContent = city;
      cityFilterLarge.appendChild(option);
    });
  }

  if (bookingCityFilter) {
    bookingCityFilter.innerHTML = "";
    gujaratCities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city === "All Cities" ? "all" : city.toLowerCase();
      option.textContent = city;
      bookingCityFilter.appendChild(option);
    });
  }
}

// ===== FILTER BY CITY =====
function filterByCity(city) {
  const cards = document.querySelectorAll(".booking-card");

  cards.forEach((card) => {
    const locationText = card.textContent.toLowerCase();

    if (city === "all") {
      card.style.display = "block";
    } else {
      if (locationText.includes(city)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    }
  });
}

// ===== FILTER VEHICLES =====
function filterVehicle(type) {
  const cards = document.querySelectorAll(".booking-card");

  cards.forEach((card) => {
    if (type === "all" || card.dataset.vehicle === type) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// ===== OLA/UBER-STYLE FILTER SYSTEM =====
let activeFilters = {
  quick: [],
  vehicle: ["all"],
  trip: ["all"],
  verified: ["all"],
  capacity: [],
  extras: [],
  sort: "recommended",
};

// Toggle filter sheet
function toggleFilterSheet() {
  const overlay = document.getElementById("filterSheetOverlay");
  overlay.classList.toggle("show");
}

function closeFilterSheet() {
  const overlay = document.getElementById("filterSheetOverlay");
  overlay.classList.remove("show");
}

// Toggle chip selection
function toggleChip(chip) {
  const category = chip.dataset.category;
  const value = chip.dataset.value;
  const isSingleSelect = chip.classList.contains("single-select");

  if (isSingleSelect) {
    // Deselect all chips in this category
    document
      .querySelectorAll(`[data-category="${category}"].filter-chip`)
      .forEach((c) => {
        c.classList.remove("active");
      });
    // Select this chip
    chip.classList.add("active");
    activeFilters[category] = [value];
  } else {
    // Multi-select
    chip.classList.toggle("active");
    if (chip.classList.contains("active")) {
      if (!activeFilters[category].includes(value)) {
        activeFilters[category].push(value);
      }
    } else {
      activeFilters[category] = activeFilters[category].filter(
        (v) => v !== value
      );
    }
  }

  updateActiveFilterCount();
}

// Apply filters
function applyFilters() {
  const cards = document.querySelectorAll(".booking-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    let show = true;

    // Vehicle filter
    if (
      activeFilters.vehicle.length > 0 &&
      !activeFilters.vehicle.includes("all")
    ) {
      const cardVehicle = card.dataset.vehicle?.toLowerCase();
      if (!activeFilters.vehicle.includes(cardVehicle)) {
        show = false;
      }
    }

    // Trip type filter
    if (activeFilters.trip.length > 0 && !activeFilters.trip.includes("all")) {
      const hasRoundTrip = card.innerHTML.includes("↔");
      const cardTrip = hasRoundTrip ? "round" : "oneway";
      if (!activeFilters.trip.includes(cardTrip)) {
        show = false;
      }
    }

    // Verified filter
    if (
      activeFilters.verified.length > 0 &&
      !activeFilters.verified.includes("all")
    ) {
      const hasVerified = card.querySelector(".verified-badge");
      if (!hasVerified) {
        show = false;
      }
    }

    card.style.display = show ? "block" : "none";
    if (show) visibleCount++;
  });

  updateResultsCount(visibleCount);
  sessionStorage.setItem("activeFilters", JSON.stringify(activeFilters));
  closeFilterSheet();
}

// Clear all filters
function clearAllFilters() {
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.remove("active");
  });

  document.getElementById("sortSelect").value = "recommended";

  activeFilters = {
    quick: [],
    vehicle: ["all"],
    trip: ["all"],
    verified: ["all"],
    capacity: [],
    extras: [],
    sort: "recommended",
  };

  applyFilters();
  sessionStorage.removeItem("activeFilters");
}

// Update active filter count badge
function updateActiveFilterCount() {
  const count =
    (activeFilters.vehicle.length > 0 && !activeFilters.vehicle.includes("all")
      ? activeFilters.vehicle.length
      : 0) +
    (activeFilters.trip.length > 0 && !activeFilters.trip.includes("all")
      ? activeFilters.trip.length
      : 0) +
    (activeFilters.verified.length > 0 &&
    !activeFilters.verified.includes("all")
      ? 1
      : 0) +
    (activeFilters.capacity.length > 0 ? activeFilters.capacity.length : 0) +
    (activeFilters.extras.length > 0 ? activeFilters.extras.length : 0) +
    (activeFilters.sort !== "recommended" ? 1 : 0);

  const badgeElement = document.getElementById("activeFilterCount");
  if (badgeElement) {
    badgeElement.textContent = count;
  }
}

// Update results count
function updateResultsCount(count) {
  const resultsCount = document.getElementById("resultsCount");
  if (resultsCount) {
    resultsCount.textContent = `${count} booking${
      count !== 1 ? "s" : ""
    } found`;
    resultsCount.setAttribute("aria-live", "polite");
  }
}

// Apply sort
function applySort() {
  const sortValue = document.getElementById("sortSelect").value;
  activeFilters.sort = sortValue;

  // Implement sorting logic here if needed
  applyFilters();
}

// ===== CONTACT FUNCTIONS =====
// WhatsApp interest message for bookings
function contactBookingWhatsApp(bookingId, userMobile) {
  // Check if restrictions should be applied
  if (shouldRestrictActions()) {
    handleRestrictedAction();
    return;
  }

  // Ensure bookingId is a string for Map lookup
  const bookingIdKey = String(bookingId);

  // Retrieve booking data from Map
  const booking = dashboardBookingsMap.get(bookingIdKey);

  if (!booking) {
    console.error(
      "❌ [contactBookingWhatsApp] Booking not found:",
      bookingIdKey
    );
    console.log(
      "🔍 Available booking IDs in Map:",
      Array.from(dashboardBookingsMap.keys())
    );
    alert("⚠️ Booking data not found. Please refresh the page.");
    return;
  }

  if (!userMobile) {
    alert("⚠️ Contact number not available for this booking.");
    return;
  }

  // Extract booking details
  const bookingDisplayId =
    booking.bookingId || booking._id?.toString().slice(-6) || "N/A";
  const pickupCity = booking.pickup?.city || booking.pickupCity || "N/A";
  const dropCity = booking.drop?.city || booking.dropCity || "N/A";

  // Format date and time
  const dateTime = new Date(booking.dateTime);
  const formattedDate = dateTime.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = dateTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Vehicle type
  const vehicleTypeText = booking.vehicleType
    ? booking.vehicleType.charAt(0).toUpperCase() + booking.vehicleType.slice(1)
    : "N/A";

  // Format interest message
  const message = `Hello! I'm interested in your booking that you have posted on Tripeaz Taxi Partners.

*Booking ID:* #${bookingDisplayId}
*Pickup:* ${pickupCity}
*Drop:* ${dropCity}
*Date & Time:* ${formattedDate} at ${formattedTime}
*Vehicle Type:* ${vehicleTypeText}

Please let me know if this booking is still available.`;

  // Clean mobile number (remove +, spaces, dashes)
  const cleanNumber = userMobile.replace(/[\s\+\-]/g, "");

  // Encode message using URLSearchParams
  const params = new URLSearchParams();
  params.set("text", message);
  const whatsappUrl = `https://wa.me/${cleanNumber}?${params.toString()}`;

  // Open WhatsApp
  window.open(whatsappUrl, "_blank");
}

// WhatsApp interest message for vehicles
function contactVehicleWhatsApp(vehicleId, userMobile) {
  // Check if restrictions should be applied
  if (shouldRestrictActions()) {
    handleRestrictedAction();
    return;
  }

  // Ensure vehicleId is a string for Map lookup
  const vehicleIdKey = String(vehicleId);

  // Retrieve vehicle data from Map
  const vehicle = dashboardVehiclesMap.get(vehicleIdKey);

  if (!vehicle) {
    console.error(
      "❌ [contactVehicleWhatsApp] Vehicle not found:",
      vehicleIdKey
    );
    console.log(
      "🔍 Available vehicle IDs in Map:",
      Array.from(dashboardVehiclesMap.keys())
    );
    alert("⚠️ Vehicle data not found. Please refresh the page.");
    return;
  }

  if (!userMobile) {
    alert("⚠️ Contact number not available for this vehicle.");
    return;
  }

  // Extract vehicle details
  const vehicleDisplayId =
    vehicle.vehicleId || vehicle._id?.toString().slice(-6) || "N/A";
  const locationCity = vehicle.location?.city || "N/A";

  // Vehicle type
  const vehicleTypeText = vehicle.vehicleType
    ? vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)
    : "N/A";

  // Format availability date/time if available
  let availabilityText = "";
  if (vehicle.availability?.date) {
    const availabilityDate = new Date(vehicle.availability.date);
    const formattedDate = availabilityDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const availabilityTime = vehicle.availability?.time || "";
    if (availabilityTime) {
      const [hours, minutes] = availabilityTime.split(":");
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const formattedTime = timeDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      availabilityText = `\n*Available:* ${formattedDate} at ${formattedTime}`;
    } else {
      availabilityText = `\n*Available:* ${formattedDate}`;
    }
  }

  // Format interest message
  const message = `Hello! I'm interested in your free vehicle that you have posted on Tripeaz Taxi Partners.

*Vehicle ID:* #${vehicleDisplayId}
*Location:* ${locationCity}
*Vehicle Type:* ${vehicleTypeText}${availabilityText}

Please let me know if this vehicle is still available.`;

  // Clean mobile number (remove +, spaces, dashes)
  const cleanNumber = userMobile.replace(/[\s\+\-]/g, "");

  // Encode message using URLSearchParams
  const params = new URLSearchParams();
  params.set("text", message);
  const whatsappUrl = `https://wa.me/${cleanNumber}?${params.toString()}`;

  // Open WhatsApp
  window.open(whatsappUrl, "_blank");
}

// Keep existing function as fallback for simple contact
function contactWhatsApp(number) {
  const cleanNumber = number.replace(/[\s\+\-]/g, "");
  window.open(`https://wa.me/${cleanNumber}`, "_blank");
}

function contactCall(number) {
  // Check if restrictions should be applied
  if (shouldRestrictActions()) {
    handleRestrictedAction();
    return;
  }

  window.location.href = `tel:${number}`;
}

// ===== CHECK IF ACTIONS SHOULD BE RESTRICTED =====
function shouldRestrictActions() {
  const profileSkipped = sessionStorage.getItem("profileSkipped") === "true";
  const verificationSkipped =
    sessionStorage.getItem("verificationSkipped") === "true";

  // Get user data to check actual status
  const storedUser = localStorage.getItem("user");
  let userData = null;
  if (storedUser) {
    userData = JSON.parse(storedUser);
  }

  const isProfileComplete = userData?.profile?.isProfileComplete || false;
  const aadhaarVerified =
    userData?.verificationStatus?.aadhaar?.verified || false;
  const dlVerified =
    userData?.verificationStatus?.drivingLicense?.verified || false;
  const bothVerified = aadhaarVerified && dlVerified;

  const profilePending = !isProfileComplete && profileSkipped;
  const docsPending = !bothVerified && verificationSkipped;

  return profilePending || docsPending;
}

// ===== SCROLL TO TOP FUNCTIONALITY =====
let scrollButton;
let lastScrollTop = 0;

function initScrollToTop() {
  // Create the scroll button
  scrollButton = document.createElement("button");
  scrollButton.className = "scroll-to-top-btn";
  scrollButton.setAttribute("aria-label", "Scroll to Top");
  scrollButton.innerHTML = '<span class="scroll-to-top-btn-icon">⬆️</span>';

  // Add click handler
  scrollButton.addEventListener("click", scrollToTop);

  // Add keyboard support
  scrollButton.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      scrollToTop();
    }
  });

  document.body.appendChild(scrollButton);

  // Throttled scroll listener
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
}

function handleScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollThreshold = 400;

  if (scrollTop > scrollThreshold) {
    // Scrolling down past threshold - show button
    scrollButton.classList.add("visible");
  } else if (scrollTop <= 100) {
    // Near the top - hide button
    scrollButton.classList.remove("visible");
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

function scrollToTop() {
  // Disable the button during scroll
  scrollButton.disabled = true;
  scrollButton.classList.remove("visible");

  // Smooth scroll to top
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  // Re-enable after scroll completes
  setTimeout(() => {
    scrollButton.disabled = false;
  }, 1000);
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrollToTop);
} else {
  initScrollToTop();
}

// ===== FAB POPUP FUNCTIONALITY =====
let fabPopupOpen = false;

function toggleFABPopup() {
  const fabButton = document.getElementById("fabButton");
  const overlay = document.getElementById("fabPopupOverlay");

  fabPopupOpen = !fabPopupOpen;

  if (fabPopupOpen) {
    fabButton.classList.add("rotated");
    fabButton.setAttribute("aria-expanded", "true");
    overlay.classList.add("show");
    // Prevent background scroll
    document.body.style.overflow = "hidden";
  } else {
    fabButton.classList.remove("rotated");
    fabButton.setAttribute("aria-expanded", "false");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  }
}

function closeFABPopup() {
  if (fabPopupOpen) {
    toggleFABPopup();
  }
}

function handleUploadBooking() {
  // Check if restrictions should be applied
  if (shouldRestrictActions()) {
    closeFABPopup();
    handleRestrictedAction();
    return;
  }

  closeFABPopup();
  console.log("Opening Upload New Booking form...");

  // Check if we're already on the post-booking page
  if (window.location.pathname.includes("post-booking.html")) {
    // Already on booking form, do nothing or scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    // Navigate to post booking page
    window.location.href = "post-booking.html";
  }
}

function handleUploadVehicle() {
  // Check if restrictions should be applied
  if (shouldRestrictActions()) {
    closeFABPopup();
    handleRestrictedAction();
    return;
  }

  closeFABPopup();
  console.log("Opening Upload Free Vehicle form...");
  // Navigate to post vehicle page
  window.location.href = "post-vehicle.html";
}

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && fabPopupOpen) {
    closeFABPopup();
  }
});

// ===== CHATBOT FUNCTIONALITY =====
function toggleChatbot() {
  const chatbotWindow = document.getElementById("chatbotWindow");
  const chatbotOverlay = document.getElementById("chatbotOverlay");
  const chatbotFloater = document.querySelector(".chatbot-floater");
  const isActive = chatbotWindow.classList.contains("active");

  if (isActive) {
    // Closing chatbot
    chatbotWindow.classList.remove("active");
    chatbotOverlay.classList.remove("active");
    document.body.style.overflow = ""; // Restore scroll
    cleanupChatbotResizeListeners(); // Clean up resize listeners

    if (chatbotFloater) {
      chatbotFloater.style.opacity = "1";
      chatbotFloater.style.pointerEvents = "auto";
    }
  } else {
    // Opening chatbot
    chatbotWindow.classList.add("active");
    chatbotOverlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scroll

    if (chatbotFloater) {
      chatbotFloater.style.opacity = "0";
      chatbotFloater.style.pointerEvents = "none";
    }

    // Load chat history if available
    loadChatHistory();

    // Focus input after animation and ensure scroll
    setTimeout(() => {
      const input = document.getElementById("chatbotInput");
      if (input) {
        input.focus();
        // Scroll to bottom after focusing (handles keyboard opening)
        setTimeout(() => {
          scrollToBottom(false);
        }, 300);
      } else {
        scrollToBottom(false);
      }
    }, 300);

    // Listen for viewport resize (keyboard open/close)
    handleChatbotViewportResize();
  }
}

// Handle viewport resize for mobile keyboard
function handleChatbotViewportResize() {
  let resizeTimer;
  const chatbotWindow = document.getElementById("chatbotWindow");
  const messagesContainer = document.getElementById("chatbotMessages");

  if (!chatbotWindow || !chatbotWindow.classList.contains("active")) {
    return;
  }

  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Adjust height if needed (for mobile keyboard)
      if (window.innerWidth <= 600) {
        const vh = window.innerHeight;
        const chatHeight = vh * 0.9;
        chatbotWindow.style.height = `${chatHeight}px`;
        chatbotWindow.style.maxHeight = `${chatHeight}px`;
      }

      // Ensure scroll to bottom after resize
      if (messagesContainer) {
        setTimeout(() => {
          scrollToBottom(false);
        }, 100);
      }
    }, 150);
  };

  // Use visualViewport API if available (better for mobile keyboard)
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleResize);
    // Clean up listener when chatbot closes
    chatbotWindow._resizeHandler = handleResize;
  } else {
    window.addEventListener("resize", handleResize);
    chatbotWindow._resizeHandler = handleResize;
  }
}

// Clean up resize listeners when chatbot closes
function cleanupChatbotResizeListeners() {
  const chatbotWindow = document.getElementById("chatbotWindow");
  if (chatbotWindow && chatbotWindow._resizeHandler) {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener(
        "resize",
        chatbotWindow._resizeHandler
      );
    } else {
      window.removeEventListener("resize", chatbotWindow._resizeHandler);
    }
    chatbotWindow._resizeHandler = null;
  }
}

// Position chatbot below filter bar on mobile
function positionChatbotBelowFilterBar(chatbotWindow) {
  if (window.innerWidth > 600) {
    // Reset styles for desktop - use default positioning
    chatbotWindow.style.top = "";
    chatbotWindow.style.bottom = "";
    chatbotWindow.style.maxHeight = "";
    chatbotWindow.style.transform = "";
    return;
  }

  const filterBar = document.querySelector(".filter-section-bar");
  const header = document.querySelector(".main-header");

  if (filterBar && header) {
    const filterBarRect = filterBar.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();

    // Calculate the bottom position of filter bar from viewport top
    const filterBarBottom = filterBarRect.bottom;

    // Calculate maximum height available below filter bar
    const maxAvailableHeight = window.innerHeight - filterBarBottom;

    // Position chatbot at bottom of screen but limit its height
    // This ensures it doesn't extend into filter bar area
    chatbotWindow.style.top = "";
    chatbotWindow.style.bottom = "0";
    chatbotWindow.style.maxHeight = `${maxAvailableHeight}px`;
    chatbotWindow.style.height = "auto";
    chatbotWindow.style.transform = "";
  } else {
    // Fallback: use calculated height
    chatbotWindow.style.top = "";
    chatbotWindow.style.bottom = "0";
    chatbotWindow.style.maxHeight = "calc(100vh - 140px)";
    chatbotWindow.style.transform = "";
  }
}

function handleChatInput(event) {
  if (event.key === "Enter") {
    sendChatMessage();
  }
}

function getCurrentTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function scrollToBottom(smooth = true) {
  const messagesContainer = document.getElementById("chatbotMessages");
  if (!messagesContainer) return;

  // Use requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    const scrollHeight = messagesContainer.scrollHeight;
    const scrollTop = messagesContainer.scrollTop;
    const clientHeight = messagesContainer.clientHeight;
    const maxScrollTop = scrollHeight - clientHeight;

    // Only scroll if we're near the bottom (within 100px) or forced
    const isNearBottom = Math.abs(maxScrollTop - scrollTop) < 100;

    if (isNearBottom || !smooth) {
      messagesContainer.scrollTop = scrollHeight;

      // Double-check after a short delay to handle dynamic content
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 50);
    }
  });
}

function showTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.classList.add("active");
    // Scroll to show typing indicator
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
  }
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.classList.remove("active");
  }
}

function sendChatMessage(messageText = null) {
  const input = document.getElementById("chatbotInput");
  const message = messageText || input?.value.trim();

  if (!message) return;

  const messagesContainer = document.getElementById("chatbotMessages");
  const welcome = document.getElementById("chatbotWelcome");

  // Hide welcome message
  if (welcome && welcome.style.display !== "none") {
    welcome.style.display = "none";
  }

  // Clear input if not a quick reply
  if (!messageText && input) {
    input.value = "";
  }

  // Add user message with timestamp
  const userMessage = document.createElement("div");
  userMessage.className = "chat-message user-message";
  const timestamp = getCurrentTimestamp();
  userMessage.innerHTML = `<p>${message}</p><div class="message-timestamp">${timestamp}</div>`;
  messagesContainer.appendChild(userMessage);

  // Save to history
  saveMessageToHistory("user", message, timestamp);

  // Scroll to bottom immediately after adding message
  setTimeout(() => {
    scrollToBottom(true);
  }, 10);

  // Show typing indicator
  showTypingIndicator();

  // Generate bot response after delay (simulate typing)
  setTimeout(() => {
    hideTypingIndicator();

    const botResponse = generateBotResponse(message);
    const botMessage = document.createElement("div");
    botMessage.className = "chat-message bot-message";
    const botTimestamp = getCurrentTimestamp();
    botMessage.innerHTML = `<p>${botResponse}</p><div class="message-timestamp">${botTimestamp}</div>`;
    messagesContainer.appendChild(botMessage);

    // Save to history
    saveMessageToHistory("bot", botResponse, botTimestamp);

    // Scroll to bottom after bot message with multiple attempts
    setTimeout(() => {
      scrollToBottom(true);
      // Ensure scroll after layout recalculation
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    }, 50);
  }, 800 + Math.random() * 500); // Random delay between 800-1300ms
}

function sendQuickReply(text) {
  sendChatMessage(text);
}

// ===== CHAT HISTORY PERSISTENCE =====
function saveMessageToHistory(type, message, timestamp) {
  try {
    const history = getChatHistory();
    history.push({
      type: type, // 'user' or 'bot'
      message: message,
      timestamp: timestamp,
      date: new Date().toISOString(),
    });
    localStorage.setItem("tripeaztaxi_chat_history", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }
}

function getChatHistory() {
  try {
    const history = localStorage.getItem("tripeaztaxi_chat_history");
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return [];
  }
}

function loadChatHistory() {
  const messagesContainer = document.getElementById("chatbotMessages");
  const welcome = document.getElementById("chatbotWelcome");
  const history = getChatHistory();

  if (!messagesContainer) return;

  // Don't reload if messages already exist
  if (messagesContainer.querySelector(".chat-message")) {
    // Just ensure we're scrolled to bottom
    setTimeout(() => {
      scrollToBottom(false);
    }, 100);
    return;
  }

  if (history.length > 0) {
    // Hide welcome message
    if (welcome) {
      welcome.style.display = "none";
    }

    // Restore messages
    history.forEach((item) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = `chat-message ${item.type}-message`;
      messageDiv.innerHTML = `<p>${item.message}</p><div class="message-timestamp">${item.timestamp}</div>`;
      messagesContainer.appendChild(messageDiv);
    });

    // Scroll to bottom after all messages are loaded
    setTimeout(() => {
      scrollToBottom(false);
      // Double-check scroll position
      setTimeout(() => {
        scrollToBottom(false);
      }, 200);
    }, 150);
  } else {
    // Show welcome message if no history
    if (welcome) {
      welcome.style.display = "flex";
    }
  }
}

function clearChatHistory() {
  try {
    localStorage.removeItem("tripeaztaxi_chat_history");
    const messagesContainer = document.getElementById("chatbotMessages");
    const welcome = document.getElementById("chatbotWelcome");

    if (messagesContainer) {
      // Remove all messages except welcome
      const messages = messagesContainer.querySelectorAll(".chat-message");
      messages.forEach((msg) => msg.remove());

      // Show welcome message
      if (welcome) {
        welcome.style.display = "flex";
      }
    }
  } catch (error) {
    console.error("Failed to clear chat history:", error);
  }
}

function generateBotResponse(userMessage) {
  const message = userMessage.toLowerCase();

  // Booking related queries
  if (
    message.includes("booking") ||
    message.includes("trip") ||
    message.includes("ride")
  ) {
    return "I can help you with booking information! We have multiple bookings available including One Way and Round Trips. You can filter by vehicle type (Sedan, SUV, Hatchback, Luxury) or trip type. What would you like to know? 📋";
  }

  // Vehicle related queries
  if (
    message.includes("vehicle") ||
    message.includes("car") ||
    message.includes("driver")
  ) {
    return "We have various vehicles available for free! Including SUVs like Toyota Innova and Fortuner, Sedans like Honda City and Hyundai Verna, and premium options like Mercedes-Benz E-Class. Would you like details about any specific vehicle? 🚗";
  }

  // Location related queries
  if (
    message.includes("city") ||
    message.includes("location") ||
    message.includes("where")
  ) {
    return "Our services cover major cities in Gujarat including Ahmedabad, Vadodara, Surat, Rajkot, Jamnagar, and more! All bookings show pickup and drop locations. Where would you like to travel? 🗺️";
  }

  // Pricing queries
  if (
    message.includes("price") ||
    message.includes("cost") ||
    message.includes("fare") ||
    message.includes("₹")
  ) {
    return "Prices vary based on vehicle type and distance. SUVs typically range from ₹2,500-₹4,500, Sedans from ₹950-₹3,100, and Luxury vehicles from ₹5,500-₹6,800. Each booking card shows the exact price! 💰";
  }

  // Payment queries
  if (
    message.includes("pay") ||
    message.includes("payment") ||
    message.includes("how to pay")
  ) {
    return "You can contact the driver directly via WhatsApp or Call button on each booking card for payment details and arrangements! 💳";
  }

  // Support related
  if (
    message.includes("help") ||
    message.includes("support") ||
    message.includes("issue")
  ) {
    return "I'm here to help! You can contact drivers directly through the booking cards, or use WhatsApp (💬) and Call (📞) buttons. For verification issues, look for the ✓ Verified badge! ✨";
  }

  // Greeting responses
  if (
    message.includes("hi") ||
    message.includes("hello") ||
    message.includes("hey")
  ) {
    return "Hello! 👋 Welcome to Tripeaz Taxi Partners. I can help you with bookings, vehicles, locations, and pricing. What would you like to know?";
  }

  // Booking process
  if (
    message.includes("how") &&
    (message.includes("book") || message.includes("make booking"))
  ) {
    return "Booking is simple! Browse available trips in the Bookings section. Click WhatsApp or Call to contact the customer directly and arrange your ride! 📱";
  }

  // Verification related
  if (message.includes("verified") || message.includes("verified badge")) {
    return "Verified users have a ✓ Verified badge on their booking cards. They have good ratings and verified contact information! ⭐";
  }

  // Default response with hints
  const responses = [
    "I can help you with booking information, available vehicles, pricing, locations, and more! What would you like to know? 🚖",
    "Feel free to ask about our bookings, vehicles, cities we serve, or pricing! How can I assist you? 💬",
    "I'm here to help with Tripeaz Taxi Partners queries. Try asking about bookings, vehicles, or locations! 📍",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// ===== RATING MODAL =====
function showRatingModal() {
  alert(
    "⭐ Rating & Review\n\nUser Profile:\n• Total Trips: 23\n• Rating: 4.8/5\n• Joined: Jan 2024"
  );
}

// ===== FILTER BOOKINGS BY CITY =====
function filterBookingsByCity(city) {
  const cards = document.querySelectorAll(".booking-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const locationText = card.textContent.toLowerCase();

    if (city === "all") {
      card.style.display = "block";
      visibleCount++;
    } else {
      if (locationText.includes(city)) {
        card.style.display = "block";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    }
  });

  updateResultsCount(visibleCount);
}

// ===== FILTER BOOKINGS BY VEHICLE =====
function filterBookingsByVehicle(vehicle) {
  const cards = document.querySelectorAll(".booking-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    if (vehicle === "all" || card.dataset.vehicle.toLowerCase() === vehicle) {
      card.style.display = "block";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  updateResultsCount(visibleCount);
}

// ===== QUICK FILTER BOOKINGS =====
function quickFilterBookings(vehicleType) {
  const chips = document.querySelectorAll(".quick-filter-chip");
  const cards = document.querySelectorAll(".booking-card");
  let visibleCount = 0;

  // Update active state
  chips.forEach((chip) => {
    if (chip.textContent.toLowerCase().includes(vehicleType)) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  // Filter cards
  cards.forEach((card) => {
    if (
      vehicleType === "all" ||
      card.dataset.vehicle.toLowerCase() === vehicleType
    ) {
      card.style.display = "block";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  // Update results count
  updateResultsCount(visibleCount);
}

// filterVehicles function removed - free vehicles section removed

// ===== FILTER SECTION FUNCTIONALITY =====
let filterState = {
  vehicles: ["all"],
  pickupLocations: ["all"],
  dropLocations: ["all"],
};

const vehicleIcons = {
  all: "🚗",
  sedan: "🚘",
  suv: "🚙",
  hatchback: "🚗",
  luxury: "🚖",
  traveller: "🚐",
  bus: "🚌",
};

// Initialize filter section
function initFilterSection() {
  // Load saved filters from sessionStorage
  const savedFilters = sessionStorage.getItem("bookingFilters");
  if (savedFilters) {
    try {
      const saved = JSON.parse(savedFilters);
      // Migrate old city filter to route filters
      if (saved.cities && !saved.pickupLocations) {
        filterState = {
          vehicles: saved.vehicles || ["all"],
          pickupLocations: saved.cities || ["all"],
          dropLocations: saved.cities || ["all"],
        };
      } else {
        filterState = {
          vehicles: saved.vehicles || ["all"],
          pickupLocations: saved.pickupLocations || ["all"],
          dropLocations: saved.dropLocations || ["all"],
        };
      }
    } catch (e) {
      filterState = {
        vehicles: ["all"],
        pickupLocations: ["all"],
        dropLocations: ["all"],
      };
    }
  }

  // Populate city options for pickup and drop
  populateCityFilterOptions("pickup");
  populateCityFilterOptions("drop");

  // Update UI with saved state
  updateVehicleDropdownText();
  updatePickupDropdownText();
  updateDropDropdownText();
  updateFilterChips();
  applyBookingFilters();

  // Setup click outside handlers
  document.addEventListener("click", (e) => {
    // Check if click is outside dropdown
    if (
      !e.target.closest(".custom-dropdown") &&
      !e.target.closest(".dropdown-menu")
    ) {
      closeAllDropdowns();
    }
  });

  // Setup Escape key handler
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDropdowns();
    }
  });

  // Reposition dropdown on window resize (especially for mobile)
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const activeDropdown = document.querySelector(".custom-dropdown.active");
      if (activeDropdown) {
        positionDropdownMenu(activeDropdown);
      }

      // Also reposition chatbot if open
      const chatbotWindow = document.getElementById("chatbotWindow");
      if (chatbotWindow && chatbotWindow.classList.contains("active")) {
        positionChatbotBelowFilterBar(chatbotWindow);
      }
    }, 100);
  });

  // Scroll functionality removed - dropdown will not close on scroll
  // Only touch events will close dropdown (handled below)

  // Add touch event listeners for mobile (like calendar/time picker)
  // Close dropdown on any touch outside dropdown menu
  // Use touchend instead of touchstart to allow clicks to register first
  let touchStartTime = 0;
  let touchStartTarget = null;
  
  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartTime = Date.now();
      touchStartTarget = e.target;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      const activeDropdown = document.querySelector(".custom-dropdown.active");
      if (!activeDropdown) return;

      const touchTarget = e.target;
      const menu = activeDropdown.querySelector(".dropdown-menu");
      
      // Check if touch is inside dropdown menu or trigger
      let isInsideDropdown = false;

      // Check if touch is on trigger (to toggle dropdown)
      const trigger = activeDropdown.querySelector(".dropdown-trigger");
      if (
        trigger &&
        (trigger.contains(touchTarget) || trigger === touchTarget || trigger.contains(touchStartTarget))
      ) {
        // Don't close if clicking on trigger - let toggle function handle it
        return;
      }

      // Check if touch is inside dropdown menu
      if (menu) {
        // Check if menu is in document.body (moved menu)
        if (menu.parentElement === document.body) {
          const menuRect = menu.getBoundingClientRect();
          const touchX = e.changedTouches[0].clientX;
          const touchY = e.changedTouches[0].clientY;
          isInsideDropdown =
            touchX >= menuRect.left &&
            touchX <= menuRect.right &&
            touchY >= menuRect.top &&
            touchY <= menuRect.bottom;
        } else {
          // Menu is still in dropdown element
          if (menu.contains(touchTarget) || menu.contains(touchStartTarget)) {
            isInsideDropdown = true;
          }
        }
      }

      // Check if touch is inside dropdown options, search, or any child element
      if (!isInsideDropdown) {
        const menuOptions = activeDropdown.querySelector(".dropdown-options");
        const menuSearch = activeDropdown.querySelector(".dropdown-search");
        const allMenuElements = menu ? menu.querySelectorAll("*") : [];
        
        // Check if touch target is any child of menu
        let isMenuChild = false;
        if (menu) {
          allMenuElements.forEach((el) => {
            if (el === touchTarget || el === touchStartTarget || el.contains(touchTarget) || el.contains(touchStartTarget)) {
              isMenuChild = true;
            }
          });
          if (menu === touchTarget || menu === touchStartTarget || menu.contains(touchTarget) || menu.contains(touchStartTarget)) {
            isMenuChild = true;
          }
        }
        
        if (
          isMenuChild ||
          (menuOptions && (menuOptions.contains(touchTarget) || menuOptions.contains(touchStartTarget))) ||
          (menuSearch && (menuSearch.contains(touchTarget) || menuSearch.contains(touchStartTarget)))
        ) {
          isInsideDropdown = true;
        }
      }

      // Only close if touch is clearly outside and not a quick tap (allow click to register)
      const touchDuration = Date.now() - touchStartTime;
      if (!isInsideDropdown && touchDuration > 100) {
        // Delay close to allow click events to fire first
        setTimeout(() => {
          const stillActive = document.querySelector(".custom-dropdown.active");
          if (stillActive === activeDropdown) {
            closeAllDropdowns();
          }
        }, 150);
      }
      
      touchStartTarget = null;
    },
    { passive: true }
  );
}

// Populate city filter options (for Pickup or Drop)
function populateCityFilterOptions(type) {
  const optionsContainer = document.getElementById(
    type === "pickup" ? "pickupOptions" : "dropOptions"
  );
  if (!optionsContainer) return;

  // Clear existing options
  optionsContainer.innerHTML = "";

  // Add "All Cities" option first
  const allCityOption = document.createElement("div");
  allCityOption.className = "dropdown-option";
  allCityOption.dataset.value = "all";
  // Use both onclick and touch events for better mobile support
  allCityOption.onclick = (e) => {
    e.stopPropagation();
    selectCityOption(type, "all");
  };
  allCityOption.ontouchstart = (e) => {
    e.stopPropagation();
  };
  allCityOption.innerHTML = `
    <span class="checkbox-custom"></span>
    <span class="option-icon">📍</span>
    <span class="option-text">All Cities</span>
  `;
  const stateKey = type === "pickup" ? "pickupLocations" : "dropLocations";
  if (
    filterState[stateKey].includes("all") ||
    filterState[stateKey].length === 0
  ) {
    allCityOption.classList.add("selected");
  }
  optionsContainer.appendChild(allCityOption);

  // Add other Gujarat cities
  const citiesList = gujaratCities.slice(1); // Skip "All Cities"
  citiesList.forEach((city) => {
    const option = document.createElement("div");
    option.className = "dropdown-option";
    option.dataset.value = city.toLowerCase();
    option.dataset.cityName = city;
    // Use both onclick and touch events for better mobile support
    option.onclick = (e) => {
      e.stopPropagation();
      selectCityOption(type, city.toLowerCase());
    };
    option.ontouchstart = (e) => {
      e.stopPropagation();
    };
    option.innerHTML = `
      <span class="checkbox-custom"></span>
      <span class="option-icon">📍</span>
      <span class="option-text">${city}</span>
    `;
    if (filterState[stateKey].includes(city.toLowerCase())) {
      option.classList.add("selected");
    }
    optionsContainer.appendChild(option);
  });
}

// Toggle vehicle dropdown
function toggleVehicleDropdown(event) {
  if (event) {
    event.stopPropagation();
  }
  const dropdown = document.getElementById("vehicleTypeDropdown");
  const isActive = dropdown.classList.contains("active");

  closeAllDropdowns();

  if (!isActive) {
    dropdown.classList.add("active");
    positionDropdownMenu(dropdown);
    updateVehicleOptionsState();
  }
}

// Toggle pickup dropdown
function togglePickupDropdown(event) {
  if (event) {
    event.stopPropagation();
  }
  const dropdown = document.getElementById("pickupDropdown");
  const isActive = dropdown.classList.contains("active");

  closeAllDropdowns();

  if (!isActive) {
    dropdown.classList.add("active");
    positionDropdownMenu(dropdown);
    updateCityOptionsState("pickup");
  }
}

// Toggle drop dropdown
function toggleDropDropdown(event) {
  if (event) {
    event.stopPropagation();
  }
  const dropdown = document.getElementById("dropDropdown");
  const isActive = dropdown.classList.contains("active");

  closeAllDropdowns();

  if (!isActive) {
    dropdown.classList.add("active");
    positionDropdownMenu(dropdown);
    updateCityOptionsState("drop");
  }
}

// Position dropdown menu dynamically, especially for mobile
function positionDropdownMenu(dropdownElement) {
  const menu = dropdownElement.querySelector(".dropdown-menu");
  const trigger = dropdownElement.querySelector(".dropdown-trigger");

  if (!menu || !trigger) return;

  // ALWAYS move menu to document.body to escape container constraints
  if (menu.parentElement !== document.body) {
    dropdownElement.removeChild(menu);
    document.body.appendChild(menu);
  }

  // Force a reflow to ensure accurate position calculation
  void menu.offsetHeight;

  // Calculate position based on trigger - get fresh position every time
  const triggerRect = trigger.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const padding = 8;

  // Position below trigger
  let topPosition = triggerRect.bottom + 6;
  const spaceBelow = viewportHeight - triggerRect.bottom;

  // If not enough space below, show above trigger
  const menuHeight = 220; // Further reduced for better UX
  if (spaceBelow < menuHeight && triggerRect.top > menuHeight) {
    topPosition = triggerRect.top - menuHeight - 6;
  }

  // Ensure within viewport bounds
  if (topPosition < padding) topPosition = padding;
  if (topPosition + menuHeight > viewportHeight - padding) {
    topPosition = Math.max(padding, viewportHeight - menuHeight - padding);
  }

  // Calculate width - full width on mobile, trigger width on desktop
  let menuWidth;
  let leftPosition;

  if (window.innerWidth <= 600) {
    // Mobile: 88% width (further reduced for professional look) with centered positioning
    menuWidth = viewportWidth * 0.88;
    leftPosition = (viewportWidth - menuWidth) / 2; // Center it
    menu.style.left = `${leftPosition}px`;
    menu.style.right = "auto";
  } else {
    // Desktop: align with trigger
    menuWidth = triggerRect.width;
    leftPosition = triggerRect.left;

    // Ensure within viewport bounds
    if (leftPosition + menuWidth > viewportWidth - padding) {
      leftPosition = viewportWidth - menuWidth - padding;
    }
    if (leftPosition < padding) {
      leftPosition = padding;
    }
    menu.style.left = `${leftPosition}px`;
    menu.style.right = "auto";
  }

  // Apply fixed positioning to escape all containers
  menu.style.position = "fixed";
  menu.style.top = `${topPosition}px`;
  menu.style.width = `${menuWidth}px`;
  menu.style.maxWidth = `${menuWidth}px`;
  menu.style.minWidth = `${menuWidth}px`;
  menu.style.maxHeight = "45vh"; // Further reduced for better UX
  menu.style.zIndex = "10002"; // Highest z-index
  menu.style.display = "flex";
  menu.style.overflow = "visible";
  menu.style.overflowY = "visible";
  menu.style.overflowX = "visible";

  // Store references for scroll updates
  menu._dropdownElement = dropdownElement;
  menu._trigger = trigger;
}

// Close all dropdowns
function closeAllDropdowns() {
  // First, find all menus in document.body (moved menus) and close them
  const bodyMenus = document.body.querySelectorAll(".dropdown-menu");
  bodyMenus.forEach((menu) => {
    // Find which dropdown this menu belongs to by checking menu ID
    const menuId = menu.id;
    let dropdown = null;

    if (menuId === "vehicleTypeMenu") {
      dropdown = document.getElementById("vehicleTypeDropdown");
    } else if (menuId === "pickupFilterMenu") {
      dropdown = document.getElementById("pickupDropdown");
    } else if (menuId === "dropFilterMenu") {
      dropdown = document.getElementById("dropDropdown");
    }

    if (dropdown) {
      dropdown.classList.remove("active");
      // Hide menu
      menu.style.display = "none";
      // Move menu back to dropdown element
      if (menu.parentElement === document.body) {
        document.body.removeChild(menu);
        dropdown.appendChild(menu);
      }
      // Reset all inline styles
      menu.style.position = "";
      menu.style.top = "";
      menu.style.left = "";
      menu.style.right = "";
      menu.style.width = "";
      menu.style.maxWidth = "";
      menu.style.minWidth = "";
      menu.style.maxHeight = "";
      menu.style.zIndex = "";
      menu.style.overflow = "";
      menu.style.overflowY = "";
      menu.style.overflowX = "";

      // Remove scroll listener if it exists
      if (dropdown._scrollHandler) {
        window.removeEventListener("scroll", dropdown._scrollHandler);
        dropdown._scrollHandler = null;
      }
    }
  });

  // Also check dropdowns that still have menus as children (fallback)
  document.querySelectorAll(".custom-dropdown").forEach((dd) => {
    if (dd.classList.contains("active")) {
      dd.classList.remove("active");
    }
    const menu = dd.querySelector(".dropdown-menu");
    if (menu && menu.parentElement === dd) {
      menu.style.display = "none";
    }
    // Remove scroll listener if it exists
    if (dd._scrollHandler) {
      window.removeEventListener("scroll", dd._scrollHandler);
      dd._scrollHandler = null;
    }
  });

  // Reposition chatbot if it's open (in case filter bar position changed)
  const chatbotWindow = document.getElementById("chatbotWindow");
  if (chatbotWindow && chatbotWindow.classList.contains("active")) {
    setTimeout(() => {
      positionChatbotBelowFilterBar(chatbotWindow);
    }, 50);
  }
}

// Select vehicle option
function selectVehicleOption(value) {
  const isAll = value === "all";
  const wasSelected = filterState.vehicles.includes(value);

  if (isAll) {
    // Selecting "All Vehicle" clears all others
    filterState.vehicles = ["all"];
  } else {
    // Remove "all" if a specific vehicle is selected
    filterState.vehicles = filterState.vehicles.filter((v) => v !== "all");

    if (wasSelected) {
      // Deselect
      filterState.vehicles = filterState.vehicles.filter((v) => v !== value);
    } else {
      // Select
      filterState.vehicles.push(value);
    }

    // If no vehicles selected, default to "all"
    if (filterState.vehicles.length === 0) {
      filterState.vehicles = ["all"];
    }
  }

  updateVehicleOptionsState();
  updateVehicleDropdownText();
  updateFilterChips();
  saveFilters();
  
  // Reload bookings from API with new filters
  if (typeof loadBookingsFromAPI === "function") {
    loadBookingsFromAPI();
  } else {
    // Fallback: apply client-side filters if API reload not available
    applyBookingFilters();
  }
}

// Select city option (for pickup or drop)
function selectCityOption(type, value) {
  const stateKey = type === "pickup" ? "pickupLocations" : "dropLocations";
  const isAll = value === "all";
  const wasSelected = filterState[stateKey].includes(value);

  if (isAll) {
    // Selecting "All Cities" clears all others
    filterState[stateKey] = ["all"];
  } else {
    // Remove "all" if a specific city is selected
    filterState[stateKey] = filterState[stateKey].filter((c) => c !== "all");

    if (wasSelected) {
      // Deselect
      filterState[stateKey] = filterState[stateKey].filter((c) => c !== value);
    } else {
      // Select
      filterState[stateKey].push(value);
    }

    // If no cities selected, default to "all"
    if (filterState[stateKey].length === 0) {
      filterState[stateKey] = ["all"];
    }
  }

  updateCityOptionsState(type);
  if (type === "pickup") {
    updatePickupDropdownText();
  } else {
    updateDropDropdownText();
  }
  updateFilterChips();
  saveFilters();
  
  // Reload bookings from API with new filters
  if (typeof loadBookingsFromAPI === "function") {
    loadBookingsFromAPI();
  } else {
    // Fallback: apply client-side filters if API reload not available
    applyBookingFilters();
  }
}

// Update vehicle options visual state
function updateVehicleOptionsState() {
  const options = document.querySelectorAll(
    "#vehicleTypeMenu .dropdown-option"
  );
  options.forEach((option) => {
    const value = option.dataset.value;
    if (filterState.vehicles.includes(value)) {
      option.classList.add("selected");
    } else {
      option.classList.remove("selected");
    }
  });
}

// Update city options visual state (for pickup or drop)
function updateCityOptionsState(type) {
  const optionsSelector =
    type === "pickup"
      ? "#pickupOptions .dropdown-option"
      : "#dropOptions .dropdown-option";
  const options = document.querySelectorAll(optionsSelector);
  const stateKey = type === "pickup" ? "pickupLocations" : "dropLocations";

  options.forEach((option) => {
    const value = option.dataset.value;
    if (filterState[stateKey].includes(value)) {
      option.classList.add("selected");
    } else {
      option.classList.remove("selected");
    }
  });
}

// Update vehicle dropdown text
function updateVehicleDropdownText() {
  const textEl = document.getElementById("vehicleTypeText");
  if (!textEl) return;

  if (
    filterState.vehicles.includes("all") ||
    filterState.vehicles.length === 0
  ) {
    textEl.textContent = "All Vehicle";
  } else if (filterState.vehicles.length === 1) {
    const vehicle = filterState.vehicles[0];
    const icon = vehicleIcons[vehicle] || "🚗";
    textEl.textContent = `${icon} ${
      vehicle.charAt(0).toUpperCase() + vehicle.slice(1)
    }`;
  } else {
    textEl.textContent = `${filterState.vehicles.length} selected`;
  }
}

// Update pickup dropdown text
function updatePickupDropdownText() {
  const textEl = document.getElementById("pickupFilterText");
  if (!textEl) return;

  if (
    filterState.pickupLocations.includes("all") ||
    filterState.pickupLocations.length === 0
  ) {
    textEl.textContent = "All Cities";
  } else if (filterState.pickupLocations.length === 1) {
    const cityName =
      document.querySelector(
        `#pickupOptions .dropdown-option[data-value="${filterState.pickupLocations[0]}"]`
      )?.dataset.cityName || filterState.pickupLocations[0];
    textEl.textContent = cityName;
  } else {
    textEl.textContent = `${filterState.pickupLocations.length} selected`;
  }
}

// Update drop dropdown text
function updateDropDropdownText() {
  const textEl = document.getElementById("dropFilterText");
  if (!textEl) return;

  if (
    filterState.dropLocations.includes("all") ||
    filterState.dropLocations.length === 0
  ) {
    textEl.textContent = "All Cities";
  } else if (filterState.dropLocations.length === 1) {
    const cityName =
      document.querySelector(
        `#dropOptions .dropdown-option[data-value="${filterState.dropLocations[0]}"]`
      )?.dataset.cityName || filterState.dropLocations[0];
    textEl.textContent = cityName;
  } else {
    textEl.textContent = `${filterState.dropLocations.length} selected`;
  }
}

// Update filter chips
function updateFilterChips() {
  const container = document.getElementById("filterChipsContainer");
  if (!container) return;

  container.innerHTML = "";

  // Vehicle chips (excluding "all")
  filterState.vehicles
    .filter((v) => v !== "all")
    .forEach((vehicle) => {
      const chip = createFilterChip(
        "vehicle",
        vehicle,
        vehicleIcons[vehicle] || "🚗"
      );
      container.appendChild(chip);
    });

  // Pickup city chips (excluding "all")
  filterState.pickupLocations
    .filter((c) => c !== "all")
    .forEach((pickup) => {
      const pickupName =
        document.querySelector(
          `#pickupOptions .dropdown-option[data-value="${pickup}"]`
        )?.dataset.cityName || pickup;
      const chip = createFilterChip("pickup", pickup, "📍", pickupName);
      container.appendChild(chip);
    });

  // Drop city chips (excluding "all")
  filterState.dropLocations
    .filter((c) => c !== "all")
    .forEach((drop) => {
      const dropName =
        document.querySelector(
          `#dropOptions .dropdown-option[data-value="${drop}"]`
        )?.dataset.cityName || drop;
      const chip = createFilterChip("drop", drop, "📍", dropName);
      container.appendChild(chip);
    });
}

// Create a filter chip
function createFilterChip(type, value, icon, displayName) {
  const chip = document.createElement("div");
  chip.className = "filter-chip-badge";
  chip.dataset.type = type;
  chip.dataset.value = value;

  const displayText =
    displayName || value.charAt(0).toUpperCase() + value.slice(1);

  chip.innerHTML = `
    <span class="filter-chip-icon">${icon}</span>
    <span>${displayText}</span>
    <span class="filter-chip-remove" onclick="removeFilterChip('${type}', '${value}')" aria-label="Remove ${displayText}">×</span>
  `;

  return chip;
}

// Remove filter chip
function removeFilterChip(type, value) {
  if (type === "vehicle") {
    filterState.vehicles = filterState.vehicles.filter((v) => v !== value);
    if (filterState.vehicles.length === 0) {
      filterState.vehicles = ["all"];
    }
  } else if (type === "pickup") {
    filterState.pickupLocations = filterState.pickupLocations.filter(
      (c) => c !== value
    );
    if (filterState.pickupLocations.length === 0) {
      filterState.pickupLocations = ["all"];
    }
  } else if (type === "drop") {
    filterState.dropLocations = filterState.dropLocations.filter(
      (c) => c !== value
    );
    if (filterState.dropLocations.length === 0) {
      filterState.dropLocations = ["all"];
    }
  }

  updateVehicleOptionsState();
  if (type === "pickup") {
    updateCityOptionsState("pickup");
    updatePickupDropdownText();
  } else {
    updateCityOptionsState("drop");
    updateDropDropdownText();
  }
  updateVehicleDropdownText();
  updateFilterChips();
  saveFilters();
  
  // Reload bookings from API with new filters
  if (typeof loadBookingsFromAPI === "function") {
    loadBookingsFromAPI();
  } else {
    // Fallback: apply client-side filters if API reload not available
    applyBookingFilters();
  }
}

// Apply booking filters
function applyBookingFilters() {
  const cards = document.querySelectorAll(".booking-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    let show = true;

    // Vehicle filter
    if (
      !filterState.vehicles.includes("all") &&
      filterState.vehicles.length > 0
    ) {
      const cardVehicle = card.dataset.vehicle?.toLowerCase();
      if (!filterState.vehicles.includes(cardVehicle)) {
        show = false;
      }
    }

    // Pickup filter
    const hasAllPickup =
      filterState.pickupLocations.includes("all") ||
      filterState.pickupLocations.length === 0;
    if (!hasAllPickup && filterState.pickupLocations.length > 0) {
      const cardText = card.textContent.toLowerCase();
      const matchesPickup = filterState.pickupLocations.some((pickup) => {
        const pickupName =
          document.querySelector(
            `#pickupOptions .dropdown-option[data-value="${pickup}"]`
          )?.dataset.cityName || pickup;
        return cardText.includes(pickupName.toLowerCase());
      });
      if (!matchesPickup) {
        show = false;
      }
    }

    // Drop filter
    const hasAllDrop =
      filterState.dropLocations.includes("all") ||
      filterState.dropLocations.length === 0;
    if (!hasAllDrop && filterState.dropLocations.length > 0) {
      const cardText = card.textContent.toLowerCase();
      const matchesDrop = filterState.dropLocations.some((drop) => {
        const dropName =
          document.querySelector(
            `#dropOptions .dropdown-option[data-value="${drop}"]`
          )?.dataset.cityName || drop;
        return cardText.includes(dropName.toLowerCase());
      });
      if (!matchesDrop) {
        show = false;
      }
    }

    card.style.display = show ? "block" : "none";
    if (show) visibleCount++;
  });

  // Update results count if function exists
  if (typeof updateResultsCount === "function") {
    updateResultsCount(visibleCount);
  }

  // Smooth scroll to top of booking list
  const container = document.querySelector(".booking-cards-container");
  if (container) {
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Save filters to sessionStorage
function saveFilters() {
  sessionStorage.setItem("bookingFilters", JSON.stringify(filterState));
}

// Filter vehicle options (for search)
function filterVehicleOptions(event) {
  const searchTerm = event.target.value.toLowerCase();
  const options = document.querySelectorAll(
    "#vehicleTypeMenu .dropdown-option"
  );

  options.forEach((option) => {
    const text = option.textContent.toLowerCase();
    option.style.display = text.includes(searchTerm) ? "flex" : "none";
  });
}

// ===== OPEN USER PROFILE =====
function openUserProfile(userId) {
  if (!userId) {
    console.error("User ID not available");
    alert("User profile not available");
    return;
  }
  
  // Navigate to user profile page with userId
  window.location.href = `user-profile.html?userId=${encodeURIComponent(userId)}`;
}
