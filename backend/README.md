# Tripeaz Taxi Partners Backend API

Backend API for Tripeaz Taxi Partners platform built with Node.js, Express, and MongoDB.

## Features

- ✅ User Authentication (OTP-based)
- ✅ JWT Token Management
- ✅ Booking Management (CRUD)
- ✅ Vehicle Management (CRUD)
- ✅ User Profile Management
- ✅ Identity Verification (Aadhaar, DL, DigiLocker)
- ✅ Chatbot Support
- ✅ Wallet System
- ✅ Real-time Updates (Socket.io)
- ✅ Role-based Access Control

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Nodemailer** - Email service
- **Axios** - HTTP client

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taxiwale
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB

Make sure MongoDB is running on your system or use MongoDB Atlas.

### 4. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/send-otp` - Send OTP to mobile
- `POST /api/auth/verify-otp` - Verify OTP and get JWT
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Bookings

- `GET /api/bookings` - Get all bookings (with filters)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `POST /api/bookings/:id/assign` - Assign booking to partner
- `POST /api/bookings/:id/close` - Close booking
- `POST /api/bookings/:id/comment` - Add comment

### Vehicles

- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Post vehicle
- `GET /api/vehicles/:id` - Get vehicle by ID
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Profile

- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `GET /api/profile/wallet` - Get wallet
- `POST /api/profile/wallet/transaction` - Add transaction
- `GET /api/profile/qr` - Generate QR code

### Verification

- `GET /api/verification/status` - Get verification status
- `POST /api/verification/aadhaar` - Verify Aadhaar
- `POST /api/verification/driving-license` - Verify DL
- `POST /api/verification/digilocker` - Connect DigiLocker

### Chat

- `GET /api/chat` - Get chat history
- `POST /api/chat/message` - Send message

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── services/        # Business logic services
│   └── server.js        # Main server file
├── .env                 # Environment variables
├── package.json
└── README.md
```

## Development

The server runs on `http://localhost:3000` by default.

In development mode, OTPs are logged to console instead of being sent via SMS.

## License

ISC

---

**Powered by Wolfron Technologies**
