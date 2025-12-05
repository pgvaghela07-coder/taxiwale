# Quick MongoDB Atlas Setup - You're Already Logged In! ✅

## You're on the "Project 0 Overview" page. Here's what to do:

### Step 1: Create a Cluster (2 minutes)

1. **Click the green "Create" button** in the "Create a cluster" card
2. **Choose FREE (M0) tier** - It should be selected by default
3. **Cloud Provider:** Choose AWS (or any - doesn't matter for free tier)
4. **Region:** Choose closest to you (e.g., Mumbai/ap-south-1 for India)
5. **Cluster Name:** Leave default or name it "taxiwale-cluster"
6. **Click "Create Cluster"** (bottom right)
   - ⏳ Wait 3-5 minutes for cluster to be created

### Step 2: Create Database User (1 minute)

While cluster is creating, or after:

1. Click **"Database Access"** in the left sidebar (under SECURITY)
2. Click **"Add New Database User"** button
3. Choose **"Password"** authentication method
4. **Username:** `taxiwale` (or your choice)
5. **Password:** Click **"Autogenerate Secure Password"**
   - ⚠️ **COPY AND SAVE THIS PASSWORD!** You'll need it
6. **Database User Privileges:** Select **"Read and write to any database"**
7. Click **"Add User"**

### Step 3: Configure Network Access (1 minute)

1. Click **"Network Access"** in the left sidebar (under SECURITY)
2. Click **"Add IP Address"** button
3. Click **"Allow Access from Anywhere"** button
   - This adds `0.0.0.0/0` (allows all IPs for development)
4. Click **"Confirm"**

### Step 4: Get Connection String (1 minute)

1. Go back to **"Database"** → **"Clusters"** in left sidebar
2. Wait for cluster status to show **"Green"** (ready)
3. Click **"Connect"** button on your cluster
4. Choose **"Connect your application"**
5. **Driver:** Node.js
6. **Version:** 5.5 or later
7. **Copy the connection string** - It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Configure Backend

Once you have the connection string, run:

```powershell
cd backend
node configure-atlas.js
```

Or use the PowerShell script:

```powershell
.\backend\setup-atlas.ps1
```

**Important:** When entering the connection string:

- Replace `<username>` with your database username (e.g., `taxiwale`)
- Replace `<password>` with your database password
- Add `/taxiwale` before `?retryWrites` to specify database name

**Example final format:**

```
mongodb+srv://taxiwale:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taxiwale?retryWrites=true&w=majority
```

---

## Quick Checklist:

- [ ] Cluster created (green status)
- [ ] Database user created (username + password saved)
- [ ] Network access configured (0.0.0.0/0 allowed)
- [ ] Connection string copied
- [ ] Backend configured with connection string

---

**Need help?** The scripts will test the connection automatically!
