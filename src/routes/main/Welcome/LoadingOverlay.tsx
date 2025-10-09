import React from "react";

/**
 * Loading overlay shown when launching an app
 */
export function LoadingOverlay(): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-8">
        {/* Spinner with futuristic design */}
        <div className="relative w-20 h-20">
          {/* Outer glow ring */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-30 blur-2xl rounded-full animate-pulse" />

          {/* Double ring spinner */}
          <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-border border-t-amber-500 border-r-amber-500 animate-spin" />
          <div
            className="absolute inset-2 w-16 h-16 rounded-full border-2 border-border border-b-orange-500 border-l-orange-500 animate-spin"
            style={{
              animationDirection: "reverse",
              animationDuration: "1s",
            }}
          />

          {/* Center dot with pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <div className="absolute w-2 h-2 bg-amber-500 rounded-full blur-sm opacity-50" />
          </div>

          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber-500/50" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-amber-500/50" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-amber-500/50" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-amber-500/50" />
        </div>

        {/* Loading text */}
        <div className="text-center space-y-3">
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 tracking-tight animate-pulse">
            Loading Application
          </p>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-pulse" />
            <p className="text-sm text-muted-foreground font-semibold tracking-wide">
              Please wait
            </p>
            <div
              className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
