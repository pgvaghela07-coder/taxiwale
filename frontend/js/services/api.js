// API Service for Tripeaz Taxi Partners Frontend
// Get API URL from localStorage or use default
// On phone, set this in browser console: localStorage.setItem('API_BASE_URL', 'http://192.168.1.100:6300/api')
// Production: Automatically uses Render backend URL
function getApiBaseUrl() {
  // Check if API URL is set in localStorage (for manual override)
  const storedUrl = localStorage.getItem("API_BASE_URL");
  if (storedUrl) {
    return storedUrl;
  }

  // Auto-detect environment
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  const isLocalhost = currentHost === "localhost" || currentHost === "127.0.0.1";
  const isFileProtocol = currentProtocol === "file:";
  const isLocalNetwork = currentHost.startsWith("192.168.") || 
                         currentHost.startsWith("10.") || 
                         currentHost.startsWith("172.16.") ||
                         currentHost.startsWith("172.17.") ||
                         currentHost.startsWith("172.18.") ||
                         currentHost.startsWith("172.19.") ||
                         currentHost.startsWith("172.20.") ||
                         currentHost.startsWith("172.21.") ||
                         currentHost.startsWith("172.22.") ||
                         currentHost.startsWith("172.23.") ||
                         currentHost.startsWith("172.24.") ||
                         currentHost.startsWith("172.25.") ||
                         currentHost.startsWith("172.26.") ||
                         currentHost.startsWith("172.27.") ||
                         currentHost.startsWith("172.28.") ||
                         currentHost.startsWith("172.29.") ||
                         currentHost.startsWith("172.30.") ||
                         currentHost.startsWith("172.31.");

  // For localhost or file:// protocol: use localhost backend
  // Try port 6300 first (default), then 5000 as fallback
  if (isLocalhost || isFileProtocol) {
    // Default to 6300, but user can override via localStorage
    // To use port 5000: localStorage.setItem('API_BASE_URL', 'http://localhost:5000/api')
    return "http://localhost:6300/api";
  }

  // Local network: use same IP with port 6300 (for mobile/local device testing)
  if (isLocalNetwork) {
    return `http://${currentHost}:6300/api`;
  }

  // Production: Use Render backend URL
  // Backend is deployed on Render, so use Render URL by default
  // To use localhost backend: localStorage.setItem('API_BASE_URL', 'http://localhost:6300/api')
  return window.location.origin + "/api";
}

const API_BASE_URL = getApiBaseUrl();
console.log("🌐 API Base URL:", API_BASE_URL);

class ApiService {
  constructor() {
    // Token will be fetched fresh on each request
  }

  getToken() {
    return localStorage.getItem("token");
  }

  async request(endpoint, options = {}) {
    // Get fresh token on each request
    const token = this.getToken();

    if (!token && !endpoint.includes("/auth/")) {
      throw new Error("No token, authorization denied. Please login first.");
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: response.statusText };
        }

        // Log the full error for debugging
        console.error("❌ API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          url: url,
          method: options.method || "GET",
          data: errorData,
        });
        
        // Provide helpful error message for Method Not Allowed
        if (response.status === 405) {
          console.error("💡 Method Not Allowed - Check:");
          console.error("   1. Backend server is running");
          console.error("   2. API URL is correct:", API_BASE_URL);
          console.error("   3. To set custom API URL: localStorage.setItem('API_BASE_URL', 'http://localhost:PORT/api')");
          throw new Error(
            `Method Not Allowed (405). Check if backend is running and API URL is correct. Current URL: ${API_BASE_URL}`
          );
        }
        
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Request failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ API Success:", url, data);
      return data;
    } catch (error) {
      // Handle network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.error(
          "❌ Network Error - Backend server might be down:",
          error
        );
        const apiUrl = API_BASE_URL.replace('/api', '');
        throw new Error(
          `Cannot connect to server. Please check if the backend server is running at ${apiUrl}`
        );
      }
      console.error("❌ API Request Error:", {
        url: url,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Auth methods
  async sendOTP(mobile) {
    return this.request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ mobile }),
    });
  }

  async verifyOTP(mobile, otp) {
    const data = await this.request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ mobile, otp }),
    });

    if (data.token || data.data?.token) {
      const token = data.token || data.data?.token;
      localStorage.setItem("token", token);
      if (data.user || data.data?.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user || data.data.user)
        );
      }
    }

    return data;
  }

  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        console.log("Calling logout API endpoint...");
        await this.request("/auth/logout", { method: "POST" });
        console.log("Logout API call completed");
      } else {
        console.log("No token found, skipping API call");
      }
    } catch (error) {
      console.error("Logout API error (continuing with local logout):", error);
      // Continue with local logout even if API fails
    } finally {
      // Always clear local storage
      console.log("Clearing local storage...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Clear all other items too
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("token") ||
            key.includes("user") ||
            key.includes("auth"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log("Local storage cleared");
    }
  }

  // Booking methods
  async getBookings(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/bookings?${query}`);
  }

  async getMyBookings(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/bookings/my-bookings?${query}`);
  }

  async getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  async createBooking(bookingData) {
    return this.request("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  }

  async updateBooking(id, bookingData) {
    return this.request(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(bookingData),
    });
  }

  async deleteBooking(id) {
    return this.request(`/bookings/${id}`, {
      method: "DELETE",
    });
  }

  async assignBooking(id, partnerId) {
    return this.request(`/bookings/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ partnerId }),
    });
  }

  async closeBooking(id, data) {
    return this.request(`/bookings/${id}/close`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addComment(id, text) {
    return this.request(`/bookings/${id}/comment`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  // Vehicle methods
  async getVehicles(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/vehicles?${query}`);
  }

  async getMyVehicles(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/vehicles/my-vehicles?${query}`);
  }

  async getVehicle(id) {
    return this.request(`/vehicles/${id}`);
  }

  async createVehicle(vehicleData) {
    return this.request("/vehicles", {
      method: "POST",
      body: JSON.stringify(vehicleData),
    });
  }

  async updateVehicle(id, vehicleData) {
    return this.request(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(vehicleData),
    });
  }

  async deleteVehicle(id) {
    return this.request(`/vehicles/${id}`, {
      method: "DELETE",
    });
  }

  async assignVehicle(id, partnerId) {
    return this.request(`/vehicles/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ partnerId }),
    });
  }

  async closeVehicle(id, data) {
    return this.request(`/vehicles/${id}/close`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addVehicleComment(id, text) {
    return this.request(`/vehicles/${id}/comment`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  // Profile methods
  async getProfile() {
    return this.request("/profile");
  }

  async updateProfile(profileData) {
    return this.request("/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  async getWallet() {
    return this.request("/profile/wallet");
  }

  async getProfileQR() {
    return this.request("/profile/qr");
  }

  // User search for assignment
  async searchUsers(query) {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`);
  }

  // Verification methods
  async verifyAadhaar(aadhaarData) {
    return this.request("/verification/aadhaar", {
      method: "POST",
      body: JSON.stringify(aadhaarData),
    });
  }

  async verifyDrivingLicense(dlData) {
    return this.request("/verification/driving-license", {
      method: "POST",
      body: JSON.stringify(dlData),
    });
  }

  // Chat methods
  async getChatHistory() {
    return this.request("/chat");
  }

  async sendChatMessage(message) {
    return this.request("/chat/message", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }
}

// Create global instance
const apiService = new ApiService();
