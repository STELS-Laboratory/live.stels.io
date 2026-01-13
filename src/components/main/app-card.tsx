/**
 * AppCard Component
 * Professional navigation card for app shortcuts
 */

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface AppCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  isActive?: boolean;
  onClick: () => void;
  shortcut?: string;
  badge?: string;
}

/**
 * Animated app navigation card with glass morphism effect
 */
export function AppCard({
  title,
  description,
  icon: Icon,
  accentColor,
  gradientFrom,
  gradientTo,
  isActive = false,
  onClick,
  shortcut,
  badge,
}: AppCardProps): React.ReactElement {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative flex flex-col items-start p-6 rounded border transition-all duration-300",
        "bg-card/80 backdrop-blur-sm hover:bg-card",
        "border-border/50 hover:border-border",
        "shadow-sm hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20",
        "text-left w-full min-h-[180px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive && "ring-2 ring-primary/50 border-primary/30"
      )}
      aria-label={`Open ${title}`}
    >
      {/* Background gradient on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-br pointer-events-none"
        )}
        style={{
          backgroundImage: `linear-gradient(135deg, ${gradientFrom}08 0%, ${gradientTo}05 100%)`,
        }}
      />

      {/* Top row: Icon and badge */}
      <div className="relative flex items-start justify-between w-full mb-4">
        {/* Icon container with gradient background */}
        <div
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded",
            "transition-transform duration-300 group-hover:scale-110",
            "shadow-lg"
          )}
          style={{
            background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          }}
        >
          <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>

        {/* Badge */}
        {badge && (
          <span
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full",
              "bg-primary/10 text-primary"
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Title and description */}
      <div className="relative flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-foreground mb-1.5 group-hover:text-foreground transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Bottom row: Shortcut hint */}
      <div className="relative flex items-center justify-between w-full mt-4 pt-4 border-t border-border/50">
        <span
          className="text-xs font-medium transition-colors"
          style={{ color: accentColor }}
        >
          Launch →
        </span>
        {shortcut && (
          <kbd className="px-2 py-1 text-[10px] font-mono bg-muted/50 text-muted-foreground rounded border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {shortcut}
          </kbd>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="active-app-indicator"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

/**
 * AppCard skeleton for loading states
 */
export function AppCardSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col items-start p-6 rounded border border-border/50 bg-card/50 min-h-[180px] animate-pulse">
      <div className="w-14 h-14 rounded bg-muted mb-4" />
      <div className="w-2/3 h-5 rounded bg-muted mb-2" />
      <div className="w-full h-4 rounded bg-muted/60" />
      <div className="w-3/4 h-4 rounded bg-muted/40 mt-1" />
      <div className="flex-1" />
      <div className="w-full h-px bg-border/50 mt-4" />
      <div className="w-20 h-4 rounded bg-muted/50 mt-4" />
    </div>
  );
}
