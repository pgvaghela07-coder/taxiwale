// ===== MY BOOKINGS FUNCTIONALITY =====

// ===== GLOBAL VARIABLES =====
let currentMainTab = "pending";
let currentSubcategory = "bookings";

// Data storage for bookings and vehicles (for WhatsApp share)
const bookingsDataMap = new Map(); // Store booking objects by _id
const vehiclesDataMap = new Map(); // Store vehicle objects by _id

// Requirements array for edit booking modal
// Removed: editSelectedRequirements - Extra Requirements section removed

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

// ===== SUBCATEGORY SWITCHING =====
function switchSubcategory(subcategory) {
  currentSubcategory = subcategory;

  // Update subcategory tab buttons
  document.querySelectorAll(".sub-tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const clickedSubTab = document.getElementById(subcategory + "SubTab");
  if (clickedSubTab) clickedSubTab.classList.add("active");

  // Update subcategory content
  const mainTab = currentMainTab;
  const bookingsContent = document.getElementById(mainTab + "BookingsContent");
  const vehiclesContent = document.getElementById(mainTab + "VehiclesContent");

  if (bookingsContent) bookingsContent.classList.remove("active");
  if (vehiclesContent) vehiclesContent.classList.remove("active");

  if (subcategory === "bookings") {
    if (bookingsContent) bookingsContent.classList.add("active");
    loadMyBookings(mainTab);
  } else {
    if (vehiclesContent) vehiclesContent.classList.add("active");
    loadMyVehicles(mainTab);
  }
}

// Tab Switching
function switchBookingTab(tab) {
  currentMainTab = tab;
  // Remove active class from all tabs and content
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Add active class to clicked tab
  const clickedTab = document.getElementById(tab + "Tab");
  const clickedContent = document.getElementById(tab + "Content");

  if (clickedTab) clickedTab.classList.add("active");
  if (clickedContent) clickedContent.classList.add("active");

  console.log(`Switched to ${tab} tab`);
}

// Create New Booking
function createNewBooking() {
  window.location.href = "/pages/post-booking.html";
}

// Edit Booking
function editBooking(bookingId) {
  console.log(`Editing booking: ${bookingId}`);
  alert(`Edit functionality for booking ${bookingId} - Coming soon!`);
}

// Update Booking
function updateBooking(bookingId) {
  console.log(`Updating booking: ${bookingId}`);
  alert(`Update functionality for booking ${bookingId} - Coming soon!`);
}

// ===== WHATSAPP SHARE FUNCTIONS =====
function shareBookingOnWhatsApp(bookingId) {
  // Retrieve booking data from Map
  const booking = bookingsDataMap.get(bookingId);

  if (!booking) {
    console.error("❌ [shareBookingOnWhatsApp] Booking not found:", bookingId);
    alert("⚠️ Booking data not found. Please refresh the page.");
    return;
  }

  const postedBy = booking.postedBy || {};
  const userName = postedBy.name || "Unknown User";
  const userMobile = postedBy.mobile || "N/A";

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

  // Format amount
  const amount = booking.amount?.bookingAmount || booking.bookingAmount || 0;
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

  // Vehicle type
  const vehicleTypeText = booking.vehicleType
    ? booking.vehicleType.charAt(0).toUpperCase() + booking.vehicleType.slice(1)
    : "N/A";

  // Trip type
  const tripTypeText =
    booking.tripType === "round-trip" ? "Round Trip" : "One Way";

  // Pickup and Drop
  const pickupCity = booking.pickup?.city || booking.pickupCity || "N/A";
  const dropCity = booking.drop?.city || booking.dropCity || "N/A";

  // Additional Notes
  const customRequirement = booking.customRequirement || "";
  const notes = customRequirement || "No additional notes";

  // App link (placeholder - can be updated later)
  const appLink = "https://tripeaztaxi.com/app";

  // Format WhatsApp message
  const message = `*Tripeaz Taxi Partners Booking Details*

*Name:* ${userName}
*PickUP:* ${pickupCity}
*Drop:* ${dropCity}
*Time & Date:* ${formattedTime}, ${formattedDate}
*Amount:* ${formattedAmount}
*Car Type:* ${vehicleTypeText}
*Contact Number:* ${userMobile}
*Trip Type:* ${tripTypeText}
*Additional Notes:* ${notes}

*Download App:* ${appLink}`;

  // Encode message for WhatsApp URL - use URLSearchParams for better emoji support
  const params = new URLSearchParams();
  params.set("text", message);
  const whatsappUrl = `https://wa.me/?${params.toString()}`;

  // Open WhatsApp
  window.open(whatsappUrl, "_blank");
}

function shareVehicleOnWhatsApp(vehicleId) {
  // Retrieve vehicle data from Map
  const vehicle = vehiclesDataMap.get(vehicleId);

  if (!vehicle) {
    console.error("❌ [shareVehicleOnWhatsApp] Vehicle not found:", vehicleId);
    alert("⚠️ Vehicle data not found. Please refresh the page.");
    return;
  }

  const postedBy = vehicle.postedBy || {};
  const userName = postedBy.name || "Unknown User";
  const userMobile = postedBy.mobile || "N/A";

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

  // Vehicle type
  const vehicleTypeText = vehicle.vehicleType
    ? vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)
    : "N/A";

  // Trip type
  const tripTypeText =
    vehicle.tripType === "round-trip" ? "Round Trip" : "One Way";

  // Location
  const locationCity = vehicle.location?.city || "N/A";

  // Commission/Amount
  const commission = vehicle.commission || 0;
  const amountText = commission > 0 ? `${commission}% commission` : "Free";

  // Additional Notes
  const customRequirement = vehicle.customRequirement || "";
  const notes = customRequirement || "No additional notes";

  // App link (placeholder - can be updated later)
  const appLink = "https://tripeaztaxi.com/app";

  // Format WhatsApp message
  const message = `*Tripeaz Taxi Partners Free Vehicle Details*

*Name:* ${userName}
*PickUP:* ${locationCity}
*Drop:* ${locationCity} (Available for booking)
*Time & Date:* ${formattedTime ? formattedTime + ", " : ""}${formattedDate}
*Amount:* ${amountText}
*Car Type:* ${vehicleTypeText}
*Contact Number:* ${userMobile}
*Trip Type:* ${tripTypeText}
*Additional Notes:* ${notes}

*Download App:* ${appLink}`;

  // Encode message for WhatsApp URL - use URLSearchParams for better emoji support
  const params = new URLSearchParams();
  params.set("text", message);
  const whatsappUrl = `https://wa.me/?${params.toString()}`;

  // Open WhatsApp
  window.open(whatsappUrl, "_blank");
}

// Toggle Comment Box
function toggleCommentBox(bookingId) {
  const commentBox = document.getElementById(`commentBox_${bookingId}`);
  if (commentBox) {
    const isVisible = commentBox.style.display !== "none";
    commentBox.style.display = isVisible ? "none" : "flex";
  }
}

// ===== ASSIGN TO FUNCTIONALITY (Merged into Close Modal) =====

// When Closed From dropdown changes - show/hide Assign To section
document.addEventListener("DOMContentLoaded", function () {
  const closedFromSelect = document.getElementById("closedFrom");
  if (closedFromSelect) {
    closedFromSelect.addEventListener("change", function () {
      const platform = this.value;
      const assignSection = document.getElementById("assignToSection");
      const submitBtn = document.getElementById("submitCloseBtn");

      if (platform === "tripeaz-taxi-partners") {
        // Show Assign To section
        if (assignSection) assignSection.style.display = "block";
      } else {
        // Hide Assign To section
        if (assignSection) assignSection.style.display = "none";
        clearSelectedUser(); // Clear any selected user
      }

      updateSubmitButtonText();
    });
  }
});

// Search users for assignment (in Close Modal)
async function searchUsersForAssign(query) {
  const resultsDiv = document.getElementById("assignToResults");
  if (!resultsDiv) return;

  // Allow search from 1 character (for mobile numbers and quick searches)
  if (!query || query.trim().length < 1) {
    resultsDiv.innerHTML = "";
    return;
  }

  const trimmedQuery = query.trim();

  try {
    // Call real API to search users
    const response = await apiService.request(
      `/users/search?q=${encodeURIComponent(trimmedQuery)}`
    );

    // Handle different response formats
    let users = [];
    if (response && response.data) {
      users = Array.isArray(response.data) ? response.data : [];
    } else if (Array.isArray(response)) {
      users = response;
    }

    resultsDiv.innerHTML = "";

    if (users.length === 0) {
      resultsDiv.innerHTML =
        '<p style="color: #bdbdbd; padding: 12px; text-align: center;">No users found. Try searching by User ID, Name, or Mobile Number.</p>';
      return;
    }

    users.forEach((user) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.style.cssText =
        "padding: 12px; margin: 4px 0; background: #1a1a1a; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); transition: background 0.2s;";
      item.onmouseover = function () {
        this.style.background = "#2a2a2a";
      };
      item.onmouseout = function () {
        this.style.background = "#1a1a1a";
      };

      const userId = user.userId || user.id || "N/A";
      const userName = user.name || "Unknown";
      const userMobile = user.mobile || "N/A";

      item.innerHTML = `
        <div>
          <div style="font-weight: 600; color: #ffffff; margin-bottom: 2px;">${userName}</div>
          <div style="font-size: 12px; color: #bdbdbd;">ID: ${userId} | Mobile: ${userMobile}</div>
        </div>
      `;
      item.onclick = () =>
        selectUserForAssign({
          id: userId,
          userId: userId,
          name: userName,
          mobile: userMobile,
        });
      resultsDiv.appendChild(item);
    });
  } catch (error) {
    console.error("❌ [searchUsersForAssign] Error searching users:", error);
    console.error("❌ [searchUsersForAssign] Error details:", {
      message: error.message,
      stack: error.stack,
    });

    // Show user-friendly error message
    resultsDiv.innerHTML =
      '<p style="color: #ff6b35; padding: 12px; text-align: center;">Error searching users. Please check your connection and try again. If the problem persists, contact support.</p>';
  }
}

// Select user for assignment
function selectUserForAssign(user) {
  const selectedNameEl = document.getElementById("selectedUserName");
  const selectedDisplay = document.getElementById("selectedUserDisplay");
  const resultsDiv = document.getElementById("assignToResults");
  const searchInput = document.getElementById("assignToSearch");
  const modal = document.getElementById("closeModal");

  const userId = user.userId || user.id;

  if (selectedNameEl) {
    selectedNameEl.textContent = `${user.name} (ID: ${userId})`;
  }
  if (selectedDisplay) {
    selectedDisplay.style.display = "block";
  }
  if (resultsDiv) resultsDiv.innerHTML = "";
  if (searchInput) searchInput.value = "";

  // Store selected user in modal dataset
  if (modal) {
    modal.dataset.selectedUserId = userId;
    modal.dataset.selectedUserName = user.name;
    modal.dataset.selectedUserMobile = user.mobile || "";
  }

  updateSubmitButtonText();
}

// Clear selected user
function clearSelectedUser() {
  const selectedDisplay = document.getElementById("selectedUserDisplay");
  const resultsDiv = document.getElementById("assignToResults");
  const searchInput = document.getElementById("assignToSearch");
  const modal = document.getElementById("closeModal");

  if (selectedDisplay) selectedDisplay.style.display = "none";
  if (resultsDiv) resultsDiv.innerHTML = "";
  if (searchInput) searchInput.value = "";

  if (modal) {
    delete modal.dataset.selectedUserId;
    delete modal.dataset.selectedUserName;
  }

  updateSubmitButtonText();
}

// Update submit button text based on user selection
function updateSubmitButtonText() {
  const submitBtn = document.getElementById("submitCloseBtn");
  const modal = document.getElementById("closeModal");
  const selectedUserId = modal?.dataset.selectedUserId;

  if (submitBtn) {
    if (selectedUserId) {
      submitBtn.textContent = "Close & Assign";
    } else {
      submitBtn.textContent = "Close Booking";
    }
  }
}

// Open Close Modal
function openCloseModal(bookingId) {
  const modal = document.getElementById("closeModal");
  if (modal) {
    modal.classList.add("show");
    modal.dataset.bookingId = bookingId;
    modal.dataset.type = "booking";
    // Reset form
    const closedFrom = document.getElementById("closedFrom");
    if (closedFrom) closedFrom.value = "";
    clearSelectedUser();
    const assignSection = document.getElementById("assignToSection");
    if (assignSection) assignSection.style.display = "none";
    updateSubmitButtonText();
  }
}

// Open Close Modal for Vehicle (uses same modal)
function openCloseVehicleModal(vehicleId) {
  const modal = document.getElementById("closeModal");
  if (modal) {
    modal.classList.add("show");
    modal.dataset.vehicleId = vehicleId;
    modal.dataset.type = "vehicle";
    // Reset form
    const closedFrom = document.getElementById("closedFrom");
    if (closedFrom) closedFrom.value = "";
    clearSelectedUser();
    const assignSection = document.getElementById("assignToSection");
    if (assignSection) assignSection.style.display = "none";
    updateSubmitButtonText();
  }
}

// Close Close Modal
function closeCloseModal() {
  const modal = document.getElementById("closeModal");
  if (modal) {
    modal.classList.remove("show");
    // Clear form
    const closedFrom = document.getElementById("closedFrom");
    if (closedFrom) closedFrom.value = "";

    // Clear Assign To section
    clearSelectedUser();
    const assignSection = document.getElementById("assignToSection");
    if (assignSection) assignSection.style.display = "none";
    const assignSearch = document.getElementById("assignToSearch");
    if (assignSearch) assignSearch.value = "";
    const assignResults = document.getElementById("assignToResults");
    if (assignResults) assignResults.innerHTML = "";
  }
}

// Submit Closure (Updated with Assign functionality)
async function submitClosure() {
  const modal = document.getElementById("closeModal");
  const bookingId = modal ? modal.dataset.bookingId : "";
  const vehicleId = modal ? modal.dataset.vehicleId : "";
  const itemId = bookingId || vehicleId;
  const modalType = modal?.dataset.type || (bookingId ? "booking" : "vehicle");
  const closedFrom = document.getElementById("closedFrom")?.value;
  const selectedUserId = modal?.dataset.selectedUserId;
  const selectedUserName = modal?.dataset.selectedUserName;

  if (!closedFrom) {
    alert("⚠️ Please select where the booking/vehicle was closed from");
    return;
  }

  if (!itemId) {
    alert("Booking/Vehicle ID not found");
    return;
  }

  // If Tripeaz Taxi Partners is selected, assignment is REQUIRED
  if (closedFrom === "tripeaz-taxi-partners") {
    if (!selectedUserId || !selectedUserName) {
      alert(
        "⚠️ Please assign this booking/vehicle to a user. Search and select a user by User ID, Name, or Mobile Number."
      );
      // Focus on search input
      const searchInput = document.getElementById("assignToSearch");
      if (searchInput) {
        searchInput.focus();
      }
      return;
    }
  }

  try {
    // Prepare data for closing
    const closeData = {
      closedFrom: closedFrom,
    };

    // Assignment is required for Tripeaz Taxi Partners
    if (closedFrom === "tripeaz-taxi-partners") {
      closeData.assignedTo = {
        id: selectedUserId,
        name: selectedUserName,
        mobile: modal?.dataset.selectedUserMobile || "",
      };
    }

    // Call appropriate API based on type
    if (modalType === "vehicle") {
      await apiService.closeVehicle(itemId, closeData);
    } else {
      await apiService.closeBooking(itemId, closeData);
    }

    const itemType = modalType === "vehicle" ? "Vehicle" : "Booking";
    showToast(
      selectedUserId
        ? `${itemType} closed and assigned successfully ✅`
        : `${itemType} closed successfully ✅`
    );
    closeCloseModal();
    // Reload bookings/vehicles
    if (currentSubcategory === "vehicles" || modalType === "vehicle") {
      loadMyVehicles(currentMainTab);
    } else {
      loadMyBookings(currentMainTab);
    }
  } catch (error) {
    console.error("Error closing booking/vehicle:", error);
    alert("Failed to close: " + (error.message || "Unknown error"));
  }
}

// View Details
function viewDetails(bookingId) {
  console.log(`Viewing details for booking: ${bookingId}`);
  alert(`Details for booking ${bookingId} - Coming soon!`);
}

// Show Toast
function showToast(message) {
  const toast = document.getElementById("successToast");
  const messageElement = document.getElementById("toastMessage");

  if (toast && messageElement) {
    messageElement.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
}

// ===== LOAD USER'S BOOKINGS FROM API =====
async function loadMyBookings(status = "pending") {
  const containerId =
    status === "pending" ? "pendingBookingsContent" : "historyBookingsContent";
  const container = document.getElementById(containerId);

  console.log("🔍 [loadMyBookings] Starting load for status:", status);
  console.log("🔍 [loadMyBookings] Container ID:", containerId);
  console.log("🔍 [loadMyBookings] Container found:", !!container);

  if (!container) {
    console.error("❌ [loadMyBookings] Container not found:", containerId);
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="loading-bookings" style="text-align: center; padding: 40px; color: #bdbdbd;">
      <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
      <p>Loading your bookings...</p>
    </div>
  `;

  try {
    // Check if API service is available
    if (typeof apiService === "undefined") {
      console.error("❌ [loadMyBookings] API service not loaded");
      throw new Error("API service not loaded");
    }

    // Fetch user's bookings from API
    // For pending: get active and assigned bookings
    // For history: get closed and cancelled bookings
    const apiStatus = status === "pending" ? "pending" : "history";
    const requestParams = { status: apiStatus };

    console.log(
      "📤 [loadMyBookings] Making API call with params:",
      requestParams
    );
    console.log(
      "📤 [loadMyBookings] API service available:",
      typeof apiService !== "undefined"
    );

    const response = await apiService.getMyBookings(requestParams);
    console.log("📦 [loadMyBookings] Full API Response:", response);
    console.log("📦 [loadMyBookings] Response type:", typeof response);
    console.log("📦 [loadMyBookings] Is array:", Array.isArray(response));

    // Handle different response formats
    let bookings = [];
    if (Array.isArray(response)) {
      bookings = response;
      console.log(
        "✅ [loadMyBookings] Response is direct array, count:",
        bookings.length
      );
    } else if (response && response.data && Array.isArray(response.data)) {
      bookings = response.data;
      console.log(
        "✅ [loadMyBookings] Response has data array, count:",
        bookings.length
      );
    } else if (
      response &&
      response.bookings &&
      Array.isArray(response.bookings)
    ) {
      bookings = response.bookings;
      console.log(
        "✅ [loadMyBookings] Response has bookings array, count:",
        bookings.length
      );
    } else {
      console.warn("⚠️ [loadMyBookings] Unexpected response format:", response);
    }

    console.log("📋 [loadMyBookings] Extracted bookings:", bookings.length);
    console.log("📋 [loadMyBookings] Bookings data:", bookings);

    // Filter history to only show assigned bookings
    if (status === "history") {
      const beforeFilter = bookings.length;
      bookings = bookings.filter((booking) => booking.assignedTo);
      console.log(
        "🔍 [loadMyBookings] History filter: before",
        beforeFilter,
        "after",
        bookings.length
      );
    }

    console.log("📊 [loadMyBookings] Final bookings count:", bookings.length);

    // Validate bookings data
    const validBookings = bookings.filter((booking) => {
      const isValid = booking && (booking._id || booking.bookingId);
      if (!isValid) {
        console.warn("⚠️ [loadMyBookings] Invalid booking found:", booking);
      }
      return isValid;
    });

    if (validBookings.length !== bookings.length) {
      console.warn(
        `⚠️ [loadMyBookings] Filtered out ${
          bookings.length - validBookings.length
        } invalid bookings`
      );
    }

    bookings = validBookings;

    if (bookings.length === 0) {
      console.log("ℹ️ [loadMyBookings] No bookings found, showing empty state");
      container.innerHTML = `
        <div class="no-bookings" style="text-align: center; padding: 60px 20px; color: #bdbdbd;">
          <div style="font-size: 64px; margin-bottom: 16px;">📋</div>
          <h3 style="margin-bottom: 8px; color: #757575;">No ${status} bookings</h3>
          <p>You don't have any ${status} bookings yet</p>
        </div>
      `;
      return;
    }

    // Store bookings in Map for WhatsApp share functionality
    bookingsDataMap.clear(); // Clear previous data
    bookings.forEach((booking) => {
      if (booking._id) {
        bookingsDataMap.set(booking._id, booking);
      }
    });
    console.log(
      "💾 [loadMyBookings] Stored",
      bookingsDataMap.size,
      "bookings in Map"
    );

    // Render booking cards
    console.log(
      "🎨 [loadMyBookings] Rendering",
      bookings.length,
      "booking cards"
    );
    try {
      container.innerHTML = bookings
        .map((booking) => {
          try {
            return createMyBookingCard(booking);
          } catch (cardError) {
            console.error(
              "❌ [loadMyBookings] Error creating booking card:",
              cardError,
              booking
            );
            return ""; // Skip invalid bookings
          }
        })
        .filter((card) => card)
        .join("");
      console.log("✅ [loadMyBookings] Successfully rendered booking cards");
    } catch (renderError) {
      console.error(
        "❌ [loadMyBookings] Error rendering booking cards:",
        renderError
      );
      throw renderError;
    }
  } catch (error) {
    console.error("❌ [loadMyBookings] Error loading bookings:", error);
    console.error("❌ [loadMyBookings] Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response,
      name: error.name,
    });
    // Enhanced error display with retry option
    const errorMessage = error.message || "Please try again later";
    const isNetworkError =
      error.message &&
      (error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch"));
    const isAuthError =
      error.message &&
      (error.message.includes("token") ||
        error.message.includes("authorization") ||
        error.message.includes("401"));

    let errorDetails = "";
    if (isNetworkError) {
      errorDetails =
        "Cannot connect to server. Please check if backend is running.";
    } else if (isAuthError) {
      errorDetails = "Authentication failed. Please login again.";
    } else {
      errorDetails = "Check console for details.";
    }

    container.innerHTML = `
      <div class="error-bookings" style="text-align: center; padding: 60px 20px; color: #f44336;">
        <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
        <h3 style="margin-bottom: 8px;">Failed to load bookings</h3>
        <p style="margin-bottom: 8px; font-weight: 600;">${errorMessage}</p>
        <p style="margin-bottom: 16px; font-size: 12px; color: #bdbdbd;">${errorDetails}</p>
        <button onclick="loadMyBookings('${status}')" style="padding: 12px 24px; background: #ff9900; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 8px;">
          🔄 Retry
        </button>
        ${
          isAuthError
            ? `
        <button onclick="window.location.href='/pages/index.html'" style="padding: 12px 24px; background: #1a1a1a; color: white; border: 1px solid #ff9900; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 8px; margin-left: 8px;">
          🔐 Login
        </button>
        `
            : ""
        }
      </div>
    `;
  }
}

// ===== CREATE MY BOOKING CARD FROM API DATA =====
function createMyBookingCard(booking) {
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

  // Trip type
  const tripTypeIcon = booking.tripType === "round-trip" ? "↔" : "→";
  const tripTypeText =
    booking.tripType === "round-trip" ? "Round Trip" : "One Way";

  // Vehicle type
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

  // Status badge
  const statusClass =
    booking.status === "active"
      ? "active-status"
      : booking.status === "assigned"
      ? "assigned-status"
      : booking.status === "closed"
      ? "closed-status"
      : "cancelled-status";
  const statusText =
    booking.status === "active"
      ? "Active"
      : booking.status === "assigned"
      ? "Assigned"
      : booking.status === "closed"
      ? "Closed"
      : "Cancelled";

  // Booking ID
  const bookingId =
    booking.bookingId || booking._id?.toString().slice(-6) || "N/A";

  // Assigned to info
  const assignedTo = booking.assignedTo ? booking.assignedTo.name : null;

  return `
    <div class="booking-manage-card" data-booking-id="${booking._id}">
      <!-- Header Row -->
      <div class="card-header-row">
        <span class="booking-id">#${bookingId}</span>
        <span class="trip-badge">${tripTypeText}</span>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>

      <!-- Meta Row -->
      <div class="card-meta-row">
        <div class="meta-left">
          <span class="meta-icon">📅</span>
          <span class="meta-text">${formattedDate}, ${formattedTime}</span>
        </div>
        <span class="upload-time">${timeAgo}</span>
      </div>

      <!-- Trip Summary Row -->
      <div class="trip-summary-container">
        <span class="type-icon">${tripTypeIcon}</span>
        <span class="trip-type-text">${tripTypeText}</span>
        <div class="price-section">
          <span class="trip-price">${formattedAmount}</span>
        </div>
      </div>

      <!-- Route Block -->
      <div class="route-container-bookings">
        <div class="route-left">
          <div class="route-stop">
            <span class="pin-icon">📍</span>
            <span>${booking.pickup?.city || booking.pickupCity || "N/A"}</span>
          </div>
          <div class="route-arrow">↓</div>
          <div class="route-stop">
            <span class="pin-icon">📍</span>
            <span>${booking.drop?.city || booking.dropCity || "N/A"}</span>
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
        <span>${(() => {
          const customRequirement = booking.customRequirement || "";
          return customRequirement || "No additional notes";
        })()}</span>
      </div>

      ${
        assignedTo
          ? `
      <!-- Assigned Info -->
      <div class="assigned-info" style="padding: 12px; background: #1a1a1a; border-radius: 8px; margin: 12px 0;">
        <span style="color: #bdbdbd;">Assigned to: </span>
        <span style="color: #ff9900; font-weight: 600;">${assignedTo}</span>
        ${
          booking.assignedAt
            ? `<span style="color: #757575; font-size: 12px; margin-left: 8px;">(${new Date(
                booking.assignedAt
              ).toLocaleDateString()})</span>`
            : ""
        }
      </div>
      `
          : ""
      }

      <!-- Action Buttons Row 1 -->
      <div class="card-actions-row-1">
        ${
          booking.status === "active" || booking.status === "assigned"
            ? `
        <button class="action-btn" onclick="editBooking('${booking._id}')" aria-label="Edit Booking">
          <span class="btn-icon">✏️</span> Edit
        </button>
        <button class="action-btn" onclick="shareBookingOnWhatsApp('${booking._id}')" aria-label="Share Booking">
          <span class="btn-icon">📤</span> Share
        </button>
        `
            : ""
        }
      </div>

      <!-- Action Buttons Row 2 -->
      <div class="card-actions-row-2">
        ${
          booking.status !== "closed" && booking.status !== "cancelled"
            ? `
        <button class="action-btn action-btn-close" onclick="openCloseModal('${booking._id}')" aria-label="Close Booking">
          <span class="btn-icon">🏁</span> Close
        </button>
        `
            : ""
        }
        <button class="action-btn" onclick="deleteBookingConfirm('${
          booking._id
        }')" aria-label="Delete Booking" style="background: #f44336;">
          <span class="btn-icon">🗑️</span> Delete
        </button>
      </div>
    </div>
  `;
}

// ===== UPDATE TAB SWITCHING TO LOAD DATA =====
function switchBookingTab(tab) {
  currentMainTab = tab;

  // Remove active class from all tabs and content
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Add active class to clicked tab
  const clickedTab = document.getElementById(tab + "Tab");
  const clickedContent = document.getElementById(tab + "Content");

  if (clickedTab) clickedTab.classList.add("active");
  if (clickedContent) clickedContent.classList.add("active");

  // Load data for current subcategory
  if (currentSubcategory === "bookings") {
    loadMyBookings(tab);
  } else {
    loadMyVehicles(tab);
  }

  console.log(`Switched to ${tab} tab`);
}

// ===== CITY DROPDOWN POPULATION =====
function populateEditCityDropdowns() {
  const gujaratCities = [
    "Ahmedabad",
    "Vadodara",
    "Surat",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Anand",
    "Palanpur",
    "Mehsana",
    "Godhra",
    "Navsari",
    "Vapi",
    "Porbandar",
    "Dwarka",
    "Somnath",
    "Palitana",
    "Kutch",
    "Bharuch",
    "Nadiad",
    "Surendranagar",
    "Valsad",
  ];

  const pickupSelect = document.getElementById("editPickupCity");
  const dropSelect = document.getElementById("editDropCity");

  if (pickupSelect && dropSelect) {
    // Clear existing options (except first)
    pickupSelect.innerHTML = '<option value="">Select Pickup City</option>';
    dropSelect.innerHTML = '<option value="">Select Drop City</option>';

    gujaratCities.forEach((city) => {
      const option1 = document.createElement("option");
      option1.value = city;
      option1.textContent = city;
      pickupSelect.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = city;
      option2.textContent = city;
      dropSelect.appendChild(option2);
    });
  }
}

// ===== UPDATE CRUD FUNCTIONS TO USE API =====
async function editBooking(bookingId) {
  try {
    // Always fetch fresh data from API to ensure all fields are present
    // Map data might be incomplete or outdated
    let bookingData;
    try {
      const booking = await apiService.getBooking(bookingId);
      bookingData = booking.data || booking;
      console.log(
        "📥 [editBooking] Fetched booking data from API:",
        bookingData
      );
    } catch (apiError) {
      console.warn("⚠️ [editBooking] API fetch failed, trying Map:", apiError);
      // Fallback to Map if API fails
      bookingData = bookingsDataMap.get(bookingId);
      if (!bookingData) {
        throw new Error("Could not fetch booking data");
      }
    }

    // Populate city dropdowns first
    populateEditCityDropdowns();

    // Store booking ID
    document.getElementById("editBookingId").value = bookingId;

    // Set trip type toggle
    const tripType = bookingData.tripType || "one-way";
    if (tripType === "one-way") {
      document.getElementById("editBookingOneWay").classList.add("active");
      document
        .getElementById("editBookingRoundTrip")
        .classList.remove("active");
    } else {
      document.getElementById("editBookingRoundTrip").classList.add("active");
      document.getElementById("editBookingOneWay").classList.remove("active");
    }

    // Select vehicle type
    const vehicleType = bookingData.vehicleType || "sedan";
    document
      .querySelectorAll("#editBookingModal .vehicle-option")
      .forEach((btn) => {
        btn.classList.remove("selected");
        if (btn.dataset.vehicle === vehicleType) {
          btn.classList.add("selected");
        }
      });

    // Set date & time
    if (bookingData.dateTime) {
      const dateTime = new Date(bookingData.dateTime);
      document.getElementById("editBookingDate").value = dateTime
        .toISOString()
        .split("T")[0];
      const hours = String(dateTime.getHours()).padStart(2, "0");
      const minutes = String(dateTime.getMinutes()).padStart(2, "0");
      document.getElementById("editBookingTime").value = `${hours}:${minutes}`;
    }

    // Set pickup and drop cities
    if (bookingData.pickup?.city) {
      document.getElementById("editPickupCity").value = bookingData.pickup.city;
    }
    if (bookingData.drop?.city) {
      document.getElementById("editDropCity").value = bookingData.drop.city;
    }

    // Set amount
    if (bookingData.amount) {
      document.getElementById("editBookingAmount").value =
        bookingData.amount.bookingAmount || 0;
    }

    // Removed: Visibility and Requirements sections

    // Set custom requirement/notes (Note field)
    // Try multiple possible field names in case of data structure variations
    const customRequirement =
      bookingData.customRequirement ||
      bookingData.note ||
      bookingData.notes ||
      "";

    console.log("📝 [editBooking] Note field value:", customRequirement);
    console.log(
      "📝 [editBooking] Full bookingData:",
      JSON.stringify(bookingData, null, 2)
    );

    // Wait for modal to be ready before setting value
    const modal = document.getElementById("editBookingModal");
    if (modal) {
      modal.classList.add("show");

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const customRequirementEl = document.getElementById(
          "editCustomRequirement"
        );
        if (customRequirementEl) {
          // Clear any existing value first
          customRequirementEl.value = "";
          // Set the value
          customRequirementEl.value = customRequirement;
          // Trigger input event to update character count
          customRequirementEl.dispatchEvent(
            new Event("input", { bubbles: true })
          );
          updateEditCharCount();
          console.log(
            "✅ [editBooking] Note field set to:",
            customRequirementEl.value
          );
        } else {
          console.error(
            "❌ [editBooking] editCustomRequirement element not found"
          );
          // Retry after a short delay
          setTimeout(() => {
            const retryEl = document.getElementById("editCustomRequirement");
            if (retryEl) {
              retryEl.value = customRequirement;
              updateEditCharCount();
              console.log(
                "✅ [editBooking] Note field set on retry:",
                retryEl.value
              );
            }
          }, 200);
        }
      });
    }
  } catch (error) {
    console.error("Error fetching booking:", error);
    alert(
      "Failed to load booking details: " + (error.message || "Unknown error")
    );
  }
}

// ===== EDIT BOOKING MODAL HELPER FUNCTIONS =====
function closeEditBookingModal() {
  const modal = document.getElementById("editBookingModal");
  if (modal) {
    modal.classList.remove("show");
    // Reset form
    document.getElementById("editBookingId").value = "";
    document.getElementById("editBookingDate").value = "";
    document.getElementById("editBookingTime").value = "";
    document.getElementById("editPickupCity").value = "";
    document.getElementById("editDropCity").value = "";
    document.getElementById("editBookingAmount").value = "";
    document.getElementById("editCustomRequirement").value = "";
    document.getElementById("editBookingOneWay").classList.remove("active");
    document.getElementById("editBookingRoundTrip").classList.remove("active");
    document
      .querySelectorAll("#editBookingModal .vehicle-option")
      .forEach((btn) => {
        btn.classList.remove("selected");
      });
    // Removed: Visibility and Requirements reset
    updateEditCharCount();
  }
}

function toggleEditBookingTripType(type) {
  const oneWayBtn = document.getElementById("editBookingOneWay");
  const roundTripBtn = document.getElementById("editBookingRoundTrip");

  if (type === "one-way") {
    oneWayBtn.classList.add("active");
    roundTripBtn.classList.remove("active");
  } else {
    roundTripBtn.classList.add("active");
    oneWayBtn.classList.remove("active");
  }
  // Commission is always visible now, no need to show/hide
}

function selectEditBookingVehicle(vehicleType) {
  // Remove selected class from all buttons
  document
    .querySelectorAll("#editBookingModal .vehicle-option")
    .forEach((btn) => {
      btn.classList.remove("selected");
    });

  // Add selected class to clicked button
  const clickedBtn = document.querySelector(
    `#editBookingModal [data-vehicle="${vehicleType}"]`
  );
  if (clickedBtn) {
    clickedBtn.classList.add("selected");
  }
}

function updateEditCharCount() {
  const textarea = document.getElementById("editCustomRequirement");
  const charCount = document.getElementById("editCharCount");
  if (textarea && charCount) {
    const text = textarea.value.trim();
    const words =
      text === "" ? [] : text.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;

    // Limit to 250 words
    if (wordCount > 250) {
      const wordsArray = text.split(/\s+/).filter((word) => word.length > 0);
      const limitedWords = wordsArray.slice(0, 250).join(" ");
      textarea.value = limitedWords;
      charCount.textContent = `250/250 words`;
      charCount.style.color = "#ff6b6b";
    } else {
      charCount.textContent = `${wordCount}/250 words`;
      charCount.style.color = wordCount > 200 ? "#ffb300" : "#bdbdbd";
    }
  }
}

// Removed: toggleEditChip function - Extra Requirements section removed

// Removed: validateCommission function

// ===== SUBMIT BOOKING EDIT =====
async function submitBookingEdit() {
  const bookingId = document.getElementById("editBookingId").value;
  if (!bookingId) {
    alert("⚠️ Booking ID not found");
    return;
  }

  // Get trip type
  const tripType = document
    .getElementById("editBookingRoundTrip")
    .classList.contains("active")
    ? "round-trip"
    : "one-way";

  // Get selected vehicle type
  const selectedVehicleBtn = document.querySelector(
    "#editBookingModal .vehicle-option.selected"
  );
  if (!selectedVehicleBtn) {
    alert("⚠️ Please select a vehicle type");
    return;
  }
  const vehicleType = selectedVehicleBtn.dataset.vehicle;

  // Get date and time
  const bookingDate = document.getElementById("editBookingDate").value;
  const bookingTime = document.getElementById("editBookingTime").value;
  if (!bookingDate || !bookingTime) {
    alert("⚠️ Please select date and time");
    return;
  }

  // Validate date is not in past
  const selectedDateTime = new Date(`${bookingDate}T${bookingTime}`);
  const now = new Date();
  if (selectedDateTime < now) {
    alert("⚠️ Date and time cannot be in the past");
    return;
  }

  // Get pickup and drop cities
  const pickupCity = document.getElementById("editPickupCity").value;
  const dropCity = document.getElementById("editDropCity").value;
  if (!pickupCity || !dropCity) {
    alert("⚠️ Please select pickup and drop cities");
    return;
  }

  if (pickupCity === dropCity) {
    alert("⚠️ Pickup and drop locations cannot be the same");
    return;
  }

  // Get amounts
  const bookingAmount = parseFloat(
    document.getElementById("editBookingAmount").value
  );
  if (!bookingAmount || bookingAmount < 0) {
    alert("⚠️ Please enter valid amount");
    return;
  }

  // Get custom requirement (handle if field doesn't exist)
  const customRequirementEl = document.getElementById("editCustomRequirement");
  const customRequirement = customRequirementEl ? customRequirementEl.value.trim() : "";

  // Prepare update data
  const updateData = {
    tripType: tripType,
    vehicleType: vehicleType,
    pickup: {
      city: pickupCity,
      location: pickupCity,
      address: pickupCity,
    },
    drop: {
      city: dropCity,
      location: dropCity,
      address: dropCity,
    },
    dateTime: selectedDateTime.toISOString(),
    amount: {
      bookingAmount: bookingAmount,
    },
    customRequirement: customRequirement,
  };

  // Show loading state
  const submitBtn = document.getElementById("editBookingSubmitBtn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Updating...";

  try {
    await apiService.updateBooking(bookingId, updateData);
    showToast("Booking updated successfully ✅");
    closeEditBookingModal();

    // Reload My Bookings section
    loadMyBookings(currentMainTab);

    // Reload Dashboard section if available
    if (typeof loadBookingsFromAPI === "function") {
      loadBookingsFromAPI();
    }
  } catch (error) {
    console.error("Error updating booking:", error);
    alert("Failed to update booking: " + (error.message || "Unknown error"));
  } finally {
    // Restore button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function updateBookingStatus(bookingId) {
  try {
    // Fetch current booking
    const booking = await apiService.getBooking(bookingId);
    const bookingData = booking.data || booking;

    // Show update form (simplified - you can enhance this)
    const newStatus = prompt(
      "Update booking status:\n1. active\n2. assigned\n3. closed\n4. cancelled\n\nEnter status:",
      bookingData.status
    );

    if (newStatus && newStatus !== bookingData.status) {
      await apiService.updateBooking(bookingId, { status: newStatus });
      showToast("Booking updated successfully ✅");
      loadMyBookings("pending");
    }
  } catch (error) {
    console.error("Error updating booking:", error);
    alert("Failed to update booking: " + (error.message || "Unknown error"));
  }
}

async function deleteBookingConfirm(bookingId) {
  if (
    confirm(
      "⚠️ Are you sure you want to delete this booking?\n\nThis action cannot be undone."
    )
  ) {
    try {
      await apiService.deleteBooking(bookingId);
      showToast("Booking deleted successfully ✅");
      // Reload bookings
      loadMyBookings(currentMainTab);
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking: " + (error.message || "Unknown error"));
    }
  }
}

async function submitComment(bookingId) {
  const commentInput = document.getElementById(`commentInput_${bookingId}`);
  const commentText = commentInput?.value.trim();

  if (!commentText) {
    alert("Please enter a comment");
    return;
  }

  try {
    await apiService.addComment(bookingId, commentText);
    showToast("Comment added successfully ✅");
    commentInput.value = "";
    toggleCommentBox(bookingId);
    // Reload bookings to show new comment
    const activeTab =
      document.querySelector(".tab-btn.active")?.id.replace("Tab", "") ||
      "pending";
    loadMyBookings(activeTab);
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Failed to add comment: " + (error.message || "Unknown error"));
  }
}

// Update assign booking function
async function assignBooking(partnerId, partnerName) {
  const modal = document.getElementById("assignModal");
  const bookingId = modal ? modal.dataset.bookingId : "";

  if (!bookingId) {
    alert("Booking ID not found");
    return;
  }

  try {
    await apiService.assignBooking(bookingId, partnerId);
    showToast(`Booking assigned to ${partnerName} ✅`);
    closeAssignModal();
    loadMyBookings("pending");
  } catch (error) {
    console.error("Error assigning booking:", error);
    alert("Failed to assign booking: " + (error.message || "Unknown error"));
  }
}

// Update close booking function
async function submitClosure() {
  const modal = document.getElementById("closeModal");
  const bookingId = modal ? modal.dataset.bookingId : "";
  const vehicleId = modal ? modal.dataset.vehicleId : "";
  const type = modal ? modal.dataset.type : "";
  const closedFrom = document.getElementById("closedFrom")?.value;
  const closureReason = document.getElementById("closureReason")?.value;

  if (type === "vehicle") {
    await submitVehicleClosure();
    return;
  }

  if (!closedFrom) {
    alert("⚠️ Please select where the booking was closed from");
    return;
  }

  if (!bookingId) {
    alert("Booking ID not found");
    return;
  }

  try {
    await apiService.closeBooking(bookingId, {
      closedFrom: closedFrom,
      reason: closureReason || "No reason provided",
    });

    showToast("Booking Closed Successfully ✅");
    closeCloseModal();
    loadMyBookings(currentMainTab);
  } catch (error) {
    console.error("Error closing booking:", error);
    alert("Failed to close booking: " + (error.message || "Unknown error"));
  }
}

// ===== LOAD USER'S VEHICLES FROM API =====
async function loadMyVehicles(status = "pending") {
  const containerId =
    status === "pending" ? "pendingVehiclesContent" : "historyVehiclesContent";
  const container = document.getElementById(containerId);

  console.log("🔍 [loadMyVehicles] Starting load for status:", status);
  console.log("🔍 [loadMyVehicles] Container ID:", containerId);
  console.log("🔍 [loadMyVehicles] Container found:", !!container);

  if (!container) {
    console.error("❌ [loadMyVehicles] Container not found:", containerId);
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="loading-bookings" style="text-align: center; padding: 40px; color: #bdbdbd;">
      <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
      <p>Loading your vehicles...</p>
    </div>
  `;

  try {
    if (typeof apiService === "undefined") {
      console.error("❌ [loadMyVehicles] API service not loaded");
      throw new Error("API service not loaded");
    }

    const apiStatus = status === "pending" ? "pending" : "history";
    const requestParams = { status: apiStatus };

    console.log(
      "📤 [loadMyVehicles] Making API call with params:",
      requestParams
    );
    console.log(
      "📤 [loadMyVehicles] API service available:",
      typeof apiService !== "undefined"
    );

    const response = await apiService.getMyVehicles(requestParams);
    console.log("🚗 [loadMyVehicles] Full API Response:", response);
    console.log("🚗 [loadMyVehicles] Response type:", typeof response);
    console.log("🚗 [loadMyVehicles] Is array:", Array.isArray(response));

    let vehicles = [];
    if (Array.isArray(response)) {
      vehicles = response;
      console.log(
        "✅ [loadMyVehicles] Response is direct array, count:",
        vehicles.length
      );
    } else if (response && response.data && Array.isArray(response.data)) {
      vehicles = response.data;
      console.log(
        "✅ [loadMyVehicles] Response has data array, count:",
        vehicles.length
      );
    } else if (
      response &&
      response.vehicles &&
      Array.isArray(response.vehicles)
    ) {
      vehicles = response.vehicles;
      console.log(
        "✅ [loadMyVehicles] Response has vehicles array, count:",
        vehicles.length
      );
    } else {
      console.warn("⚠️ [loadMyVehicles] Unexpected response format:", response);
    }

    console.log("🚗 [loadMyVehicles] Extracted vehicles:", vehicles.length);
    console.log("🚗 [loadMyVehicles] Vehicles data:", vehicles);

    // Filter history to only show assigned vehicles
    if (status === "history") {
      const beforeFilter = vehicles.length;
      vehicles = vehicles.filter((vehicle) => vehicle.assignedTo);
      console.log(
        "🔍 [loadMyVehicles] History filter: before",
        beforeFilter,
        "after",
        vehicles.length
      );
    }

    console.log("📊 [loadMyVehicles] Final vehicles count:", vehicles.length);

    // Validate vehicles data
    const validVehicles = vehicles.filter((vehicle) => {
      const isValid = vehicle && vehicle._id;
      if (!isValid) {
        console.warn("⚠️ [loadMyVehicles] Invalid vehicle found:", vehicle);
      }
      return isValid;
    });

    if (validVehicles.length !== vehicles.length) {
      console.warn(
        `⚠️ [loadMyVehicles] Filtered out ${
          vehicles.length - validVehicles.length
        } invalid vehicles`
      );
    }

    vehicles = validVehicles;

    if (vehicles.length === 0) {
      console.log("ℹ️ [loadMyVehicles] No vehicles found, showing empty state");
      container.innerHTML = `
        <div class="no-bookings" style="text-align: center; padding: 60px 20px; color: #bdbdbd;">
          <div style="font-size: 64px; margin-bottom: 16px;">🚗</div>
          <h3 style="margin-bottom: 8px; color: #757575;">No ${status} vehicles</h3>
          <p>You don't have any ${status} vehicles yet</p>
        </div>
      `;
      return;
    }

    // Store vehicles in Map for WhatsApp share functionality
    vehiclesDataMap.clear(); // Clear previous data
    vehicles.forEach((vehicle) => {
      if (vehicle._id) {
        vehiclesDataMap.set(vehicle._id, vehicle);
      }
    });
    console.log(
      "💾 [loadMyVehicles] Stored",
      vehiclesDataMap.size,
      "vehicles in Map"
    );

    // Render vehicle cards
    console.log(
      "🎨 [loadMyVehicles] Rendering",
      vehicles.length,
      "vehicle cards"
    );
    try {
      container.innerHTML = vehicles
        .map((vehicle) => {
          try {
            return createMyVehicleCard(vehicle);
          } catch (cardError) {
            console.error(
              "❌ [loadMyVehicles] Error creating vehicle card:",
              cardError,
              vehicle
            );
            return ""; // Skip invalid vehicles
          }
        })
        .filter((card) => card)
        .join("");
      console.log("✅ [loadMyVehicles] Successfully rendered vehicle cards");
    } catch (renderError) {
      console.error(
        "❌ [loadMyVehicles] Error rendering vehicle cards:",
        renderError
      );
      throw renderError;
    }
  } catch (error) {
    console.error("❌ [loadMyVehicles] Error loading vehicles:", error);
    console.error("❌ [loadMyVehicles] Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response,
      name: error.name,
    });
    // Enhanced error display with retry option
    const errorMessage = error.message || "Please try again later";
    const isNetworkError =
      error.message &&
      (error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch"));
    const isAuthError =
      error.message &&
      (error.message.includes("token") ||
        error.message.includes("authorization") ||
        error.message.includes("401"));

    let errorDetails = "";
    if (isNetworkError) {
      errorDetails =
        "Cannot connect to server. Please check if backend is running.";
    } else if (isAuthError) {
      errorDetails = "Authentication failed. Please login again.";
    } else {
      errorDetails = "Check console for details.";
    }

    container.innerHTML = `
      <div class="error-bookings" style="text-align: center; padding: 60px 20px; color: #f44336;">
        <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
        <h3 style="margin-bottom: 8px;">Failed to load vehicles</h3>
        <p style="margin-bottom: 8px; font-weight: 600;">${errorMessage}</p>
        <p style="margin-bottom: 16px; font-size: 12px; color: #bdbdbd;">${errorDetails}</p>
        <button onclick="loadMyVehicles('${status}')" style="padding: 12px 24px; background: #ff9900; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 8px;">
          🔄 Retry
        </button>
        ${
          isAuthError
            ? `
        <button onclick="window.location.href='/pages/index.html'" style="padding: 12px 24px; background: #1a1a1a; color: white; border: 1px solid #ff9900; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 8px; margin-left: 8px;">
          🔐 Login
        </button>
        `
            : ""
        }
      </div>
    `;
  }
}

// ===== CREATE MY VEHICLE CARD FROM API DATA =====
function createMyVehicleCard(vehicle) {
  const postedBy = vehicle.postedBy || {};
  const userName = postedBy.name || "You";
  const userMobile = postedBy.mobile || "";

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
    hatchback: "🚗",
    luxury: "🚖",
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

  // Status badge
  const statusClass =
    vehicle.status === "active"
      ? "active-status"
      : vehicle.status === "assigned"
      ? "assigned-status"
      : vehicle.status === "booked"
      ? "closed-status"
      : "cancelled-status";
  const statusText =
    vehicle.status === "active"
      ? "Active"
      : vehicle.status === "assigned"
      ? "Assigned"
      : vehicle.status === "booked"
      ? "Booked"
      : "Inactive";

  const assignedTo = vehicle.assignedTo
    ? vehicle.assignedTo.name || vehicle.assignedTo.mobile || "Unknown"
    : null;
  const assignedAt = vehicle.assignedAt
    ? new Date(vehicle.assignedAt).toLocaleDateString("en-IN")
    : null;

  // Avatar URL
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName
  )}&background=ff9900&color=1a1a1a`;

  // Verified badge check
  const isVerified =
    postedBy.isVerified || postedBy.verificationStatus === "verified" || false;

  // Vehicle ID (similar to booking ID) - display ID for frontend
  const vehicleDisplayId =
    vehicle.vehicleId || vehicle._id?.toString().slice(-6) || "N/A";

  // Trip type icon (matching booking card style)
  const tripTypeIcon = vehicle.tripType === "round-trip" ? "↔" : "→";

  return `
    <div class="vehicle-manage-card" data-vehicle-id="${
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

      ${
        assignedTo
          ? `
      <!-- Assigned Info (matching booking card style) -->
      <div class="assigned-info" style="padding: 12px; background: #1a1a1a; border-radius: 8px; margin: 12px 0;">
        <span style="color: #bdbdbd;">Assigned to: </span>
        <span style="color: #ff9900; font-weight: 600;">${assignedTo}</span>
        ${
          assignedAt
            ? `<span style="color: #757575; font-size: 12px; margin-left: 8px;">(${assignedAt})</span>`
            : ""
        }
      </div>
      `
          : ""
      }

      <!-- Action Buttons Row 1 (matching booking card structure) -->
      <div class="card-actions-row-1">
        ${
          vehicle.status === "active" || vehicle.status === "assigned"
            ? `
        <button class="action-btn" onclick="editVehicle('${vehicle._id}')" aria-label="Edit Vehicle">
          <span class="btn-icon">✏️</span> Edit
        </button>
        <button class="action-btn" onclick="shareVehicleOnWhatsApp('${vehicle._id}')" aria-label="Share Vehicle">
          <span class="btn-icon">📤</span> Share
        </button>
        `
            : ""
        }
      </div>

      <!-- Action Buttons Row 2 (matching booking card structure) -->
      <div class="card-actions-row-2">
        ${
          vehicle.status !== "booked" && vehicle.status !== "inactive"
            ? `
        <button class="action-btn action-btn-close" onclick="openCloseVehicleModal('${vehicle._id}')" aria-label="Close Vehicle">
          <span class="btn-icon">🏁</span> Close
        </button>
        `
            : ""
        }
        <button class="action-btn" onclick="deleteVehicleConfirm('${
          vehicle._id
        }')" aria-label="Delete Vehicle" style="background: #f44336;">
          <span class="btn-icon">🗑️</span> Delete
        </button>
      </div>
    </div>
  `;
}

// ===== VEHICLE CRUD OPERATIONS =====
// Global variable for edit vehicle requirements
// Removed: editVehicleSelectedRequirements - Extra Requirements section removed

async function editVehicle(vehicleId) {
  try {
    // Always fetch fresh data from API to ensure all fields are present
    let vehicleData;
    try {
      const vehicle = await apiService.getVehicle(vehicleId);
      vehicleData = vehicle.data || vehicle;
      console.log(
        "📥 [editVehicle] Fetched vehicle data from API:",
        vehicleData
      );
    } catch (apiError) {
      console.warn("⚠️ [editVehicle] API fetch failed, trying Map:", apiError);
      vehicleData = vehiclesDataMap.get(vehicleId);
      if (!vehicleData) {
        throw new Error("Could not fetch vehicle data");
      }
    }

    // Populate city dropdowns
    populateEditVehicleCityDropdowns();

    // Store vehicle ID
    document.getElementById("editVehicleId").value = vehicleId;

    // Select vehicle type
    const vehicleType = vehicleData.vehicleType || "sedan";
    document
      .querySelectorAll("#editVehicleModal .vehicle-option")
      .forEach((btn) => {
        btn.classList.remove("selected");
        if (btn.dataset.vehicle === vehicleType) {
          btn.classList.add("selected");
        }
      });

    // Set date & time
    if (vehicleData.availability?.date) {
      const dateTime = new Date(vehicleData.availability.date);
      document.getElementById("editVehicleDate").value = dateTime
        .toISOString()
        .split("T")[0];
      document.getElementById("editVehicleTime").value =
        vehicleData.availability.time || "";
    }

    // Set pickup and drop cities (both set to same city for vehicles)
    if (vehicleData.location?.city) {
      document.getElementById("editVehiclePickupCity").value =
        vehicleData.location.city;
      document.getElementById("editVehicleDropCity").value =
        vehicleData.location.city;
    }

    // Set commission
    if (vehicleData.commission !== undefined) {
      document.getElementById("editVehicleCommission").value =
        vehicleData.commission || 0;
    }

    // Removed: Visibility and Requirements sections

    // Set Note field (customRequirement)
    const customRequirement = vehicleData.customRequirement || "";
    console.log("📝 [editVehicle] Note field value:", customRequirement);

    // Show modal
    const modal = document.getElementById("editVehicleModal");
    if (modal) {
      modal.classList.add("show");

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const customRequirementEl = document.getElementById(
          "editVehicleCustomRequirement"
        );
        if (customRequirementEl) {
          customRequirementEl.value = "";
          customRequirementEl.value = customRequirement;
          customRequirementEl.dispatchEvent(
            new Event("input", { bubbles: true })
          );
          updateEditVehicleCharCount();
          console.log(
            "✅ [editVehicle] Note field set to:",
            customRequirementEl.value
          );
        } else {
          console.error(
            "❌ [editVehicle] editVehicleCustomRequirement element not found"
          );
          setTimeout(() => {
            const retryEl = document.getElementById(
              "editVehicleCustomRequirement"
            );
            if (retryEl) {
              retryEl.value = customRequirement;
              updateEditVehicleCharCount();
            }
          }, 200);
        }
      });
    }
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    alert(
      "Failed to load vehicle details: " + (error.message || "Unknown error")
    );
  }
}

async function submitVehicleEdit() {
  const vehicleId = document.getElementById("editVehicleId").value;
  if (!vehicleId) {
    alert("⚠️ Vehicle ID not found");
    return;
  }

  // Get selected vehicle type
  const selectedVehicleBtn = document.querySelector(
    "#editVehicleModal .vehicle-option.selected"
  );
  if (!selectedVehicleBtn) {
    alert("⚠️ Please select a vehicle type");
    return;
  }
  const vehicleType = selectedVehicleBtn.dataset.vehicle;

  // Get trip type from existing vehicle data (since trip type toggle is removed from UI)
  // We need to fetch the vehicle to get its current trip type
  let tripType = "one-way"; // Default
  
  try {
    const vehicle = await apiService.getVehicle(vehicleId);
    const currentVehicleData = vehicle.data || vehicle;
    if (currentVehicleData?.tripType) {
      tripType = currentVehicleData.tripType;
    }
  } catch (e) {
    console.warn("Could not get trip type from vehicle data, using default one-way");
  }

  // Get date & time
  const bookingDate = document.getElementById("editVehicleDate").value;
  const bookingTime = document.getElementById("editVehicleTime").value;
  const pickupCity = document.getElementById("editVehiclePickupCity").value;
  const dropCity = document.getElementById("editVehicleDropCity").value;

  if (!bookingDate || !bookingTime || !pickupCity || !dropCity) {
    alert("⚠️ Please fill all required fields");
    return;
  }
  
  // Use pickup city as the main location (vehicles typically have single location)
  const city = pickupCity;

  // Validate date is not in past
  const selectedDateTime = new Date(`${bookingDate}T${bookingTime}`);
  const now = new Date();
  if (selectedDateTime < now) {
    alert("⚠️ Availability date and time cannot be in the past");
    return;
  }

  // Determine availability status
  const selectedDate = new Date(bookingDate);
  const [hours, minutes] = bookingTime.split(":").map(Number);
  const selectedDateTimeObj = new Date(selectedDate);
  selectedDateTimeObj.setHours(hours, minutes, 0, 0);

  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const availabilityStatus =
    selectedDate.toDateString() === now.toDateString() &&
    selectedDateTimeObj <= twoHoursFromNow
      ? "available-now"
      : "available-later";

  // Get submit button for loading state
  const submitBtn = document.getElementById("editVehicleSubmitBtn");
  const originalText = submitBtn ? submitBtn.textContent : "Update Vehicle";

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Updating...";
  }

  try {
    const vehicleData = {
      vehicleType: vehicleType,
      tripType: tripType,
      location: {
        city: city,
        address: city, // Can be enhanced later
      },
      availability: {
        date: selectedDateTime.toISOString(),
        time: bookingTime,
        status: availabilityStatus,
      },
      commission:
        parseFloat(document.getElementById("editVehicleCommission").value) || 0,
      customRequirement:
        document.getElementById("editVehicleCustomRequirement").value.trim() ||
        "",
    };

    await apiService.updateVehicle(vehicleId, vehicleData);
    showToast("Vehicle updated successfully ✅");
    closeEditVehicleModal();

    // Reload My Bookings section
    loadMyVehicles(currentMainTab);

    // Reload Dashboard section if available
    if (typeof loadVehiclesFromAPI === "function") {
      loadVehiclesFromAPI();
    }
  } catch (error) {
    console.error("Error updating vehicle:", error);
    alert("Failed to update vehicle: " + (error.message || "Unknown error"));
  } finally {
    // Restore button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

function closeEditVehicleModal() {
  const modal = document.getElementById("editVehicleModal");
  if (modal) {
    modal.classList.remove("show");
    // Reset form
    document.getElementById("editVehicleId").value = "";

    // Reset vehicle type
    document
      .querySelectorAll("#editVehicleModal .vehicle-option")
      .forEach((btn) => {
        btn.classList.remove("selected");
      });

    // Reset date & time
    document.getElementById("editVehicleDate").value = "";
    document.getElementById("editVehicleTime").value = "";

    // Reset cities
    document.getElementById("editVehiclePickupCity").value = "";
    document.getElementById("editVehicleDropCity").value = "";

    // Reset commission
    document.getElementById("editVehicleCommission").value = "0";

    // Removed: Visibility and Requirements reset

    // Reset note
    document.getElementById("editVehicleCustomRequirement").value = "";
    updateEditVehicleCharCount();
  }
}

// Helper functions for edit vehicle modal
// Removed: toggleEditVehicleTripType - Trip type toggle removed from UI

function selectEditVehicle(vehicleType) {
  // Remove selected class from all buttons
  document
    .querySelectorAll("#editVehicleModal .vehicle-option")
    .forEach((btn) => {
      btn.classList.remove("selected");
    });

  // Add selected class to clicked button
  const clickedBtn = document.querySelector(
    `#editVehicleModal [data-vehicle="${vehicleType}"]`
  );
  if (clickedBtn) {
    clickedBtn.classList.add("selected");
  }
}

// Removed: toggleEditVehicleChip function - Extra Requirements section removed

function updateEditVehicleCharCount() {
  const textarea = document.getElementById("editVehicleCustomRequirement");
  const charCount = document.getElementById("editVehicleCharCount");
  if (textarea && charCount) {
    const text = textarea.value.trim();
    const words =
      text === "" ? [] : text.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;

    // Limit to 250 words
    if (wordCount > 250) {
      const wordsArray = text.split(/\s+/).filter((word) => word.length > 0);
      const limitedWords = wordsArray.slice(0, 250).join(" ");
      textarea.value = limitedWords;
      charCount.textContent = `250/250 words`;
      charCount.style.color = "#ff6b6b";
    } else {
      charCount.textContent = `${wordCount}/250 words`;
      charCount.style.color = wordCount > 200 ? "#ffb300" : "#bdbdbd";
    }
  }
}

function validateEditVehicleCommission() {
  const commissionInput = document.getElementById("editVehicleCommission");
  let value = parseFloat(commissionInput.value);

  if (isNaN(value)) {
    value = 0;
  } else if (value < 0) {
    value = 0;
  } else if (value > 100) {
    value = 100;
  }

  commissionInput.value = value;
}

// Populate city dropdowns for edit vehicle modal (pickup and drop)
function populateEditVehicleCityDropdowns() {
  const gujaratCities = [
    "Ahmedabad",
    "Vadodara",
    "Surat",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Anand",
    "Palanpur",
    "Mehsana",
    "Godhra",
    "Navsari",
    "Vapi",
    "Porbandar",
    "Dwarka",
    "Somnath",
    "Palitana",
    "Kutch",
    "Bharuch",
    "Nadiad",
    "Surendranagar",
    "Valsad",
  ];

  const pickupSelect = document.getElementById("editVehiclePickupCity");
  const dropSelect = document.getElementById("editVehicleDropCity");

  if (pickupSelect && dropSelect) {
    // Clear existing options
    pickupSelect.innerHTML = '<option value="">Pickup City</option>';
    dropSelect.innerHTML = '<option value="">Drop City</option>';

    gujaratCities.forEach((city) => {
      const option1 = document.createElement("option");
      option1.value = city;
      option1.textContent = city;
      pickupSelect.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = city;
      option2.textContent = city;
      dropSelect.appendChild(option2);
    });
  }
}

async function updateVehicleStatus(vehicleId) {
  try {
    const vehicle = await apiService.getVehicle(vehicleId);
    const vehicleData = vehicle.data || vehicle;
    const newStatus = prompt(
      "Update vehicle status:\n1. active\n2. assigned\n3. booked\n4. inactive\n\nEnter status:",
      vehicleData.status
    );

    if (newStatus && newStatus !== vehicleData.status) {
      await apiService.updateVehicle(vehicleId, { status: newStatus });
      showToast("Vehicle updated successfully ✅");
      loadMyVehicles(currentMainTab);
    }
  } catch (error) {
    console.error("Error updating vehicle:", error);
    alert("Failed to update vehicle: " + (error.message || "Unknown error"));
  }
}

async function deleteVehicleConfirm(vehicleId) {
  if (
    confirm(
      "⚠️ Are you sure you want to delete this vehicle?\n\nThis action cannot be undone."
    )
  ) {
    try {
      await apiService.deleteVehicle(vehicleId);
      showToast("Vehicle deleted successfully ✅");
      loadMyVehicles(currentMainTab);
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      alert("Failed to delete vehicle: " + (error.message || "Unknown error"));
    }
  }
}

async function submitVehicleComment(vehicleId) {
  const commentInput = document.getElementById(
    `vehicleCommentInput_${vehicleId}`
  );
  const commentText = commentInput?.value.trim();

  if (!commentText) {
    alert("Please enter a comment");
    return;
  }

  try {
    await apiService.addVehicleComment(vehicleId, commentText);
    showToast("Comment added successfully ✅");
    commentInput.value = "";
    toggleVehicleCommentBox(vehicleId);
    loadMyVehicles(currentMainTab);
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Failed to add comment: " + (error.message || "Unknown error"));
  }
}

function toggleVehicleCommentBox(vehicleId) {
  const commentBox = document.getElementById(`vehicleCommentBox_${vehicleId}`);
  if (commentBox) {
    const isVisible = commentBox.style.display !== "none";
    commentBox.style.display = isVisible ? "none" : "flex";
  }
}

// ===== VEHICLE ASSIGNMENT =====
function openAssignVehicleModal(vehicleId) {
  const modal = document.getElementById("assignModal");
  if (modal) {
    modal.classList.add("show");
    modal.dataset.vehicleId = vehicleId;
    modal.dataset.type = "vehicle";
  }
}

async function assignVehicle(partnerId, partnerName) {
  const modal = document.getElementById("assignModal");
  const vehicleId = modal ? modal.dataset.vehicleId : "";
  const type = modal ? modal.dataset.type : "";

  if (type !== "vehicle") {
    return;
  }

  if (!vehicleId) {
    alert("Vehicle ID not found");
    return;
  }

  try {
    await apiService.assignVehicle(vehicleId, partnerId);
    showToast(`Vehicle assigned to ${partnerName} ✅`);
    closeAssignModal();
    loadMyVehicles(currentMainTab);
  } catch (error) {
    console.error("Error assigning vehicle:", error);
    alert("Failed to assign vehicle: " + (error.message || "Unknown error"));
  }
}

// ===== VEHICLE CLOSURE =====
// openCloseVehicleModal is now defined above with openCloseModal
// submitVehicleClosure is merged into submitClosure function above

// Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 [DOMContentLoaded] My Bookings page initialization started");

  // Check authentication
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ [DOMContentLoaded] No authentication token found");
    alert("⚠️ Please login first");
    window.location.href = "/pages/index.html";
    return;
  }
  console.log("✅ [DOMContentLoaded] Authentication token found");

  // Initialize global variables
  currentMainTab = "pending";
  currentSubcategory = "bookings";
  console.log("✅ [DOMContentLoaded] Global variables initialized:", {
    currentMainTab,
    currentSubcategory,
  });

  // Ensure all subcategory content divs exist and are properly initialized
  const pendingBookingsContent = document.getElementById(
    "pendingBookingsContent"
  );
  const pendingVehiclesContent = document.getElementById(
    "pendingVehiclesContent"
  );
  const historyBookingsContent = document.getElementById(
    "historyBookingsContent"
  );
  const historyVehiclesContent = document.getElementById(
    "historyVehiclesContent"
  );

  console.log("🔍 [DOMContentLoaded] Checking containers:", {
    pendingBookingsContent: !!pendingBookingsContent,
    pendingVehiclesContent: !!pendingVehiclesContent,
    historyBookingsContent: !!historyBookingsContent,
    historyVehiclesContent: !!historyVehiclesContent,
  });

  // Hide all subcategory contents first
  [
    pendingBookingsContent,
    pendingVehiclesContent,
    historyBookingsContent,
    historyVehiclesContent,
  ].forEach((div, index) => {
    if (div) {
      div.classList.remove("active");
      console.log(
        `✅ [DOMContentLoaded] Removed active from container ${index}`
      );
    } else {
      console.warn(`⚠️ [DOMContentLoaded] Container ${index} not found`);
    }
  });

  // Show active subcategory content (bookings in pending)
  if (pendingBookingsContent) {
    pendingBookingsContent.classList.add("active");
    console.log("✅ [DOMContentLoaded] Set pendingBookingsContent as active");
  } else {
    console.error("❌ [DOMContentLoaded] pendingBookingsContent not found!");
  }

  // Ensure API service is loaded before making calls
  const loadData = () => {
    console.log("📡 [DOMContentLoaded] Loading data...");
    console.log(
      "📡 [DOMContentLoaded] API service available:",
      typeof apiService !== "undefined"
    );

    if (typeof apiService === "undefined") {
      console.warn(
        "⚠️ [DOMContentLoaded] API service not loaded, loading script..."
      );
      // Load API service first
      const script = document.createElement("script");
      script.src = "js/services/api.js";
      script.onload = () => {
        console.log("✅ [DOMContentLoaded] API service script loaded");
        // Load pending bookings by default
        loadMyBookings("pending");
      };
      script.onerror = () => {
        console.error(
          "❌ [DOMContentLoaded] Failed to load API service script"
        );
        alert("Failed to load API service. Please refresh the page.");
      };
      document.head.appendChild(script);
    } else {
      console.log("✅ [DOMContentLoaded] API service already available");
      // Load pending bookings by default
      loadMyBookings("pending");
    }
  };

  // Wait a bit to ensure DOM is fully ready
  setTimeout(() => {
    loadData();
  }, 100);

  // Add search listener for assign modal
  const partnerSearch = document.getElementById("partnerSearch");
  if (partnerSearch) {
    partnerSearch.addEventListener("input", handlePartnerSearch);
  }

  // Close modals on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAssignModal();
      closeCloseModal();
    }
  });

  console.log("📋 My Bookings page loaded");
});
