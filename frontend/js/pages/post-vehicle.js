// ===== GLOBAL VARIABLES =====
let selectedTripType = "available-now";
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
  populateCityDropdowns();
  setMinDateVehicle();
  initVehicleDatePicker();
  initVehicleTimePicker();
  console.log("📝 Post Vehicle page loaded");
});

// ===== NAVIGATION =====
function goBack() {
  window.history.back();
}

// ===== TRIP TYPE TOGGLE =====
function toggleTripType(type) {
  selectedTripType = type;

  const availableNowBtn = document.getElementById("availableNowBtn");
  const availableLaterBtn = document.getElementById("availableLaterBtn");

  if (type === "available-now") {
    availableNowBtn.classList.add("active");
    availableLaterBtn.classList.remove("active");
  } else {
    availableLaterBtn.classList.add("active");
    availableNowBtn.classList.remove("active");
  }

  console.log(`Availability status changed to: ${type}`);
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
function setMinDateVehicle() {
  // This function is now handled by initVehicleDatePicker
}

// ===== CUSTOM DATE PICKER =====
function initVehicleDatePicker() {
  const dateInput = document.getElementById("availabilityDate");
  const datePicker = document.getElementById("availabilityDatePicker");
  const monthDropdown = document.getElementById("availabilityMonthDropdown");
  const yearDropdown = document.getElementById("availabilityYearDropdown");
  const monthSelected = document.getElementById("availabilityMonthSelected");
  const yearSelected = document.getElementById("availabilityYearSelected");
  const monthSelectedText = document.getElementById(
    "availabilityMonthSelectedText"
  );
  const yearSelectedText = document.getElementById(
    "availabilityYearSelectedText"
  );
  const monthOptions = document.getElementById("availabilityMonthOptions");
  const yearOptions = document.getElementById("availabilityYearOptions");
  const daysContainer = document.getElementById("availabilityDatePickerDays");
  const prevBtn = document.getElementById("availabilityPrevMonth");
  const nextBtn = document.getElementById("availabilityNextMonth");
  const clearBtn = document.getElementById("availabilityClearDate");
  const hiddenInput = document.getElementById("availabilityDateHidden");
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
  const confirmBtn = document.getElementById("availabilityConfirmDate");
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

// ===== CUSTOM TIME PICKER =====
function initVehicleTimePicker() {
  const timeInput = document.getElementById("availabilityTime");
  const timePicker = document.getElementById("availabilityTimePicker");
  const timePickerWrapper = timeInput?.closest(".time-picker-wrapper");
  const hourWheel = document.getElementById("vehicleHourWheel");
  const minuteWheel = document.getElementById("vehicleMinuteWheel");
  const ampmWheel = document.getElementById("vehicleAMPMWheel");
  const clearBtn = document.getElementById("availabilityClearTime");
  const confirmBtn = document.getElementById("availabilityConfirmTime");
  const timeHidden = document.getElementById("availabilityTimeHidden");

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
    validateDateTimeVehicle();
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

// Remove custom date picker - using native browser date picker instead
function initVehicleDatePicker_DISABLED() {
  const dateInput = document.getElementById("availabilityDate");
  const datePicker = document.getElementById("availabilityDatePicker");
  const datePickerWrapper = dateInput?.closest(".date-picker-wrapper");

  // Store scroll handler reference for cleanup
  let scrollHandlerRef = null;

  const monthDropdown = document.getElementById("monthDropdownVehicle");
  const yearDropdown = document.getElementById("yearDropdownVehicle");
  const monthSelected = document.getElementById("monthSelectedVehicle");
  const yearSelected = document.getElementById("yearSelectedVehicle");
  const monthSelectedText = document.getElementById("monthSelectedTextVehicle");
  const yearSelectedText = document.getElementById("yearSelectedTextVehicle");
  const monthOptions = document.getElementById("monthOptionsVehicle");
  const yearOptions = document.getElementById("yearOptionsVehicle");
  const daysContainer = document.getElementById("datePickerDaysVehicle");
  const prevBtn = document.getElementById("prevMonthVehicle");
  const nextBtn = document.getElementById("nextMonthVehicle");
  const clearBtn = document.getElementById("clearDateVehicle");
  const hiddenInput = document.getElementById("availabilityDateHidden");

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
            validateDateTimeVehicle();
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
    datePicker.style.zIndex = "";
    datePicker.style.maxHeight = "";
    datePicker.style.overflowY = "";
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

// ===== VALIDATE DATE AND TIME TOGETHER FOR VEHICLE =====
function validateDateTimeVehicle() {
  const dateInput = document.getElementById("availabilityDate");
  const timeInput = document.getElementById("availabilityTime");
  const timeHidden = document.getElementById("availabilityTimeHidden");
  const dateHidden = document.getElementById("availabilityDateHidden");

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
  validateDateTimeVehicle();
}

// ===== TOGGLE SWITCH UPDATE =====
function updateToggleState(checkbox) {
  console.log(`Amount negotiable: ${checkbox.checked}`);
}

// ===== COMMISSION VALIDATION =====
// Removed: validateCommission function - Commission field removed

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
async function handleVehicleSubmit(event) {
  event.preventDefault();

  // Validate required fields
  if (!selectedVehicle) {
    showAlertModal("Please select a vehicle type");
    return;
  }

  const availabilityDate =
    document.getElementById("availabilityDateHidden")?.value ||
    document.getElementById("availabilityDate").value;
  const availabilityTimeHidden = document.getElementById(
    "availabilityTimeHidden"
  );
  const availabilityTime =
    availabilityTimeHidden?.value ||
    document.getElementById("availabilityTime").value;
  const pickupCity = document.getElementById("pickupCity").value;
  const dropCity = document.getElementById("dropCity").value;

  if (!availabilityDate || !availabilityTime || !pickupCity || !dropCity) {
    showAlertModal("Please fill all required fields");
    return;
  }

  // Note: For vehicles, pickup and drop can be the same (vehicle is available at a location)
  // Removing the validation that prevents same pickup/drop

  // Determine availability status
  const now = new Date();
  const selectedDate = new Date(availabilityDate);
  const [hours, minutes] = availabilityTime.split(":").map(Number);
  const selectedDateTime = new Date(selectedDate);
  selectedDateTime.setHours(hours, minutes, 0, 0);

  // If date is today and time is within next 2 hours, mark as "available-now"
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const availabilityStatus =
    selectedDate.toDateString() === now.toDateString() &&
    selectedDateTime <= twoHoursFromNow
      ? "available-now"
      : "available-later";

  // Prepare vehicle data for API (matching Vehicle model structure)
  // Note: tripType is required and must be "one-way" or "round-trip"
  // For vehicles, we default to "one-way" since it's a free vehicle posting
  const vehicleData = {
    tripType: "one-way", // Required: "one-way" or "round-trip" (defaulting to one-way for free vehicles)
    vehicleType: selectedVehicle, // "sedan", "suv", "hatchback", "luxury"
    location: {
      city: pickupCity,
      address: pickupCity, // Can be enhanced later
    },
    availability: {
      date: new Date(availabilityDate).toISOString(), // Convert to ISO string
      time: availabilityTime, // String like "14:30"
      status: availabilityStatus, // "available-now" or "available-later"
    },
    customRequirement: document.getElementById("customRequirement").value || "",
    // status defaults to "active" in the model
    // postedBy is set by backend from req.userId
  };

  console.log("Submitting vehicle to API:", vehicleData);

  // Check authentication first
  const token = localStorage.getItem("token");
  if (!token) {
    showAlertModal("Please login first to post a vehicle");
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
    const response = await apiService.createVehicle(vehicleData);

    console.log("✅ Vehicle created successfully:", response);
    
    // Check if response indicates success
    if (response && response.success === false) {
      throw new Error(response.message || response.error || "Failed to post vehicle");
    }

    // Show success modal
    showSuccessModal();

    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = "/pages/dashboard.html";
    }, 2000);
  } catch (error) {
    console.error("❌ Error creating vehicle:", error);
    console.error("❌ Full error object:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Extract detailed error message
    let errorMessage = "Please try again";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response) {
      errorMessage = error.response.message || error.response.error || "Unknown error";
    }
    
    // Show detailed error message
    showAlertModal(
      `Failed to post vehicle: ${errorMessage}\n\nPlease check the console for more details.`
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
