// Script to generate complete Nginx configuration for all states
import fs from 'fs';

const states = [
  { name: "Abia", slug: "abia", domain: "abia.lgpoa.ng" },
  { name: "Adamawa", slug: "adamawa", domain: "adamawa.lgpoa.ng" },
  { name: "Akwa Ibom", slug: "akwa-ibom", domain: "akwaibom.lgpoa.ng" },
  { name: "Anambra", slug: "anambra", domain: "anambra.lgpoa.ng" },
  { name: "Bauchi", slug: "bauchi", domain: "bauchi.lgpoa.ng" },
  { name: "Bayelsa", slug: "bayelsa", domain: "bayelsa.lgpoa.ng" },
  { name: "Benue", slug: "benue", domain: "benue.lgpoa.ng" },
  { name: "Borno", slug: "borno", domain: "borno.lgpoa.ng" },
  { name: "Cross River", slug: "cross-river", domain: "crossriver.lgpoa.ng" },
  { name: "Delta", slug: "delta", domain: "delta.lgpoa.ng" },
  { name: "Ebonyi", slug: "ebonyi", domain: "ebonyi.lgpoa.ng" },
  { name: "Edo", slug: "edo", domain: "edo.lgpoa.ng" },
  { name: "Ekiti", slug: "ekiti", domain: "ekiti.lgpoa.ng" },
  { name: "Enugu", slug: "enugu", domain: "enugu.lgpoa.ng" },
  { name: "FCT", slug: "fct", domain: "fct.lgpoa.ng" },
  { name: "Gombe", slug: "gombe", domain: "gombe.lgpoa.ng" },
  { name: "Imo", slug: "imo", domain: "imo.lgpoa.ng" },
  { name: "Jigawa", slug: "jigawa", domain: "jigawa.lgpoa.ng" },
  { name: "Kaduna", slug: "kaduna", domain: "kaduna.lgpoa.ng" },
  { name: "Kano", slug: "kano", domain: "kano.lgpoa.ng" },
  { name: "Katsina", slug: "katsina", domain: "katsina.lgpoa.ng" },
  { name: "Kebbi", slug: "kebbi", domain: "kebbi.lgpoa.ng" },
  { name: "Kogi", slug: "kogi", domain: "kogi.lgpoa.ng" },
  { name: "Kwara", slug: "kwara", domain: "kwara.lgpoa.ng" },
  { name: "Lagos", slug: "lagos", domain: "lagos.lgpoa.ng" },
  { name: "Nasarawa", slug: "nasarawa", domain: "nasarawa.lgpoa.ng" },
  { name: "Niger", slug: "niger", domain: "niger.lgpoa.ng" },
  { name: "Ogun", slug: "ogun", domain: "ogun.lgpoa.ng" },
  { name: "Ondo", slug: "ondo", domain: "ondo.lgpoa.ng" },
  { name: "Osun", slug: "osun", domain: "osun.lgpoa.ng" },
  { name: "Oyo", slug: "oyo", domain: "oyo.lgpoa.ng" },
  { name: "Plateau", slug: "plateau", domain: "plateau.lgpoa.ng" },
  { name: "Rivers", slug: "rivers", domain: "rivers.lgpoa.ng" },
  { name: "Sokoto", slug: "sokoto", domain: "sokoto.lgpoa.ng" },
  { name: "Taraba", slug: "taraba", domain: "taraba.lgpoa.ng" },
  { name: "Yobe", slug: "yobe", domain: "yobe.lgpoa.ng" },
  { name: "Zamfara", slug: "zamfara", domain: "zamfara.lgpoa.ng" },
];

const generateStateLocation = (state) => `
    # ${state.name} State
    location /state/${state.slug}/ {
        proxy_pass https://${state.domain}/;
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
        proxy_http_version 1.1;
        proxy_set_header Host ${state.domain};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cookie_domain ${state.domain} $host;
        proxy_cookie_path / /;
        proxy_redirect https://${state.domain}/ /state/${state.slug}/;
        proxy_redirect / /state/${state.slug}/;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        
        # Buffer settings for large POST requests
        proxy_buffering off;
        proxy_request_buffering off;
        client_body_buffer_size 128k;
        
        # Handle redirects
        proxy_redirect ~^https://${state.domain.replace(/\./g, '\\.')}(/.*)$ /state/${state.slug}$1;
    }`;

const config = `# Nginx Configuration for LGPOA State Gateway
# Generated automatically - DO NOT EDIT MANUALLY
# Place this file in /etc/nginx/sites-available/lgpoa
# Then create symlink: sudo ln -s /etc/nginx/sites-available/lgpoa /etc/nginx/sites-enabled/
# Test config: sudo nginx -t
# Reload: sudo systemctl reload nginx

# Upstream for the Node.js landing page
upstream nodejs_backend {
    server localhost:5000;
    keepalive 64;
}

# HTTP Server (Port 80)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # For production with SSL, uncomment this to redirect HTTP to HTTPS:
    # return 301 https://$server_name$request_uri;

    # Client body size (for file uploads)
    client_max_body_size 100M;
    client_body_timeout 300s;
    client_header_timeout 300s;
    send_timeout 300s;

    # Logging
    access_log /var/log/nginx/lgpoa_access.log;
    error_log /var/log/nginx/lgpoa_error.log;

    # Root path - serve the Node.js landing page
    location / {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # API routes - serve from Node.js
    location /api/ {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # State proxy locations
${states.map(generateStateLocation).join('\n')}
}

# HTTPS Server (Port 443) - For Production
# Uncomment and configure after obtaining SSL certificates
# Use Let's Encrypt: sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name yourdomain.com www.yourdomain.com;
#
#     # SSL certificates
#     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#
#     # Client body size
#     client_max_body_size 100M;
#     client_body_timeout 300s;
#     client_header_timeout 300s;
#     send_timeout 300s;
#
#     # Logging
#     access_log /var/log/nginx/lgpoa_ssl_access.log;
#     error_log /var/log/nginx/lgpoa_ssl_error.log;
#
#     # Include all location blocks from HTTP server above
#     # (Copy all location blocks here)
# }
`;

// Write the configuration file
fs.writeFileSync('nginx-complete.conf', config);
console.log('✅ Nginx configuration generated: nginx-complete.conf');
console.log('\nTo use this configuration:');
console.log('1. Copy to Nginx: sudo cp nginx-complete.conf /etc/nginx/sites-available/lgpoa');
console.log('2. Create symlink: sudo ln -s /etc/nginx/sites-available/lgpoa /etc/nginx/sites-enabled/');
console.log('3. Test config: sudo nginx -t');
console.log('4. Reload Nginx: sudo systemctl reload nginx');
console.log('\nFor SSL (production):');
console.log('5. Install certbot: sudo apt install certbot python3-certbot-nginx');
console.log('6. Get certificate: sudo certbot --nginx -d yourdomain.com');
