// Aadhaar OTP Verification handling
document.addEventListener("DOMContentLoaded", () => {
  const otpForm = document.getElementById("otpForm");
  const verifyButton = document.getElementById("verifyButton");
  const resendButton = document.getElementById("resendButton");
  const otpInput = document.getElementById("otpInput");
  const cooldownText = document.getElementById("cooldownText");

  // Get OTP and mobile from sessionStorage (from OTP popup)
  const storedOTP = sessionStorage.getItem("aadhaarOTP");
  const storedMobile = sessionStorage.getItem("aadhaarOTPMobile");

  // Clear sessionStorage immediately (user has already seen the OTP on previous page)
  if (storedOTP) {
    sessionStorage.removeItem("aadhaarOTP");
  }
  if (storedMobile) {
    sessionStorage.removeItem("aadhaarOTPMobile");
  }

  // Update subtitle with mobile number if available
  const otpSubtitle = document.getElementById("otpSubtitle");
  if (storedMobile) {
    otpSubtitle.textContent = `Enter the OTP sent to ${storedMobile}`;
  }

  // Format OTP input (only numbers)
  otpInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  // Auto-submit on 6 digits
  otpInput.addEventListener("input", (e) => {
    if (e.target.value.length === 6) {
      otpForm.dispatchEvent(new Event("submit"));
    }
  });

  // Cooldown removed for prototyping - resend button always enabled
  resendButton.disabled = false;

  // Form submission
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const otp = otpInput.value.trim();

    if (otp.length !== 6) {
      showError("otpError", "Please enter a valid 6-digit OTP");
      return;
    }

    // Clear error
    document.getElementById("otpError").textContent = "";

    // Disable button and show loading
    verifyButton.disabled = true;
    verifyButton.textContent = "Verifying...";

    try {
      // Verify Aadhaar OTP
      await verifyAadhaarOTP(otp);
    } catch (error) {
      console.error("Aadhaar OTP verification error:", error);
      showError("otpError", error.message || "Failed to verify OTP. Please try again.");
      verifyButton.disabled = false;
      verifyButton.textContent = "Verify OTP";
    }
  });

  // Resend OTP
  resendButton.addEventListener("click", async () => {
    if (resendButton.disabled) return;

    resendButton.disabled = true;
    resendButton.textContent = "Sending...";

    try {
      // Check if API service is available
      if (typeof apiService === "undefined") {
        throw new Error("API service not loaded");
      }

      // Get user mobile number
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const mobile = userData.mobile || sessionStorage.getItem("currentMobile");

      if (!mobile) {
        throw new Error("Mobile number not found. Please login again.");
      }

      // Call send OTP API
      const response = await apiService.request("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ mobile }),
      });

      if (response.success) {
        // Show OTP popup if OTP is provided (development mode)
        if (response.otp) {
          showOTPPopup(response.otp, mobile);
        } else {
          showSuccessModal("OTP Sent!", "A new OTP has been sent to your mobile number.");
        }

        // Cooldown removed for prototyping

        // Clear OTP input
        otpInput.value = "";
        otpInput.focus();
      } else {
        throw new Error(response.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      showError("otpError", error.message || "Failed to resend OTP. Please try again.");
      resendButton.disabled = false;
      resendButton.textContent = "Resend OTP";
    }
  });

  function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      errorElement.style.color = "#f44336";
    }
  }

  // OTP Popup functions
  function showOTPPopup(otp, mobile) {
    const popup = document.getElementById("otpPopup");
    const otpCode = document.getElementById("otpCode");
    const otpMobile = document.getElementById("otpPopupMobile");
    const copyBtn = document.getElementById("copyOtpBtn");
    const closeBtn = document.getElementById("closeOtpPopupBtn");
    const copiedMessage = document.getElementById("otpCopiedMessage");

    if (!popup || !otpCode || !otpMobile) {
      console.error("OTP popup elements not found");
      return;
    }

    // Set OTP and mobile
    otpCode.textContent = otp;
    otpMobile.textContent = `📱 ${mobile}`;

    // Show popup
    popup.classList.add("show");

    // Copy OTP button
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(otp).then(() => {
        copiedMessage.classList.add("show");
        setTimeout(() => {
          copiedMessage.classList.remove("show");
        }, 2000);
      });
    };

    // Close button - just close, user will enter OTP on page
    closeBtn.onclick = () => {
      closeOTPPopup();
    };

    // Close on overlay click
    popup.onclick = (e) => {
      if (e.target === popup) {
        closeOTPPopup();
      }
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (popup.classList.contains("show")) {
        closeOTPPopup();
      }
    }, 10000);
  }

  function closeOTPPopup() {
    const popup = document.getElementById("otpPopup");
    if (popup) {
      popup.classList.remove("show");
    }
  }

  // Verify Aadhaar OTP
  async function verifyAadhaarOTP(otp) {
    try {
      // Get stored Aadhaar number
      const aadhaarNumber = sessionStorage.getItem("pendingAadhaarNumber");
      if (!aadhaarNumber) {
        throw new Error("Aadhaar number not found. Please start again.");
      }

      // Call backend API
      if (typeof apiService === "undefined") {
        throw new Error("API service not loaded");
      }

      const response = await apiService.request("/verification/aadhaar", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: aadhaarNumber,
          otp: otp
        }),
      });

      if (!response.success) {
        throw new Error(response.message || "Verification failed");
      }

      // Update localStorage with fresh user data from backend
      const userResponse = await apiService.request("/auth/me");
      if (userResponse.success && userResponse.user) {
        localStorage.setItem("user", JSON.stringify(userResponse.user));
      }

      // Store verification status in sessionStorage
      sessionStorage.setItem("aadhaarVerified", "true");

      // Clear pending Aadhaar number
      sessionStorage.removeItem("pendingAadhaarNumber");

      // Get updated user data
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Check if DL is also verified
      const dlVerified = userData.verificationStatus?.drivingLicense?.verified || false;

      if (dlVerified) {
        // Both verified, redirect to success page
        showSuccessModal("✅ Aadhaar Verified!", "Both Aadhaar and Driving License are now verified.", () => {
          window.location.href = "verified_success.html";
        });
      } else {
        // Only Aadhaar verified, show success and redirect to verification page
        showSuccessModal("✅ Aadhaar Verified!", "Your Aadhaar has been verified successfully.", () => {
          window.location.href = "verification.html";
        });
      }
    } catch (error) {
      console.error("Aadhaar OTP verification error:", error);
      throw error;
    }
  }

  // Success Modal functions
  function showSuccessModal(title, message, onClose) {
    const modal = document.getElementById("successModal");
    const modalTitle = document.getElementById("successModalTitle");
    const modalMessage = document.getElementById("successModalMessage");
    const modalBtn = document.getElementById("successModalBtn");

    if (!modal || !modalTitle || !modalMessage || !modalBtn) {
      console.error("Success modal elements not found");
      return;
    }

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add("show");

    // OK button click
    modalBtn.onclick = () => {
      hideSuccessModal();
      if (onClose) {
        onClose();
      }
    };

    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) {
        hideSuccessModal();
        if (onClose) {
          onClose();
        }
      }
    };

    // Auto-close after 2 seconds if onClose is provided
    if (onClose) {
      setTimeout(() => {
        if (modal.classList.contains("show")) {
          hideSuccessModal();
          onClose();
        }
      }, 2000);
    }
  }

  function hideSuccessModal() {
    const modal = document.getElementById("successModal");
    if (modal) {
      modal.classList.remove("show");
    }
  }
});

