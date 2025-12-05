const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    if (
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      console.log(
        "⚠️ Email service not configured. Email functionality will be disabled."
      );
      this.transporter = null;
    }
  }

  async sendOTP(to, otp) {
    if (!this.transporter) {
      console.log(`📧 Email OTP to ${to}: ${otp}`);
      return { success: true };
    }

    const mailOptions = {
      from: `"Tripeaz Taxi Partners" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "Tripeaz Taxi Partners - OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFB300;">Your OTP for Tripeaz Taxi Partners</h2>
          <p>Your OTP is: <strong style="font-size: 24px; color: #FF7B00;">${otp}</strong></p>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Email Error:", error);
      throw error;
    }
  }

  async sendBookingConfirmation(to, booking) {
    if (!this.transporter) {
      console.log(
        `📧 Booking confirmation email to ${to} for booking ${booking.bookingId}`
      );
      return { success: true };
    }

    const mailOptions = {
      from: `"Tripeaz Taxi Partners" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "Tripeaz Taxi Partners - Booking Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFB300;">Booking Confirmed!</h2>
          <p>Your booking <strong>#${
            booking.bookingId
          }</strong> has been posted successfully.</p>
          <p><strong>Trip:</strong> ${booking.pickup.location} to ${
        booking.drop.location
      }</p>
          <p><strong>Date:</strong> ${new Date(
            booking.dateTime
          ).toLocaleString()}</p>
          <p><strong>Amount:</strong> ₹${booking.amount.bookingAmount}</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("Email Error:", error);
      throw error;
    }
  }
}

module.exports = new EmailService();
