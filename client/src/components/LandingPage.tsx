import { Shield } from "lucide-react";
import StateSelector from "./StateSelector";
import mapImage from "@assets/generated_images/folded_map_with_location_pin.png";
import logoImage from "@assets/image_1764527052979.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div 
        className="hidden lg:block lg:w-[45%] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 relative"
        aria-hidden="true"
      >
        <img
          src={mapImage}
          alt="Nigeria map illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img
                  src={logoImage}
                  alt="Know Your Citizens Technology Logo"
                  className="h-20 w-auto object-contain"
                  data-testid="img-logo"
                />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-lg text-foreground" data-testid="text-instruction">
                To continue, please select your registered state
              </p>
            </div>

            <StateSelector />

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>Official Government Portal</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="p-4 text-center border-t border-border">
          <p className="text-xs text-muted-foreground" data-testid="text-footer">
            LGPOA - Local Government Proof of Address
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            For support, contact your state administrator
          </p>
        </footer>
      </div>
    </div>
  );
}
