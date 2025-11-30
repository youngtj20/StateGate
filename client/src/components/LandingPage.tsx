import { Shield } from "lucide-react";
import StateSelector from "./StateSelector";
import mapImage from "@assets/generated_images/folded_map_with_location_pin.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div 
        className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 items-center justify-center p-12"
        aria-hidden="true"
      >
        <div className="max-w-md">
          <img
            src={mapImage}
            alt="Nigeria map illustration"
            className="w-full h-auto object-contain drop-shadow-lg"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        <div className="lg:hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 p-8 flex justify-center">
          <img
            src={mapImage}
            alt="Nigeria map illustration"
            className="w-40 h-40 object-contain"
          />
        </div>

        <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-heading">
                  KNOW YOUR CITIZENS
                </h1>
                <p className="text-lg font-semibold text-primary" data-testid="text-subheading">
                  TECHNOLOGY
                </p>
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
            LGPOA - Local Government Pension Officers Association
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            For support, contact your state administrator
          </p>
        </footer>
      </div>
    </div>
  );
}
