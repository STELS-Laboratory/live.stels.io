/**
 * Premium App Card Component
 * Futuristic, animated app card with neon effects
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Sparkles, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import type { AppMetadata } from "../types.ts";
import { useWelcomeStore } from "../store.ts";

interface AppCardPremiumProps {
  app: AppMetadata;
  onLaunch: (route: string) => void;
  isMobile: boolean;
  index: number;
}

/**
 * Get category color scheme
 */
function getCategoryColorScheme(category: string): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  const schemes: Record<string, any> = {
    Analytics: {
      bg: "from-blue-500/10 to-cyan-500/10",
      text: "text-blue-500",
      border: "border-blue-500/20",
      glow: "shadow-blue-500/20",
    },
    Trading: {
      bg: "from-green-500/10 to-emerald-500/10",
      text: "text-green-500",
      border: "border-green-500/20",
      glow: "shadow-green-500/20",
    },
    Development: {
      bg: "from-purple-500/10 to-violet-500/10",
      text: "text-purple-500",
      border: "border-purple-500/20",
      glow: "shadow-purple-500/20",
    },
    Network: {
      bg: "from-emerald-500/10 to-teal-500/10",
      text: "text-emerald-500",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/20",
    },
    Visualization: {
      bg: "from-pink-500/10 to-rose-500/10",
      text: "text-pink-500",
      border: "border-pink-500/20",
      glow: "shadow-pink-500/20",
    },
  };

  return (
    schemes[category] || {
      bg: "from-amber-500/10 to-orange-500/10",
      text: "text-amber-500",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/20",
    }
  );
}

/**
 * iOS-style Mobile App Card
 */
function MobileAppCard({
  app,
  onLaunch,
}: AppCardPremiumProps & {
  isFavorite: boolean;
  onToggleFavorite: () => void;
}): React.ReactElement {
  const [isPressed, setIsPressed] = useState(false);
  const colorScheme = getCategoryColorScheme(app.category);

  return (
    <motion.div
      className="relative"
      whileTap={{ scale: 0.88 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      <button
        onClick={() => onLaunch(app.route)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={cn(
          "relative w-full aspect-square overflow-hidden transition-all duration-200 border",
          "bg-gradient-to-br shadow-md active:shadow-sm",
          "ease-[cubic-bezier(0.4,0,0.2,1)]",
          app.color,
        )}
      >
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* Icon container */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            className={cn("relative", colorScheme.text)}
            animate={isPressed
              ? { scale: 0.85, opacity: 0.8 }
              : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {app.icon}
          </motion.div>
        </div>
      </button>

      {/* App name */}
      <p className="text-[11px] font-semibold text-center mt-1.5 text-foreground/90 truncate px-0.5 leading-tight">
        {app.name}
      </p>
    </motion.div>
  );
}

/**
 * Desktop App Card
 */
function DesktopAppCard({
  app,
  onLaunch,
  isFavorite,
  onToggleFavorite,
}: AppCardPremiumProps & {
  isFavorite: boolean;
  onToggleFavorite: () => void;
}): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const colorScheme = getCategoryColorScheme(app.category);

  return (
    <div>
      <Card
        className={cn(
          "group relative overflow-hidden border-2 transition-all duration-500 cursor-pointer",
          "hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5",
          "bg-gradient-to-br from-card via-card/98 to-card/95",
          "ease-[cubic-bezier(0.4,0,0.2,1)]",
          isHovered && colorScheme.border,
          isHovered && `shadow-lg ${colorScheme.glow}`,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onLaunch(app.route)}
      >
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        {/* Animated background gradient on hover */}
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500",
            app.color,
          )}
        />

        <CardContent className="relative p-7">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            {/* Icon container */}
            <motion.div
              className={cn(
                "relative p-4 border-2 bg-gradient-to-br backdrop-blur-sm",
                colorScheme.border,
                colorScheme.bg,
              )}
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={cn("relative", colorScheme.text)}>
                {app.icon}
              </div>
            </motion.div>

            {/* Favorite button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={cn(
                "p-2 border transition-all duration-300",
                isFavorite
                  ? "bg-red-500/15 text-red-500 border-red-500/30"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  isFavorite && "fill-current",
                )}
              />
            </motion.button>
          </div>

          {/* Title and tagline */}
          <div className="mb-5">
            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight leading-tight line-clamp-1">
              {app.name}
            </h3>
            <p className="text-sm text-muted-foreground/70 font-semibold tracking-tight leading-snug line-clamp-2">
              {app.tagline}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground/60 leading-relaxed mb-5 line-clamp-3">
            {app.description}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2.5 mb-6 flex-wrap">
            {/* Category badge */}
            <div
              className={cn(
                "px-3.5 py-1.5 border text-xs font-semibold backdrop-blur-sm",
                colorScheme.border,
                colorScheme.bg,
                colorScheme.text,
              )}
            >
              {app.category}
            </div>

            {/* Feature badge */}
            {app.badge && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-semibold">
                  {app.badge}
                </span>
              </div>
            )}

            {/* Stats badge */}
            {app.stats && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-muted/50">
                <div className="w-1.5 h-1.5 bg-green-500" />
                <span className="text-xs font-semibold text-muted-foreground">
                  {app.stats}
                </span>
              </div>
            )}
          </div>

          {/* Launch button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Button
              className="w-full h-12 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-black font-bold shadow-md hover:shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group/btn"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch(app.route);
              }}
            >
              <span>Launch</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-0.5 transition-transform duration-200" />
            </Button>
          </motion.div>

          {/* Featured badge */}
          {app.featured && (
            <div className="absolute top-3 left-3 z-20">
              <div className="flex items-center gap-1.5 px-2.5 py-1 border border-white/20 bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                  Featured
                </span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Subtle hover glow */}
        <motion.div
          className={cn(
            "absolute -inset-[1px] opacity-0 transition-opacity duration-500 pointer-events-none",
            isHovered && "opacity-30",
          )}
          style={{
            background: `linear-gradient(135deg, transparent, ${
              colorScheme.text.replace("text-", "").replace("-500", "-400")
            } / 0.15, transparent)`,
            filter: "blur(12px)",
          }}
        />
      </Card>
    </div>
  );
}

/**
 * Main Premium App Card Component
 */
export function AppCardPremium({
  app,
  onLaunch,
  isMobile,
  index,
}: AppCardPremiumProps): React.ReactElement {
  const favoriteApps = useWelcomeStore((state) => state.favoriteApps);
  const toggleFavorite = useWelcomeStore((state) => state.toggleFavorite);
  const addToRecent = useWelcomeStore((state) => state.addToRecent);

  const isFavorite = favoriteApps.includes(app.id);

  const handleLaunch = (route: string): void => {
    addToRecent(app.id);
    onLaunch(route);
  };

  const handleToggleFavorite = (): void => {
    toggleFavorite(app.id);
  };

  if (isMobile) {
    return (
      <MobileAppCard
        app={app}
        onLaunch={handleLaunch}
        isMobile={isMobile}
        index={index}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />
    );
  }

  return (
    <DesktopAppCard
      app={app}
      onLaunch={handleLaunch}
      isMobile={isMobile}
      index={index}
      isFavorite={isFavorite}
      onToggleFavorite={handleToggleFavorite}
    />
  );
}
