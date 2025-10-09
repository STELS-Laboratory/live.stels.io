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
      <div className="px-4 mb-4 pt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <h2 className="text-[22px] font-black text-foreground tracking-tight leading-tight">
            {title}
          </h2>
          <span className="text-base font-bold text-muted-foreground/60">
            {count}
          </span>
        </div>
        {description && (
          <p className="text-[13px] text-muted-foreground/60 font-semibold leading-snug">
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-start justify-between mb-8 relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start gap-4">
        {showFeaturedBadge && (
          <motion.div
            className="relative p-3 border-2 bg-gradient-to-br from-amber-500/15 to-orange-500/15 border-amber-500/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
          </motion.div>
        )}

        <div>
          <h2 className="text-[28px] font-black text-foreground mb-1 tracking-tight leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-[15px] text-muted-foreground/60 font-semibold tracking-tight leading-snug max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>

      <motion.div
        className="flex items-center gap-2 px-3 py-1.5 border bg-muted/40"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <span className="text-sm font-bold text-muted-foreground/70">
          {count}
        </span>
      </motion.div>
    </motion.div>
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
        isMobile ? "mb-10" : "container mx-auto px-6 mb-16",
        // iOS-style section spacing
        variant === "featured" && !isMobile && "mb-20",
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
