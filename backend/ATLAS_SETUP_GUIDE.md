# MongoDB Atlas Quick Setup Guide

## Step-by-Step Instructions

### Step 1: Sign Up (Browser should open automatically)

- If browser didn't open, go to: https://www.mongodb.com/cloud/atlas/register
- Sign up with your email
- Verify your email address

### Step 2: Create Free Cluster

1. After login, click **"Build a Database"**
2. Choose **"FREE" (M0)** tier
3. Select **Cloud Provider**: AWS (or any)
4. Select **Region**: Choose closest to you (e.g., Mumbai for India)
5. Click **"Create"** (takes 3-5 minutes)

### Step 3: Create Database User

1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `taxiwale` (or your choice)
5. Password: Click **"Autogenerate Secure Password"** (SAVE THIS!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Configure Network Access

1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - Or add: `0.0.0.0/0`
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. **Copy the connection string** (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update .env File

1. Replace `<username>` with your database username (e.g., `taxiwale`)
2. Replace `<password>` with your database password
3. Add database name: `/taxiwale` before `?retryWrites`
4. Final format:
   ```
   mongodb+srv://taxiwale:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taxiwale?retryWrites=true&w=majority
   ```

### Step 7: Update backend/.env

Open `backend/.env` and update:

```
MONGODB_URI=mongodb+srv://taxiwale:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taxiwale?retryWrites=true&w=majority
```

### Step 8: Restart Backend Server

The backend server will automatically reconnect with the new connection string.

---

## Quick Test

After updating .env, test the connection:

```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected to MongoDB Atlas!'); process.exit(0); }).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });"
```

---

## Troubleshooting

**Connection Error?**

- Check username/password in connection string
- Verify IP address is allowed in Network Access
- Make sure cluster is fully created (green status)

**Can't find connection string?**

- Go to Database → Your Cluster → Connect → Connect your application

**Password issues?**

- Make sure password is URL-encoded (special characters)
- Or reset password in Database Access

---

**Need help?** Check MongoDB Atlas documentation or contact support.
