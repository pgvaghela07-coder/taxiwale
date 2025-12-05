# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud - Recommended) ⭐

### Quick Setup (5 minutes):

1. **Sign up for free:**

   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Create a free account

2. **Create a Free Cluster:**

   - Click "Build a Database"
   - Choose "FREE" (M0) tier
   - Select a cloud provider and region (choose closest to you)
   - Click "Create"

3. **Create Database User:**

   - Go to "Database Access" → "Add New Database User"
   - Username: `taxiwale` (or your choice)
   - Password: Create a strong password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access:**

   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your current IP: `0.0.0.0/0`
   - Click "Confirm"

5. **Get Connection String:**

   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `taxiwale`

6. **Update .env file:**
   ```
   MONGODB_URI=mongodb+srv://taxiwale:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taxiwale?retryWrites=true&w=majority
   ```

**Example connection string format:**

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taxiwale?retryWrites=true&w=majority
```

---

## Option 2: Local MongoDB Installation

### Windows Installation:

1. **Download MongoDB:**

   - Go to: https://www.mongodb.com/try/download/community
   - Select:
     - Version: Latest (7.0+)
     - Platform: Windows
     - Package: MSI
   - Click "Download"

2. **Install MongoDB:**

   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Service Name: `MongoDB`
   - Check "Run service as Network Service user"
   - Check "Install MongoDB Compass" (GUI tool)
   - Click "Install"

3. **Verify Installation:**

   ```bash
   mongod --version
   ```

4. **Start MongoDB Service:**

   ```bash
   # MongoDB should start automatically as a service
   # If not, start it manually:
   net start MongoDB
   ```

5. **Update .env file:**
   ```
   MONGODB_URI=mongodb://localhost:27017/taxiwale
   ```

---

## Quick Test

After setup, test the connection:

```bash
# Test MongoDB connection
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taxiwale').then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });"
```

---

## Which Option to Choose?

- **MongoDB Atlas:** Best for quick start, development, and production
- **Local MongoDB:** Best if you want offline access or have specific requirements

**Recommendation:** Use MongoDB Atlas for now - it's free, fast, and works immediately!
