# Setting Up Nginx on Windows for Development

## Step 1: Download and Install Nginx for Windows

1. Download Nginx for Windows from: http://nginx.org/en/download.html
   - Get the latest stable version (e.g., `nginx-1.24.0.zip`)

2. Extract to `C:\nginx`

## Step 2: Configure Nginx

1. Open `C:\nginx\conf\nginx.conf` in a text editor

2. Replace the entire content with this configuration:

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    # Upstream for Node.js app
    upstream nodejs_backend {
        server localhost:5000;
    }

    server {
        listen       80;
        server_name  localhost;

        client_max_body_size 100M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;

        # Root - Node.js landing page
        location / {
            proxy_pass http://nodejs_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API routes
        location /api/ {
            proxy_pass http://nodejs_backend;
            proxy_set_header Host $host;
        }

        # Lagos State
        location /state/lagos/ {
            proxy_pass https://lagos.lgpoa.ng/;
            proxy_ssl_server_name on;
            proxy_ssl_verify off;
            proxy_http_version 1.1;
            proxy_set_header Host lagos.lgpoa.ng;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cookie_domain lagos.lgpoa.ng $host;
            proxy_cookie_path / /;
            proxy_redirect https://lagos.lgpoa.ng/ /state/lagos/;
            proxy_redirect / /state/lagos/;
            proxy_buffering off;
            proxy_request_buffering off;
        }

        # Add more states as needed...
    }
}
```

## Step 3: Start Nginx

1. Open Command Prompt as Administrator
2. Navigate to Nginx directory:
   ```cmd
   cd C:\nginx
   ```

3. Start Nginx:
   ```cmd
   start nginx
   ```

4. Check if it's running:
   ```cmd
   tasklist /fi "imagename eq nginx.exe"
   ```

## Step 4: Update Your App

Change the state paths back to use `/state/` prefix:

In `client/src/lib/states.ts`, change Lagos to:
```typescript
{ name: "Lagos State", slug: "lagos", path: "/state/lagos" }
```

## Step 5: Test

1. Make sure Node.js app is running on port 5000
2. Open browser and go to: `http://localhost` (port 80)
3. Select Lagos and click Continue
4. URL should stay as `http://localhost/state/lagos`

## Managing Nginx on Windows

**Stop Nginx:**
```cmd
cd C:\nginx
nginx -s stop
```

**Reload config after changes:**
```cmd
cd C:\nginx
nginx -s reload
```

**Check for errors:**
```cmd
cd C:\nginx
nginx -t
```

## Troubleshooting

**Port 80 already in use?**
- Stop IIS or other web servers
- Or change Nginx to use port 8080:
  ```nginx
  listen 8080;
  ```
  Then access via `http://localhost:8080`

**Nginx won't start?**
- Check `C:\nginx\logs\error.log` for errors
- Make sure no other service is using port 80
