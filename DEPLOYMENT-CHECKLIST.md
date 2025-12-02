# Deployment Checklist - Fix Redirect Issue

## The Problem
The app is still redirecting to `https://lagos.lgpoa.ng/login` instead of showing the iframe.

## Why?
The browser is using **cached old code**. The new iframe code hasn't been deployed yet.

## Solution

### For Development (localhost:5000)

1. **Stop the dev server** (Ctrl+C in terminal)

2. **Restart it:**
   ```bash
   npm run dev
   ```

3. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"
   - Or use **Incognito/Private window**

4. **Test:**
   - Go to `http://localhost:5000`
   - Select Lagos
   - Should show: `http://localhost:5000/state/lagos` with iframe

### For Production (transporters.cvis.com.ng)

1. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Navigate to project:**
   ```bash
   cd /www/wwwroot/transporters.cvis.com.ng/gateway
   ```

3. **Pull latest code** (if using Git):
   ```bash
   git pull
   ```
   
   Or **upload the new files** via FTP/SCP

4. **Install dependencies** (if needed):
   ```bash
   npm install
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Restart PM2:**
   ```bash
   pm2 restart state-gateway
   ```

7. **Check PM2 status:**
   ```bash
   pm2 logs state-gateway --lines 50
   ```

8. **Clear browser cache** and test

## Verify Files Exist

Make sure these files exist:

```bash
# Check if state-portal.tsx exists
ls -la client/src/pages/state-portal.tsx

# Check if App.tsx was updated
cat client/src/App.tsx | grep StatePortal
```

Should see: `import StatePortal from "@/pages/state-portal";`

## Test the Route

After deployment, test:

```bash
# Test if route works
curl http://localhost:5000/state/lagos
```

Should return HTML with an iframe.

## Still Not Working?

### Check 1: Is the new code deployed?

Open browser DevTools (F12) → Sources tab → Check if `state-portal.tsx` is loaded

### Check 2: Is PM2 running the new code?

```bash
pm2 restart state-gateway --update-env
pm2 logs state-gateway
```

### Check 3: Clear ALL cache

- Close ALL browser tabs
- Clear cache completely
- Open in **Incognito/Private window**
- Test again

### Check 4: Hard refresh

- Press `Ctrl + Shift + R` (Windows/Linux)
- Or `Cmd + Shift + R` (Mac)

## Expected Behavior

✅ **Before:** `https://lagos.lgpoa.ng/login` (direct redirect)
✅ **After:** `https://transporters.cvis.com.ng/state/lagos` (iframe)

## Quick Test Command

Run this to verify the route exists:

```bash
cd /www/wwwroot/transporters.cvis.com.ng/gateway
grep -r "state-portal" client/src/
```

Should show the import in App.tsx and the file itself.
