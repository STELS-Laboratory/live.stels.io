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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/20">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
          </div>
          <div>
            <h2
              className={cn(
                "font-bold text-foreground",
                isMobile ? "text-lg" : "text-2xl",
              )}
            >
              Your Favorites
            </h2>
            <p className="text-xs text-muted-foreground">
              Apps you love the most
            </p>
          </div>
        </div>

        <Badge
          variant="secondary"
          className="bg-red-500/10 text-red-500 border-red-500/20"
        >
          <Star className="w-3 h-3 mr-1 fill-current" />
          {favoriteAppData.length}
        </Badge>
      </div>

      {/* Grid */}
      <div
        className={cn(
          isMobile
            ? "grid grid-cols-4 gap-4"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        )}
      >
        {favoriteAppData.map((app, index) => (
          <AppCardPremium
            key={app.id}
            app={app}
            onLaunch={onLaunch}
            isMobile={isMobile}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
