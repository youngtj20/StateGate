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
          if (proxyRes.headers["set-cookie"]) {
            proxyRes.headers["set-cookie"] = (proxyRes.headers["set-cookie"] as string[]).map(
              (cookie: string) => cookie.replace(/domain=[^;]+;?/gi, "")
            );
          }
        },
        error: (err, _req, res) => {
          console.error(`Proxy error for ${stateSlug}:`, err.message);
          const stateName = stateSlug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          if (res && "writeHead" in res) {
            (res as any).writeHead(502, { "Content-Type": "text/html" });
            (res as any).end(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Portal Unavailable - LGPOA</title>
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                  <style>
                    * {
                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                    }
                    body {
                      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%);
                      min-height: 100vh;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      padding: 24px;
                    }
                    .container {
                      background: white;
                      border-radius: 16px;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
                      max-width: 480px;
                      width: 100%;
                      padding: 48px 40px;
                      text-align: center;
                    }
                    .icon-container {
                      width: 80px;
                      height: 80px;
                      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      margin: 0 auto 24px;
                    }
                    .icon {
                      width: 40px;
                      height: 40px;
                      color: #d97706;
                    }
                    .state-badge {
                      display: inline-block;
                      background: #f0fdf4;
                      color: #166534;
                      font-size: 12px;
                      font-weight: 600;
                      text-transform: uppercase;
                      letter-spacing: 0.05em;
                      padding: 6px 12px;
                      border-radius: 20px;
                      margin-bottom: 16px;
                    }
                    h1 {
                      font-size: 24px;
                      font-weight: 700;
                      color: #111827;
                      margin-bottom: 12px;
                    }
                    .message {
                      font-size: 16px;
                      color: #6b7280;
                      line-height: 1.6;
                      margin-bottom: 32px;
                    }
                    .button {
                      display: inline-flex;
                      align-items: center;
                      gap: 8px;
                      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                      color: white;
                      font-size: 16px;
                      font-weight: 600;
                      padding: 14px 28px;
                      border-radius: 10px;
                      text-decoration: none;
                      transition: all 0.2s ease;
                      box-shadow: 0 4px 14px 0 rgba(22, 163, 74, 0.3);
                    }
                    .button:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 6px 20px 0 rgba(22, 163, 74, 0.4);
                    }
                    .button svg {
                      width: 20px;
                      height: 20px;
                    }
                    .footer {
                      margin-top: 32px;
                      padding-top: 24px;
                      border-top: 1px solid #e5e7eb;
                    }
                    .footer p {
                      font-size: 13px;
                      color: #9ca3af;
                    }
                    .footer a {
                      color: #16a34a;
                      text-decoration: none;
                    }
                    .footer a:hover {
                      text-decoration: underline;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="icon-container">
                      <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <span class="state-badge">${stateName} State</span>
                    <h1>Portal Temporarily Unavailable</h1>
                    <p class="message">
                      We're having trouble connecting to the ${stateName} portal right now. 
                      This is usually temporary. Please wait a moment and try again.
                    </p>
                    <a href="/" class="button">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Return to State Selection
                    </a>
                    <div class="footer">
                      <p>LGPOA - Local Government Proof of Address</p>
                    </div>
                  </div>
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
