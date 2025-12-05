// ===== DRIVING LICENSE VERIFICATION =====
document.addEventListener("DOMContentLoaded", () => {
  const dlForm = document.getElementById("dlForm");
  const dlInput = document.getElementById("dlNumber");
  const verifyButton = document.getElementById("verifyDLButton");
  const dlError = document.getElementById("dlError");

  // Format DL input (alphanumeric)
  dlInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  });

  dlForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dlNumber = dlInput.value.trim();

    // Clear error
    dlError.textContent = "";
    dlError.style.display = "none";

    // Validate DL number
    if (!dlNumber) {
      dlError.textContent = "Driving License number is required";
      dlError.style.display = "block";
      return;
    }

    if (dlNumber.length < 10) {
      dlError.textContent = "Please enter a valid Driving License number";
      dlError.style.display = "block";
      return;
    }

    // Disable button
    verifyButton.disabled = true;
    verifyButton.textContent = "Sending OTP...";

    try {
      // Get user mobile number
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const mobile = userData.mobile || sessionStorage.getItem("currentMobile");

      if (!mobile) {
        throw new Error("Mobile number not found. Please login again.");
      }

      // Store DL number in sessionStorage
      sessionStorage.setItem("pendingDLNumber", dlNumber);

      // Send OTP for DL verification
      if (typeof apiService === "undefined") {
        throw new Error("API service not loaded");
      }

      const response = await apiService.request("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ mobile }),
      });

      if (response.success && response.otp) {
        // Show OTP popup
        showOTPPopup(response.otp, mobile);
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("DL verification error:", error);
      dlError.textContent = error.message || "Failed to send OTP. Please try again.";
      dlError.style.display = "block";
      verifyButton.disabled = false;
      verifyButton.textContent = "Verify Driving License";
    }
  });
});

// ===== OTP POPUP FUNCTIONS =====
let otpPopupTimeout = null;
let isRedirecting = false;

function showOTPPopup(otp, mobile) {
  const popup = document.getElementById("otpPopup");
  const otpCode = document.getElementById("otpCode");
  const otpMobile = document.getElementById("otpPopupMobile");
  const copyBtn = document.getElementById("copyOtpBtn");
  const closeBtn = document.getElementById("closeOtpPopupBtn");
  const copiedMessage = document.getElementById("otpCopiedMessage");

  let redirectTimeout = null;

  const redirectToOTPPage = () => {
    if (isRedirecting) return;
    isRedirecting = true;
    closeOTPPopup();
    // Redirect to OTP input page
    window.location.href = "verify-dl-otp.html";
  };

  // Clear any existing timeout
  if (otpPopupTimeout) {
    clearTimeout(otpPopupTimeout);
    otpPopupTimeout = null;
  }

  // Reset redirect flag
  isRedirecting = false;

  // Set OTP and mobile
  otpCode.textContent = otp;
  otpMobile.textContent = `📱 ${mobile}`;

  // Show popup
  popup.classList.add("show");

  // Copy OTP button - redirect after 1 second (user can see copied message)
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(otp).then(() => {
      copiedMessage.classList.add("show");
      // Clear any existing timeout
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      // Redirect after 1 second (user can see the copied message)
      redirectTimeout = setTimeout(() => {
        redirectToOTPPage();
      }, 1000);
    });
  });

  // Close button - redirect immediately
  closeBtn.addEventListener("click", () => {
    if (redirectTimeout) {
      clearTimeout(redirectTimeout);
    }
    redirectToOTPPage();
  });

  // Close on overlay click - redirect immediately
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      redirectToOTPPage();
    }
  });

  // Auto-redirect after 5 seconds (reduced from 10)
  redirectTimeout = setTimeout(() => {
    redirectToOTPPage();
  }, 5000);
}

function closeOTPPopup() {
  const popup = document.getElementById("otpPopup");
  if (popup) {
    popup.classList.remove("show");
  }
}

