# Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Create .env File

Create a `.env` file in the `backend` directory with the following content:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/taxiwale

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Note:** For production, add additional environment variables for:

- OTP Service (FAST2SMS_API_KEY)
- Email Service (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)
- WhatsApp API (WHATSAPP_API_KEY)
- Payment Gateway (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)

## Step 3: Start MongoDB

### Option A: Local MongoDB

Make sure MongoDB is installed and running:

```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### Option B: MongoDB Atlas (Cloud)

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

## Step 4: Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Step 5: Test the API

### Health Check

```bash
curl http://localhost:3000/health
```

### Send OTP (Example)

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210"}'
```

In development mode, the OTP will be logged to the console.

## API Documentation

See `README.md` for complete API endpoint documentation.

## Troubleshooting

### MongoDB Connection Error

- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify MongoDB port (default: 27017)

### Port Already in Use

- Change `PORT` in `.env`
- Or stop the process using port 3000

### Module Not Found

- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

---

**Ready to go!** 🚀
