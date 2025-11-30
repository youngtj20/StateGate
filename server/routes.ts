import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
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

  Object.entries(stateSubdomains).forEach(([stateSlug, targetUrl]) => {
    const proxyMiddleware = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      pathRewrite: {
        [`^/state/${stateSlug}`]: "",
      },
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");
          proxyReq.setHeader("X-Forwarded-Proto", "https");
        },
        proxyRes: (proxyRes) => {
          delete proxyRes.headers["x-frame-options"];
          
          if (proxyRes.headers["set-cookie"]) {
            proxyRes.headers["set-cookie"] = (proxyRes.headers["set-cookie"] as string[]).map(
              (cookie: string) => cookie.replace(/domain=[^;]+;?/gi, "")
            );
          }
        },
        error: (err, _req, res) => {
          console.error(`Proxy error for ${stateSlug}:`, err.message);
          if (res && "writeHead" in res) {
            (res as any).writeHead(502, { "Content-Type": "text/html" });
            (res as any).end(`
              <html>
                <head><title>Service Unavailable</title></head>
                <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                  <h1>State Portal Temporarily Unavailable</h1>
                  <p>The ${stateSlug.toUpperCase()} portal is currently unavailable. Please try again later.</p>
                  <a href="/">Return to State Selection</a>
                </body>
              </html>
            `);
          }
        },
      },
    });

    app.use(`/state/${stateSlug}`, proxyMiddleware);
  });

  return httpServer;
}
