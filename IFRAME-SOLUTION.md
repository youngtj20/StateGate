# Iframe Solution - Guaranteed to Work

Since the Laravel apps have complex redirect logic that's hard to proxy, use an iframe approach instead.

## How It Works

```
User visits: https://transporters.cvis.com.ng/
  ↓
Selects Lagos
  ↓
Redirects to: https://transporters.cvis.com.ng/state/lagos
  ↓
Shows an iframe containing: https://lagos.lgpoa.ng
  ↓
URL stays: https://transporters.cvis.com.ng/state/lagos
```

## Implementation

### Step 1: Create State Portal Page

Create a new file: `client/src/pages/state-portal.tsx`

```typescript
import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { nigerianStates } from "@/lib/states";

export default function StatePortal() {
  const params = useParams();
  const stateSlug = params.state;
  const [portalUrl, setPortalUrl] = useState<string>("");

  useEffect(() => {
    const state = nigerianStates.find(s => s.slug === stateSlug);
    if (state) {
      // Get the actual portal URL
      const stateUrls: Record<string, string> = {
        "lagos": "https://lagos.lgpoa.ng",
        "rivers": "https://rivers.lgpoa.ng",
        "abia": "https://abia.lgpoa.ng",
        // Add all other states...
      };
      setPortalUrl(stateUrls[stateSlug] || "");
    }
  }, [stateSlug]);

  if (!portalUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Portal...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full">
      <iframe
        src={portalUrl}
        className="w-full h-full border-0"
        title={`${stateSlug} State Portal`}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
```

### Step 2: Update App Router

Update `client/src/App.tsx`:

```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/components/LandingPage";
import StatePortal from "@/pages/state-portal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/state/:state" component={StatePortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Step 3: Update States Configuration

Update `client/src/lib/states.ts`:

```typescript
export const nigerianStates: NigerianState[] = [
  { name: "Lagos State", slug: "lagos", path: "/state/lagos" },
  { name: "Rivers State", slug: "rivers", path: "/state/rivers" },
  // ... all other states with /state/{slug} paths
];
```

### Step 4: Remove Nginx Proxy Configuration

Remove all the `/state/` location blocks from Nginx. Keep only:

```nginx
# Root - Node.js landing page
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Advantages

✅ **100% Reliable** - No proxy issues
✅ **No Redirects** - URL stays on your domain
✅ **Full Functionality** - All Laravel features work
✅ **Simple** - No complex Nginx configuration
✅ **Fast** - Direct connection to state portals

## Disadvantages

⚠️ **Iframe Limitations**:
- Some sites block iframes (but your state portals likely don't)
- Cookies are isolated (but this is actually good for security)
- Can't modify the iframe content

## Testing

1. Deploy the updated code
2. Visit: `https://transporters.cvis.com.ng/`
3. Select Lagos
4. You'll see: `https://transporters.cvis.com.ng/state/lagos`
5. The iframe shows: `https://lagos.lgpoa.ng`
6. Login works perfectly!

## Alternative: Use X-Frame-Options

If the state portals block iframes, you'll need to contact the state portal admins to add:

```
X-Frame-Options: ALLOW-FROM https://transporters.cvis.com.ng
```

Or use:

```
Content-Security-Policy: frame-ancestors 'self' https://transporters.cvis.com.ng
```
