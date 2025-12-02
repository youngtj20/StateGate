# StateGate Proxy System - Detailed Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [How the Proxy Works](#how-the-proxy-works)
3. [Request Flow](#request-flow)
4. [URL Rewriting](#url-rewriting)
5. [Gzip Decompression](#gzip-decompression)
6. [Security Analysis](#security-analysis)
7. [Production Recommendations](#production-recommendations)
8. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

The StateGate application uses a **reverse proxy pattern** to provide a unified interface for accessing multiple state-specific LGPOA (Local Government Proof of Address) portals.

### Components:
- **Client Application**: React-based frontend (Vite)
- **Express Server**: Node.js backend with proxy middleware
- **Proxy Middleware**: `http-proxy-middleware` with custom response handling
- **Target Portals**: Individual state portals at `https://{state}.lgpoa.ng`

### System Diagram:
```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│              http://localhost:5000                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  StateGate Application                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Frontend (Landing Page + State Selector)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express Server (Port 5000)                          │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Proxy Middleware (http-proxy-middleware)       │  │   │
│  │  │ - Route: /state/{state-slug}                   │  │   │
│  │  │ - Target: https://{state}.lgpoa.ng             │  │   │
│  │  │ - Custom Response Handling                     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────��──────��─────────────────────────────┐
│              State Portal Servers (HTTPS)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Lagos Portal │  │ Abia Portal  │  │ Kano Portal  │ ...  │
│  │ (HTTPS)      │  │ (HTTPS)      │  │ (HTTPS)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## How the Proxy Works

### 1. **State Selection Flow**

**Step 1: User Selects State**
```
User selects "Lagos" from dropdown
    ↓
StateSelector component calls window.location.assign("/state/lagos")
    ↓
Browser navigates to http://localhost:5000/state/lagos
```

**Step 2: Proxy Intercepts Request**
```
Express receives GET /state/lagos
    ↓
Proxy middleware matches route pattern: /state/{stateSlug}
    ↓
Proxy extracts stateSlug = "lagos"
    ↓
Looks up target URL: https://lagos.lgpoa.ng
```

**Step 3: Forward to Target Portal**
```
Proxy creates request to https://lagos.lgpoa.ng/
    ↓
Adds headers:
  - X-Forwarded-Host: localhost:5000
  - X-Forwarded-Proto: https
  - changeOrigin: true (changes Host header to target domain)
    ↓
Sends request to target portal
```

### 2. **Response Processing**

The proxy intercepts the response and performs several transformations:

#### A. **Redirect Handling**
```javascript
if (statusCode >= 300 && statusCode < 400) {
  // HTTP redirect detected (301, 302, 307, etc.)
  const location = headers["location"];
  
  // Rewrite redirect URL to use proxy path
  // Example: https://lagos.lgpoa.ng/login → /state/lagos/login
  const redirectUrl = new URL(location, targetUrl);
  const proxyPath = `/state/${stateSlug}${redirectUrl.pathname}${redirectUrl.search}`;
  headers["location"] = proxyPath;
}
```

#### B. **Cookie Handling**
```javascript
if (headers["set-cookie"]) {
  // Remove domain restrictions from cookies
  // This allows cookies to work with the proxy domain
  headers["set-cookie"] = headers["set-cookie"].map(cookie =>
    cookie.replace(/domain=[^;]+;?/gi, "")
  );
}
```

#### C. **HTML Content Rewriting**
For HTML responses, the proxy:
1. Detects gzip compression
2. Decompresses the content
3. Rewrites all URLs
4. Sends uncompressed response

---

## Request Flow

### Complete Request/Response Cycle

```
1. USER ACTION
   └─ Clicks "Continue to Lagos Login"
   
2. CLIENT-SIDE
   └─ window.location.assign("/state/lagos")
   
3. BROWSER REQUEST
   └─ GET http://localhost:5000/state/lagos
   
4. EXPRESS SERVER
   ├─ Receives request
   ├─ Matches route: /state/lagos
   └─ Extracts: stateSlug = "lagos"
   
5. PROXY MIDDLEWARE (proxyReq)
   ├─ Creates request to https://lagos.lgpoa.ng/
   ├─ Sets headers:
   │  ├─ X-Forwarded-Host: localhost:5000
   │  ├─ X-Forwarded-Proto: https
   │  └─ Host: lagos.lgpoa.ng (changeOrigin: true)
   └─ Sends to target portal
   
6. TARGET PORTAL RESPONSE
   ├─ Status: 200 OK
   ├─ Headers:
   │  ├─ Content-Type: text/html
   │  ├─ Content-Encoding: gzip
   │  └─ Set-Cookie: session=abc123; Domain=.lgpoa.ng
   └─ Body: [gzip compressed HTML]
   
7. PROXY RESPONSE HANDLER (proxyRes)
   ├─ Detects: Content-Type includes "text/html"
   ├─ Detects: Content-Encoding is "gzip"
   ├─ Removes: content-encoding header
   ├─ Removes: content-length header
   ├─ Pipes response through gunzip decompressor
   └─ Collects decompressed data
   
8. URL REWRITING
   ├─ Replaces: https://lagos.lgpoa.ng → ""
   ├─ Rewrites: href="/login" → href="/state/lagos/login"
   ├─ Rewrites: src="/assets/logo.png" → src="/state/lagos/assets/logo.png"
   ├─ Rewrites: window.location = "/login" → window.location = "/state/lagos/login"
   └─ Rewrites: location.href = "/login" → location.href = "/state/lagos/login"
   
9. RESPONSE SENT TO BROWSER
   ├─ Status: 200 OK
   ├─ Headers: (without content-encoding)
   ├─ Body: [uncompressed, rewritten HTML]
   └─ Browser address bar: http://localhost:5000/state/lagos
   
10. BROWSER RENDERING
    ├─ Parses HTML
    ├─ Loads resources from /state/lagos/assets/...
    ├─ Executes JavaScript
    └─ All navigation stays within /state/lagos/* paths
```

---

## URL Rewriting

### Rewriting Rules

The proxy applies the following URL rewriting rules to HTML content:

#### 1. **Absolute Domain URLs**
```javascript
// Before: https://lagos.lgpoa.ng/login
// After: /login (relative to proxy)
html = html.replace(new RegExp(targetUrl, "g"), "");
```

#### 2. **Relative Paths in href**
```javascript
// Before: href="/login"
// After: href="/state/lagos/login"
html = html.replace(/href=["']\/([^"']*)/g, `href="/state/${stateSlug}/$1`);
```

#### 3. **Relative Paths in src**
```javascript
// Before: src="/assets/logo.png"
// After: src="/state/lagos/assets/logo.png"
html = html.replace(/src=["']\/([^"']*)/g, `src="/state/${stateSlug}/$1`);
```

#### 4. **JavaScript window.location**
```javascript
// Before: window.location = "/login"
// After: window.location = "/state/lagos/login"
html = html.replace(
  /window\.location\s*=\s*["']([^"']*)/g,
  (match, url) => {
    if (url.startsWith("http")) return match; // Keep external URLs
    return `window.location = "/state/${stateSlug}${url.startsWith("/") ? "" : "/"}${url}`;
  }
);
```

#### 5. **JavaScript window.location.href**
```javascript
// Before: window.location.href = "/login"
// After: window.location.href = "/state/lagos/login"
html = html.replace(
  /window\.location\.href\s*=\s*["']([^"']*)/g,
  (match, url) => {
    if (url.startsWith("http")) return match;
    return `window.location.href = "/state/${stateSlug}${url.startsWith("/") ? "" : "/"}${url}`;
  }
);
```

#### 6. **JavaScript location.href**
```javascript
// Before: location.href = "/login"
// After: location.href = "/state/lagos/login"
html = html.replace(
  /location\.href\s*=\s*["']([^"']*)/g,
  (match, url) => {
    if (url.startsWith("http")) return match;
    return `location.href = "/state/${stateSlug}${url.startsWith("/") ? "" : "/"}${url}`;
  }
);
```

### Why URL Rewriting is Important

Without URL rewriting:
- Links would point to `https://lagos.lgpoa.ng/login`
- Browser would navigate away from the proxy
- Target domain would be exposed to users
- Session cookies might not work correctly

With URL rewriting:
- All navigation stays within `/state/lagos/*`
- Browser address bar shows proxy URL
- Target domain remains hidden
- Cookies are properly managed by the proxy

---

## Gzip Decompression

### Why Gzip Handling is Critical

Most modern web servers compress responses with gzip to reduce bandwidth. The proxy must handle this:

```
Target Portal Response:
├─ Content-Encoding: gzip
├─ Content-Length: 5234 (compressed size)
└─ Body: [binary gzip data]

Without Decompression:
├─ Browser receives gzip data
├─ Browser tries to decompress
├─ But content-encoding header says "gzip"
├─ Browser expects more gzip data
└─ Result: ERR_CONTENT_DECODING_FAILED ❌

With Decompression:
├─ Proxy detects: Content-Encoding: gzip
├─ Proxy pipes through gunzip decompressor
├─ Proxy removes content-encoding header
├─ Proxy sends uncompressed HTML
├─ Browser receives plain HTML
└─ Result: Page loads successfully ✓
```

### Implementation

```javascript
// Check if response is gzip compressed
const isGzipped = proxyRes.headers["content-encoding"] === "gzip";

// Remove content-encoding to prevent double compression
delete proxyRes.headers["content-encoding"];
delete proxyRes.headers["content-length"];

// Create decompression stream if needed
let stream = proxyRes;
if (isGzipped) {
  stream = proxyRes.pipe(createGunzip());
}

// Collect decompressed data
stream.on("data", (chunk) => {
  body = Buffer.concat([body, chunk]);
});

// Process when complete
stream.on("end", () => {
  let html = body.toString("utf-8");
  // ... perform URL rewriting ...
  res.end(html);
});
```

---

## Security Analysis

### ✅ Security Strengths

1. **HTTPS to Target Portals**
   - All connections to state portals use HTTPS
   - Encrypted communication with target servers
   - Protects data in transit

2. **Cookie Domain Stripping**
   - Removes domain restrictions from cookies
   - Prevents cookies from being rejected
   - Cookies work with proxy domain

3. **URL Rewriting**
   - Hides target domain from users
   - Prevents direct access to state portals
   - Centralizes access control

4. **Header Forwarding**
   - X-Forwarded-Host: Tells target server about original host
   - X-Forwarded-Proto: Indicates HTTPS was used
   - Helps target server generate correct URLs

### ⚠️ Security Concerns for Production

#### 1. **No Authentication/Authorization**
**Risk**: Anyone can access any state portal
```
Current: http://localhost:5000/state/lagos → Anyone can access
Needed: Verify user is authorized for that state
```

**Recommendation**:
```javascript
// Add authentication middleware
app.use("/state/:stateSlug", (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  
  // Check if user is authorized for this state
  if (req.user.state !== req.params.stateSlug) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  next();
});
```

#### 2. **No Rate Limiting**
**Risk**: Attackers can flood the proxy with requests
```
Current: No limits on requests
Needed: Rate limiting per IP/user
```

**Recommendation**:
```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP"
});

app.use("/state/", limiter);
```

#### 3. **No Input Validation**
**Risk**: Invalid state slugs could cause errors
```
Current: /state/invalid-state → Proxy tries to connect
Needed: Validate state slug against whitelist
```

**Recommendation**:
```javascript
const validStates = Object.keys(stateSubdomains);

app.use("/state/:stateSlug", (req, res, next) => {
  if (!validStates.includes(req.params.stateSlug)) {
    return res.status(404).json({ error: "Invalid state" });
  }
  next();
});
```

#### 4. **No HTTPS on Proxy**
**Risk**: Local traffic is unencrypted (if deployed)
```
Current: http://localhost:5000 (development only)
Needed: https://portal.lgpoa.ng (production)
```

**Recommendation**:
```javascript
const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("/path/to/private-key.pem"),
  cert: fs.readFileSync("/path/to/certificate.pem")
};

https.createServer(options, app).listen(443);
```

#### 5. **No Logging/Monitoring**
**Risk**: Can't detect attacks or debug issues
```
Current: Minimal logging
Needed: Comprehensive audit trail
```

**Recommendation**:
```javascript
const morgan = require("morgan");

// Log all requests
app.use(morgan("combined"));

// Log proxy errors
app.use((err, req, res, next) => {
  console.error({
    timestamp: new Date(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ error: "Internal Server Error" });
});
```

#### 6. **No CSRF Protection**
**Risk**: Cross-site request forgery attacks
```
Current: No CSRF tokens
Needed: CSRF token validation
```

**Recommendation**:
```javascript
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Add CSRF token to responses
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

#### 7. **No Content Security Policy (CSP)**
**Risk**: XSS attacks through injected scripts
```
Current: No CSP headers
Needed: Strict CSP policy
```

**Recommendation**:
```javascript
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  next();
});
```

#### 8. **No Session Security**
**Risk**: Session hijacking, fixation attacks
```
Current: Basic session handling
Needed: Secure session configuration
```

**Recommendation**:
```javascript
const session = require("express-session");

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // No JavaScript access
    sameSite: "strict",  // CSRF protection
    maxAge: 3600000      // 1 hour
  }
}));
```

#### 9. **No Data Encryption at Rest**
**Risk**: Sensitive data stored in plain text
```
Current: No encryption for stored data
Needed: Encrypt sensitive information
```

#### 10. **No Audit Trail**
**Risk**: Can't track who accessed what
```
Current: Minimal logging
Needed: Complete audit trail
```

---

## Production Recommendations

### 1. **Deployment Architecture**

```
┌─────────────────────────────────────────────────────┐
│                  Load Balancer (HTTPS)              │
│              (nginx, HAProxy, or AWS ALB)           │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node 1 │  │ Node 2 │  │ Node 3 │
    │ :3000  │  │ :3000  │  │ :3000  │
    └────────┘  └────────┘  └────────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Redis  │  │ Redis  │  │ Redis  │
    │ Cache  │  │ Cache  │  │ Cache  │
    └────────┘  └────────┘  └────────┘
```

### 2. **Environment Configuration**

```bash
# .env.production
NODE_ENV=production
PORT=3000
SESSION_SECRET=<strong-random-secret>
LOG_LEVEL=info
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
HTTPS_CERT=/etc/ssl/certs/cert.pem
HTTPS_KEY=/etc/ssl/private/key.pem
REDIS_URL=redis://redis-cluster:6379
```

### 3. **Security Headers**

```javascript
const helmet = require("helmet");

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  }
}));
```

### 4. **Monitoring & Logging**

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});

// Log all proxy requests
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent")
  });
  next();
});
```

### 5. **Error Handling**

```javascript
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" 
      ? "Internal Server Error" 
      : err.message
  });
});
```

### 6. **Health Checks**

```javascript
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.get("/health/ready", async (req, res) => {
  try {
    // Check database connection
    // Check Redis connection
    // Check target portals availability
    res.json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message });
  }
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up authentication/authorization
- [ ] Implement rate limiting
- [ ] Add input validation for state slugs
- [ ] Configure CSRF protection
- [ ] Set up session security
- [ ] Enable security headers (CSP, X-Frame-Options, etc.)
- [ ] Configure logging and monitoring
- [ ] Set up error handling
- [ ] Test all state portals
- [ ] Load test the proxy
- [ ] Security audit/penetration testing

### Deployment

- [ ] Use environment variables for secrets
- [ ] Deploy behind load balancer
- [ ] Set up health checks
- [ ] Configure auto-scaling
- [ ] Set up monitoring alerts
- [ ] Configure log aggregation
- [ ] Set up backup/disaster recovery
- [ ] Document runbooks for common issues

### Post-Deployment

- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor resource usage
- [ ] Review security logs
- [ ] Test failover scenarios
- [ ] Regular security updates
- [ ] Regular backups
- [ ] Performance optimization

---

## Conclusion

### Is It Safe for Production?

**Current State**: ❌ **NOT SAFE FOR PRODUCTION**

The current implementation is suitable for development and testing but requires significant security enhancements before production deployment.

### Key Issues to Address:

1. **No Authentication** - Anyone can access any state
2. **No Rate Limiting** - Vulnerable to DoS attacks
3. **No HTTPS** - Data transmitted in plain text
4. **No Audit Trail** - Can't track access
5. **No Input Validation** - Invalid requests not rejected
6. **No CSRF Protection** - Vulnerable to CSRF attacks
7. **No CSP Headers** - Vulnerable to XSS attacks
8. **No Session Security** - Session hijacking possible

### Estimated Effort to Production-Ready:

- **Security Implementation**: 2-3 weeks
- **Testing & QA**: 1-2 weeks
- **Deployment & Monitoring**: 1 week
- **Total**: 4-6 weeks

### Recommended Next Steps:

1. Implement authentication system
2. Add rate limiting and DDoS protection
3. Set up HTTPS with valid certificates
4. Implement comprehensive logging
5. Add security headers and CSRF protection
6. Conduct security audit
7. Load testing and performance optimization
8. Set up monitoring and alerting

