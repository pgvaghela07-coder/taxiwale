// ===== PROFILE PAGE FUNCTIONALITY =====
console.log('Profile.js script loading...');

let apiService;
let currentUser = null;
let walletBalance = 0;

// ===== GLOBALLY ACCESSIBLE FUNCTIONS (Define Early) =====
// CRITICAL: Define functions directly on window FIRST to ensure they're available for inline onclick

// Logout - Define directly on window for immediate global access
// This function shows the in-app confirmation modal
window.logout = function logout() {
  console.log("Logout function called");
  
  // Show in-app confirmation modal
  const modal = document.getElementById('logoutConfirmModal');
  if (modal) {
    console.log("Showing logout confirmation modal");
    modal.classList.add('show');
  } else {
    console.warn("Logout modal not found, using fallback");
    // Fallback to browser confirm if modal not found
    if (confirm("Are you sure you want to logout?")) {
      performLogout();
    }
  }
};

// Function to perform actual logout (called after confirmation)
window.performLogout = function performLogout() {
  console.log("User confirmed logout, performing logout...");
  
  // Execute async logic in IIFE
  (async () => {
    try {
      console.log("Starting logout process...");
      
      // Initialize apiService if not already initialized
      if (!apiService && typeof ApiService !== 'undefined') {
        console.log("Initializing apiService...");
        apiService = new ApiService();
      }
      
      // Try to call logout API if apiService is available
      if (apiService) {
        try {
          console.log("Calling logout API...");
          await apiService.logout();
          console.log("Logout API call successful");
        } catch (apiError) {
          console.error('Logout API error:', apiError);
          // Continue with logout even if API call fails
        }
      } else {
        console.warn("apiService not available, proceeding with local logout");
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if there's an error
    } finally {
      console.log("Clearing storage and redirecting...");
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("Storage cleared, redirecting to login page...");
      
      // Force redirect to login page
      window.location.href = "/pages/index.html";
      
      // Fallback redirect after short delay
      setTimeout(() => {
        if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('index.html')) {
          window.location.replace("index.html");
        }
      }, 100);
    }
  })();
};

// Function to close logout modal
window.closeLogoutModal = function closeLogoutModal() {
  const modal = document.getElementById('logoutConfirmModal');
  if (modal) {
    modal.classList.remove('show');
    console.log("Logout modal closed");
  }
};

// Function to confirm logout (called from modal button)
window.confirmLogout = function confirmLogout() {
  console.log("Logout confirmed from modal");
  closeLogoutModal();
  performLogout();
};

// Also create a direct reference for compatibility
var logout = window.logout;

// Verify logout is defined
console.log('Logout function defined:', typeof logout, typeof window.logout);

// Verify all critical functions are available
console.log('Function availability check:', {
  logout: typeof logout,
  windowLogout: typeof window.logout,
  deleteAccount: typeof window.deleteAccount
});

// Delete Account - Make globally accessible
window.deleteAccount = function deleteAccount() {
  if (
    confirm(
      "⚠️ Are you sure you want to delete your account? This action cannot be undone."
    )
  ) {
    console.log("Deleting account...");
    alert(
      "🗑️ Account deletion requested\n\nThis feature will be implemented soon."
    );
  }
}

// Edit & Verify - Make globally accessible
window.editAndVerify = function editAndVerify() {
  console.log("Opening Edit & Verify...");
  // Redirect to verification page
  window.location.href = '/pages/verification.html';
}

// View Profile - Make globally accessible
window.viewProfile = function viewProfile() {
  console.log("Opening View Profile...");
  // Show detailed profile modal or page
  const displayName = currentUser?.name || currentUser?.fullName || 'N/A';
  const displayMobile = formatPhoneNumber(currentUser?.mobile || currentUser?.phone || '');
  const displayEmail = currentUser?.email || 'Not provided';
  alert(`👁️ Profile Details\n\nName: ${displayName}\nMobile: ${displayMobile}\nEmail: ${displayEmail}\n\nProfile details page coming soon!`);
}

// Download Profile QR - Make globally accessible
window.downloadQR = async function downloadQR() {
  try {
  console.log("Downloading Profile QR...");
    
    // Initialize apiService if not already initialized
    if (!apiService && typeof ApiService !== 'undefined') {
      apiService = new ApiService();
    }
    
    if (apiService) {
      const qrResponse = await apiService.getProfileQR();
      
      if (qrResponse.success && qrResponse.data) {
        // Open QR code in new window or download
        window.open(qrResponse.data.qrUrl, '_blank');
      } else {
        alert("📱 Download Profile QR\n\nFailed to generate QR code. Please try again.");
      }
    } else {
      alert("📱 Download Profile QR\n\nService not available. Please try again.");
    }
  } catch (error) {
    console.error('Error generating QR:', error);
    alert("📱 Download Profile QR\n\nFailed to generate QR code. Please try again.");
  }
}

// Show Membership - Make globally accessible
window.showMembership = function showMembership() {
  console.log("Opening Membership...");
  alert("⭐ Tripeaz Taxi Membership\n\nMembership details coming soon!");
}

// Open Wallet - Make globally accessible
window.openWallet = function openWallet() {
  console.log("Opening Wallet...");
  alert(`💰 Wallet\n\nBalance: ₹${walletBalance.toLocaleString('en-IN')}\n\nWallet details page coming soon!`);
}

// Change Language - Make globally accessible
window.changeLanguage = function changeLanguage() {
  console.log("Opening Language Settings...");
  alert("🌐 Change Language\n\nLanguage selection coming soon!");
}

// Show Terms - Make globally accessible
window.showTerms = function showTerms() {
  console.log("Opening Terms & Policy...");
  alert("📜 Terms & Policy\n\nTerms and policy details coming soon!");
}

// App Settings - Make globally accessible
window.appSettings = function appSettings() {
  console.log("Opening App Settings...");
  alert("⚙️ App Settings\n\nApp settings coming soon!");
}

// Contact Support - Make globally accessible
window.contactSupport = function contactSupport() {
  const modal = document.getElementById("supportModal");
  if (modal) {
    modal.classList.add("show");
  }
}

// WhatsApp Support - Make globally accessible
window.whatsappSupport = function whatsappSupport() {
  // WhatsApp support number (format: country code + number without + or spaces)
  const supportNumber = "919103774717"; // +91-9103774717 without + and dashes
  const message = encodeURIComponent("Hello! I need help with Tripeaz Taxi Partners.");
  const whatsappUrl = `https://wa.me/${supportNumber}?text=${message}`;
  
  // Open WhatsApp in new tab
  window.open(whatsappUrl, '_blank');
  closeSupportModal();
}

// Call Support - Make globally accessible
window.callSupport = function callSupport() {
  // Support phone number
  const supportNumber = "+919103774717"; // Format: +91 followed by number
  const telUrl = `tel:${supportNumber}`;
  
  // Open phone dialer
  window.location.href = telUrl;
  closeSupportModal();
}

// Email Support - Make globally accessible
window.emailSupport = function emailSupport() {
  alert("✉️ Email Support\n\nsupport@tripeaztaxi.com");
  closeSupportModal();
}

// Close Support Modal - Make globally accessible
window.closeSupportModal = function closeSupportModal() {
  const modal = document.getElementById("supportModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

// All functions are already defined above and assigned to window
// No need for conditional assignments - they're already in global scope

// ===== HELPER FUNCTIONS (Internal use only) =====

// Format phone number with country code
function formatPhoneNumber(mobile) {
  if (!mobile) return '+91 -------';
  
  // Remove any non-digit characters
  const digits = mobile.replace(/\D/g, '');
  
  // If 10 digits, add +91
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  
  // If already has country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  
  return `+91 ${mobile}`;
}

// Initialize API Service
async function initApiService() {
  try {
    // Check if apiService is already initialized
    if (apiService) {
      console.log('API Service already initialized');
      await loadProfileData();
      return;
    }
    
    // Wait for ApiService class to be available
    if (typeof ApiService === 'undefined') {
      console.warn('ApiService not available, using localStorage only');
      loadFromLocalStorage();
      return;
    }
    
    // Initialize apiService only if not already set
    if (!apiService) {
      apiService = new ApiService();
    }
    
    await loadProfileData();
  } catch (error) {
    console.error('Error initializing API service:', error);
    // Fallback to localStorage
    loadFromLocalStorage();
  }
}

// Load from localStorage as fallback
function loadFromLocalStorage() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      currentUser = JSON.parse(userStr);
      console.log('Loaded user from localStorage:', currentUser);
      // Ensure DOM is ready before updating
      setTimeout(() => {
        updateProfileUI(currentUser);
      }, 100);
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  } else {
    console.warn('No user data in localStorage');
  }
}

// Load profile data from API
async function loadProfileData() {
  try {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, redirecting to login...');
      window.location.href = 'index.html';
      return;
    }

    // Load user data from localStorage first (for quick display)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        currentUser = JSON.parse(userStr);
        console.log('Loaded user from localStorage:', currentUser);
        updateProfileUI(currentUser);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }

    // Fetch fresh data from API/database if apiService is available
    if (apiService) {
      console.log('📡 Fetching fresh profile data from database...');
      try {
        const profileResponse = await apiService.getProfile();
        console.log('Profile API response:', profileResponse);
        
        if (profileResponse.success && profileResponse.data) {
          currentUser = profileResponse.data;
          
          // Update localStorage with fresh data from database
          localStorage.setItem('user', JSON.stringify(currentUser));
          
          // Update UI with fresh data from database
          updateProfileUI(currentUser);
          
          console.log('✅ Profile data updated from database');
        } else {
          console.error('Failed to fetch profile:', profileResponse);
          // Keep using localStorage data if API fails
          if (!currentUser) {
            showError('Failed to load profile data');
          }
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        // Keep using localStorage data if API fails
        if (!currentUser) {
          showError('Failed to load profile from server. Using cached data.');
        }
      }
    } else {
      console.warn('API service not available, using localStorage data only');
    }

    // Load wallet balance
    if (apiService) {
      await loadWalletBalance();
    }

  } catch (error) {
    console.error('❌ Error loading profile:', error);
    
    // If we have localStorage data, use it
    if (!currentUser) {
      showError('Failed to load profile. Please try again.');
    }
    
    // If unauthorized, redirect to login
    if (error.message && (error.message.includes('authorization') || error.message.includes('401'))) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    }
  }
}

// Load wallet balance
async function loadWalletBalance() {
  try {
    const walletResponse = await apiService.getWallet();
    if (walletResponse.success && walletResponse.data) {
      walletBalance = walletResponse.data.balance || 0;
      updateWalletDisplay();
    }
  } catch (error) {
    console.error('Error loading wallet:', error);
    // Wallet is optional, so don't show error
    walletBalance = 0;
    updateWalletDisplay();
  }
}

// Update profile UI with user data
function updateProfileUI(user) {
  if (!user) {
    console.warn('No user data provided to updateProfileUI');
    return;
  }

  console.log('Updating profile UI with user data:', user);
  console.log('User name:', user.name || user.fullName);
  console.log('User mobile:', user.mobile || user.phone);

  // Update name - try ID first, then class
  const nameElement = document.getElementById('profileName') || document.querySelector('.profile-name');
  if (nameElement) {
    const displayName = user.name || user.fullName || 'User';
    nameElement.textContent = displayName;
    console.log('✅ Updated name:', displayName);
  } else {
    console.error('❌ Name element not found');
    // Retry after a short delay
    setTimeout(() => {
      const retryElement = document.getElementById('profileName') || document.querySelector('.profile-name');
      if (retryElement) {
        retryElement.textContent = user.name || user.fullName || 'User';
      }
    }, 200);
  }

  // Update phone number - try ID first, then class
  const phoneElement = document.getElementById('profilePhone') || document.querySelector('.profile-phone');
  if (phoneElement) {
    const phoneNumber = user.mobile || user.phone || '';
    const formattedPhone = formatPhoneNumber(phoneNumber);
    phoneElement.textContent = formattedPhone;
    console.log('✅ Updated phone:', formattedPhone);
  } else {
    console.error('❌ Phone element not found');
    // Retry after a short delay
    setTimeout(() => {
      const retryElement = document.getElementById('profilePhone') || document.querySelector('.profile-phone');
      if (retryElement) {
        const phoneNumber = user.mobile || user.phone || '';
        retryElement.textContent = formatPhoneNumber(phoneNumber);
      }
    }, 200);
  }

  // Update profile picture - try ID first, then class
  const avatarImg = document.getElementById('profileAvatar') || document.querySelector('.profile-avatar img');
  if (avatarImg) {
    if (user.profile && user.profile.avatar) {
      avatarImg.src = user.profile.avatar;
      avatarImg.alt = user.name || 'Profile';
    } else {
      // Use placeholder or generate initials
      const displayName = user.name || user.fullName || 'User';
      avatarImg.src = generateAvatarPlaceholder(displayName);
      avatarImg.alt = displayName;
    }
    console.log('✅ Updated avatar');
  }

  // Update verification status
  updateVerificationStatus(user);

  // Calculate and update profile completion
  const completionPercentage = calculateProfileCompletion(user);
  updateProfileCompletion(completionPercentage);
  
  console.log('✅ Profile UI update complete');
}

// Generate avatar placeholder from name initials
function generateAvatarPlaceholder(name) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Create a data URL for a colored circle with initials
  const colors = ['#FFB300', '#FF7B00', '#2196F3', '#4CAF50', '#9C27B0'];
  const color = colors[name.length % colors.length];
  
  // For now, use a placeholder service or return a default
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color.replace('#', '')}&color=fff&size=100&bold=true`;
}

// Update verification status badge
function updateVerificationStatus(user) {
  const verifiedBadge = document.getElementById('verifiedBadge') || document.querySelector('.verified-badge');
  if (!verifiedBadge) {
    console.error('Verified badge element not found');
    return;
  }

  const isPhoneVerified = user.is_phone_verified || false;
  const isAadhaarVerified = user.verificationStatus?.aadhaar?.verified || false;
  const isDLVerified = user.verificationStatus?.drivingLicense?.verified || false;

  // Show verified badge if at least phone is verified
  if (isPhoneVerified) {
    verifiedBadge.style.display = 'flex';
    verifiedBadge.innerHTML = `
      <span class="verify-icon">✓</span>
      <span>Verified</span>
    `;
  } else {
    verifiedBadge.style.display = 'none';
  }
}

// Calculate profile completion percentage
function calculateProfileCompletion(user) {
  if (!user) return 0;

  const fields = {
    name: user.name ? 1 : 0,
    mobile: user.mobile ? 1 : 0,
    email: user.email ? 1 : 0,
    phoneVerified: user.is_phone_verified ? 1 : 0,
    aadhaarVerified: user.verificationStatus?.aadhaar?.verified ? 1 : 0,
    dlVerified: user.verificationStatus?.drivingLicense?.verified ? 1 : 0,
    avatar: (user.profile && user.profile.avatar) ? 1 : 0,
    address: (user.profile && user.profile.address) ? 1 : 0,
    city: (user.profile && user.profile.city) ? 1 : 0,
    state: (user.profile && user.profile.state) ? 1 : 0,
    pincode: (user.profile && user.profile.pincode) ? 1 : 0,
  };

  const totalFields = Object.keys(fields).length;
  const completedFields = Object.values(fields).reduce((sum, val) => sum + val, 0);
  
  const percentage = Math.round((completedFields / totalFields) * 100);
  return Math.min(percentage, 100); // Cap at 100%
}

// Update profile completion display
function updateProfileCompletion(percentage) {
  const completionFill = document.getElementById('completionFill') || document.querySelector('.completion-fill');
  const completionText = document.getElementById('completionText') || document.querySelector('.completion-text');
  
  if (completionFill) {
    completionFill.style.width = `${percentage}%`;
  } else {
    console.error('Completion fill element not found');
  }
  
  if (completionText) {
    completionText.textContent = `${percentage}% Profile Complete`;
  } else {
    console.error('Completion text element not found');
  }
}

// Update wallet display
function updateWalletDisplay() {
  const walletBadge = document.querySelector('.option-item[onclick="openWallet()"] .option-badge');
  if (walletBadge) {
    walletBadge.textContent = `₹${walletBalance.toLocaleString('en-IN')}`;
  }
}

// Show error message
function showError(message) {
  // You can implement a toast notification here
  console.error('Profile Error:', message);
  // For now, just log it
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("👤 Profile page loaded");
  
  // Immediately try to load from localStorage for instant display
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('Loading user from localStorage immediately:', user);
      
      // Update name and phone immediately (before full UI update)
      const nameElement = document.getElementById('profileName');
      const phoneElement = document.getElementById('profilePhone');
      
      if (nameElement) {
        const displayName = user.name || user.fullName || 'User';
        nameElement.textContent = displayName;
        console.log('✅ Updated name immediately:', displayName);
      }
      
      if (phoneElement) {
        const phoneNumber = user.mobile || user.phone || '';
        const formattedPhone = formatPhoneNumber(phoneNumber);
        phoneElement.textContent = formattedPhone || 'Loading...';
        console.log('✅ Updated phone immediately:', formattedPhone);
      }
      
      // Use setTimeout to ensure DOM is ready for full UI update
      setTimeout(() => {
        updateProfileUI(user);
      }, 100);
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  } else {
    console.warn('No user data in localStorage');
    
    // Try to fetch from API if no localStorage data
    setTimeout(() => {
      initApiService();
    }, 200);
  }
  
  // Then initialize API service for fresh data from database
  // Use a small delay to avoid conflicts with dashboard.js
  setTimeout(() => {
    initApiService();
  }, 200);
  
  // Add event delegation for logout and other action buttons
  // This ensures functions work even if inline onclick fails
  // Wait a bit for DOM to be fully ready
  setTimeout(() => {
    // Try multiple selectors to find logout button
    let logoutButton = document.querySelector('.option-item[onclick*="logout()"]');
    
    if (!logoutButton) {
      // Try finding by text content
      const allOptionItems = document.querySelectorAll('.option-item');
      logoutButton = Array.from(allOptionItems).find(el => {
        const text = el.textContent || el.innerText || '';
        return text.includes('Logout') && !text.includes('Delete Account');
      });
    }
    
    if (logoutButton) {
      console.log("✅ Logout button found, setting up event listener");
      // Remove inline onclick and add event listener
      logoutButton.removeAttribute('onclick');
      
      // Remove any existing listeners by cloning
      const newLogoutButton = logoutButton.cloneNode(true);
      logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
      
      newLogoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("🖱️ Logout button clicked via event listener");
        
        // Try multiple ways to call logout
        if (typeof logout === 'function') {
          console.log("Calling logout() function");
          logout();
        } else if (typeof window.logout === 'function') {
          console.log("Calling window.logout() function");
          window.logout();
        } else {
          console.error('❌ Logout function not available, attempting direct logout');
          // Direct logout if function not available
          if (confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/pages/index.html";
          }
        }
      });
      
      console.log("✅ Logout event listener attached successfully");
    } else {
      console.warn("⚠️ Logout button not found in DOM - inline onclick will be used");
    }
  }, 300);
  
  // Similar for deleteAccount
  const deleteAccountButton = document.querySelector('.option-item[onclick*="deleteAccount()"]');
  if (deleteAccountButton) {
    deleteAccountButton.removeAttribute('onclick');
    deleteAccountButton.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof deleteAccount === 'function') {
        deleteAccount();
      } else if (typeof window.deleteAccount === 'function') {
        window.deleteAccount();
      }
    });
  }
});
