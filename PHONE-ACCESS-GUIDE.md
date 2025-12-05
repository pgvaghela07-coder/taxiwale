# 📱 Phone Access Guide - Local Network Setup

## Quick Setup Steps

### Step 1: Find Your Computer's IP Address

**Windows:**

```cmd
ipconfig
```

Look for "IPv4 Address" under your active network adapter (WiFi or Ethernet).
Example: `192.168.1.100`

**Mac/Linux:**

```bash
ifconfig
```

Look for "inet" under your active network adapter.
Example: `192.168.1.100`

### Step 2: Start Backend Server

```cmd
cd "C:\OneDrive\Desktop\New Taxi Wala Partners\backend"
npm start
```

Server will start on `http://0.0.0.0:5000` (accessible from all network interfaces)

### Step 3: Start Frontend Server

**Option A: Using Live Server (VS Code)**

1. Right-click on `index.html`
2. Select "Open with Live Server"
3. Note the port (usually 5500, 5502, or 5503)

**Option B: Using Python HTTP Server**

```cmd
cd "C:\OneDrive\Desktop\New Taxi Wala Partners"
python -m http.server 8000
```

**Option C: Using Node.js http-server**

```cmd
npx http-server -p 8000
```

### Step 4: Access from Phone

1. **Connect phone to same WiFi network** as your computer
2. **Open phone browser** and navigate to:

   - `http://YOUR_COMPUTER_IP:PORT`
   - Example: `http://192.168.1.100:5502` (if using Live Server)
   - Example: `http://192.168.1.100:8000` (if using Python server)

3. **API URL Auto-Detection:**
   - The frontend will automatically detect if you're accessing via IP address
   - It will automatically use the same IP for API calls
   - No manual configuration needed!

### Step 5: Manual API URL Configuration (If Needed)

If auto-detection doesn't work, manually set API URL in phone browser console:

1. Open browser developer tools on phone (or use remote debugging)
2. Run in console:

```javascript
localStorage.setItem("API_BASE_URL", "http://YOUR_COMPUTER_IP:5000/api");
```

Example: `localStorage.setItem('API_BASE_URL', 'http://192.168.1.100:5000/api')`

3. Refresh the page

## Troubleshooting

### Can't Access from Phone

1. **Check Firewall:**

   - Windows: Allow Node.js through Windows Firewall
   - Make sure ports 5000 (backend) and your frontend port are allowed

2. **Check Network:**

   - Ensure phone and computer are on the same WiFi network
   - Try pinging your computer's IP from phone

3. **Check Backend:**

   - Verify backend is running: `http://YOUR_IP:5000/health`
   - Check console for any errors

4. **Check CORS:**
   - Backend is configured to allow local network IPs (192.168.x.x, 10.x.x.x, etc.)
   - If still having issues, check backend console for CORS errors

### API Calls Not Working

1. **Check API URL:**

   - Open browser console on phone
   - Check: `localStorage.getItem('API_BASE_URL')`
   - Should be: `http://YOUR_IP:5000/api`

2. **Verify Backend:**

   - Test: `http://YOUR_IP:5000/health` in phone browser
   - Should return: `{ status: 'ok' }`

3. **Check Network:**
   - Ensure phone can reach computer's IP
   - Try accessing backend health endpoint directly

## Quick Test

1. Start backend: `npm start` (in backend folder)
2. Start frontend: Open with Live Server or Python server
3. On phone: Open `http://YOUR_IP:PORT`
4. Check console: Should see API calls working automatically

## Notes

- Backend listens on `0.0.0.0:5000` (all network interfaces)
- Frontend auto-detects IP address and uses it for API calls
- CORS is configured to allow local network IPs
- No need to modify code - works automatically!
