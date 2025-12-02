# Deployment Guide for BT Panel / aaPanel

## Overview

You'll add the state gateway proxy to your existing `transporters.cvis.com.ng` domain.

## Architecture

```
https://transporters.cvis.com.ng/
    ├─ / → Node.js app (port 5000) - Landing page
    ├─ /api/ → Node.js app - API routes
    └─ /state/lagos/ → Nginx proxy to https://lagos.lgpoa.ng
```

## Step 1: Deploy Node.js Application

### 1.1 Upload Application

```bash
# SSH into your server
ssh root@your-server-ip

# Create directory for the app
mkdir -p /www/wwwroot/transporters.cvis.com.ng/gateway
cd /www/wwwroot/transporters.cvis.com.ng/gateway

# Upload your files (use FTP, SCP, or Git)
# Or clone from Git:
git clone <your-repo-url> .

# Install dependencies
npm install

# Build for production
npm run build
```

### 1.2 Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
cd /www/wwwroot/transporters.cvis.com.ng/gateway
pm2 start npm --name "state-gateway" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

### 1.3 Verify Node.js is Running

```bash
# Check PM2 status
pm2 status

# Check if port 5000 is listening
netstat -tlnp | grep 5000

# Test locally
curl http://localhost:5000
```

## Step 2: Generate Complete Nginx Configuration

On your local machine or server:

```bash
cd /www/wwwroot/transporters.cvis.com.ng/gateway
node generate-nginx-config.js
```

This creates `nginx-complete.conf` with all 37 states configured.

## Step 3: Update Nginx Configuration

### Option A: Using BT Panel Web Interface

1. Login to BT Panel: `http://your-server-ip:8888`
2. Go to **Website** → Find `transporters.cvis.com.ng` → Click **Settings**
3. Go to **Config File** tab
4. **BACKUP** your current configuration first!
5. Add the state proxy configuration BEFORE the PHP and rewrite includes

Insert this section after the SSL configuration and before `include enable-php-00.conf`:

```nginx
# Increase timeouts for state proxies
client_max_body_size 100M;
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;

# Upstream for Node.js
upstream nodejs_gateway {
    server localhost:5000;
    keepalive 64;
}

# Root path - Node.js landing page
location = / {
    proxy_pass http://nodejs_gateway;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# API routes
location /api/ {
    proxy_pass http://nodejs_gateway;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Static assets for Vite dev
location ~ ^/(src|assets|node_modules|@vite|@react-refresh)/ {
    proxy_pass http://nodejs_gateway;
    proxy_http_version 1.1;
}

# Lagos State (add all 37 states)
location /state/lagos/ {
    proxy_pass https://lagos.lgpoa.ng/;
    proxy_ssl_server_name on;
    proxy_ssl_verify off;
    proxy_http_version 1.1;
    proxy_set_header Host lagos.lgpoa.ng;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_cookie_domain lagos.lgpoa.ng $host;
    proxy_cookie_path / /;
    proxy_redirect https://lagos.lgpoa.ng/ /state/lagos/;
    proxy_redirect / /state/lagos/;
    proxy_buffering off;
    proxy_request_buffering off;
}

# Repeat for all other states...
```

6. Click **Save**
7. The panel will automatically reload Nginx

### Option B: Using SSH (Recommended for all 37 states)

```bash
# Backup current config
cp /www/server/panel/vhost/nginx/transporters.cvis.com.ng.conf \
   /www/server/panel/vhost/nginx/transporters.cvis.com.ng.conf.backup

# Edit the config
nano /www/server/panel/vhost/nginx/transporters.cvis.com.ng.conf

# Add the proxy configuration (copy from PRODUCTION-NGINX-CONFIG.conf)

# Test Nginx configuration
nginx -t

# If test passes, reload Nginx
nginx -s reload
# Or
systemctl reload nginx
```

## Step 4: Update Application Configuration

Update `client/src/lib/states.ts` to use relative paths:

```typescript
export const nigerianStates: NigerianState[] = [
  { name: "Lagos State", slug: "lagos", path: "/state/lagos" },
  { name: "Rivers State", slug: "rivers", path: "/state/rivers" },
  // ... all other states with /state/{slug} paths
];
```

Rebuild and restart:

```bash
cd /www/wwwroot/transporters.cvis.com.ng/gateway
npm run build
pm2 restart state-gateway
```

## Step 5: Test the Setup

### 5.1 Test Landing Page

```bash
curl https://transporters.cvis.com.ng/
```

Should return HTML from your Node.js app.

### 5.2 Test State Proxy

```bash
curl -I https://transporters.cvis.com.ng/state/lagos/
```

Should return headers from Lagos portal.

### 5.3 Test in Browser

1. Open: `https://transporters.cvis.com.ng/`
2. Select Lagos State
3. Click "Continue to Lagos Login"
4. URL should be: `https://transporters.cvis.com.ng/state/lagos/`
5. Login should work without timeout!

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: Node.js app not running

**Fix**:
```bash
pm2 restart state-gateway
pm2 logs state-gateway
```

### Issue: 404 Not Found on root

**Cause**: Nginx routing conflict

**Fix**: Make sure `location = /` comes BEFORE other location blocks

### Issue: State proxy not working

**Check**:
```bash
# Test direct access
curl -I https://lagos.lgpoa.ng

# Check Nginx error log
tail -f /www/wwwlogs/transporters.cvis.com.ng.error.log

# Check if proxy config is loaded
nginx -T | grep "state/lagos"
```

### Issue: Login timeout

**Fix**: Make sure these are set:
```nginx
proxy_buffering off;
proxy_request_buffering off;
client_max_body_size 100M;
proxy_read_timeout 300s;
```

## Monitoring

### Check Application Status

```bash
# PM2 status
pm2 status

# View logs
pm2 logs state-gateway

# Monitor in real-time
pm2 monit
```

### Check Nginx Logs

```bash
# Access log
tail -f /www/wwwlogs/transporters.cvis.com.ng.log

# Error log
tail -f /www/wwwlogs/transporters.cvis.com.ng.error.log
```

## Maintenance

### Update Application

```bash
cd /www/wwwroot/transporters.cvis.com.ng/gateway
git pull  # or upload new files
npm install
npm run build
pm2 restart state-gateway
```

### Restart Services

```bash
# Restart Node.js app
pm2 restart state-gateway

# Reload Nginx
nginx -s reload

# Restart Nginx (if needed)
systemctl restart nginx
```

## Security Notes

1. ✅ SSL is already configured
2. ✅ Firewall should allow ports 80, 443, 8888 (BT Panel)
3. ✅ Keep Node.js and npm packages updated
4. ✅ Monitor logs for suspicious activity
5. ✅ Use strong passwords for BT Panel

## Performance Tips

1. Enable Gzip in BT Panel settings
2. Use PM2 cluster mode for better performance:
   ```bash
   pm2 start npm --name "state-gateway" -i max -- start
   ```
3. Enable Nginx caching for static assets
4. Monitor server resources (CPU, RAM, Disk)

## Complete Configuration Example

See `PRODUCTION-NGINX-CONFIG.conf` for the complete Nginx configuration with all 37 states.

## Need Help?

- Check PM2 logs: `pm2 logs state-gateway`
- Check Nginx logs: `tail -f /www/wwwlogs/transporters.cvis.com.ng.error.log`
- Test Nginx config: `nginx -t`
- Verify Node.js is running: `curl http://localhost:5000`
