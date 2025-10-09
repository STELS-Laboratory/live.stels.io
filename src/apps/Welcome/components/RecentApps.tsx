/**
 * Recent Apps Component
 * Quick access to recently launched applications
 */

import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
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

  if (recentApps.length === 0) return null;

  const recentAppData = recentApps
    .map((appId) => applications.find((app) => app.id === appId))
    .filter((app): app is AppMetadata => app !== undefined)
    .slice(0, 4);

  if (recentAppData.length === 0) return null;

  if (isMobile) {
    return (
      <div className="px-4 py-4 border-b border-border/30 bg-card/30">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Recent</h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent -mx-4 px-4">
          {recentAppData.map((app) => (
            <motion.button
              key={app.id}
              onClick={() => onLaunch(app.route)}
              className={cn(
                "flex-shrink-0 w-16 aspect-square flex items-center justify-center",
                "bg-gradient-to-br border transition-all duration-200",
                app.color,
                "hover:scale-105 active:scale-95",
              )}
              whileTap={{ scale: 0.9 }}
            >
              {app.icon}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-6 py-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-baseline justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 border-2 border-amber-500/30 bg-amber-500/10">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-[22px] font-black text-foreground tracking-tight leading-tight">
              Recently Opened
            </h2>
            <p className="text-[13px] text-muted-foreground/60 font-semibold">
              Quick access to your apps
            </p>
          </div>
        </div>

        <span className="text-sm font-bold text-muted-foreground/60">
          {recentAppData.length}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentAppData.map((app, index) => (
          <motion.button
            key={app.id}
            onClick={() => onLaunch(app.route)}
            className={cn(
              "group relative p-5 border-2 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              "bg-gradient-to-br shadow-sm hover:shadow-lg hover:scale-[1.02]",
              app.color,
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

            {/* Icon */}
            <div className="flex items-center justify-center mb-3">
              <motion.div
                className="p-2.5 border bg-card/40 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {app.icon}
              </motion.div>
            </div>

            {/* Name */}
            <p className="text-sm font-bold text-foreground text-center mb-1 truncate">
              {app.name}
            </p>

            {/* Category */}
            <p className="text-xs text-muted-foreground/60 text-center font-semibold">
              {app.category}
            </p>

            {/* Hover launch overlay */}
            <motion.div
              className="absolute inset-0 bg-amber-500/90 flex items-center justify-center backdrop-blur-sm"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-sm font-bold text-black">
                Launch
              </span>
            </motion.div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
