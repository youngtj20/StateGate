import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { nigerianStates } from "@/lib/states";
import { Loader2 } from "lucide-react";

const statePortalUrls: Record<string, string> = {
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

export default function StatePortal() {
  const params = useParams<{ state: string }>();
  const [, setLocation] = useLocation();
  const stateSlug = params.state;
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [stateName, setStateName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!stateSlug) {
      setLocation("/");
      return;
    }

    const state = nigerianStates.find(s => s.slug === stateSlug);
    const url = statePortalUrls[stateSlug];

    if (!state || !url) {
      setLocation("/");
      return;
    }

    setStateName(state.name);
    setPortalUrl(url);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [stateSlug, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800">Loading {stateName} Portal...</h1>
          <p className="text-gray-600">Please wait while we connect you to the portal</p>
        </div>
      </div>
    );
  }

  if (!portalUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <iframe
        src={portalUrl}
        className="w-full h-full border-0"
        title={`${stateName} Portal`}
        allow="fullscreen; geolocation; microphone; camera"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
      />
    </div>
  );
}
