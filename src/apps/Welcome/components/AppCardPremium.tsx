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
 * Category color scheme type
 */
interface CategoryColorScheme {
  bg: string;
  text: string;
  border: string;
  iconBg: string;
}

/**
 * Get category color scheme
 */
function getCategoryColorScheme(category: string): CategoryColorScheme {
  const schemes: Record<string, CategoryColorScheme> = {
    Analytics: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
      iconBg: "bg-blue-500/20",
    },
    Trading: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      border: "border-green-500/30",
      iconBg: "bg-green-500/20",
    },
    Development: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/30",
      iconBg: "bg-purple-500/20",
    },
    Network: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
    },
    Visualization: {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      border: "border-pink-500/30",
      iconBg: "bg-pink-500/20",
    },
  };

  return (
    schemes[category] || {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/20",
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
    <motion.div
      className="relative"
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      <button
        onClick={() => onLaunch(app.route)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={cn(
          "relative w-full aspect-square overflow-hidden transition-all duration-150 border group",
          "bg-card active:bg-muted",
          borderColor,
        )}
      >
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-border" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-border" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-border" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-border" />

        {/* Diagonal line accent with category color */}
        <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden opacity-30">
          <div
            className={cn(
              "absolute inset-0 rotate-45 border-t-2",
              colorScheme.border,
            )}
          />
        </div>

        {/* Icon container */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <motion.div
            className={cn(
              "relative w-full h-full flex items-center justify-center",
              colorScheme.text,
            )}
            animate={isPressed ? { scale: 0.9 } : { scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {app.icon}
          </motion.div>
        </div>

        {/* Marketing badges */}
        {app.featured && (
          <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5">
            <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
          </div>
        )}

        {app.badge && (
          <div className="absolute bottom-0.5 left-0.5 right-0.5">
            <div className="relative px-1 py-0.5 bg-amber-500 border border-amber-400 text-center">
              <div className="absolute -top-0.5 -left-0.5 w-0.5 h-0.5 border-t border-l border-amber-300" />
              <span className="text-[8px] font-bold text-black uppercase tracking-wider leading-none">
                {app.badge}
              </span>
            </div>
          </div>
        )}
      </button>

      {/* App name with category indicator */}
      <div className="mt-1.5 text-center">
        <p className="text-[10px] font-bold text-foreground truncate px-0.5 mb-0.5">
          {app.name}
        </p>
        <p
          className={cn(
            "text-[8px] font-medium truncate",
            colorScheme.text,
          )}
        >
          {app.category}
        </p>
      </div>
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
          "group relative overflow-hidden border transition-all duration-200 cursor-pointer",
          "hover:border-foreground/20",
          "bg-card",
          isHovered && colorScheme.border,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onLaunch(app.route)}
      >
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-border group-hover:border-foreground/30 transition-colors" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-border group-hover:border-foreground/30 transition-colors" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-border group-hover:border-foreground/30 transition-colors" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-border group-hover:border-foreground/30 transition-colors" />

        {/* Top accent line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-border opacity-50" />

        <CardContent className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            {/* Icon container */}
            <div className="relative">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-border" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-border" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-border" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-border" />

              <div
                className={cn(
                  "relative p-3 border-2 flex items-center justify-center",
                  colorScheme.border,
                  colorScheme.iconBg,
                  colorScheme.text,
                )}
              >
                {app.icon}
              </div>
            </div>

            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={cn(
                "relative p-2 border transition-colors group/fav",
                isFavorite
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:border-red-500/30",
              )}
            >
              {/* Corner accent */}
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t border-r border-border group-hover/fav:border-red-500/50 transition-colors" />

              <Heart
                className={cn(
                  "w-4 h-4 transition-transform",
                  isFavorite && "fill-current scale-110",
                )}
              />
            </button>
          </div>

          {/* Title and tagline */}
          <div className="mb-3 relative">
            {/* Title underline */}
            <div className="absolute left-0 bottom-0 w-8 h-px bg-amber-500/30" />

            <h3 className="text-base font-bold text-foreground mb-1 line-clamp-1 tracking-tight">
              {app.name}
            </h3>
            <p className="text-xs text-muted-foreground/70 font-medium line-clamp-1 tracking-tight">
              {app.tagline}
            </p>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {app.description}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Category badge */}
            <div
              className={cn(
                "px-2 py-1 border text-xs font-medium",
                colorScheme.border,
                colorScheme.bg,
                colorScheme.text,
              )}
            >
              {app.category}
            </div>

            {/* Feature badge */}
            {app.badge && (
              <div className="flex items-center gap-1 px-2 py-1 border border-amber-500/30 bg-amber-500/10 text-amber-500">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-medium">
                  {app.badge}
                </span>
              </div>
            )}

            {/* Stats badge */}
            {app.stats && (
              <div className="flex items-center gap-1 px-2 py-1 border border-border bg-background">
                <div className="w-1 h-1 bg-green-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  {app.stats}
                </span>
              </div>
            )}
          </div>

          {/* Launch button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="w-full h-9 text-sm bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-bold transition-colors group/btn"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch(app.route);
              }}
            >
              <span>Launch</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </motion.div>

          {/* Featured badge */}
          {app.featured && (
            <div className="absolute top-2 left-2 z-20">
              <div className="relative flex items-center gap-1 px-2 py-0.5 border border-amber-500/30 bg-amber-500 text-black">
                {/* Corner accent */}
                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-amber-400" />
                <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 border-b border-r border-amber-600" />

                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  Featured
                </span>
              </div>
            </div>
          )}
        </CardContent>
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
