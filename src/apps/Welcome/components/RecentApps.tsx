/**
 * Recent Apps Component
 * Quick access to recently launched applications
 */

import React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useWelcomeStore } from "../store.ts";
import type { AppMetadata } from "../types.ts";

interface RecentAppsProps {
  applications: AppMetadata[];
  onLaunch: (route: string) => void;
  isMobile: boolean;
}

/**
 * Recent Apps Quick Access
 */
export function RecentApps({
  applications,
  onLaunch,
  isMobile,
}: RecentAppsProps): React.ReactElement | null {
  const recentApps = useWelcomeStore((state) => state.recentApps);
  const removeFromRecent = useWelcomeStore((state) => state.removeFromRecent);

  const handleRemove = (e: React.MouseEvent, appId: string): void => {
    e.stopPropagation();
    removeFromRecent(appId);
  };

  if (recentApps.length === 0) return null;

  const recentAppData = recentApps
    .map((appId) => applications.find((app) => app.id === appId))
    .filter((app): app is AppMetadata => app !== undefined)
    .slice(0, 4);

  if (recentAppData.length === 0) return null;

  if (isMobile) {
    return (
      <div className="relative px-4 py-3 border-b border-border bg-card overflow-hidden">
        {/* Decorative line */}
        <div className="absolute top-0 left-4 w-12 h-px bg-amber-500/30" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative p-1 border border-amber-500/30 bg-amber-500/10">
              <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-amber-500/50" />
              <Clock className="w-3 h-3 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground tracking-tight leading-tight">
                Running Apps
              </h2>
              <p className="text-[10px] text-muted-foreground/70 font-medium">
                Tap to launch
              </p>
            </div>
          </div>
          {recentAppData.length > 0 && (
            <div className="px-1.5 py-0.5 border border-border bg-muted">
              <span className="text-[10px] font-bold text-foreground">
                {recentAppData.length}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {recentAppData.map((app) => {
            // Get border color based on category for tonal accent
            const borderColors: Record<string, string> = {
              Analytics: "border-blue-500/40 active:border-blue-500/60",
              Trading: "border-green-500/40 active:border-green-500/60",
              Development: "border-purple-500/40 active:border-purple-500/60",
              Network: "border-emerald-500/40 active:border-emerald-500/60",
              Visualization: "border-pink-500/40 active:border-pink-500/60",
            };

            const borderColor = borderColors[app.category] ||
              "border-amber-500/40 active:border-amber-500/60";

            return (
              <div key={app.id} className="relative flex-shrink-0">
                <button
                  onClick={() => onLaunch(app.route)}
                  className={cn(
                    "relative w-16 h-16 flex flex-col items-center justify-center overflow-hidden",
                    "bg-card active:bg-muted border transition-colors active:scale-95",
                    borderColor,
                  )}
                >
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-border" />
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-border" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-border" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-border" />

                  {/* Icon */}
                  <div className="relative flex items-center justify-center text-foreground scale-50 mb-1">
                    {app.icon}
                  </div>

                  {/* App name */}
                  <p className="text-[9px] font-bold text-foreground text-center truncate w-full px-1 leading-tight">
                    {app.name}
                  </p>

                  {/* Close button */}
                  <button
                    onClick={(e) => handleRemove(e, app.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-background border border-border flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors text-[10px] leading-none font-bold"
                    aria-label={`Close ${app.name}`}
                  >
                    ×
                  </button>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative container mx-auto px-6 py-3">
      {/* Decorative line */}
      <div className="absolute top-0 left-6 w-16 h-px bg-amber-500/30" />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative p-1.5 border border-amber-500/30 bg-amber-500/10">
            {/* Corner accent */}
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
            <Clock className="w-3 h-3 text-amber-500" />
          </div>
          <h2 className="text-xs font-bold text-foreground tracking-tight">
            Running Applications
          </h2>
        </div>

        <div className="px-1.5 py-0.5 border border-border bg-muted">
          <span className="text-[10px] font-bold text-foreground">
            {recentAppData.length}
          </span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {recentAppData.map((app) => (
          <div key={app.id} className="relative flex-shrink-0">
            <button
              onClick={() =>
                onLaunch(app.route)}
              className="relative w-20 h-20 flex flex-col items-center justify-center overflow-hidden bg-card active:bg-muted border border-border transition-colors active:scale-95"
            >
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-border" />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-border" />
              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-border" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-border" />

              {/* Icon */}
              <div className="relative flex items-center justify-center text-foreground mb-1 scale-50">
                {app.icon}
              </div>

              {/* Close button */}
              <button
                onClick={(e) =>
                  handleRemove(e, app.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors text-xs leading-none font-bold"
                aria-label={`Close ${app.name}`}
              >
                ×
              </button>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
