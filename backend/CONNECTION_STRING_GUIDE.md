# Getting Your MongoDB Atlas Connection String

## Current Step: Choose "Drivers"

You're on the connection method selection screen. Here's exactly what to do:

### Step 1: Click "Drivers"
- Look for the **"Drivers"** option under **"Connect to your application"**
- It has a calendar/grid icon showing "1011"
- Click on it (or the arrow on the right)

### Step 2: Select Node.js Driver
After clicking "Drivers", you'll see:
- **Driver:** Select **"Node.js"**
- **Version:** Select **"5.5 or later"** (or latest)

### Step 3: Copy Connection String
You'll see a connection string like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**⚠️ Important:** 
- Replace `<username>` with your database username (e.g., `taxiwale`)
- Replace `<password>` with your database password
- Add `/taxiwale` before `?retryWrites` to specify the database name

**Final format should be:**
```
mongodb+srv://taxiwale:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taxiwale?retryWrites=true&w=majority
```

### Step 4: Configure Backend

Once you have the connection string, you have two options:

#### Option A: Use Configuration Script (Recommended)
```powershell
cd backend
node configure-atlas.js
```
Then paste your connection string when prompted.

#### Option B: Manual Configuration
1. Open `backend/.env` file
2. Update the `MONGODB_URI` line with your connection string
3. Save the file
4. Restart the backend server

---

## Quick Checklist:
- [ ] Clicked "Drivers"
- [ ] Selected Node.js driver
- [ ] Copied connection string
- [ ] Replaced `<username>` and `<password>`
- [ ] Added `/taxiwale` before `?retryWrites`
- [ ] Configured backend with connection string

---

**Need help?** Just paste your connection string here and I'll configure it for you!

