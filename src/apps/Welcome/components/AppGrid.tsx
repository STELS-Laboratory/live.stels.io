/**
 * App Grid Component
 * iOS-style application grid with adaptive layouts
 */

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { AppMetadata } from "../types.ts";
import { AppCardPremium } from "./AppCardPremium.tsx";

interface AppGridProps {
  applications: AppMetadata[];
  onLaunch: (route: string) => void;
  isMobile: boolean;
  title?: string;
  description?: string;
  showFeaturedBadge?: boolean;
  variant?: "featured" | "standard";
}

/**
 * iOS-style Section Header
 */
function SectionHeader({
  title,
  description,
  count,
  isMobile,
  showFeaturedBadge,
}: {
  title: string;
  description?: string;
  count: number;
  isMobile: boolean;
  showFeaturedBadge?: boolean;
}): React.ReactElement {
  if (isMobile) {
    return (
      <div className="relative px-4 mb-3 pt-3">
        {/* Decorative corner */}
        <div className="absolute top-0 left-4 w-8 h-px bg-amber-500/30" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {showFeaturedBadge && (
              <div className="relative p-1 border border-amber-500/30 bg-amber-500/10">
                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-amber-500/50" />
                <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight leading-tight">
                {title}
              </h2>
              {description && (
                <p className="text-[10px] text-muted-foreground/70 font-medium leading-tight">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="px-1.5 py-0.5 border border-border bg-muted">
            <span className="text-[10px] font-bold text-foreground">
              {count}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-between mb-4">
      {/* Decorative line */}
      <div className="absolute -top-2 left-0 w-12 h-px bg-amber-500/30" />

      <div className="flex items-center gap-3">
        {showFeaturedBadge && (
          <div className="relative p-2 border bg-amber-500/10 border-amber-500/30">
            {/* Corner accent */}
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-foreground mb-0.5 tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground/70 font-medium max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="relative flex items-center gap-1.5 px-2 py-1 border bg-muted">
        {/* Corner accent */}
        <div className="absolute -top-0.5 -right-0.5 w-1 h-1 border-t border-r border-border" />
        <span className="text-xs font-bold text-foreground">
          {count}
        </span>
      </div>
    </div>
  );
}

/**
 * iOS-style App Grid Component
 */
export function AppGrid({
  applications,
  onLaunch,
  isMobile,
  title = "Applications",
  description,
  showFeaturedBadge = false,
  variant = "standard",
}: AppGridProps): React.ReactElement {
  if (applications.length === 0) {
    return <></>;
  }

  // Grid configuration
  const getGridClasses = (): string => {
    if (isMobile) {
      // Mobile: 4 column grid for all
      return "grid grid-cols-3 gap-3 px-4";
    }

    if (variant === "featured") {
      // Featured: Larger cards, fewer columns
      return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
    }

    // Standard: Wider cards, comfortable layout
    return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5";
  };

  // Stagger animation for cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? 0.03 : 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      className={cn(
        isMobile ? "mb-6" : "container mt-8 mx-auto px-6 mb-8",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <SectionHeader
        title={title}
        description={description}
        count={applications.length}
        isMobile={isMobile}
        showFeaturedBadge={showFeaturedBadge}
      />

      {/* iOS-style grid with stagger animation */}
      <motion.div
        className={getGridClasses()}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {applications.map((app, index) => (
          <motion.div key={app.id} variants={itemVariants}>
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
