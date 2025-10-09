/**
 * App Grid Component
 * Display applications in a responsive grid with sections
 */

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
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
}

/**
 * Section header component
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
      <div className="px-4 mb-4 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {title}
          </h2>
          <Badge variant="secondary" className="bg-muted text-foreground">
            {count}
          </Badge>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-between mb-8 pb-6 border-b border-border/30 relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradient underline */}
      <div className="absolute bottom-0 left-0 h-[2px] w-32 bg-gradient-to-r from-amber-500/50 to-transparent" />

      <div className="flex items-center gap-4">
        {showFeaturedBadge && (
          <motion.div
            className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-6 h-6 text-amber-500" />
          </motion.div>
        )}

        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-1">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground font-medium">
              {description}
            </p>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Badge
          variant="outline"
          className="px-4 py-2 text-base font-bold bg-card/50 backdrop-blur-sm border-border/50"
        >
          {count} {count === 1 ? "App" : "Apps"}
        </Badge>
      </motion.div>
    </motion.div>
  );
}

/**
 * App Grid Component
 */
export function AppGrid({
  applications,
  onLaunch,
  isMobile,
  title = "Applications",
  description,
  showFeaturedBadge = false,
}: AppGridProps): React.ReactElement {
  if (applications.length === 0) {
    return <></>;
  }

  return (
    <div className={isMobile ? "mb-8" : "container mx-auto px-6 mb-16"}>
      <SectionHeader
        title={title}
        description={description}
        count={applications.length}
        isMobile={isMobile}
        showFeaturedBadge={showFeaturedBadge}
      />

      <div
        className={cn(
          isMobile
            ? "grid grid-cols-4 gap-4 px-4"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        )}
      >
        {applications.map((app, index) => (
          <AppCardPremium
            key={app.id}
            app={app}
            onLaunch={onLaunch}
            isMobile={isMobile}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
