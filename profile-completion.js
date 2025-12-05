// Profile Completion form handling
document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profileForm");
  const submitButton = document.getElementById("submitButton");
  const skipButton = document.getElementById("skipButton");

  // Gujarat cities list
  const gujaratCities = [
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
    "Wankaner"
  ];

  // Initialize custom dropdowns
  initCustomDropdowns();
  initVehicleTypes();
  initServiceAreas();

  // Format pincode input (only numbers)
  const pincodeInput = document.getElementById("pincode");
  if (pincodeInput) {
    pincodeInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  }

  // Form submission
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous errors
    clearErrors();

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    // Disable button and show loading
    submitButton.disabled = true;
    submitButton.textContent = "Saving Profile...";

    try {
      // Get selected vehicle types
      const selectedVehicleTypes = getSelectedVehicleTypes();
      let vehicleTypes = [...selectedVehicleTypes];
      
      // If "Other" is selected, include the custom value
      if (vehicleTypes.includes("Other")) {
        const otherValue = document.getElementById("otherVehicleType").value.trim();
        if (otherValue) {
          vehicleTypes = vehicleTypes.filter(v => v !== "Other");
          vehicleTypes.push(`Other: ${otherValue}`);
        }
      }

      // Get selected service areas (cities)
      const selectedCities = getSelectedCities();
      const serviceAreas = selectedCities;

      const formData = {
        profile: {
          businessOperationCity: document.getElementById("businessCity").value.trim(),
          businessOperationState: document.getElementById("businessState").value.trim(),
          address: document.getElementById("address").value.trim(),
          city: document.getElementById("businessCity").value.trim(),
          state: document.getElementById("businessState").value.trim(),
          pincode: document.getElementById("pincode").value.trim(),
          numberOfVehicles: parseInt(document.getElementById("numberOfVehicles").value) || 0,
          vehicleTypes: vehicleTypes,
          businessType: document.getElementById("businessType").value,
          yearsInBusiness: document.getElementById("yearsInBusiness").value 
            ? parseInt(document.getElementById("yearsInBusiness").value) 
            : undefined,
          serviceAreas: serviceAreas,
          isProfileComplete: true,
        }
      };

      // Check if API service is available
      if (typeof apiService === "undefined") {
        throw new Error("API service not loaded");
      }

      // Call profile update API
      const response = await apiService.request("/profile/update", {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (response.success) {
        // Update user data in localStorage
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }

        // Set flag to indicate profile is complete
        sessionStorage.setItem("profileComplete", "true");
        // Directly redirect to journey page (no browser popup)
        window.location.href = "account-journey.html";
      } else {
        showError("submitError", response.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Profile completion error:", error);
      showError(
        "submitError",
        error.message || "Failed to save profile. Please try again."
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Complete Profile";
    }
  });

  // Skip button
  skipButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to skip? You can complete your profile later.")) {
      const fromSignup = sessionStorage.getItem("fromSignup");
      if (fromSignup === "true") {
        window.location.href = "verification.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }
  });

  // Vehicle Types Multi-Select Handler
  function initVehicleTypes() {
    const dropdown = document.getElementById("vehicleTypesDropdown");
    const selected = document.getElementById("vehicleTypesSelected");
    const selectedText = selected.querySelector(".selected-text");
    const options = document.getElementById("vehicleTypesOptions");
    const hiddenInput = document.getElementById("vehicleTypes");
    const selectedDisplay = document.getElementById("selectedVehicleTypes");
    const selectedList = document.getElementById("selectedVehicleTypesList");
    const otherContainer = document.getElementById("otherVehicleTypeContainer");
    const otherInput = document.getElementById("otherVehicleType");

    let selectedVehicleTypes = [];

    // Toggle dropdown
    selected.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Close all other dropdowns
      document.querySelectorAll(".custom-dropdown, .custom-multi-select").forEach(d => {
        if (d !== dropdown) {
          d.classList.remove("active");
          d.querySelector(".dropdown-options").classList.remove("show");
        }
      });
      
      dropdown.classList.toggle("active");
      options.classList.toggle("show");
    });

    // Select/deselect option
    options.querySelectorAll(".dropdown-option").forEach(option => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const value = option.getAttribute("data-value");
        
        if (selectedVehicleTypes.includes(value)) {
          // Deselect
          selectedVehicleTypes = selectedVehicleTypes.filter(v => v !== value);
          option.classList.remove("selected");
        } else {
          // Select
          selectedVehicleTypes.push(value);
          option.classList.add("selected");
        }
        
        updateVehicleTypesDisplay();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
        options.classList.remove("show");
      }
    });

    // Other input handler
    if (otherInput) {
      otherInput.addEventListener("input", () => {
        clearError("otherVehicleTypeError");
      });
    }

    function updateVehicleTypesDisplay() {
      // Update hidden input
      hiddenInput.value = selectedVehicleTypes.join(",");
      
      // Update selected text in dropdown
      if (selectedVehicleTypes.length === 0) {
        selectedText.textContent = "Select vehicle types (multiple selection allowed)";
        selectedText.classList.add("placeholder");
        selectedDisplay.style.display = "none";
      } else {
        selectedText.textContent = `${selectedVehicleTypes.length} type/types selected`;
        selectedText.classList.remove("placeholder");
        selectedDisplay.style.display = "block";
        selectedList.innerHTML = "";
        
        selectedVehicleTypes.forEach(type => {
          const tag = document.createElement("div");
          tag.className = "selected-item-tag";
          tag.innerHTML = `
            <span>${type}</span>
            <button type="button" class="remove-btn" data-value="${type}">×</button>
          `;
          selectedList.appendChild(tag);
        });

        // Add remove button handlers
        selectedList.querySelectorAll(".remove-btn").forEach(btn => {
          btn.addEventListener("click", (e) => {
            const value = e.target.getAttribute("data-value");
            selectedVehicleTypes = selectedVehicleTypes.filter(v => v !== value);
            
            // Update option state
            const option = options.querySelector(`[data-value="${value}"]`);
            if (option) option.classList.remove("selected");
            
            updateVehicleTypesDisplay();
          });
        });
      }

      // Show/hide "Other" input
      const otherSelected = selectedVehicleTypes.includes("Other");
      if (otherSelected) {
        otherContainer.style.display = "block";
      } else {
        otherContainer.style.display = "none";
        if (otherInput) otherInput.value = "";
      }
    }

    // Get selected vehicle types
    window.getSelectedVehicleTypes = () => selectedVehicleTypes;
  }

  // Service Areas Multi-Select Handler
  function initServiceAreas() {
    const dropdown = document.getElementById("serviceAreasDropdown");
    const selected = document.getElementById("serviceAreasSelected");
    const selectedText = selected.querySelector(".selected-text");
    const options = document.getElementById("serviceAreasOptions");
    const optionsList = document.getElementById("serviceAreasOptionsList");
    const searchInput = document.getElementById("serviceAreasSearch");
    const hiddenInput = document.getElementById("serviceAreas");
    const selectedDisplay = document.getElementById("selectedCitiesDisplay");
    const selectedList = document.getElementById("selectedCitiesList");

    let selectedCities = [];
    let allOptions = [];

    // Populate options
    gujaratCities.forEach(city => {
      const option = document.createElement("div");
      option.className = "dropdown-option";
      option.setAttribute("data-value", city);
      option.textContent = city;
      optionsList.appendChild(option);
      allOptions.push(option);
    });

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterCities(searchTerm);
      });

      // Prevent dropdown from closing when clicking on search input
      searchInput.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    function filterCities(searchTerm) {
      allOptions.forEach(option => {
        const cityName = option.getAttribute("data-value").toLowerCase();
        if (cityName.includes(searchTerm)) {
          option.style.display = "flex";
        } else {
          option.style.display = "none";
        }
      });
    }

    // Toggle dropdown
    selected.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Close all other dropdowns
      document.querySelectorAll(".custom-dropdown, .custom-multi-select").forEach(d => {
        if (d !== dropdown) {
          d.classList.remove("active");
          d.querySelector(".dropdown-options").classList.remove("show");
        }
      });
      
      dropdown.classList.toggle("active");
      options.classList.toggle("show");
      
      // Focus search input when dropdown opens
      if (options.classList.contains("show") && searchInput) {
        setTimeout(() => {
          searchInput.focus();
        }, 100);
      }
    });

    // Select/deselect option
    optionsList.querySelectorAll(".dropdown-option").forEach(option => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const city = option.getAttribute("data-value");
        
        if (selectedCities.includes(city)) {
          // Deselect
          selectedCities = selectedCities.filter(c => c !== city);
          option.classList.remove("selected");
        } else {
          // Select
          selectedCities.push(city);
          option.classList.add("selected");
        }
        
        updateServiceAreasDisplay();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
        options.classList.remove("show");
        // Clear search when closing
        if (searchInput) {
          searchInput.value = "";
          filterCities("");
        }
      }
    });

    function updateServiceAreasDisplay() {
      // Update hidden input
      hiddenInput.value = selectedCities.join(",");
      
      // Update selected text in dropdown
      if (selectedCities.length === 0) {
        selectedText.textContent = "Select cities (multiple selection allowed)";
        selectedText.classList.add("placeholder");
        selectedDisplay.style.display = "none";
      } else {
        selectedText.textContent = `${selectedCities.length} city/cities selected`;
        selectedText.classList.remove("placeholder");
        selectedDisplay.style.display = "block";
        selectedList.innerHTML = "";
        
        selectedCities.forEach(city => {
          const tag = document.createElement("div");
          tag.className = "selected-item-tag";
          tag.innerHTML = `
            <span>${city}</span>
            <button type="button" class="remove-btn" data-city="${city}">×</button>
          `;
          selectedList.appendChild(tag);
        });

        // Add remove button handlers
        selectedList.querySelectorAll(".remove-btn").forEach(btn => {
          btn.addEventListener("click", (e) => {
            const city = e.target.getAttribute("data-city");
            selectedCities = selectedCities.filter(c => c !== city);
            
            // Update option state
            const option = allOptions.find(opt => opt.getAttribute("data-value") === city);
            if (option) option.classList.remove("selected");
            
            updateServiceAreasDisplay();
          });
        });
      }
    }

    // Get selected cities
    window.getSelectedCities = () => selectedCities;
  }

  // Custom Dropdown Functionality
  function initCustomDropdowns() {
    // Business Type Dropdown
    const businessTypeDropdown = document.getElementById("businessTypeDropdown");
    if (businessTypeDropdown) {
      initDropdown(businessTypeDropdown, "businessType");
    }
  }

  function initDropdown(dropdown, fieldName) {
    const selected = dropdown.querySelector(".dropdown-selected");
    const selectedText = selected.querySelector(".selected-text");
    const options = dropdown.querySelector(".dropdown-options");
    const hiddenInput = document.getElementById(fieldName);
    const optionElements = options.querySelectorAll(".dropdown-option");

    // Toggle dropdown
    selected.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Close all other dropdowns
      document.querySelectorAll(".custom-dropdown, .custom-multi-select").forEach(d => {
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
        if (hiddenInput) {
          hiddenInput.value = value;
        }
        
        // Update option states
        optionElements.forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
        
        // Close dropdown
        dropdown.classList.remove("active");
        options.classList.remove("show");
        
        // Clear error if any
        const errorElement = document.getElementById(fieldName + "Error");
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

  // Validation functions
  function validateForm() {
    let isValid = true;

    // Validate business city
    const businessCity = document.getElementById("businessCity").value.trim();
    if (businessCity.length < 2) {
      showError("businessCityError", "Please enter a valid city name");
      isValid = false;
    }

    // Validate state
    const businessState = document.getElementById("businessState").value.trim();
    if (businessState.length < 2) {
      showError("businessStateError", "Please enter a valid state name");
      isValid = false;
    }

    // Validate address
    const address = document.getElementById("address").value.trim();
    if (address.length < 10) {
      showError("addressError", "Please enter a complete address (at least 10 characters)");
      isValid = false;
    }

    // Validate pincode
    const pincode = document.getElementById("pincode").value.trim();
    if (!/^[0-9]{6}$/.test(pincode)) {
      showError("pincodeError", "Please enter a valid 6-digit pin code");
      isValid = false;
    }

    // Validate number of vehicles
    const numberOfVehicles = parseInt(document.getElementById("numberOfVehicles").value);
    if (!numberOfVehicles || numberOfVehicles < 1) {
      showError("numberOfVehiclesError", "Please enter a valid number of vehicles (at least 1)");
      isValid = false;
    }

    // Validate vehicle types
    const selectedVehicleTypes = getSelectedVehicleTypes();
    if (selectedVehicleTypes.length === 0) {
      showError("vehicleTypesError", "Please select at least one vehicle type");
      isValid = false;
    } else {
      // If "Other" is selected, validate the input
      if (selectedVehicleTypes.includes("Other")) {
        const otherValue = document.getElementById("otherVehicleType").value.trim();
        if (!otherValue || otherValue.length < 2) {
          showError("otherVehicleTypeError", "Please specify the vehicle type");
          isValid = false;
        }
      }
    }

    // Validate business type
    const businessType = document.getElementById("businessType").value;
    if (!businessType) {
      showError("businessTypeError", "Please select a business type");
      isValid = false;
    }

    // Validate years in business
    const yearsInBusiness = document.getElementById("yearsInBusiness").value.trim();
    if (!yearsInBusiness || yearsInBusiness === "" || parseInt(yearsInBusiness) < 0) {
      showError("yearsInBusinessError", "Please enter years in business (minimum 0)");
      isValid = false;
    }

    // Validate service areas
    const selectedCities = getSelectedCities();
    if (selectedCities.length === 0) {
      showError("serviceAreasError", "Please select at least one city");
      isValid = false;
    }

    return isValid;
  }

  function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      errorElement.style.color = "#f44336";
    }
  }

  function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    }
  }

  function clearErrors() {
    const errorElements = document.querySelectorAll(".error-message");
    errorElements.forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });
  }

  function showSuccessMessage(message, onClose) {
    // You can use a modal or simple alert
    alert(message);
    if (onClose) {
      onClose();
    }
  }

  // Number spinner functions for Years in Business
  window.incrementYears = function() {
    const input = document.getElementById("yearsInBusiness");
    if (input) {
      const currentValue = parseInt(input.value) || 0;
      input.value = currentValue + 1;
      clearError("yearsInBusinessError");
      // Trigger input event to update validation
      input.dispatchEvent(new Event('input'));
    }
  };

  window.decrementYears = function() {
    const input = document.getElementById("yearsInBusiness");
    if (input) {
      const currentValue = parseInt(input.value) || 0;
      if (currentValue > 0) {
        input.value = currentValue - 1;
        clearError("yearsInBusinessError");
        // Trigger input event to update validation
        input.dispatchEvent(new Event('input'));
      }
    }
  };
});
