// Signup form handling
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const signupButton = document.getElementById("signupButton");

  // Format mobile number input (only numbers)
  const mobileInput = document.getElementById("mobileNumber");
  mobileInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  // Real-time password validation
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  passwordInput.addEventListener("input", validatePassword);
  confirmPasswordInput.addEventListener("input", validateConfirmPassword);

  // Form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous errors
    clearErrors();

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    // Disable button and show loading
    signupButton.disabled = true;
    signupButton.textContent = "Creating Account...";

    try {
      const formData = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        businessName: document.getElementById("businessName").value.trim(),
        dob: document.getElementById("dobHidden").value || document.getElementById("dob").value,
        gender: document.getElementById("gender").value,
        mobile: document.getElementById("mobileNumber").value.trim(),
        email: document.getElementById("email").value.trim() || undefined,
        password: document.getElementById("password").value,
        confirmPassword: document.getElementById("confirmPassword").value,
      };

      // Check if API service is available
      if (typeof apiService === "undefined") {
        throw new Error("API service not loaded");
      }

      // Call signup API
      const response = await apiService.request("/auth/signup", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response.success) {
        // Store userId for OTP verification
        sessionStorage.setItem("signupUserId", response.userId);
        sessionStorage.setItem("signupMobile", formData.mobile);

        // Show OTP popup if OTP is provided (development mode)
        if (response.otp) {
          showOTPPopup(response.otp, formData.mobile);
        } else {
          // Redirect to OTP verification after a short delay
          setTimeout(() => {
            window.location.href = "/pages/otp-verification.html?type=signup";
          }, 1000);
        }
      } else {
        // Map backend errors to specific field error elements
        const errorMsg = response.message || "Failed to create account";
        let errorShown = false;
        
        // Check for specific field errors and show in appropriate place
        if (errorMsg.includes("First name")) {
          showError("firstNameError", errorMsg);
          errorShown = true;
        } else if (errorMsg.includes("Last name")) {
          showError("lastNameError", errorMsg);
          errorShown = true;
        } else if (errorMsg.includes("Business name")) {
          showError("businessNameError", errorMsg);
          errorShown = true;
        } else if (errorMsg.includes("Date of birth") || errorMsg.includes("DOB") || errorMsg.includes("dob")) {
          showError("dobError", errorMsg);
          errorShown = true;
        } else if (errorMsg.includes("Gender") || errorMsg.includes("gender")) {
          showError("genderError", errorMsg);
          errorShown = true;
        } else if (errorMsg.includes("Mobile") || errorMsg.includes("mobile")) {
          showError("mobileError", errorMsg);
          errorShown = true;
        } else if (errorMsg.includes("Email") || errorMsg.includes("email")) {
          showError("emailError", errorMsg);
          errorShown = true;
        } else if (errorMsg.includes("Password") || errorMsg.includes("password")) {
          showError("passwordError", errorMsg);
          errorShown = true;
        } else if (errorMsg.includes("Name must be at least") || errorMsg.includes("First name and last name")) {
          // This could be from name field validation - show in firstName field
          showError("firstNameError", errorMsg.includes("First name and last name") ? errorMsg : "Please ensure first name and last name are at least 2 characters each");
          errorShown = true;
        }
        
        // If no specific field error, show in general error area
        if (!errorShown) {
          showError("signupError", errorMsg);
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      const errorMsg = error.message || "Failed to create account. Please try again.";
      
      // Try to map error to specific field
      if (errorMsg.includes("First name") || errorMsg.includes("firstName")) {
        showError("firstNameError", errorMsg);
      } else if (errorMsg.includes("Last name") || errorMsg.includes("lastName")) {
        showError("lastNameError", errorMsg);
      } else if (errorMsg.includes("Business name") || errorMsg.includes("businessName")) {
        showError("businessNameError", errorMsg);
      } else {
        showError("signupError", errorMsg);
      }
    } finally {
      signupButton.disabled = false;
      signupButton.textContent = "Create Account";
    }
  });

  // Validation functions
  function validateForm() {
    let isValid = true;

    // Validate first name
    const firstName = document.getElementById("firstName").value.trim();
    if (firstName.length < 2) {
      showError("firstNameError", "First name must be at least 2 characters long");
      isValid = false;
    }

    // Validate last name
    const lastName = document.getElementById("lastName").value.trim();
    if (lastName.length < 2) {
      showError("lastNameError", "Last name must be at least 2 characters long");
      isValid = false;
    }

    // Validate business name
    const businessName = document.getElementById("businessName").value.trim();
    if (businessName.length < 2) {
      showError("businessNameError", "Business name must be at least 2 characters long");
      isValid = false;
    }

    // Validate DOB
    const dobHidden = document.getElementById("dobHidden");
    const dobDisplay = document.getElementById("dob").value;
    const dob = (dobHidden && dobHidden.value) || dobDisplay;
    
    if (!dob) {
      showError("dobError", "Date of birth is required");
      isValid = false;
    } else {
      // Parse date (handle both yyyy-mm-dd and dd-mm-yyyy formats)
      let dobDate;
      if (dob.includes("-")) {
        const parts = dob.split("-");
        if (parts.length === 3) {
          // Check if it's yyyy-mm-dd or dd-mm-yyyy
          if (parts[0].length === 4) {
            // yyyy-mm-dd format
            dobDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            // dd-mm-yyyy format
            dobDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        } else {
          showError("dobError", "Please select a valid date");
          isValid = false;
          return isValid;
        }
      } else {
        dobDate = new Date(dob);
      }
      
      if (isNaN(dobDate.getTime())) {
        showError("dobError", "Please select a valid date");
        isValid = false;
      } else {
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        const dayDiff = today.getDate() - dobDate.getDate();
        if (age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && dayDiff < 0)) {
          showError("dobError", "You must be at least 18 years old");
          isValid = false;
        }
      }
    }

    // Validate gender
    const gender = document.getElementById("gender").value;
    if (!gender) {
      showError("genderError", "Please select your gender");
      isValid = false;
    }

    // Validate mobile
    const mobile = document.getElementById("mobileNumber").value.trim();
    if (!/^[0-9]{10}$/.test(mobile)) {
      showError("mobileError", "Please enter a valid 10-digit mobile number");
      isValid = false;
    }

    // Validate email (optional but must be valid if provided)
    const email = document.getElementById("email").value.trim();
    if (email && !validateEmail(email)) {
      showError("emailError", "Please enter a valid email address");
      isValid = false;
    }

    // Validate password
    if (!validatePassword()) {
      isValid = false;
    }

    // Validate confirm password
    if (!validateConfirmPassword()) {
      isValid = false;
    }

    return isValid;
  }

  function validatePassword() {
    const password = passwordInput.value;
    const passwordError = document.getElementById("passwordError");

    if (!password) {
      passwordError.textContent = "";
      return false;
    }

    // Password strength validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      passwordError.textContent =
        "Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)";
      passwordError.style.display = "block";
      return false;
    }

    passwordError.textContent = "";
    passwordError.style.display = "none";
    return true;
  }

  function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const confirmPasswordError = document.getElementById("confirmPasswordError");

    if (!confirmPassword) {
      confirmPasswordError.textContent = "";
      return false;
    }

    if (password !== confirmPassword) {
      confirmPasswordError.textContent = "Passwords do not match";
      confirmPasswordError.style.display = "block";
      return false;
    }

    confirmPasswordError.textContent = "";
    confirmPasswordError.style.display = "none";
    return true;
  }

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      errorElement.style.color = "#f44336";
    }
  }

  function clearErrors() {
    const errorElements = document.querySelectorAll(".error-message");
    errorElements.forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });
  }

  // OTP Popup functions
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
      // Immediate redirect without delay
      window.location.href = "/pages/otp-verification.html?type=signup";
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
    popup.classList.remove("show");
  }

  // Custom Dropdown Functionality
  function initCustomDropdown() {
    const dropdown = document.getElementById("genderDropdown");
    if (!dropdown) return;

    const selected = document.getElementById("genderSelected");
    const selectedText = selected.querySelector(".selected-text");
    const options = document.getElementById("genderOptions");
    const hiddenInput = document.getElementById("gender");
    const optionElements = options.querySelectorAll(".dropdown-option");

    // Toggle dropdown
    selected.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Close all other dropdowns
      document.querySelectorAll(".custom-dropdown").forEach(d => {
        if (d !== dropdown) {
          d.classList.remove("active");
          d.querySelector(".dropdown-options").classList.remove("show");
        }
      });
      
      dropdown.classList.toggle("active");
      options.classList.toggle("show");
    });

    // Select option
    optionElements.forEach(option => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const value = option.getAttribute("data-value");
        const text = option.textContent;
        
        // Update UI
        selectedText.textContent = text;
        selectedText.classList.remove("placeholder");
        hiddenInput.value = value;
        
        // Update option states
        optionElements.forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
        
        // Close dropdown
        dropdown.classList.remove("active");
        options.classList.remove("show");
        
        // Clear error if any
        const errorElement = document.getElementById("genderError");
        if (errorElement) {
          errorElement.textContent = "";
          errorElement.style.display = "none";
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
        options.classList.remove("show");
      }
    });
  }

  // Initialize dropdown when DOM is ready
  initCustomDropdown();

  // Custom Date Picker Functionality
  function initDatePicker() {
    const dateInput = document.getElementById("dob");
    const datePicker = document.getElementById("dobDatePicker");
    const monthDropdown = document.getElementById("monthDropdown");
    const yearDropdown = document.getElementById("yearDropdown");
    const monthSelected = document.getElementById("monthSelected");
    const yearSelected = document.getElementById("yearSelected");
    const monthSelectedText = document.getElementById("monthSelectedText");
    const yearSelectedText = document.getElementById("yearSelectedText");
    const monthOptions = document.getElementById("monthOptions");
    const yearOptions = document.getElementById("yearOptions");
    const daysContainer = document.getElementById("datePickerDays");
    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");
    const clearBtn = document.getElementById("clearDate");
    const hiddenInput = document.getElementById("dobHidden");

    if (!dateInput || !datePicker) return;

    let currentDate = new Date();
    let selectedDate = null;
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    const maxDate = new Date(2006, 11, 31); // December 31, 2006
    const minDate = new Date(1950, 0, 1); // January 1, 1950

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Populate month dropdown
    months.forEach((month, index) => {
      const option = document.createElement("div");
      option.className = "dropdown-option";
      option.setAttribute("data-value", index);
      option.textContent = month;
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        currentMonth = index;
        monthSelectedText.textContent = month;
        monthOptions.querySelectorAll(".dropdown-option").forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
        monthDropdown.classList.remove("active");
        monthOptions.classList.remove("show");
        renderCalendar();
      });
      monthOptions.appendChild(option);
    });

    // Populate year dropdown
    for (let year = maxDate.getFullYear(); year >= minDate.getFullYear(); year--) {
      const option = document.createElement("div");
      option.className = "dropdown-option";
      option.setAttribute("data-value", year);
      option.textContent = year;
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        currentYear = year;
        yearSelectedText.textContent = year;
        yearOptions.querySelectorAll(".dropdown-option").forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
        yearDropdown.classList.remove("active");
        yearOptions.classList.remove("show");
        renderCalendar();
      });
      yearOptions.appendChild(option);
    }

    // Initialize month/year dropdowns
    initDateDropdown(monthDropdown, monthSelected, monthOptions);
    initDateDropdown(yearDropdown, yearSelected, yearOptions);

    // Set initial values
    monthSelectedText.textContent = months[currentMonth];
    yearSelectedText.textContent = currentYear;

    // Format date as dd-mm-yyyy for display
    function formatDateDisplay(date) {
      if (!date) return "";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }

    // Format date as yyyy-mm-dd for form submission
    function formatDateSubmit(date) {
      if (!date) return "";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    }

    // Helper function to initialize date dropdown
    function initDateDropdown(dropdown, selected, options) {
      selected.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".custom-dropdown").forEach(d => {
          if (d !== dropdown && !d.closest(".custom-date-picker")) {
            d.classList.remove("active");
            d.querySelector(".dropdown-options").classList.remove("show");
          }
        });
        dropdown.classList.toggle("active");
        options.classList.toggle("show");
      });

      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("active");
          options.classList.remove("show");
        }
      });
    }

    // Render calendar
    function renderCalendar() {
      daysContainer.innerHTML = "";
      const year = currentYear;
      const month = currentMonth;
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      // Previous month days
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = document.createElement("div");
        day.className = "date-day other-month";
        day.textContent = prevMonthLastDay - i;
        daysContainer.appendChild(day);
      }

      // Current month days
      const today = new Date();
      for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement("div");
        const date = new Date(year, month, i);
        day.className = "date-day";
        day.textContent = i;

        // Check if today
        if (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        ) {
          day.classList.add("today");
        }

        // Check if selected
        if (selectedDate &&
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear()) {
          day.classList.add("selected");
        }

        // Check if disabled (after maxDate or before minDate)
        if (date > maxDate || date < minDate) {
          day.classList.add("disabled");
        } else {
          day.addEventListener("click", () => {
            if (date <= maxDate && date >= minDate) {
              selectedDate = new Date(date);
              dateInput.value = formatDateDisplay(selectedDate);
              if (hiddenInput) {
                hiddenInput.value = formatDateSubmit(selectedDate);
              }
              renderCalendar();
              closeDatePicker();
              
              // Clear error if any
              const errorElement = document.getElementById("dobError");
              if (errorElement) {
                errorElement.textContent = "";
                errorElement.style.display = "none";
              }
            }
          });
        }

        daysContainer.appendChild(day);
      }

      // Next month days
      const remainingDays = 42 - (startingDayOfWeek + daysInMonth);
      for (let i = 1; i <= remainingDays && i <= 14; i++) {
        const day = document.createElement("div");
        day.className = "date-day other-month";
        day.textContent = i;
        daysContainer.appendChild(day);
      }
    }

    // Open date picker
    function openDatePicker() {
      if (selectedDate) {
        currentMonth = selectedDate.getMonth();
        currentYear = selectedDate.getFullYear();
      } else {
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
      }
      
      // Update dropdown displays
      monthSelectedText.textContent = months[currentMonth];
      yearSelectedText.textContent = currentYear;
      
      // Update selected states
      monthOptions.querySelectorAll(".dropdown-option").forEach((opt, idx) => {
        if (idx === currentMonth) {
          opt.classList.add("selected");
        } else {
          opt.classList.remove("selected");
        }
      });
      
      yearOptions.querySelectorAll(".dropdown-option").forEach(opt => {
        if (parseInt(opt.getAttribute("data-value")) === currentYear) {
          opt.classList.add("selected");
        } else {
          opt.classList.remove("selected");
        }
      });
      
      renderCalendar();
      datePicker.classList.add("show");
      
      // Close other date pickers
      document.querySelectorAll(".custom-date-picker").forEach(picker => {
        if (picker !== datePicker) {
          picker.classList.remove("show");
        }
      });
    }

    // Close date picker
    function closeDatePicker() {
      datePicker.classList.remove("show");
    }

    // Event listeners
    dateInput.addEventListener("click", openDatePicker);
    dateInput.addEventListener("focus", openDatePicker);

    prevBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      monthSelectedText.textContent = months[currentMonth];
      yearSelectedText.textContent = currentYear;
      
      // Update selected states
      monthOptions.querySelectorAll(".dropdown-option").forEach((opt, idx) => {
        if (idx === currentMonth) {
          opt.classList.add("selected");
        } else {
          opt.classList.remove("selected");
        }
      });
      
      yearOptions.querySelectorAll(".dropdown-option").forEach(opt => {
        if (parseInt(opt.getAttribute("data-value")) === currentYear) {
          opt.classList.add("selected");
        } else {
          opt.classList.remove("selected");
        }
      });
      
      renderCalendar();
    });

    nextBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      monthSelectedText.textContent = months[currentMonth];
      yearSelectedText.textContent = currentYear;
      
      // Update selected states
      monthOptions.querySelectorAll(".dropdown-option").forEach((opt, idx) => {
        if (idx === currentMonth) {
          opt.classList.add("selected");
        } else {
          opt.classList.remove("selected");
        }
      });
      
      yearOptions.querySelectorAll(".dropdown-option").forEach(opt => {
        if (parseInt(opt.getAttribute("data-value")) === currentYear) {
          opt.classList.add("selected");
        } else {
          opt.classList.remove("selected");
        }
      });
      
      renderCalendar();
    });

    clearBtn.addEventListener("click", () => {
      selectedDate = null;
      dateInput.value = "";
      if (hiddenInput) {
        hiddenInput.value = "";
      }
      closeDatePicker();
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!dateInput.closest(".input-group").contains(e.target)) {
        closeDatePicker();
      }
    });

    // Initialize
    renderCalendar();
  }

  // Initialize date picker
  initDatePicker();
});

