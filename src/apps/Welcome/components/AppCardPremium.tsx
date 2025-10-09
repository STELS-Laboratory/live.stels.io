/**
 * Premium App Card Component
 * Futuristic, animated app card with neon effects
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
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
 * Mobile App Card
 */
function MobileAppCard({
  app,
  onLaunch,
  isFavorite,
  onToggleFavorite,
}: AppCardPremiumProps & {
  isFavorite: boolean;
  onToggleFavorite: () => void;
}): React.ReactElement {
  const [isPressed, setIsPressed] = useState(false);
  const colorScheme = getCategoryColorScheme(app.category);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileTap={{ scale: 0.92 }}
    >
      <button
        onClick={() => onLaunch(app.route)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={cn(
          "relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-200",
          "bg-gradient-to-br border",
          app.color,
          isPressed ? "scale-95 shadow-lg" : "scale-100 shadow-md",
        )}
      >
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className={cn(
              "p-3 rounded-xl bg-card/50 backdrop-blur-sm border",
              colorScheme.border,
            )}
            animate={isPressed ? { scale: 0.9 } : { scale: 1 }}
          >
            {app.icon}
          </motion.div>
        </div>

        {/* Badge */}
        {app.badge && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="text-xs bg-card/80 backdrop-blur-sm border-border/50 px-2 py-0.5"
            >
              {app.badge}
            </Badge>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 transition-colors"
        >
          <Heart
            className={cn(
              "w-3 h-3",
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground",
            )}
          />
        </button>
      </button>

      {/* App name below */}
      <p className="text-xs font-medium text-center mt-2 text-foreground truncate px-1">
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
  index,
  isFavorite,
  onToggleFavorite,
}: AppCardPremiumProps & {
  isFavorite: boolean;
  onToggleFavorite: () => void;
}): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const colorScheme = getCategoryColorScheme(app.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer",
          "hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2",
          isHovered && colorScheme.border,
          isHovered && `shadow-lg ${colorScheme.glow}`,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onLaunch(app.route)}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Animated background gradient */}
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
            app.color,
          )}
        />

        {/* Top accent line */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            colorScheme.text.replace("text-", "via-"),
          )}
        />

        {/* Corner accent lines */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-transparent group-hover:border-amber-500/30 transition-all duration-300" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-transparent group-hover:border-amber-500/30 transition-all duration-300" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-transparent group-hover:border-amber-500/30 transition-all duration-300" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-transparent group-hover:border-amber-500/30 transition-all duration-300" />

        <CardContent className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className={cn(
                "p-3 rounded-xl border-2 bg-card/50 backdrop-blur-sm",
                colorScheme.border,
                colorScheme.text,
              )}
              animate={isHovered
                ? { scale: 1.1, rotate: 5 }
                : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              {app.icon}
            </motion.div>

            {/* Favorite button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={cn(
                "p-2 rounded-full border transition-all duration-200",
                isFavorite
                  ? "bg-red-500/20 border-red-500/30 text-red-500"
                  : "bg-card/50 border-border/50 text-muted-foreground hover:bg-card hover:border-border",
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
          <div className="mb-3">
            <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-amber-500 transition-colors">
              {app.name}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {app.tagline}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
            {app.description}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                colorScheme.text,
                colorScheme.border,
              )}
            >
              {app.category}
            </Badge>
            {app.badge && (
              <Badge
                variant="secondary"
                className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20"
              >
                <Star className="w-3 h-3 mr-1" />
                {app.badge}
              </Badge>
            )}
          </div>

          {/* Stats */}
          {app.stats && (
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span className="font-medium">{app.stats}</span>
            </div>
          )}

          {/* Launch button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Button corner accents */}
            <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t border-l border-amber-400/50" />
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t border-r border-amber-400/50" />
            <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b border-l border-amber-400/50" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b border-r border-amber-400/50" />

            <Button
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-black font-bold h-10 group/btn relative"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch(app.route);
              }}
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Featured indicator */}
          {app.featured && (
            <div className="absolute top-3 left-3">
              <div className="px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/80 to-orange-500/80 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-xs font-bold text-white">Featured</span>
                </div>
              </div>
            </div>
          )}

          {/* Trending indicator */}
          {app.id === "scanner" && (
            <div className="absolute bottom-3 left-3">
              <Badge
                variant="secondary"
                className="bg-green-500/20 text-green-500 border-green-500/30"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                <span className="text-xs font-bold">Trending</span>
              </Badge>
            </div>
          )}
        </CardContent>

        {/* Enhanced hover glow effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn("absolute -inset-2 blur-2xl", colorScheme.glow)} />
          <div
            className={cn(
              "absolute -inset-4 blur-3xl opacity-50",
              colorScheme.glow,
            )}
          />
        </motion.div>

        {/* Outer neon glow */}
        <motion.div
          className={cn(
            "absolute -inset-[2px] opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100",
          )}
          style={{
            background: `linear-gradient(45deg, transparent, ${
              colorScheme.text.replace("text-", "rgb(var(--") + ") / 0.2"
            }, transparent)`,
            filter: "blur(8px)",
          }}
        />
      </Card>
    </motion.div>
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
