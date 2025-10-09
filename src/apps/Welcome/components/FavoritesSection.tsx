/**
 * Favorites Section Component
 * Display user's favorite applications
 */

import React from "react";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
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
      className={isMobile ? "px-4 py-6" : "container mx-auto px-6 py-8"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 border-2 border-red-500/30 bg-gradient-to-br from-red-500/15 to-pink-500/15">
            <Heart className="w-4 h-4 text-red-500 fill-current" />
          </div>
          <div>
            <h2
              className={cn(
                "font-black text-foreground tracking-tight leading-tight",
                isMobile ? "text-[22px]" : "text-[22px]",
              )}
            >
              Your Favorites
            </h2>
            <p className="text-[13px] text-muted-foreground/60 font-semibold">
              Apps you love the most
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 border border-red-500/30 bg-red-500/10">
          <Star className="w-3 h-3 text-red-500 fill-current" />
          <span className="text-sm font-bold text-red-500">
            {favoriteAppData.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className={cn(
          isMobile
            ? "grid grid-cols-4 gap-3"
            : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {favoriteAppData.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0.16, 1, 0.3, 1],
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
