const axios = require("axios");

class WhatsAppService {
  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY;
    this.apiUrl =
      process.env.WHATSAPP_API_URL || "https://api.360dialog.com/v1";
  }

  async sendMessage(to, message) {
    // In development, just log
    if (process.env.NODE_ENV === "development" || !this.apiKey) {
      console.log(`📱 WhatsApp to ${to}: ${message}`);
      return { success: true };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          to: `91${to}`, // Add country code for India
          type: "text",
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("WhatsApp API Error:", error);
      // Don't throw in development
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      return { success: true };
    }
  }

  async sendTemplate(to, templateName, params) {
    // Implementation for template messages
    if (process.env.NODE_ENV === "development" || !this.apiKey) {
      console.log(`📱 WhatsApp template to ${to}: ${templateName}`);
      return { success: true };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/messages`,
        {
          to: `91${to}`,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: params,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("WhatsApp Template Error:", error);
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      return { success: true };
    }
  }
}

module.exports = new WhatsAppService();
