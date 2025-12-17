// ===== GLOBAL VARIABLES =====
let selectedLanguage = null;

// ===== PRELOADER LOGIC =====
window.addEventListener("DOMContentLoaded", async () => {
  const preloader = document.getElementById("preloader");
  const mainContent = document.getElementById("mainContent");

  // User info display removed from preloader as per user request

  // Hide preloader after 2.5 seconds and show main content
  setTimeout(() => {
    preloader.classList.add("fade-out");

    setTimeout(() => {
      preloader.style.display = "none";
      mainContent.classList.add("show");
    }, 800);
  }, 2500);
});

// Helper function to display user info
function displayUserInfo(
  user,
  nameElement,
  mobileElement,
  contentElement,
  loadingElement
) {
  if (!user) return;

  const displayName = user.name || user.fullName || "User";
  const displayMobile = formatPhoneNumber(user.mobile || user.phone || "");

  nameElement.textContent = displayName;
  mobileElement.textContent = displayMobile;

  // Hide loading, show content
  loadingElement.style.display = "none";
  contentElement.style.display = "block";
}

// Helper function to format phone number
function formatPhoneNumber(mobile) {
  if (!mobile) return "-";

  // Remove any non-digit characters
  const digits = mobile.replace(/\D/g, "");

  // If 10 digits, add +91
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // If already has country code
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return `+91 ${mobile}`;
}

// Helper function to hide user info on error
function hideUserInfo(userInfoElement, loadingElement) {
  userInfoElement.style.display = "none";
  loadingElement.style.display = "none";
}

// ===== CHECK FIRST VISIT & SHOW LANGUAGE POPUP =====
// Note: Language popup now opens after OTP is sent (see showOTPAlert function)
// This auto-open is disabled to follow the new flow

// ===== LOGIN FORM HANDLING =====
document.addEventListener("DOMContentLoaded", () => {
  // Tab switching
  const loginTabs = document.querySelectorAll(".login-tab");
  const passwordForm = document.getElementById("passwordLoginForm");
  const otpForm = document.getElementById("otpLoginForm");

  loginTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabType = tab.dataset.tab;

      // Update active tab
      loginTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Show/hide forms
      if (tabType === "password") {
        passwordForm.style.display = "block";
        otpForm.style.display = "none";
      } else {
        passwordForm.style.display = "none";
        otpForm.style.display = "block";
      }
    });
  });

  // Password Login Form
  const passwordLoginForm = document.getElementById("passwordLoginForm");
  const passwordLoginButton = document.getElementById("passwordLoginButton");
  const mobileInput = document.getElementById("mobileNumber");
  const passwordInput = document.getElementById("password");

  // Format mobile number input (only numbers)
  mobileInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  passwordLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mobile = mobileInput.value.trim();
    const password = passwordInput.value;

    // Clear errors
    document.getElementById("mobileError").textContent = "";
    document.getElementById("passwordError").textContent = "";

    // Validate
    if (!validateMobileNumber(mobile)) {
      document.getElementById("mobileError").textContent =
        "Please enter a valid 10-digit mobile number";
      document.getElementById("mobileError").style.display = "block";
      return;
    }

    if (!password) {
      document.getElementById("passwordError").textContent =
        "Password is required";
      document.getElementById("passwordError").style.display = "block";
      return;
    }

    // Disable button
    passwordLoginButton.disabled = true;
    passwordLoginButton.textContent = "Logging in...";

    try {
      // Check if API service is available
      if (typeof apiService === "undefined") {
        throw new Error("API service not loaded");
      }

      // Call login API
      const response = await apiService.request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ mobile, password }),
      });

      if (response.success) {
        // Store tokens and user data
        if (response.token) {
          localStorage.setItem("token", response.token);
        }
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }

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

        // ALWAYS redirect to dashboard after login
        // Dashboard will handle restrictions/warnings if profile/docs not verified
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("passwordError").textContent =
          response.message || "Invalid mobile number or password";
        document.getElementById("passwordError").style.display = "block";
      }
    } catch (error) {
      console.error("Login error:", error);
      document.getElementById("passwordError").textContent =
        error.message || "Failed to login. Please try again.";
      document.getElementById("passwordError").style.display = "block";
    } finally {
      passwordLoginButton.disabled = false;
      passwordLoginButton.textContent = "Login";
    }
  });

  // OTP Login Form
  const otpLoginForm = document.getElementById("otpLoginForm");
  const otpButton = document.getElementById("otpButton");
  const otpMobileInput = document.getElementById("otpMobileNumber");

  // Format mobile number input (only numbers)
  otpMobileInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  otpLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mobileNumber = otpMobileInput.value.trim();

    // Clear error
    document.getElementById("otpMobileError").textContent = "";

    // Validate mobile number
    if (!validateMobileNumber(mobileNumber)) {
      document.getElementById("otpMobileError").textContent =
        "Please enter a valid 10-digit mobile number";
      document.getElementById("otpMobileError").style.display = "block";
      return;
    }

    // Store current mobile number for session
    sessionStorage.setItem("currentMobile", mobileNumber);

    // Disable button
    otpButton.disabled = true;
    otpButton.textContent = "Sending...";

    try {
      // Check if API service is available
      if (typeof apiService === "undefined") {
        throw new Error("API service not loaded");
      }

      // Send OTP
      const response = await apiService.request("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ mobile: mobileNumber }),
      });

      if (response.success) {
        // Store userId if provided (needed for OTP verification)
        if (response.userId) {
          sessionStorage.setItem("otpUserId", response.userId);
        }
        
        // Show OTP popup if OTP is provided (development mode)
        if (response.otp) {
          showOTPPopup(response.otp, mobileNumber);
        } else {
          // Redirect to OTP verification
          window.location.href = "/pages/otp-verification.html?type=login";
        }
      } else {
        document.getElementById("otpMobileError").textContent =
          response.message || "Failed to send OTP";
        document.getElementById("otpMobileError").style.display = "block";
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      document.getElementById("otpMobileError").textContent =
        error.message || "Failed to send OTP. Please try again.";
      document.getElementById("otpMobileError").style.display = "block";
    } finally {
      otpButton.disabled = false;
      otpButton.textContent = "Send OTP";
    }
  });
});

// ===== MOBILE NUMBER VALIDATION =====
function validateMobileNumber(number) {
  // Check if it's exactly 10 digits
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(number);
}

// ===== OTP POPUP FUNCTIONS =====
function showOTPPopup(otp, mobile) {
  const popup = document.getElementById("otpPopup");
  const otpCode = document.getElementById("otpCode");
  const otpMobile = document.getElementById("otpPopupMobile");
  const copyBtn = document.getElementById("copyOtpBtn");
  const closeBtn = document.getElementById("closeOtpPopupBtn");
  const copiedMessage = document.getElementById("otpCopiedMessage");

  let redirectTimeout = null;

  const redirectToOTPPage = () => {
    closeOTPPopup();
    // Redirect to OTP verification after closing
    window.location.href = "/pages/otp-verification.html?type=login";
  };

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

// ===== OTP ALERT =====
async function showOTPAlert(mobileNumber) {
  const maskedNumber = maskMobileNumber(mobileNumber);

  try {
    // Check if API service is loaded
    if (typeof apiService === "undefined") {
      // Load API service
      const script = document.createElement("script");
      script.src = "js/services/api.js";
      document.head.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    // Send OTP to backend
    const sendResponse = await apiService.sendOTP(mobileNumber);

    // In development, show OTP in console
    if (sendResponse.otp) {
      console.log(`🔑 OTP for ${mobileNumber}: ${sendResponse.otp}`);
    }

    alert(
      `📱 OTP sent to ${maskedNumber}!\n\n${
        sendResponse.otp
          ? `(Dev Mode - OTP: ${sendResponse.otp})`
          : "Please check your phone for the OTP."
      }`
    );

    // Prompt for OTP
    const otp = prompt(`Enter OTP sent to ${maskedNumber}:`);

    if (otp && otp.trim()) {
      // Verify OTP
      const response = await apiService.verifyOTP(mobileNumber, otp.trim());

      if (response.token || response.data?.token) {
        alert("✅ Login successful!");

        // IMPORTANT: Fetch fresh user data from API after login to get latest verification status
        try {
          const freshUserData = await apiService.request("/auth/me");
          if (freshUserData.success && freshUserData.user) {
            localStorage.setItem("user", JSON.stringify(freshUserData.user));
            console.log("✅ Fresh user data loaded after login");
          } else {
            // Fallback to verifyOTP response data
            if (response.user || response.data?.user) {
              localStorage.setItem(
                "user",
                JSON.stringify(response.user || response.data.user)
              );
            }
          }
        } catch (error) {
          console.error("Error fetching fresh user data after login:", error);
          // Fallback to verifyOTP response data
          if (response.user || response.data?.user) {
            localStorage.setItem(
              "user",
              JSON.stringify(response.user || response.data.user)
            );
          }
        }

        // ALWAYS redirect to dashboard after login
        // Dashboard will handle restrictions/warnings if profile/docs not verified
        window.location.href = "dashboard.html";
      } else {
        alert("❌ Invalid OTP. Please try again.");
      }
    } else {
      alert("⚠️ OTP is required to continue.");
    }
  } catch (error) {
    console.error("OTP Error:", error);
    console.error("Full error:", error);

    // Show user-friendly error message
    let errorMessage = error.message || "Failed to send OTP. Please try again.";

    if (
      errorMessage.includes("Cannot connect to server") ||
      errorMessage.includes("fetch")
    ) {
      errorMessage =
        "❌ Backend server connection failed!\n\nPlease make sure:\n1. Backend server is running on port 5000\n2. Check browser console for details";
    }

    alert(`⚠️ ${errorMessage}`);
  }
}

// ===== MASK MOBILE NUMBER =====
function maskMobileNumber(number) {
  if (number.length !== 10) return number;
  return `${number.substring(0, 3)}XXX${number.substring(6)}`;
}

// ===== ERROR MESSAGE =====
function showError(message) {
  alert(`⚠️ ${message}`);
}

// ===== HELP MESSAGE =====
function showHelpMessage() {
  alert(
    "📞 Need Help?\n\nFor support, please contact:\n\nPhone: +91-9103774717\nEmail: support@tripeaztaxi.com\n\nOffice Hours: 9 AM - 6 PM (IST)"
  );
}

// ===== LANGUAGE POPUP FUNCTIONS =====
function showLanguagePopup() {
  const popup = document.getElementById("languagePopup");
  popup.classList.add("show");

  // Load saved language if exists
  const savedLang = localStorage.getItem("selectedLanguage");
  if (savedLang) {
    selectLanguage(savedLang);
  }
}

function hideLanguagePopup() {
  const popup = document.getElementById("languagePopup");
  popup.classList.remove("show");
}

// ===== LANGUAGE SELECTION =====
document.addEventListener("DOMContentLoaded", () => {
  const languageItems = document.querySelectorAll(".language-item");
  const closePopup = document.getElementById("closePopup");
  const continueButton = document.getElementById("continueButton");

  // Handle language item clicks
  languageItems.forEach((item) => {
    item.addEventListener("click", () => {
      const lang = item.dataset.lang;
      selectLanguage(lang);
    });
  });

  // Close popup button
  closePopup.addEventListener("click", () => {
    // If no language selected, select English as default
    if (!selectedLanguage) {
      selectedLanguage = "english";
      saveLanguagePreference("english");
    }
    hideLanguagePopup();
    // Check if it's login or signup flow
    const urlParams = new URLSearchParams(window.location.search);
    const verificationType = urlParams.get("type");
    const fromSignup = sessionStorage.getItem("fromSignup") === "true";

    if (verificationType === "login" || fromSignup === false) {
      // Login flow: Go directly to dashboard
      window.location.href = "dashboard.html";
    } else {
      // Signup flow: Go to journey page
      window.location.href = "account-journey.html";
    }
  });

  // Continue button
  continueButton.addEventListener("click", () => {
    if (selectedLanguage) {
      saveLanguagePreference(selectedLanguage);
      hideLanguagePopup();
      // Check if it's login or signup flow
      const urlParams = new URLSearchParams(window.location.search);
      const verificationType = urlParams.get("type");
      const fromSignup = sessionStorage.getItem("fromSignup") === "true";

      if (verificationType === "login" || fromSignup === false) {
        // Login flow: Go directly to dashboard
        window.location.href = "dashboard.html";
      } else {
        // Signup flow: Go to journey page
        window.location.href = "account-journey.html";
      }
    } else {
      alert("Please select a language to continue");
    }
  });

  // Close popup when clicking outside
  document.getElementById("languagePopup").addEventListener("click", (e) => {
    if (e.target.id === "languagePopup") {
      // If no language selected, select English as default
      if (!selectedLanguage) {
        selectedLanguage = "english";
        saveLanguagePreference("english");
      }
      hideLanguagePopup();
      // Check if it's login or signup flow
      const urlParams = new URLSearchParams(window.location.search);
      const verificationType = urlParams.get("type");
      const fromSignup = sessionStorage.getItem("fromSignup") === "true";

      if (verificationType === "login" || fromSignup === false) {
        // Login flow: Go directly to dashboard
        window.location.href = "dashboard.html";
      } else {
        // Signup flow: Go to journey page
        window.location.href = "account-journey.html";
      }
    }
  });
});

// ===== SELECT LANGUAGE =====
function selectLanguage(lang) {
  selectedLanguage = lang;

  // Remove selected class from all items
  document.querySelectorAll(".language-item").forEach((item) => {
    item.classList.remove("selected");
  });

  // Add selected class to clicked item
  const selectedItem = document.querySelector(`[data-lang="${lang}"]`);
  if (selectedItem) {
    selectedItem.classList.add("selected");
  }
}

// ===== SAVE LANGUAGE PREFERENCE =====
function saveLanguagePreference(lang) {
  localStorage.setItem("selectedLanguage", lang);
  localStorage.setItem("hasVisited", "true");

  // Show confirmation
  console.log(`Language saved: ${lang}`);

  // You can add language switching logic here
  switchLanguage(lang);
}

// ===== SWITCH LANGUAGE (Future Implementation) =====
function switchLanguage(lang) {
  // This function can be expanded to actually switch content language
  // For now, it's a placeholder for future implementation

  const languageNames = {
    english: "English",
    hindi: "Hindi",
    gujarati: "Gujarati",
    tamil: "Tamil",
    telugu: "Telugu",
    marathi: "Marathi",
  };

  console.log(`Interface switched to: ${languageNames[lang] || "English"}`);

  // You can add dynamic content switching here
  // Example: Update text content based on selected language
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener("keydown", (e) => {
  // Escape key to close language popup
  if (e.key === "Escape") {
    const popup = document.getElementById("languagePopup");
    if (popup.classList.contains("show")) {
      if (!selectedLanguage) {
        selectedLanguage = "english";
        saveLanguagePreference("english");
      }
      hideLanguagePopup();
    }
  }

  // Enter key to submit login form
  if (e.key === "Enter" && e.target.id === "mobileNumber") {
    document.getElementById("loginForm").dispatchEvent(new Event("submit"));
  }
});

// ===== UTILITY FUNCTIONS =====

// Smooth scroll to element (if needed)
function smoothScrollTo(element) {
  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// Format mobile number with spaces (visual only)
function formatMobileNumber(value) {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, "");

  // Add space after 5 digits for better readability
  if (cleaned.length <= 5) {
    return cleaned;
  }
  return `${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
}

// ===== CLEAR VERIFICATION DATA =====
function clearVerificationData() {
  // Clear localStorage verification status
  localStorage.removeItem("aadhaarVerified");
  localStorage.removeItem("dlVerified");

  // Clear sessionStorage verification status
  sessionStorage.removeItem("aadhaarVerified");
  sessionStorage.removeItem("dlVerified");

  console.log("✅ Verification data cleared for fresh session");
}

// ===== REDIRECT TO VERIFICATION PAGE =====
function redirectToVerification() {
  // Add a small delay for smooth transition
  setTimeout(() => {
    window.location.href = "verification.html";
  }, 500);
}

// ===== CONSOLE WELCOME MESSAGE =====
console.log(
  "%c🚖 Tripeaz Taxi Partners",
  "font-size: 20px; font-weight: bold; color: #FFB300;"
);
console.log(
  "%cPowered by Wolfron Technologies",
  "font-size: 12px; color: #BDBDBD;"
);
console.log(
  "%cMade in India | Supported by Govt. of Gujarat & Govt. of India",
  "font-size: 10px; color: #666;"
);
