/**
 * Favorites Section Component
 * Display user's favorite applications
 */

import React from "react";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useWelcomeStore } from "../store.ts";
import type { AppMetadata } from "../types.ts";
import { AppCardPremium } from "./AppCardPremium.tsx";

interface FavoritesSectionProps {
  applications: AppMetadata[];
  onLaunch: (route: string) => void;
  isMobile: boolean;
}

/**
 * Favorites Section
 */
export function FavoritesSection({
  applications,
  onLaunch,
  isMobile,
}: FavoritesSectionProps): React.ReactElement | null {
  const favoriteApps = useWelcomeStore((state) => state.favoriteApps);

  if (favoriteApps.length === 0) return null;

  const favoriteAppData = favoriteApps
    .map((appId) => applications.find((app) => app.id === appId))
    .filter((app): app is AppMetadata => app !== undefined);

  if (favoriteAppData.length === 0) return null;

  return (
    <motion.div
      className={cn(
        "relative",
        isMobile
          ? "px-4 py-3 border-b border-border bg-card"
          : "container mx-auto px-6 py-4",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Decorative line */}
      <div className="absolute top-0 left-6 w-16 h-px bg-red-500/30" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative p-2 border border-red-500/30 bg-red-500/10">
            {/* Corner accent */}
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-red-500/50" />
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
          </div>
          <div>
            <h2
              className={cn(
                "font-bold text-foreground tracking-tight leading-tight",
                isMobile ? "text-xs" : "text-sm",
              )}
            >
              Favorite Applications
            </h2>
            <p
              className={cn(
                "text-muted-foreground/70 font-medium",
                isMobile ? "text-[10px]" : "text-xs",
              )}
            >
              {isMobile ? "Your top picks" : "Quick access to your favorites"}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-1 px-2 py-1 border border-red-500/30 bg-red-500/10">
          {/* Corner accent */}
          <div className="absolute -top-0.5 -right-0.5 w-1 h-1 border-t border-r border-red-500/50" />
          <Star className="w-3 h-3 text-red-500 fill-current" />
          <span
            className={cn(
              "font-bold text-red-500",
              isMobile ? "text-[10px]" : "text-xs",
            )}
          >
            {favoriteAppData.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className={cn(
          isMobile
            ? "grid grid-cols-3 gap-2"
            : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {favoriteAppData.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.2,
              delay: index * 0.03,
            }}
          >
            <AppCardPremium
              app={app}
              onLaunch={onLaunch}
              isMobile={isMobile}
              index={index}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
