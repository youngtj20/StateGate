import type { Express } from "express";
import { createServer, type Server } from "http";
import httpProxy from "http-proxy";
import { storage } from "./storage";

const stateSubdomains: Record<string, string> = {
  "abia": "https://abia.lgpoa.ng",
  "adamawa": "https://adamawa.lgpoa.ng",
  "akwa-ibom": "https://akwaibom.lgpoa.ng",
  "anambra": "https://anambra.lgpoa.ng",
  "bauchi": "https://bauchi.lgpoa.ng",
  "bayelsa": "https://bayelsa.lgpoa.ng",
  "benue": "https://benue.lgpoa.ng",
  "borno": "https://borno.lgpoa.ng",
  "cross-river": "https://crossriver.lgpoa.ng",
  "delta": "https://delta.lgpoa.ng",
  "ebonyi": "https://ebonyi.lgpoa.ng",
  "edo": "https://edo.lgpoa.ng",
  "ekiti": "https://ekiti.lgpoa.ng",
  "enugu": "https://enugu.lgpoa.ng",
  "fct": "https://fct.lgpoa.ng",
  "gombe": "https://gombe.lgpoa.ng",
  "imo": "https://imo.lgpoa.ng",
  "jigawa": "https://jigawa.lgpoa.ng",
  "kaduna": "https://kaduna.lgpoa.ng",
  "kano": "https://kano.lgpoa.ng",
  "katsina": "https://katsina.lgpoa.ng",
  "kebbi": "https://kebbi.lgpoa.ng",
  "kogi": "https://kogi.lgpoa.ng",
  "kwara": "https://kwara.lgpoa.ng",
  "lagos": "https://lagos.lgpoa.ng",
  "nasarawa": "https://nasarawa.lgpoa.ng",
  "niger": "https://niger.lgpoa.ng",
  "ogun": "https://ogun.lgpoa.ng",
  "ondo": "https://ondo.lgpoa.ng",
  "osun": "https://osun.lgpoa.ng",
  "oyo": "https://oyo.lgpoa.ng",
  "plateau": "https://plateau.lgpoa.ng",
  "rivers": "https://rivers.lgpoa.ng",
  "sokoto": "https://sokoto.lgpoa.ng",
  "taraba": "https://taraba.lgpoa.ng",
  "yobe": "https://yobe.lgpoa.ng",
  "zamfara": "https://zamfara.lgpoa.ng",
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/states", (_req, res) => {
    const states = Object.entries(stateSubdomains).map(([slug, url]) => ({
      slug,
      url,
      path: `/state/${slug}`,
    }));
    res.json(states);
  });

  // Create a single proxy server instance
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    secure: false,
    xfwd: true,
    preserveHeaderKeyCase: true,
  });

  // Handle proxy errors
  proxy.on('error', (err, req, res) => {
    console.error('[PROXY ERROR]', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/html' });
      res.end('<h1>502 Bad Gateway</h1><p>Error connecting to the backend server.</p>');
    }
  });

  // Handle proxy responses to rewrite redirects and cookies
  proxy.on('proxyRes', (proxyRes, req, res) => {
    const stateMatch = req.url?.match(/^\/state\/([a-z-]+)/);
    if (!stateMatch) return;
    
    const stateSlug = stateMatch[1];
    const targetUrl = stateSubdomains[stateSlug];
    
    console.log(`[PROXY ${stateSlug}] Response: ${proxyRes.statusCode}`);
    
    // Rewrite redirect locations
    if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
      const location = proxyRes.headers["location"];
      if (location) {
        if (location.startsWith('/')) {
          proxyRes.headers["location"] = `/state/${stateSlug}${location}`;
        } else if (location.startsWith(targetUrl)) {
          const path = location.substring(targetUrl.length);
          proxyRes.headers["location"] = `/state/${stateSlug}${path}`;
        }
      }
    }
    
    // Rewrite cookies
    if (proxyRes.headers["set-cookie"]) {
      proxyRes.headers["set-cookie"] = (proxyRes.headers["set-cookie"] as string[]).map(
        (cookie: string) => {
          let modifiedCookie = cookie.replace(/domain=[^;]+;?/gi, "");
          if (!modifiedCookie.includes('path=')) {
            modifiedCookie += `; path=/`;
          }
          return modifiedCookie;
        }
      );
    }
  });

  // Register proxy routes for each state
  Object.entries(stateSubdomains).forEach(([stateSlug, targetUrl]) => {
    app.use(`/state/${stateSlug}`, (req, res) => {
      console.log(`[PROXY ${stateSlug}] ${req.method} ${req.url} -> ${targetUrl}`);
      
      // Proxy the request
      proxy.web(req, res, {
        target: targetUrl,
      });
    });
  });

  // Catch-all route for root-level paths that should be prefixed with state
  app.use((req, res, next) => {
    // Skip if path already starts with /state/ or /api/
    if (req.path.startsWith("/state/") || req.path.startsWith("/api/")) {
      return next();
    }

    // Skip Vite-specific paths
    if (req.path.startsWith("/src/") || 
        req.path.startsWith("/@") || 
        req.path.startsWith("/node_modules/") ||
        req.path === "/vite-hmr") {
      return next();
    }

    // Skip if it's a static file or vite asset
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|tsx|ts|jsx|json)$/i)) {
      return next();
    }

    // Skip if it's the root path (handled by frontend)
    if (req.path === "/") {
      return next();
    }

    // If someone tries to access /login directly, redirect to home to select state
    if (req.path === "/login") {
      return res.redirect(302, "/");
    }

    // Get the current state from session or referrer
    const currentState = (req as any).currentState;
    
    if (currentState) {
      // Redirect to state-prefixed path
      const redirectPath = `/state/${currentState}${req.path}${req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : ""}`;
      return res.redirect(302, redirectPath);
    }

    // If no state context, redirect to home
    res.redirect(302, "/");
  });

  return httpServer;
}
