# StateGate Security Checklist for Production

## Quick Summary

| Item | Current | Required | Priority |
|------|---------|----------|----------|
| HTTPS | ❌ No | ✅ Yes | CRITICAL |
| Authentication | ❌ No | ✅ Yes | CRITICAL |
| Rate Limiting | ❌ No | ✅ Yes | HIGH |
| Input Validation | ❌ No | ✅ Yes | HIGH |
| CSRF Protection | ❌ No | ✅ Yes | HIGH |
| Security Headers | ❌ No | ✅ Yes | HIGH |
| Logging/Audit | ⚠️ Basic | ✅ Comprehensive | MEDIUM |
| Session Security | ⚠️ Basic | ✅ Secure | MEDIUM |
| Error Handling | ⚠️ Basic | ✅ Secure | MEDIUM |
| Monitoring | ❌ No | ✅ Yes | MEDIUM |

---

## 1. HTTPS Configuration (CRITICAL)

### Current State
```
❌ Running on http://localhost:5000
❌ No SSL/TLS encryption
❌ Credentials transmitted in plain text
```

### Required Implementation

**Install Dependencies**:
```bash
npm install helmet express-session connect-mongo
```

**Create HTTPS Server** (`server/https.ts`):
```typescript
import https from "https";
import fs from "fs";
import express from "express";
import app from "./index";

const options = {
  key: fs.readFileSync(process.env.HTTPS_KEY || "/etc/ssl/private/key.pem"),
  cert: fs.readFileSync(process.env.HTTPS_CERT || "/etc/ssl/certs/cert.pem")
};

const port = parseInt(process.env.PORT || "443", 10);

https.createServer(options, app).listen(port, () => {
  console.log(`Server running on https://localhost:${port}`);
});
```

**Update package.json**:
```json
{
  "scripts": {
    "start": "cross-env NODE_ENV=production node dist/index.cjs",
    "start:https": "cross-env NODE_ENV=production node dist/https.cjs"
  }
}
```

**Generate Self-Signed Certificate (Development)**:
```bash
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

**For Production - Use Let's Encrypt**:
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d portal.lgpoa.ng

# Certificates will be at:
# /etc/letsencrypt/live/portal.lgpoa.ng/privkey.pem
# /etc/letsencrypt/live/portal.lgpoa.ng/fullchain.pem
```

---

## 2. Authentication & Authorization (CRITICAL)

### Current State
```
❌ No authentication required
❌ Anyone can access any state portal
❌ No user identification
```

### Required Implementation

**Install Dependencies**:
```bash
npm install passport passport-local bcryptjs express-session connect-mongo
```

**Create Authentication Middleware** (`server/auth.ts`):
```typescript
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcryptjs";
import session from "express-session";
import MongoStore from "connect-mongo";

// User database (replace with real database)
const users = new Map();

// Configure Passport
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = users.get(username);
      if (!user) {
        return done(null, false, { message: "User not found" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "Invalid password" });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

// Session configuration
export const sessionConfig = session({
  secret: process.env.SESSION_SECRET || "change-me-in-production",
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URL || "mongodb://localhost/stategate"
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only
    httpOnly: true,                                  // No JavaScript access
    sameSite: "strict",                              // CSRF protection
    maxAge: 3600000                                  // 1 hour
  }
});

// Middleware to check authentication
export const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  next();
};

// Middleware to check state authorization
export const requireStateAuth = (req, res, next) => {
  const { stateSlug } = req.params;
  
  if (req.user.state !== stateSlug) {
    return res.status(403).json({
      error: "Unauthorized",
      message: `You are not authorized to access ${stateSlug}`
    });
  }
  
  next();
};
```

**Update Server** (`server/index.ts`):
```typescript
import passport from "passport";
import { sessionConfig, requireAuth, requireStateAuth } from "./auth";

// Add session middleware
app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());

// Login route
app.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful", user: req.user });
});

// Logout route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.redirect("/");
  });
});

// Protect state routes
app.use("/state/:stateSlug", requireAuth, requireStateAuth, proxyMiddleware);
```

---

## 3. Rate Limiting (HIGH)

### Current State
```
❌ No rate limiting
❌ Vulnerable to DoS attacks
❌ No request throttling
```

### Required Implementation

**Install Dependencies**:
```bash
npm install express-rate-limit redis
```

**Create Rate Limiter** (`server/rateLimit.ts`):
```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "redis";

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379")
});

// General rate limiter
export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:general:"
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // 100 requests per window
  message: "Too many requests, please try again later",
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false
});

// Strict rate limiter for login
export const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:login:"
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,                     // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again later"
});

// Per-state rate limiter
export const stateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:state:"
  }),
  windowMs: 60 * 1000,        // 1 minute
  max: 30,                    // 30 requests per minute per state
  keyGenerator: (req) => `${req.user.id}:${req.params.stateSlug}`
});
```

**Apply Rate Limiters** (`server/index.ts`):
```typescript
import { generalLimiter, loginLimiter, stateLimiter } from "./rateLimit";

// Apply general limiter to all routes
app.use(generalLimiter);

// Apply strict limiter to login
app.post("/login", loginLimiter, passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful" });
});

// Apply state limiter to proxy routes
app.use("/state/:stateSlug", stateLimiter, proxyMiddleware);
```

---

## 4. Input Validation (HIGH)

### Current State
```
❌ No validation of state slug
❌ Invalid requests not rejected
❌ Potential for injection attacks
```

### Required Implementation

**Install Dependencies**:
```bash
npm install joi
```

**Create Validators** (`server/validators.ts`):
```typescript
import Joi from "joi";

const stateSlug = Joi.string()
  .lowercase()
  .pattern(/^[a-z-]+$/)
  .required();

export const validateStateSlug = (req, res, next) => {
  const { error, value } = stateSlug.validate(req.params.stateSlug);
  
  if (error) {
    return res.status(400).json({
      error: "Invalid state slug",
      details: error.details
    });
  }
  
  // Check if state exists
  const validStates = Object.keys(stateSubdomains);
  if (!validStates.includes(value)) {
    return res.status(404).json({
      error: "State not found"
    });
  }
  
  next();
};

export const validateLoginInput = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(8).required()
  });
  
  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: "Invalid input",
      details: error.details
    });
  }
  
  next();
};
```

**Apply Validators** (`server/index.ts`):
```typescript
import { validateStateSlug, validateLoginInput } from "./validators";

app.post("/login", validateLoginInput, loginLimiter, (req, res) => {
  // Handle login
});

app.use("/state/:stateSlug", validateStateSlug, proxyMiddleware);
```

---

## 5. CSRF Protection (HIGH)

### Current State
```
❌ No CSRF tokens
❌ Vulnerable to cross-site request forgery
❌ No token validation
```

### Required Implementation

**Install Dependencies**:
```bash
npm install csurf cookie-parser
```

**Configure CSRF** (`server/csrf.ts`):
```typescript
import csrf from "csurf";
import cookieParser from "cookie-parser";

// CSRF protection middleware
export const csrfProtection = csrf({ cookie: true });

// Middleware to add CSRF token to response
export const addCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};
```

**Apply CSRF Protection** (`server/index.ts`):
```typescript
import cookieParser from "cookie-parser";
import { csrfProtection, addCsrfToken } from "./csrf";

app.use(cookieParser());
app.use(csrfProtection);
app.use(addCsrfToken);

// For state-changing operations
app.post("/api/action", csrfProtection, (req, res) => {
  // Verify CSRF token is valid (done automatically by middleware)
  res.json({ success: true });
});
```

---

## 6. Security Headers (HIGH)

### Current State
```
❌ No security headers
❌ Vulnerable to XSS, clickjacking, etc.
❌ No CSP policy
```

### Required Implementation

**Install Dependencies**:
```bash
npm install helmet
```

**Configure Security Headers** (`server/security.ts`):
```typescript
import helmet from "helmet";

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,        // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});
```

**Apply Security Headers** (`server/index.ts`):
```typescript
import { securityHeaders } from "./security";

app.use(securityHeaders);
```

---

## 7. Comprehensive Logging (MEDIUM)

### Current State
```
⚠️ Basic console logging
❌ No audit trail
❌ No structured logging
```

### Required Implementation

**Install Dependencies**:
```bash
npm install winston winston-daily-rotate-file
```

**Configure Logging** (`server/logger.ts`):
```typescript
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "stategate-proxy" },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxDays: "14d"
    }),
    // All logs
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxDays: "14d"
    })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

**Log Important Events** (`server/index.ts`):
```typescript
import logger from "./logger";

// Log authentication
app.post("/login", (req, res, next) => {
  logger.info({
    event: "login_attempt",
    username: req.body.username,
    ip: req.ip,
    userAgent: req.get("user-agent")
  });
  next();
});

// Log state access
app.use("/state/:stateSlug", (req, res, next) => {
  logger.info({
    event: "state_access",
    state: req.params.stateSlug,
    user: req.user?.id,
    ip: req.ip
  });
  next();
});

// Log errors
app.use((err, req, res, next) => {
  logger.error({
    event: "error",
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message
  });
});
```

---

## 8. Secure Session Management (MEDIUM)

### Current State
```
⚠️ Basic session handling
❌ No secure session storage
❌ No session timeout
```

### Required Implementation

**Already covered in Authentication section**, but ensure:

```typescript
const sessionConfig = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URL
  }),
  cookie: {
    secure: true,           // ✅ HTTPS only
    httpOnly: true,         // ✅ No JavaScript access
    sameSite: "strict",     // ✅ CSRF protection
    maxAge: 3600000         // ✅ 1 hour timeout
  }
});
```

---

## 9. Error Handling (MEDIUM)

### Current State
```
⚠️ Basic error handling
❌ Errors expose sensitive information
❌ No error tracking
```

### Required Implementation

**Create Error Handler** (`server/errorHandler.ts`):
```typescript
import logger from "./logger";

export const errorHandler = (err, req, res, next) => {
  logger.error({
    event: "unhandled_error",
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
    ip: req.ip
  });

  // Don't expose error details in production
  const message = process.env.NODE_ENV === "production"
    ? "Internal Server Error"
    : err.message;

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error({
    event: "unhandled_rejection",
    reason,
    promise
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error({
    event: "uncaught_exception",
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});
```

**Apply Error Handler** (`server/index.ts`):
```typescript
import { errorHandler } from "./errorHandler";

// Apply error handler last
app.use(errorHandler);
```

---

## 10. Monitoring & Health Checks (MEDIUM)

### Current State
```
❌ No health checks
❌ No monitoring
❌ No alerting
```

### Required Implementation

**Create Health Check** (`server/health.ts`):
```typescript
import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

router.get("/health/ready", async (req, res) => {
  try {
    // Check database
    // Check Redis
    // Check target portals
    
    res.json({
      ready: true,
      checks: {
        database: "ok",
        redis: "ok",
        portals: "ok"
      }
    });
  } catch (err) {
    res.status(503).json({
      ready: false,
      error: err.message
    });
  }
});

export default router;
```

**Apply Health Checks** (`server/index.ts`):
```typescript
import healthRouter from "./health";

app.use("/", healthRouter);
```

---

## Implementation Priority

### Phase 1 (Week 1-2) - CRITICAL
- [ ] HTTPS configuration
- [ ] Authentication & authorization
- [ ] Input validation
- [ ] Rate limiting

### Phase 2 (Week 2-3) - HIGH
- [ ] CSRF protection
- [ ] Security headers
- [ ] Comprehensive logging
- [ ] Error handling

### Phase 3 (Week 3-4) - MEDIUM
- [ ] Session security
- [ ] Monitoring & health checks
- [ ] Security audit
- [ ] Load testing

### Phase 4 (Week 4+) - ONGOING
- [ ] Penetration testing
- [ ] Security updates
- [ ] Performance optimization
- [ ] Disaster recovery

---

## Testing Checklist

- [ ] Test HTTPS certificate validity
- [ ] Test authentication with valid/invalid credentials
- [ ] Test rate limiting (exceed limits)
- [ ] Test CSRF protection (missing token)
- [ ] Test input validation (invalid state slug)
- [ ] Test security headers (check with curl)
- [ ] Test error handling (trigger errors)
- [ ] Test session timeout
- [ ] Test concurrent requests
- [ ] Test failover scenarios

---

## Deployment Checklist

- [ ] All security measures implemented
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Backup/recovery tested
- [ ] Runbooks documented
- [ ] Team trained
- [ ] Go-live approval obtained

