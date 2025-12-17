// OTP Verification handling
document.addEventListener("DOMContentLoaded", () => {
  const otpForm = document.getElementById("otpForm");
  const verifyButton = document.getElementById("verifyButton");
  const resendButton = document.getElementById("resendButton");
  const otpInput = document.getElementById("otpInput");
  const cooldownText = document.getElementById("cooldownText");

  // Get verification type and data from sessionStorage or URL
  const urlParams = new URLSearchParams(window.location.search);
  const verificationType = urlParams.get("type") || "login"; // signup or login
  const userId = sessionStorage.getItem("signupUserId") || sessionStorage.getItem("otpUserId");
  const mobile =
    sessionStorage.getItem("signupMobile") ||
    sessionStorage.getItem("currentMobile");

  // Check if we have required data, if not redirect back to login
  if (!userId && !mobile) {
    console.error("Missing user information - redirecting to login");
    alert("Session expired. Please try again.");
    window.location.href = "index.html";
    return;
  }

  // Update subtitle based on verification type
  const otpSubtitle = document.getElementById("otpSubtitle");
  if (verificationType === "signup") {
    otpSubtitle.textContent = `Enter the OTP sent to ${
      mobile || "your mobile number"
    }`;
  } else if (mobile) {
    // Show masked mobile number for login
    const maskedMobile = mobile.length > 4 
      ? `****${mobile.slice(-4)}` 
      : mobile;
    otpSubtitle.textContent = `Enter the OTP sent to ${maskedMobile}`;
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
      // Check if API service is available
      if (typeof apiService === "undefined") {
        throw new Error("API service not loaded");
      }

      // Prepare verification data
      const verifyData = {
        otp: otp,
      };

      if (userId) {
        verifyData.userId = userId;
      } else if (mobile) {
        verifyData.mobile = mobile;
      } else {
        throw new Error("Missing user information");
      }

      // Call verify OTP API
      const response = await apiService.request("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(verifyData),
      });

      if (response.success) {
        // Store token and user data
        if (response.token) {
          localStorage.setItem("token", response.token);
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }

        // Clear signup session data
        sessionStorage.removeItem("signupUserId");
        sessionStorage.removeItem("signupMobile");
        sessionStorage.removeItem("currentMobile");
        sessionStorage.removeItem("otpUserId");

        // IMPORTANT: Fetch fresh user data from API after login to get latest verification status
        try {
          const freshUserData = await apiService.request("/auth/me");
          if (freshUserData.success && freshUserData.user) {
            localStorage.setItem("user", JSON.stringify(freshUserData.user));
            console.log("✅ Fresh user data loaded after login");
          } else {
            // Fallback to response data
            if (response.user) {
              localStorage.setItem("user", JSON.stringify(response.user));
            }
          }
        } catch (error) {
          console.error("Error fetching fresh user data after login:", error);
          // Fallback to response data
          if (response.user) {
            localStorage.setItem("user", JSON.stringify(response.user));
          }
        }

        // Determine redirect URL based on verification type
        if (verificationType === "signup") {
          // After signup, show success modal first, then language selection
          showSuccessModal(
            "✅ OTP Verified!",
            "Your account has been created successfully.",
            () => {
              // After success modal, show language selection popup (mandatory)
              sessionStorage.setItem("fromSignup", "true");
              setTimeout(() => {
                showLanguageSelectionPopup();
              }, 300);
            }
          );
          return; // Exit early
        } else {
          // After login, ALWAYS go to dashboard
          // Dashboard will handle restrictions/warnings if profile/docs not verified
          showSuccessModal(
            "✅ Phone number verified successfully!",
            "Account activated.",
            () => {
              window.location.href = "dashboard.html";
            }
          );
        }
      } else {
        showError("otpError", response.message || "Invalid or expired OTP");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      showError(
        "otpError",
        error.message || "Failed to verify OTP. Please try again."
      );
    } finally {
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

      // Prepare resend data
      const resendData = {};
      if (userId) {
        resendData.userId = userId;
      } else if (mobile) {
        resendData.mobile = mobile;
      } else {
        throw new Error("Missing user information");
      }

      // Call send OTP API
      const response = await apiService.request("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify(resendData),
      });

      if (response.success) {
        // Update userId if returned
        if (response.userId) {
          sessionStorage.setItem("signupUserId", response.userId);
          sessionStorage.setItem("otpUserId", response.userId);
        }

        // Show OTP popup if OTP is provided (development mode)
        if (response.otp) {
          showOTPPopup(response.otp, mobile || "your mobile");
        } else {
          showSuccessModal(
            "OTP Sent!",
            "A new OTP has been sent to your mobile number."
          );
        }

        // Cooldown removed for prototyping

        // Clear OTP input
        otpInput.value = "";
        otpInput.focus();
      } else {
        showError("otpError", response.message || "Failed to resend OTP");
        resendButton.disabled = false;
        resendButton.textContent = "Resend OTP";
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      showError(
        "otpError",
        error.message || "Failed to resend OTP. Please try again."
      );
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

    // Close button
    closeBtn.onclick = () => {
      closeOTPPopup();
    };

    // Close on overlay click
    popup.onclick = (e) => {
      if (e.target === popup) {
        closeOTPPopup();
      }
    };
  }

  function closeOTPPopup() {
    const popup = document.getElementById("otpPopup");
    if (popup) {
      popup.classList.remove("show");
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

  // ===== LANGUAGE SELECTION (MANDATORY) =====
  let selectedLanguage = null;
  let languageEventListenersAttached = false;

  function attachLanguageEventListeners() {
    // Prevent duplicate listeners
    if (languageEventListenersAttached) {
      return;
    }

    const languageItems = document.querySelectorAll(".language-item");
    const continueButton = document.getElementById("continueLanguageButton");
    const popup = document.getElementById("languagePopup");

    if (!languageItems.length || !continueButton || !popup) {
      console.warn("Language popup elements not found, retrying...");
      setTimeout(attachLanguageEventListeners, 100);
      return;
    }

    // Handle language item clicks
    languageItems.forEach((item) => {
      // Remove old listener by cloning
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);

      // Add fresh listener
      newItem.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const lang = newItem.getAttribute("data-lang");
        if (lang) {
          selectLanguage(lang);
        }
      });
    });

    // Continue button - remove old listener
    const newContinueBtn = continueButton.cloneNode(true);
    continueButton.parentNode.replaceChild(newContinueBtn, continueButton);

    // Get fresh reference
    const freshContinueBtn = document.getElementById("continueLanguageButton");
    if (freshContinueBtn) {
      freshContinueBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (selectedLanguage) {
          saveLanguagePreference(selectedLanguage);
          hideLanguagePopup();

          // Redirect to journey page after language selection
          window.location.href = "account-journey.html";
        } else {
          alert("⚠️ Please select a language to continue");
        }
      });
    }

    // Prevent closing popup by clicking outside (mandatory selection)
    popup.addEventListener("click", (e) => {
      if (e.target.id === "languagePopup" || e.target === popup) {
        // Do not close - language selection is mandatory
        e.stopPropagation();
        e.preventDefault();
      }
    });

    languageEventListenersAttached = true;
    console.log("Language event listeners attached");
  }

  function showLanguageSelectionPopup() {
    const popup = document.getElementById("languagePopup");
    if (popup) {
      // Attach event listeners when popup is shown
      setTimeout(() => {
        attachLanguageEventListeners();
      }, 50);

      popup.classList.add("show");

      // Load saved language if exists
      const savedLang = localStorage.getItem("selectedLanguage");
      if (savedLang) {
        selectLanguage(savedLang);
      }
    }
  }

  function hideLanguagePopup() {
    const popup = document.getElementById("languagePopup");
    if (popup) {
      popup.classList.remove("show");
    }
  }

  function selectLanguage(lang) {
    selectedLanguage = lang;

    // Remove selected class from all items
    document.querySelectorAll(".language-item").forEach((item) => {
      item.classList.remove("selected");
      const checkIcon = item.querySelector(".check-icon");
      if (checkIcon) checkIcon.style.display = "none";
    });

    // Add selected class to clicked item
    const selectedItem = document.querySelector(`[data-lang="${lang}"]`);
    if (selectedItem) {
      selectedItem.classList.add("selected");
      const checkIcon = selectedItem.querySelector(".check-icon");
      if (checkIcon) checkIcon.style.display = "inline";
    }

    // Enable continue button
    const continueBtn = document.getElementById("continueLanguageButton");
    if (continueBtn) {
      continueBtn.disabled = false;
    }
  }

  function saveLanguagePreference(lang) {
    localStorage.setItem("selectedLanguage", lang);
    console.log(`Language saved: ${lang}`);
  }

  // Attach event listeners on page load (backup)
  document.addEventListener("DOMContentLoaded", () => {
    // Try to attach listeners immediately
    attachLanguageEventListeners();
  });
});
