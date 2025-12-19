// ===== GLOBAL VARIABLES =====
let isLoading = false;

// ===== PAGE LOAD ANIMATION =====
window.addEventListener("DOMContentLoaded", async () => {
  // Check and update verification status
  await checkVerificationStatus();

  // Console welcome message
  console.log(
    "%c🔐 Tripeaz Taxi Partners - Identity Verification",
    "font-size: 16px; font-weight: bold; color: #FFB300;"
  );
});

// ===== CHECK VERIFICATION STATUS =====
async function checkVerificationStatus() {
  try {
    // ALWAYS fetch fresh data from API first (especially after login)
    // This ensures we have the latest verification status from database
    let userData = null;

    if (typeof apiService !== "undefined") {
      try {
        const response = await apiService.request("/auth/me");
        if (response.success && response.user) {
          userData = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
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

    if (userData) {
      // Get verification status from user data
      const aadhaarVerified =
        userData.verificationStatus?.aadhaar?.verified || false;
      const dlVerified =
        userData.verificationStatus?.drivingLicense?.verified || false;

      // Store in sessionStorage for UI updates
      sessionStorage.setItem(
        "aadhaarVerified",
        aadhaarVerified ? "true" : "false"
      );
      sessionStorage.setItem("dlVerified", dlVerified ? "true" : "false");

      // Update UI based on status
      updateVerificationBadges();

      // If both verified, redirect to verified success page
      if (aadhaarVerified && dlVerified) {
        sessionStorage.setItem("verified", "true");
        sessionStorage.removeItem("verificationSkipped");
        sessionStorage.removeItem("verificationSkippedUntil");
        // Redirect to verified success page
        setTimeout(() => {
          window.location.href = "/pages/verified_success.html";
        }, 1500);
      }
    } else {
      // Fallback to sessionStorage if no user data
      const aadhaarVerified =
        sessionStorage.getItem("aadhaarVerified") === "true";
      const dlVerified = sessionStorage.getItem("dlVerified") === "true";

      updateVerificationBadges();

      if (aadhaarVerified && dlVerified) {
        sessionStorage.setItem("verified", "true");
        setTimeout(() => {
          window.location.href = "/pages/dashboard.html";
        }, 1500);
      }
    }
  } catch (error) {
    console.error("Error checking verification status:", error);
  }
}

// ===== UPDATE BADGES =====
function updateVerificationBadges() {
  const aadhaarVerified = sessionStorage.getItem("aadhaarVerified") === "true";
  const dlVerified = sessionStorage.getItem("dlVerified") === "true";

  if (aadhaarVerified) {
    const badge = document.getElementById("aadhaarBadge");
    const card = document.getElementById("aadhaarCard");
    const button = document.getElementById("aadhaarButton");

    badge.innerHTML =
      '<span class="badge-icon">✅</span><span class="badge-text">Verified</span>';
    badge.className = "status-badge verified-badge";
    card.classList.add("verified");
    button.textContent = "Verified";
    button.disabled = true;
  }

  if (dlVerified) {
    const badge = document.getElementById("dlBadge");
    const card = document.getElementById("dlCard");
    const button = document.getElementById("dlButton");

    badge.innerHTML =
      '<span class="badge-icon">✅</span><span class="badge-text">Verified</span>';
    badge.className = "status-badge verified-badge";
    card.classList.add("verified");
    button.textContent = "Verified";
    button.disabled = true;
  }
}

// ===== AADHAAR VERIFICATION =====
function handleAadhaarVerification() {
  // Check if already verified
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const aadhaarVerified =
    userData.verificationStatus?.aadhaar?.verified ||
    sessionStorage.getItem("aadhaarVerified") === "true";

  if (aadhaarVerified) {
    alert("Aadhaar is already verified!");
    return;
  }

  // Redirect to Aadhaar verification page
  window.location.href = "/pages/verify-aadhaar.html";
}

// ===== DRIVING LICENSE VERIFICATION =====
function handleLicenseVerification() {
  // Check if already verified
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const dlVerified =
    userData.verificationStatus?.drivingLicense?.verified ||
    sessionStorage.getItem("dlVerified") === "true";

  if (dlVerified) {
    alert("Driving License is already verified!");
    return;
  }

  // Redirect to DL verification page
  window.location.href = "/pages/verify-dl.html";
}

// ===== CHECK IF BOTH VERIFIED =====
function checkIfBothVerified() {
  const aadhaarVerified = sessionStorage.getItem("aadhaarVerified") === "true";
  const dlVerified = sessionStorage.getItem("dlVerified") === "true";

  if (aadhaarVerified && dlVerified) {
    // Show success modal
    showSuccessModal(
      "🎉 Verification Complete!",
      "✅",
      "Redirecting to dashboard..."
    );

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      hideSuccessModal();
      // Clear skip flags
      sessionStorage.removeItem("verificationSkipped");
      sessionStorage.removeItem("verificationSkippedUntil");
      window.location.href = "/pages/dashboard.html";
    }, 2000);
  } else {
    // Show individual success message
    showSuccessModal(
      "DL Verified Successfully!",
      "✅",
      "Complete Aadhaar verification to finish profile setup."
    );

    setTimeout(() => {
      hideSuccessModal();
    }, 2000);
  }
}

// ===== DIGILOCKER VERIFICATION =====
function handleDigiLocker() {
  if (isLoading) return;

  showLoading("Connecting DigiLocker…");

  // Simulate API call
  setTimeout(() => {
    hideLoading();

    showSuccessModal(
      "DigiLocker Connected",
      "☁️🔒",
      "Your documents are now synced!"
    );

    setTimeout(() => {
      hideSuccessModal();
    }, 2000);
  }, 2000);
}

// ===== SKIP VERIFICATION =====
function handleSkip() {
  if (isLoading) return;

  // Show warning modal
  showWarningModal();
}

// ===== WARNING MODAL HANDLERS =====
function handleVerifyNow() {
  hideWarningModal();
  // Stay on page - user can now verify
}

function handleContinueAnyway() {
  hideWarningModal();

  showLoading("Redirecting to dashboard...");

  setTimeout(() => {
    hideLoading();

    // Mark as skipped for this session (will show popup again on next login)
    sessionStorage.setItem("verificationSkipped", "true");
    sessionStorage.setItem("verified", "false");

    // Redirect to dashboard with warning
    window.location.href = "/pages/dashboard.html";
  }, 1500);
}

// ===== LOADING OVERLAY FUNCTIONS =====
function showLoading(text = "Verifying...") {
  isLoading = true;
  const overlay = document.getElementById("loadingOverlay");
  const loadingText = document.getElementById("loadingText");

  loadingText.textContent = text;
  overlay.classList.add("show");

  // Disable buttons while loading
  document.querySelectorAll(".verify-button").forEach((button) => {
    button.disabled = true;
    button.style.opacity = "0.6";
  });
}

function hideLoading() {
  isLoading = false;
  const overlay = document.getElementById("loadingOverlay");
  overlay.classList.remove("show");

  // Re-enable buttons
  document.querySelectorAll(".verify-button").forEach((button) => {
    button.disabled = false;
    button.style.opacity = "1";
  });
}

// ===== SUCCESS MODAL FUNCTIONS =====
function showSuccessModal(title, icon, message) {
  const modal = document.getElementById("successModal");
  const modalTitle = document.getElementById("successTitle");
  const modalIcon = document.getElementById("successIcon");
  const modalMessage = document.getElementById("successMessage");

  modalTitle.textContent = title;
  modalIcon.textContent = icon;
  modalMessage.textContent = message;
  modal.classList.add("show");
}

function hideSuccessModal() {
  const modal = document.getElementById("successModal");
  modal.classList.remove("show");
}

// ===== WARNING MODAL FUNCTIONS =====
function showWarningModal() {
  const modal = document.getElementById("warningModal");
  modal.classList.add("show");
}

function hideWarningModal() {
  const modal = document.getElementById("warningModal");
  modal.classList.remove("show");
}

// ===== UTILITY FUNCTIONS =====
function scrollToDLCard() {
  const dlCard = document.getElementById("dlCard");
  if (dlCard) {
    console.log("📍 Scrolling to DL card instantly...");

    // Add fade-in animation class immediately
    dlCard.classList.add("dl-next-step");

    // Start scroll immediately (no delay for instant response)
    dlCard.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    // Highlight the card with pulse animation and gold glow instantly
    dlCard.style.animation = "pulseHighlight 2s ease-in-out";
    dlCard.style.border = "2px solid rgba(255, 179, 0, 0.6)";
    dlCard.style.boxShadow = "0 12px 50px rgba(255, 179, 0, 0.5)";

    // Remove the highlight after animation completes
    setTimeout(() => {
      dlCard.style.animation = "";
      dlCard.style.border = "";
      dlCard.style.boxShadow = "";
      console.log("✅ DL card visible and ready");
    }, 2000);
  } else {
    console.error("❌ DL card element not found");
  }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener("keydown", (e) => {
  // Escape key to close modals
  if (e.key === "Escape") {
    hideSuccessModal();
    hideWarningModal();
  }
});

// ===== CARD CLICK ENHANCEMENT =====
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".verification-card");

  cards.forEach((card) => {
    // Add ripple effect on click
    card.addEventListener("click", (e) => {
      // Don't trigger if clicking the button directly
      if (e.target.classList.contains("verify-button")) {
        return;
      }

      // Trigger button click if clicking card
      const button = card.querySelector(".verify-button");
      if (button && !button.disabled) {
        button.click();
      }
    });

    // Add enter key support
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const button = card.querySelector(".verify-button");
        if (button && !button.disabled) {
          button.click();
        }
      }
    });
  });
});

// ===== ANIMATION KEYFRAMES (inline style) =====
const style = document.createElement("style");
style.textContent = `
  @keyframes pulseHighlight {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes instantReveal {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .dl-next-step {
    animation: instantReveal 0.3s ease forwards;
  }
`;
document.head.appendChild(style);
