import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { nigerianStates, type NigerianState } from "@/lib/states";

interface StateSelectorProps {
  onStateSelect?: (state: NigerianState) => void;
}

export default function StateSelector({ onStateSelect }: StateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<NigerianState | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSelect = (state: NigerianState) => {
    setSelectedState(state);
    setOpen(false);
    onStateSelect?.(state);
  };

  const handleContinue = () => {
    if (!selectedState) return;
    
    setIsNavigating(true);
    
    setTimeout(() => {
      window.location.assign(selectedState.path);
    }, 300);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <label 
          className="text-sm font-medium text-muted-foreground uppercase tracking-wide"
          id="state-select-label"
        >
          Select Your State
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-labelledby="state-select-label"
              className="w-full justify-between h-14 px-4 text-base bg-background border-input"
              data-testid="select-state-trigger"
            >
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {selectedState ? (
                  <span className="text-foreground">{selectedState.name}</span>
                ) : (
                  <span className="text-muted-foreground">Choose your registered state...</span>
                )}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search states..." 
                className="h-12"
                data-testid="input-search-state"
              />
              <CommandList>
                <CommandEmpty>No state found.</CommandEmpty>
                <CommandGroup>
                  {nigerianStates.map((state) => (
                    <CommandItem
                      key={state.slug}
                      value={state.name}
                      onSelect={() => handleSelect(state)}
                      className="py-3 cursor-pointer"
                      data-testid={`option-state-${state.slug}`}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedState?.slug === state.slug
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {state.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          You will be taken to your state's login portal
        </p>
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selectedState || isNavigating}
        className="w-full h-14 text-base font-semibold"
        data-testid="button-continue"
      >
        {isNavigating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading {selectedState?.name}...
          </>
        ) : selectedState ? (
          `Continue to ${selectedState.name.replace(" State", "")} Login`
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );
}
