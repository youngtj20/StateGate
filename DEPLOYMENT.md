# LGPOA State Gateway - Production Deployment Guide

## Architecture Overview

```
Internet
    ↓
Nginx (Port 80/443) - Reverse Proxy
    ↓
    ├─→ Node.js App (Port 5000) - Landing page & API
    └─→ State Laravel Apps - Direct proxy to state subdomains
```

## Why Nginx is the Best Solution

✅ **Production-Ready** - Industry standard for reverse proxying
✅ **Reliable** - No timeout issues with POST requests
✅ **High Performance** - Optimized for handling proxies
✅ **Security** - Built-in security features and SSL/TLS support
✅ **Easy Maintenance** - Standard configuration, well-documented
✅ **Scalable** - Can handle thousands of concurrent connections

## Prerequisites

- Ubuntu/Debian server (or any Linux distribution)
- Root or sudo access
- Domain name pointed to your server
- Node.js 18+ installed
- Nginx installed

## Step-by-Step Deployment

### 1. Install Nginx

```bash
# Update package list
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 2. Deploy Node.js Application

```bash
# Clone or upload your application
cd /var/www
sudo git clone <your-repo> lgpoa
cd lgpoa

# Install dependencies
npm install

# Build for production
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start npm --name "lgpoa" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 3. Configure Nginx

```bash
# Generate the Nginx configuration
node generate-nginx-config.js

# Copy configuration to Nginx
sudo cp nginx-complete.conf /etc/nginx/sites-available/lgpoa

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/lgpoa /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### 4. Update Domain in Configuration

Edit the Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/lgpoa
```

Replace `yourdomain.com` with your actual domain name.

### 5. Setup SSL with Let's Encrypt (Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically:
# - Obtain the certificate
# - Update Nginx configuration
# - Setup auto-renewal

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow SSH (if not already allowed)
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## How It Works

### URL Routing

1. **Landing Page**: `https://yourdomain.com/`
   - Served by Node.js app
   - Users select their state

2. **State Portals**: `https://yourdomain.com/state/lagos/`
   - Nginx proxies to `https://lagos.lgpoa.ng/`
   - URL stays as `yourdomain.com/state/lagos/...`
   - All Laravel features work perfectly (login, sessions, etc.)

### Request Flow

```
User visits: https://yourdomain.com/state/lagos/login
    ↓
Nginx receives request
    ↓
Nginx proxies to: https://lagos.lgpoa.ng/login
    ↓
Laravel processes login
    ↓
Laravel sends response (with cookies, redirects)
    ↓
Nginx rewrites redirects and cookies
    ↓
User sees: https://yourdomain.com/state/lagos/dashboard
```

## Advantages Over Node.js Proxy

| Feature | Node.js Proxy | Nginx Proxy |
|---------|--------------|-------------|
| POST Request Handling | ❌ Timeout issues | ✅ Perfect |
| Performance | ⚠️ Moderate | ✅ Excellent |
| Reliability | ⚠️ Can crash | ✅ Very stable |
| Memory Usage | ⚠️ Higher | ✅ Lower |
| Configuration | ⚠️ Complex code | ✅ Simple config |
| SSL/TLS | ⚠️ Manual setup | ✅ Built-in |
| Production Ready | ❌ Not recommended | ✅ Industry standard |

## Monitoring and Maintenance

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/lgpoa_access.log

# Error logs
sudo tail -f /var/log/nginx/lgpoa_error.log
```

### Check Node.js App

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs lgpoa

# Restart app
pm2 restart lgpoa
```

### Reload Nginx After Config Changes

```bash
# Test configuration
sudo nginx -t

# Reload if test passes
sudo systemctl reload nginx
```

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: Node.js app is not running

**Solution**:
```bash
pm2 restart lgpoa
pm2 logs lgpoa
```

### Issue: SSL Certificate Errors

**Solution**:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Issue: State Portal Not Loading

**Check**:
1. Is the state Laravel app accessible directly?
2. Check Nginx error logs
3. Verify proxy configuration

```bash
# Test direct access
curl -I https://lagos.lgpoa.ng

# Check Nginx logs
sudo tail -f /var/log/nginx/lgpoa_error.log
```

## Performance Optimization

### Enable Gzip Compression

Add to Nginx configuration:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### Enable Caching

```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Keep Nginx and Node.js updated
3. ✅ Use strong SSL/TLS configuration
4. ✅ Enable firewall (UFW)
5. ✅ Regular security audits
6. ✅ Monitor logs for suspicious activity
7. ✅ Use fail2ban to prevent brute force attacks

## Backup Strategy

```bash
# Backup Nginx configuration
sudo cp -r /etc/nginx/sites-available /backup/nginx-config-$(date +%Y%m%d)

# Backup application
tar -czf /backup/lgpoa-$(date +%Y%m%d).tar.gz /var/www/lgpoa

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 /backup/pm2-dump-$(date +%Y%m%d).pm2
```

## Conclusion

Using Nginx as a reverse proxy is the **recommended and production-ready solution** for this project. It provides:

- ✅ Reliable POST request handling (no timeouts)
- ✅ Better performance and scalability
- ✅ Industry-standard security
- ✅ Easy SSL/TLS setup
- ✅ Simple maintenance

The Node.js app only handles the landing page, while Nginx handles all the heavy lifting of proxying to state portals.
