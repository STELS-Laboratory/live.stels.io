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
      <motion.div
        className="px-4 py-4 border-b border-border/30 bg-card/30"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Recent</h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent -mx-4 px-4">
          {recentAppData.map((app, index) => (
            <motion.button
              key={app.id}
              onClick={() => onLaunch(app.route)}
              className={cn(
                "flex-shrink-0 w-16 aspect-square rounded-xl flex items-center justify-center",
                "bg-gradient-to-br border transition-all duration-200",
                app.color,
                "hover:scale-105 active:scale-95",
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileTap={{ scale: 0.9 }}
            >
              {app.icon}
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-6 py-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Recently Opened
            </h2>
            <p className="text-xs text-muted-foreground">
              Quick access to your apps
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="text-xs">
          {recentAppData.length} apps
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentAppData.map((app, index) => (
          <motion.div
            key={app.id}
            className="group relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button
              onClick={() => onLaunch(app.route)}
              className={cn(
                "relative w-full p-4 rounded-xl border-2 transition-all duration-300",
                "bg-gradient-to-br",
                app.color,
                "hover:shadow-lg",
              )}
            >
              {/* Icon */}
              <div className="flex items-center justify-center mb-3">
                <motion.div
                  className="p-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50"
                  whileHover={{ rotate: 5 }}
                >
                  {app.icon}
                </motion.div>
              </div>

              {/* Name */}
              <p className="text-sm font-bold text-foreground text-center mb-1 truncate">
                {app.name}
              </p>

              {/* Category */}
              <p className="text-xs text-muted-foreground text-center">
                {app.category}
              </p>

              {/* Launch overlay */}
              <motion.div
                className="absolute inset-0 bg-amber-500/10 rounded-xl flex items-center justify-center backdrop-blur-sm"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Badge className="bg-amber-500 text-black font-bold">
                  Launch
                </Badge>
              </motion.div>
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
