// ===== GLOBAL VARIABLES =====
let selectedTripType = "one-way";
let selectedVehicle = null;

// ===== CUSTOM ALERT MODAL =====
function showAlertModal(message, icon = "⚠️") {
  const overlay = document.getElementById("alertModalOverlay");
  const modal = document.getElementById("alertModal");
  const modalIcon = document.getElementById("alertModalIcon");
  const modalMessage = document.getElementById("alertModalMessage");

  if (!overlay || !modal || !modalIcon || !modalMessage) {
    // Fallback to browser alert if modal not found
    alert(message);
    return;
  }

  modalIcon.textContent = icon;
  modalMessage.textContent = message;
  overlay.classList.add("show");
}

function hideAlertModal() {
  const overlay = document.getElementById("alertModalOverlay");
  if (overlay) {
    overlay.classList.remove("show");
  }
}

// Close modal on overlay click
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("alertModalOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        hideAlertModal();
      }
    });
  }
});

// ===== PAGE LOAD =====
window.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  const token = localStorage.getItem("token");
  if (!token) {
    showAlertModal("Please login first to post a booking");
    setTimeout(() => {
      window.location.href = "/pages/index.html";
    }, 2000);
    return;
  }

  populateCityDropdowns();
  setMinDate();
  initBookingDatePicker();
  initBookingTimePicker();
  console.log("📝 Post Booking page loaded");
});

// ===== NAVIGATION =====
function goBack() {
  window.history.back();
}

// ===== TRIP TYPE TOGGLE =====
function toggleTripType(type) {
  selectedTripType = type;

  const oneWayBtn = document.getElementById("oneWayBtn");
  const roundTripBtn = document.getElementById("roundTripBtn");

  if (type === "one-way") {
    oneWayBtn.classList.add("active");
    roundTripBtn.classList.remove("active");
  } else {
    roundTripBtn.classList.add("active");
    oneWayBtn.classList.remove("active");
  }

  console.log(`Trip type changed to: ${type}`);
}

// ===== VEHICLE SELECTION =====
function selectVehicle(vehicleType) {
  selectedVehicle = vehicleType;

  // Remove selected class from all buttons
  document.querySelectorAll(".vehicle-option").forEach((btn) => {
    btn.classList.remove("selected");
  });

  // Add selected class to clicked button
  const clickedBtn = document.querySelector(`[data-vehicle="${vehicleType}"]`);
  if (clickedBtn) {
    clickedBtn.classList.add("selected");
  }

  console.log(`Vehicle selected: ${vehicleType}`);
}

// ===== CITY DROPDOWN POPULATION =====
function populateCityDropdowns() {
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
    "Gandhinagar",
  ];

  const pickupSelect = document.getElementById("pickupCity");
  const dropSelect = document.getElementById("dropCity");

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

  console.log("City dropdowns populated");
}

// ===== DATE VALIDATION =====
function setMinDate() {
  // This function is now handled by initBookingDatePicker
}

// ===== CUSTOM DATE PICKER =====
function initBookingDatePicker() {
  const dateInput = document.getElementById("bookingDate");
  const datePicker = document.getElementById("bookingDatePicker");
  const monthDropdown = document.getElementById("bookingMonthDropdown");
  const yearDropdown = document.getElementById("bookingYearDropdown");
  const monthSelected = document.getElementById("bookingMonthSelected");
  const yearSelected = document.getElementById("bookingYearSelected");
  const monthSelectedText = document.getElementById("bookingMonthSelectedText");
  const yearSelectedText = document.getElementById("bookingYearSelectedText");
  const monthOptions = document.getElementById("bookingMonthOptions");
  const yearOptions = document.getElementById("bookingYearOptions");
  const daysContainer = document.getElementById("bookingDatePickerDays");
  const prevBtn = document.getElementById("bookingPrevMonth");
  const nextBtn = document.getElementById("bookingNextMonth");
  const clearBtn = document.getElementById("bookingClearDate");
  const hiddenInput = document.getElementById("bookingDateHidden");
  const datePickerWrapper = dateInput?.closest(".date-picker-wrapper");

  if (!dateInput || !datePicker) return;

  let currentDate = new Date();
  let selectedDate = null;
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  const maxDate = new Date(today.getFullYear() + 2, 11, 31);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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
      monthOptions
        .querySelectorAll(".dropdown-option")
        .forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      monthDropdown.classList.remove("active");
      monthOptions.classList.remove("show");
      renderCalendar();
    });
    monthOptions.appendChild(option);
  });

  // Populate year dropdown (from current year to 2 years ahead)
  for (
    let year = minDate.getFullYear();
    year <= maxDate.getFullYear();
    year++
  ) {
    const option = document.createElement("div");
    option.className = "dropdown-option";
    option.setAttribute("data-value", year);
    option.textContent = year;
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      currentYear = year;
      yearSelectedText.textContent = year;
      yearOptions
        .querySelectorAll(".dropdown-option")
        .forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      yearDropdown.classList.remove("active");
      yearOptions.classList.remove("show");
      renderCalendar();
    });
    yearOptions.appendChild(option);
  }

  // Initialize month/year dropdowns
  function initDateDropdown(dropdown, selected, options) {
    selected.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".custom-dropdown").forEach((d) => {
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

  // Render calendar
  function renderCalendar() {
    daysContainer.innerHTML = "";
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "date-picker-day empty";
      daysContainer.appendChild(emptyCell);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement("div");
      dayCell.className = "date-picker-day";
      dayCell.textContent = day;

      const cellDate = new Date(currentYear, currentMonth, day);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < minDate;
      const isSelected =
        selectedDate &&
        cellDate.getDate() === selectedDate.getDate() &&
        cellDate.getMonth() === selectedDate.getMonth() &&
        cellDate.getFullYear() === selectedDate.getFullYear();
      const isToday = cellDate.getTime() === today.getTime();

      if (isPast) {
        dayCell.classList.add("disabled");
      } else if (isSelected) {
        dayCell.classList.add("selected");
      } else if (isToday) {
        dayCell.classList.add("today");
      }

      if (!isPast) {
        dayCell.addEventListener("click", () => {
          selectedDate = new Date(currentYear, currentMonth, day);
          renderCalendar(); // Re-render to show selected state
          // Don't close calendar - wait for Confirm button
        });
      }

      daysContainer.appendChild(dayCell);
    }
  }

  // Open date picker
  function openDatePicker() {
    // Close other date pickers
    document.querySelectorAll(".custom-date-picker").forEach((picker) => {
      if (picker !== datePicker) {
        picker.classList.remove("show");
      }
    });

    // ALWAYS move to body for proper overlay on all sections
    // This ensures calendar overlaps Pickup, Note, Amount sections
    if (datePicker.parentElement !== document.body) {
      // Check if datePicker is actually a child of datePickerWrapper before removing
      if (datePickerWrapper && datePickerWrapper.contains(datePicker)) {
        datePickerWrapper.removeChild(datePicker);
      }
      document.body.appendChild(datePicker);
    }

    datePickerWrapper?.classList.add("calendar-open");

    // Calculate position using fixed positioning (viewport relative)
    const inputRect = dateInput.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const calendarHeight = 350;
    const padding = 8;

    // Position below input field
    let topPosition = inputRect.bottom + padding;
    const spaceBelow = viewportHeight - inputRect.bottom;

    // If not enough space below, show above input
    if (spaceBelow < calendarHeight && inputRect.top > calendarHeight) {
      topPosition = inputRect.top - calendarHeight - padding;
    }

    // Ensure within viewport bounds
    if (topPosition < padding) topPosition = padding;
    if (topPosition + calendarHeight > viewportHeight - padding) {
      topPosition = Math.max(
        padding,
        viewportHeight - calendarHeight - padding
      );
    }

    // Fixed calendar width
    const calendarWidth = 365;

    // Calculate left position - align with input
    let leftPosition = inputRect.left;
    if (leftPosition + calendarWidth > viewportWidth - padding) {
      leftPosition = viewportWidth - calendarWidth - padding;
    }
    if (leftPosition < padding) {
      leftPosition = padding;
    }

    // Apply fixed positioning - ensures it overlays everything
    datePicker.style.position = "fixed";
    datePicker.style.top = `${topPosition}px`;
    datePicker.style.left = `${leftPosition}px`;
    datePicker.style.width = `${calendarWidth}px`;
    datePicker.style.right = "auto";
    datePicker.style.zIndex = "100000";
    // Disable scrolling in calendar container
    datePicker.style.maxHeight = "none";
    datePicker.style.overflowY = "hidden";
    datePicker.style.overflowX = "hidden";

    datePicker.classList.add("show");
    renderCalendar();

    // Add scroll listener to close picker when user scrolls (professional approach)
    const scrollHandler = () => {
      if (datePicker.classList.contains("show")) {
        closeDatePicker();
      }
    };

    // Add scroll listener (use passive for better performance)
    window.addEventListener("scroll", scrollHandler, { passive: true });

    // Store handler reference for cleanup
    datePicker._scrollHandler = scrollHandler;
  }

  // Close date picker
  function closeDatePicker() {
    datePicker.classList.remove("show");
    datePickerWrapper?.classList.remove("calendar-open");

    // Remove scroll listener if it exists
    if (datePicker._scrollHandler) {
      window.removeEventListener("scroll", datePicker._scrollHandler);
      datePicker._scrollHandler = null;
    }

    if (datePicker.parentElement === document.body) {
      document.body.removeChild(datePicker);
      datePickerWrapper?.appendChild(datePicker);
      datePicker.style.position = "";
      datePicker.style.top = "";
      datePicker.style.left = "";
      datePicker.style.width = "";
      datePicker.style.right = "";
      datePicker.style.zIndex = "";
      datePicker.style.maxHeight = "";
      datePicker.style.overflowY = "";
      datePicker.style.overflowX = "";
    }
  }

  // Event listeners
  dateInput.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openDatePicker();
  });

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    monthSelectedText.textContent = months[currentMonth];
    yearSelectedText.textContent = currentYear;
    renderCalendar();
  });

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    monthSelectedText.textContent = months[currentMonth];
    yearSelectedText.textContent = currentYear;
    renderCalendar();
  });

  clearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectedDate = null;
    dateInput.value = "";
    hiddenInput.value = "";
    renderCalendar(); // Re-render to remove selection
    closeDatePicker();
  });

  // Confirm button
  const confirmBtn = document.getElementById("bookingConfirmDate");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selectedDate) {
        // Set the selected date to input fields
        dateInput.value = formatDateDisplay(selectedDate);
        hiddenInput.value = formatDateSubmit(selectedDate);
        closeDatePicker();
      } else {
        // If no date selected, show alert or just close
        closeDatePicker();
      }
    });
  }

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (
      !datePickerWrapper?.contains(e.target) &&
      !datePicker.contains(e.target)
    ) {
      closeDatePicker();
    }
  });

  // Initial render
  renderCalendar();
}

// Remove custom date picker - using native browser date picker instead
function initBookingDatePicker_DISABLED() {
  const dateInput = document.getElementById("bookingDate");
  const datePicker = document.getElementById("bookingDatePicker");
  const datePickerWrapper = dateInput?.closest(".date-picker-wrapper");
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
  const hiddenInput = document.getElementById("bookingDateHidden");

  if (!dateInput || !datePicker) return;

  let currentDate = new Date();
  let selectedDate = null;
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  // IMPORTANT: Only allow present or future dates (not past)
  const minDate = new Date(); // Today
  minDate.setHours(0, 0, 0, 0); // Set to start of today
  const maxDate = new Date(currentYear + 2, 11, 31); // 2 years from now

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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
      monthOptions
        .querySelectorAll(".dropdown-option")
        .forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      monthDropdown.classList.remove("active");
      monthOptions.classList.remove("show");
      renderCalendar();
    });
    monthOptions.appendChild(option);
  });

  // Populate year dropdown (from current year to 2 years ahead)
  for (
    let year = minDate.getFullYear();
    year <= maxDate.getFullYear();
    year++
  ) {
    const option = document.createElement("div");
    option.className = "dropdown-option";
    option.setAttribute("data-value", year);
    option.textContent = year;
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      currentYear = year;
      yearSelectedText.textContent = year;
      yearOptions
        .querySelectorAll(".dropdown-option")
        .forEach((opt) => opt.classList.remove("selected"));
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
      document.querySelectorAll(".custom-dropdown").forEach((d) => {
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
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const day = document.createElement("div");
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
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
      if (
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      ) {
        day.classList.add("selected");
      }

      // IMPORTANT: Disable past dates (only allow present or future)
      if (date < minDate) {
        day.classList.add("disabled");
      } else if (date > maxDate) {
        day.classList.add("disabled");
      } else {
        day.addEventListener("click", () => {
          if (date >= minDate && date <= maxDate) {
            selectedDate = new Date(date);
            dateInput.value = formatDateDisplay(selectedDate);
            if (hiddenInput) {
              hiddenInput.value = formatDateSubmit(selectedDate);
            }
            renderCalendar();
            closeDatePicker();

            // Validate date and time together
            validateDateTime();
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

    yearOptions.querySelectorAll(".dropdown-option").forEach((opt) => {
      if (parseInt(opt.getAttribute("data-value")) === currentYear) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    });

    renderCalendar();
    datePicker.classList.add("show");

    // Scroll handler to close calendar if input goes out of viewport
    scrollHandlerRef = () => {
      if (!datePicker.classList.contains("show")) return;

      const inputRect = dateInput.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Close calendar if input field is out of viewport
      if (
        inputRect.bottom < 0 ||
        inputRect.top > viewportHeight ||
        inputRect.right < 0 ||
        inputRect.left > window.innerWidth
      ) {
        closeDatePicker();
      }
    };

    // Move calendar to body to escape stacking context created by form-section transform
    if (datePickerWrapper && dateInput) {
      // Store original parent for restoration
      if (!datePicker.dataset.originalParent) {
        datePicker.dataset.originalParent = datePickerWrapper;
      }

      // Move to body to escape stacking context
      if (datePicker.parentElement !== document.body) {
        document.body.appendChild(datePicker);
      }

      datePickerWrapper.classList.add("calendar-open");

      // Calculate position for fixed positioning (viewport relative - NO scroll offsets!)
      const inputRect = dateInput.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const calendarHeight = 350; // Approximate calendar height

      // Calculate top position
      let topPosition = inputRect.bottom + 8;
      const spaceBelow = viewportHeight - inputRect.bottom;

      // If not enough space below, show above input
      if (spaceBelow < calendarHeight && inputRect.top > calendarHeight) {
        topPosition = inputRect.top - calendarHeight - 8;
      }

      // Ensure within viewport bounds
      if (topPosition < 8) topPosition = 8;
      if (topPosition + calendarHeight > viewportHeight - 8) {
        topPosition = viewportHeight - calendarHeight - 8;
      }

      // Calculate calendar width - ensure it fits in viewport
      const padding = 16; // Padding on each side
      const maxAvailableWidth = viewportWidth - padding * 2; // Total available width
      const preferredWidth = Math.min(inputRect.width, 400); // Preferred width
      const calendarWidth = Math.min(preferredWidth, maxAvailableWidth);

      // Calculate left position - align with input but ensure it stays in viewport
      let leftPosition = inputRect.left;

      // Ensure calendar stays within viewport bounds
      if (leftPosition + calendarWidth > viewportWidth - padding) {
        leftPosition = viewportWidth - calendarWidth - padding;
      }
      // If left position is too close to left edge, adjust it
      if (leftPosition < padding) {
        leftPosition = padding;
      }

      // Set fixed position (viewport relative - no scroll offsets!)
      datePicker.style.position = "fixed";
      datePicker.style.top = `${topPosition}px`;
      datePicker.style.left = `${leftPosition}px`;
      datePicker.style.width = `${calendarWidth}px`;
      datePicker.style.maxWidth = `${maxAvailableWidth}px`; // Ensure it never exceeds viewport
      datePicker.style.zIndex = "999999";
      datePicker.style.maxHeight = `${viewportHeight - topPosition - 16}px`;
      datePicker.style.overflowY = "visible"; // Remove internal scrolling
      datePicker.style.overflowX = "hidden"; // Prevent horizontal overflow

      // Add scroll listener (only when calendar is open)
      window.addEventListener("scroll", scrollHandlerRef, { passive: true });
      datePicker.dataset.scrollHandler = "true";
    }

    // Close other date pickers and restore them to original position
    document.querySelectorAll(".custom-date-picker").forEach((picker) => {
      if (picker !== datePicker) {
        picker.classList.remove("show");
        const wrapper = picker.closest(".date-picker-wrapper");
        if (wrapper) {
          wrapper.classList.remove("calendar-open");
        }
        // Move back to original parent if moved to body
        if (
          picker.parentElement === document.body &&
          picker.dataset.originalParent
        ) {
          picker.dataset.originalParent.appendChild(picker);
        }
        // Reset styles
        picker.style.position = "";
        picker.style.top = "";
        picker.style.left = "";
        picker.style.width = "";
        picker.style.zIndex = "";
        picker.style.maxHeight = "";
        picker.style.overflowY = "";
      }
    });
  }

  // Close date picker
  function closeDatePicker() {
    datePicker.classList.remove("show");

    // Remove scroll handler if it exists
    if (datePicker.dataset.scrollHandler === "true" && scrollHandlerRef) {
      window.removeEventListener("scroll", scrollHandlerRef);
      scrollHandlerRef = null;
      delete datePicker.dataset.scrollHandler;
    }

    // Move calendar back to original position
    if (
      datePicker.parentElement === document.body &&
      datePicker.dataset.originalParent
    ) {
      datePicker.dataset.originalParent.appendChild(datePicker);
    }

    // Remove calendar-open class from wrapper
    if (datePickerWrapper) {
      datePickerWrapper.classList.remove("calendar-open");
    }

    // Reset all inline styles
    datePicker.style.position = "";
    datePicker.style.top = "";
    datePicker.style.left = "";
    datePicker.style.width = "";
    datePicker.style.maxWidth = "";
    datePicker.style.zIndex = "";
    datePicker.style.maxHeight = "";
    datePicker.style.overflowY = "";
    datePicker.style.overflowX = "";
  }

  // Clear date
  clearBtn.addEventListener("click", () => {
    selectedDate = null;
    dateInput.value = "";
    if (hiddenInput) {
      hiddenInput.value = "";
    }
    renderCalendar();
  });

  // Event listeners
  dateInput.addEventListener("click", openDatePicker);
  dateInput.addEventListener("focus", openDatePicker);

  prevBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }

    // Don't allow navigation to past months/years
    const navDate = new Date(currentYear, currentMonth, 1);
    if (navDate < minDate) {
      currentMonth = minDate.getMonth();
      currentYear = minDate.getFullYear();
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

    yearOptions.querySelectorAll(".dropdown-option").forEach((opt) => {
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

    // Don't allow navigation beyond max date
    const navDate = new Date(currentYear, currentMonth, 1);
    if (navDate > maxDate) {
      currentMonth = maxDate.getMonth();
      currentYear = maxDate.getFullYear();
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

    yearOptions.querySelectorAll(".dropdown-option").forEach((opt) => {
      if (parseInt(opt.getAttribute("data-value")) === currentYear) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    });

    renderCalendar();
  });

  // Close on overlay click
  datePicker.addEventListener("click", (e) => {
    if (e.target === datePicker) {
      closeDatePicker();
    }
  });

  // No position update handlers needed - calendar uses absolute positioning like signup form

  // Initialize calendar
  renderCalendar();
}

// ===== CUSTOM TIME PICKER =====
function initBookingTimePicker() {
  const timeInput = document.getElementById("bookingTime");
  const timePicker = document.getElementById("bookingTimePicker");
  const timePickerWrapper = timeInput?.closest(".time-picker-wrapper");
  const hourWheel = document.getElementById("bookingHourWheel");
  const minuteWheel = document.getElementById("bookingMinuteWheel");
  const ampmWheel = document.getElementById("bookingAMPMWheel");
  const clearBtn = document.getElementById("bookingClearTime");
  const confirmBtn = document.getElementById("bookingConfirmTime");
  const timeHidden = document.getElementById("bookingTimeHidden");

  if (!timeInput || !timePicker || !hourWheel || !minuteWheel || !ampmWheel)
    return;

  let selectedHour = "12";
  let selectedMinute = "00";
  let selectedAMPM = "PM";

  // Populate minute wheel (00-55 in 5-minute intervals)
  for (let i = 0; i < 60; i += 5) {
    const item = document.createElement("div");
    item.className = "time-wheel-item";
    item.dataset.value = String(i).padStart(2, "0");
    item.textContent = String(i).padStart(2, "0");
    minuteWheel.appendChild(item);
  }

  // Initialize wheel scrolling and selection
  function initWheel(wheel, defaultValue, onSelect) {
    let isScrolling = false;
    let selectedItem = null;
    let scrollTimeout = null;

    // Set initial value
    const items = wheel.querySelectorAll(".time-wheel-item");
    items.forEach((item) => {
      if (item.dataset.value === defaultValue) {
        item.classList.add("active");
        selectedItem = item;
        // Scroll to selected item after a short delay
        setTimeout(() => {
          item.scrollIntoView({ behavior: "auto", block: "center" });
        }, 50);
      }
    });

    // Handle scroll to detect selected item
    wheel.addEventListener("scroll", () => {
      if (!isScrolling) {
        isScrolling = true;
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        updateSelection();
        isScrolling = false;
      }, 150);
    });

    function updateSelection() {
      const containerRect = wheel.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height / 2;

      let closestItem = null;
      let closestDistance = Infinity;

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterY = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(centerY - itemCenterY);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestItem = item;
        }
      });

      if (closestItem && closestItem !== selectedItem) {
        items.forEach((item) => item.classList.remove("active"));
        closestItem.classList.add("active");
        selectedItem = closestItem;

        // Snap to center smoothly
        setTimeout(() => {
          closestItem.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);

        if (onSelect) {
          onSelect(closestItem.dataset.value);
        }
      }
    }

    // Click to select
    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        selectedItem = item;
        item.scrollIntoView({ behavior: "smooth", block: "center" });
        if (onSelect) {
          onSelect(item.dataset.value);
        }
      });
    });

    return {
      setValue: (value) => {
        items.forEach((item) => {
          if (item.dataset.value === value) {
            item.classList.add("active");
            selectedItem = item;
            setTimeout(() => {
              item.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
            if (onSelect) {
              onSelect(value);
            }
          } else {
            item.classList.remove("active");
          }
        });
      },
      getValue: () => selectedItem?.dataset.value || defaultValue,
    };
  }

  // Initialize wheels
  const hourWheelControl = initWheel(hourWheel, selectedHour, (value) => {
    selectedHour = value;
  });

  const minuteWheelControl = initWheel(minuteWheel, selectedMinute, (value) => {
    selectedMinute = value;
  });

  const ampmWheelControl = initWheel(ampmWheel, selectedAMPM, (value) => {
    selectedAMPM = value;
  });

  // Convert to 24-hour format
  function convertTo24Hour(hour, minute, ampm) {
    let hour24 = parseInt(hour);
    if (ampm === "AM") {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 = hour24 + 12;
    }
    return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`;
  }

  // Clear button
  clearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectedHour = "12";
    selectedMinute = "00";
    selectedAMPM = "PM";
    hourWheelControl.setValue("12");
    minuteWheelControl.setValue("00");
    ampmWheelControl.setValue("PM");
    timeInput.value = "";
    timeHidden.value = "";
    closeTimePicker();
  });

  // Confirm button
  confirmBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const hour = hourWheelControl.getValue();
    const minute = minuteWheelControl.getValue();
    const ampm = ampmWheelControl.getValue();

    if (!hour || !minute || !ampm) {
      showAlertModal("Please select hour, minute, and period");
      return;
    }

    const time24 = convertTo24Hour(hour, minute, ampm);
    const displayTime = `${hour}:${minute} ${ampm}`;

    timeInput.value = displayTime;
    timeHidden.value = time24;
    closeTimePicker();
    validateDateTime();
  });

  // Open time picker
  function openTimePicker() {
    // Close other pickers
    document.querySelectorAll(".custom-time-picker").forEach((picker) => {
      if (picker !== timePicker) {
        picker.classList.remove("show");
      }
    });
    document.querySelectorAll(".custom-date-picker").forEach((picker) => {
      picker.classList.remove("show");
    });

    // Move to body
    if (timePicker.parentElement !== document.body) {
      if (timePickerWrapper && timePickerWrapper.contains(timePicker)) {
        timePickerWrapper.removeChild(timePicker);
      }
      document.body.appendChild(timePicker);
    }

    // Calculate position dynamically based on input field (like calendar picker)
    const inputRect = timeInput.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const timePickerHeight = 280; // Approximate time picker height
    const timePickerWidth = 240;
    const padding = 8;

    // Position below input field
    let topPosition = inputRect.bottom + padding;
    const spaceBelow = viewportHeight - inputRect.bottom;

    // If not enough space below, show above input
    if (spaceBelow < timePickerHeight && inputRect.top > timePickerHeight) {
      topPosition = inputRect.top - timePickerHeight - padding;
    }

    // Ensure within viewport bounds
    if (topPosition < padding) topPosition = padding;
    if (topPosition + timePickerHeight > viewportHeight - padding) {
      topPosition = Math.max(
        padding,
        viewportHeight - timePickerHeight - padding
      );
    }

    // Calculate left position - align with input
    let leftPosition = inputRect.left;
    // If input is on the right side, align picker to input's right edge
    if (inputRect.right - timePickerWidth < padding) {
      leftPosition = inputRect.right - timePickerWidth;
    }
    // Ensure within viewport bounds
    if (leftPosition + timePickerWidth > viewportWidth - padding) {
      leftPosition = viewportWidth - timePickerWidth - padding;
    }
    if (leftPosition < padding) {
      leftPosition = padding;
    }

    // Apply dynamic positioning (like calendar picker)
    timePicker.style.setProperty("position", "fixed", "important");
    timePicker.style.setProperty("top", `${topPosition}px`, "important");
    timePicker.style.setProperty("left", `${leftPosition}px`, "important");
    timePicker.style.setProperty("width", `${timePickerWidth}px`, "important");
    timePicker.style.setProperty("z-index", "100000", "important");
    timePicker.style.setProperty("max-height", "none", "");
    timePicker.style.setProperty("overflow", "hidden", "");

    // Populate from existing value
    if (timeInput.value) {
      const timeMatch = timeInput.value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        selectedHour = timeMatch[1].padStart(2, "0");
        selectedMinute = timeMatch[2];
        selectedAMPM = timeMatch[3]?.toUpperCase() || "PM";
        hourWheelControl.setValue(selectedHour);
        minuteWheelControl.setValue(selectedMinute);
        ampmWheelControl.setValue(selectedAMPM);
      }
    }

    timePicker.classList.add("show");

    // Add scroll listener to close picker when user scrolls (professional approach)
    const scrollHandler = () => {
      if (timePicker.classList.contains("show")) {
        closeTimePicker();
      }
    };

    // Add scroll listener (use passive for better performance)
    window.addEventListener("scroll", scrollHandler, { passive: true });

    // Store handler reference for cleanup
    timePicker._scrollHandler = scrollHandler;
  }

  // Close time picker
  function closeTimePicker() {
    timePicker.classList.remove("show");

    // Remove scroll listener if it exists
    if (timePicker._scrollHandler) {
      window.removeEventListener("scroll", timePicker._scrollHandler);
      timePicker._scrollHandler = null;
    }

    setTimeout(() => {
      if (timePicker.parentElement === document.body) {
        document.body.removeChild(timePicker);
        timePickerWrapper?.appendChild(timePicker);
        timePicker.style.position = "";
        timePicker.style.top = "";
        timePicker.style.left = "";
        timePicker.style.width = "";
        timePicker.style.zIndex = "";
      }
    }, 300);
  }

  // Event listeners
  timeInput.addEventListener("click", openTimePicker);
  timeInput.addEventListener("focus", openTimePicker);

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (
      !timePicker.contains(e.target) &&
      !timeInput.contains(e.target) &&
      !timePickerWrapper?.contains(e.target)
    ) {
      closeTimePicker();
    }
  });
}

// ===== VALIDATE DATE AND TIME TOGETHER =====
function validateDateTime() {
  const dateInput = document.getElementById("bookingDate");
  const timeInput = document.getElementById("bookingTime");
  const timeHidden = document.getElementById("bookingTimeHidden");
  const dateHidden = document.getElementById("bookingDateHidden");

  if (!dateInput || !timeInput) return true;

  // Use hiddenInput (yyyy-mm-dd format) for proper date parsing
  const dateValue = dateHidden?.value || dateInput.value;

  if (!dateValue) {
    showAlertModal("Please select a date");
    dateInput.focus();
    return false;
  }

  const timeValue = timeHidden?.value || timeInput.value;
  if (!timeValue) {
    showAlertModal("Please select a time");
    timeInput.focus();
    return false;
  }

  // Check if date is today or future
  // Parse date - handle both yyyy-mm-dd and dd-mm-yyyy formats
  let selectedDate;
  if (dateHidden?.value) {
    // yyyy-mm-dd format (from hiddenInput) - JavaScript can parse this correctly
    selectedDate = new Date(dateHidden.value);
  } else {
    // dd-mm-yyyy format (from display input) - parse manually
    const parts = dateValue.split("-");
    if (parts.length === 3) {
      // Assume dd-mm-yyyy format
      selectedDate = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0])
      );
    } else {
      selectedDate = new Date(dateValue);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  // Check if date is valid
  if (isNaN(selectedDate.getTime())) {
    showAlertModal("Please select a valid date");
    dateInput.focus();
    return false;
  }

  if (selectedDate < today) {
    showAlertModal("Please select today's date or a future date");
    dateInput.focus();
    return false;
  }

  return true;
}

// Keep validateDate for backward compatibility
function validateDate() {
  validateDateTime();
}

// Removed: updateToggleState and validateCommission functions

// ===== REQUIREMENT CHIP TOGGLE =====
// Removed: toggleChip function - Extra Requirements section removed

// ===== WORD COUNT =====
function updateCharCount() {
  const textarea = document.getElementById("customRequirement");
  const charCount = document.getElementById("charCount");
  const text = textarea.value.trim();

  // Count words (split by whitespace and filter empty strings)
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

// ===== FORM SUBMISSION =====
async function handleSubmit(event) {
  event.preventDefault();

  // Validate required fields
  if (!selectedVehicle) {
    showAlertModal("Please select a vehicle type");
    return;
  }

  const bookingDate =
    document.getElementById("bookingDateHidden")?.value ||
    document.getElementById("bookingDate").value;
  const bookingTimeHidden = document.getElementById("bookingTimeHidden");
  const bookingTime =
    bookingTimeHidden?.value || document.getElementById("bookingTime").value;
  const pickupCity = document.getElementById("pickupCity").value;
  const dropCity = document.getElementById("dropCity").value;
  const bookingAmount = document.getElementById("bookingAmount").value;

  if (
    !bookingDate ||
    !bookingTime ||
    !pickupCity ||
    !dropCity ||
    !bookingAmount ||
    bookingAmount < 0
  ) {
    showAlertModal("Please fill all required fields and enter valid amount");
    return;
  }

  if (pickupCity === dropCity) {
    showAlertModal("Pickup and drop locations cannot be the same");
    return;
  }

  // Combine date and time
  const dateTime = new Date(`${bookingDate}T${bookingTime}`);

  // Prepare booking data for API (matching Booking model structure)
  const bookingData = {
    tripType: selectedTripType,
    vehicleType: selectedVehicle,
    pickup: {
      city: pickupCity,
      location: pickupCity, // You can enhance this with specific addresses later
      address: pickupCity,
    },
    drop: {
      city: dropCity,
      location: dropCity, // You can enhance this with specific addresses later
      address: dropCity,
    },
    dateTime: dateTime.toISOString(),
    amount: {
      bookingAmount: parseFloat(bookingAmount),
    },
    customRequirement: document.getElementById("customRequirement").value || "",
    // status defaults to "active" in the model
  };

  console.log("Submitting booking to API:", bookingData);

  // Check authentication first
  const token = localStorage.getItem("token");
  if (!token) {
    showAlertModal("Please login first to post a booking");
    setTimeout(() => {
      window.location.href = "/pages/index.html";
    }, 2000);
    return;
  }

  // Show loading state
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Posting...";

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

    // Submit to API
    const response = await apiService.createBooking(bookingData);

    console.log("✅ Booking created successfully:", response);

    // Show success modal
    showSuccessModal();

    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = "/pages/dashboard.html";
    }, 2000);
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    console.error("Full error object:", error);

    // Show detailed error message
    const errorMessage = error.message || "Please try again";
    showAlertModal(
      `Failed to create booking: ${errorMessage}\n\nPlease check the console for more details.`
    );

    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

// ===== SUCCESS MODAL =====
function showSuccessModal() {
  const modal = document.getElementById("successModal");
  modal.classList.add("show");

  // Prevent background scroll
  document.body.style.overflow = "hidden";
}
