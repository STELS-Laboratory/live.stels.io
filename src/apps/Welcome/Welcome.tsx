/**
 * Welcome Screen - Premium Futuristic App Store
 * Advanced application launcher with neon effects and optimized performance
 */

import React, { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useAppStore } from "@/stores";
import { useMobile } from "@/hooks/useMobile.ts";
import { useWelcomeStore } from "./store.ts";
import { applications } from "./applications.tsx";
import { APP_CATEGORIES } from "./constants.tsx";
import {
  AppGrid,
  CategoryFilter,
  EmptyState,
  FavoritesSection,
  HeroSection,
  RecentApps,
} from "./components";

/**
 * Premium Welcome Screen Component
 */
function Welcome(): React.ReactElement {
  const { setRoute } = useAppStore();
  const isMobile = useMobile();

  // Store state
  const searchTerm = useWelcomeStore((state) => state.searchTerm);
  const selectedCategory = useWelcomeStore((state) => state.selectedCategory);
  const showOnlyFeatured = useWelcomeStore((state) => state.showOnlyFeatured);

  /**
   * Handle app launch - optimized with useCallback
   */
  const handleLaunchApp = useCallback(
    (route: string): void => {
      console.log(`[Welcome] Launching app: ${route}`);
      // Add to recent in store (handled by AppCardPremium)
      setRoute(route);
    },
    [setRoute],
  );

  /**
   * Filter and sort applications
   */
  const filteredApps = useMemo(() => {
    let filtered = [...applications];

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(search) ||
          app.tagline.toLowerCase().includes(search) ||
          app.description.toLowerCase().includes(search) ||
          app.category.toLowerCase().includes(search),
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((app) => app.category === selectedCategory);
    }

    // Filter by featured
    if (showOnlyFeatured) {
      filtered = filtered.filter((app) => app.featured);
    }

    return filtered;
  }, [searchTerm, selectedCategory, showOnlyFeatured]);

  /**
   * Separate featured and other apps
   */
  const { featuredApps, otherApps } = useMemo(() => {
    const featured = filteredApps.filter((app) => app.featured);
    const other = filteredApps.filter((app) => !app.featured);

    return {
      featuredApps: featured,
      otherApps: other,
    };
  }, [filteredApps]);

  /**
   * Calculate category counts
   */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: applications.length,
    };

    APP_CATEGORIES.forEach((category) => {
      if (category === "All") return;
      counts[category] = applications.filter(
        (app) => app.category === category,
      ).length;
    });

    return counts;
  }, []);

  /**
   * Check if showing empty state
   */
  const showEmptyState = filteredApps.length === 0 &&
    (searchTerm || selectedCategory !== "All");

  return (
    <motion.div
      className="relative h-full w-full overflow-y-auto bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <HeroSection
        totalApps={applications.length}
        featuredCount={featuredApps.length}
        isMobile={isMobile}
      />

      {/* Category Filter */}
      {!isMobile && (
        <CategoryFilter
          categories={APP_CATEGORIES}
          categoryCounts={categoryCounts}
          isMobile={isMobile}
        />
      )}

      {/* Mobile Category Filter */}
      {isMobile && (
        <CategoryFilter
          categories={APP_CATEGORIES}
          categoryCounts={categoryCounts}
          isMobile={isMobile}
        />
      )}

      {/* Recent Apps */}
      {!searchTerm && selectedCategory === "All" && !showOnlyFeatured && (
        <RecentApps
          applications={applications}
          onLaunch={handleLaunchApp}
          isMobile={isMobile}
        />
      )}

      {/* Favorites Section */}
      {!searchTerm && selectedCategory === "All" && !showOnlyFeatured && (
        <FavoritesSection
          applications={applications}
          onLaunch={handleLaunchApp}
          isMobile={isMobile}
        />
      )}

      {/* Empty State */}
      {showEmptyState && <EmptyState isMobile={isMobile} />}

      {/* Marketing banner - Mobile only */}
      {isMobile && !showEmptyState && (
        <div className="relative px-4 py-3 border-b border-border bg-amber-500/5 overflow-hidden">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-6 h-px bg-amber-500/30" />
          <div className="absolute top-0 right-0 w-6 h-px bg-amber-500/30" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative p-1.5 border border-amber-500/30 bg-amber-500/10">
                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-amber-500/50" />
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">
                  AI Trading Platform
                </p>
                <p className="text-[10px] text-muted-foreground/70 font-medium">
                  Web3 • Real-time • Secure
                </p>
              </div>
            </div>
            <div className="relative px-2 py-1 bg-amber-500 border border-amber-400 text-black">
              <div className="absolute -top-0.5 -right-0.5 w-1 h-1 border-t border-r border-amber-300" />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Pro
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Featured Apps Section */}
      {!showEmptyState && featuredApps.length > 0 && (
        <AppGrid
          applications={featuredApps}
          onLaunch={handleLaunchApp}
          isMobile={isMobile}
          title={isMobile ? "Featured" : "Featured Applications"}
          description={isMobile
            ? "Top picks for you"
            : "Handpicked professional tools for traders and developers"}
          showFeaturedBadge={!isMobile}
          variant="featured"
        />
      )}

      {/* Other Apps Section */}
      {!showEmptyState &&
        otherApps.length > 0 &&
        !showOnlyFeatured && (
        <div className={isMobile ? "border-t border-border/30 pt-6" : ""}>
          <AppGrid
            applications={otherApps}
            onLaunch={handleLaunchApp}
            isMobile={isMobile}
            title={isMobile ? "More Apps" : "More Applications"}
            description={isMobile
              ? "Explore more"
              : "Additional professional tools and utilities"}
          />
        </div>
      )}

      {/* Footer */}
      <div
        className={cn(
          "relative border-t border-border bg-card overflow-hidden",
          isMobile ? "px-4 py-4 mt-6" : "container mx-auto px-6 py-6 mt-8",
        )}
      >
        {/* Decorative grid pattern */}
        {!isMobile && (
          <div className="absolute inset-0 opacity-[0.02]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          </div>
        )}

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

        <div className="max-w-3xl mx-auto relative">
          {!isMobile && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="relative p-3 border border-amber-500/30 bg-amber-500/5 text-center">
                {/* Corner accent */}
                <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
                <Sparkles className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-foreground mb-0.5">
                  Web3 Technology
                </p>
                <p className="text-[10px] text-muted-foreground/70 font-medium">
                  Decentralized infrastructure
                </p>
              </div>

              <div className="relative p-3 border border-green-500/30 bg-green-500/5 text-center">
                {/* Corner accent */}
                <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-green-500/50" />
                <div className="w-4 h-4 mx-auto mb-1 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-green-500" />
                </div>
                <p className="text-xs font-bold text-foreground mb-0.5">
                  Real-Time Data
                </p>
                <p className="text-[10px] text-muted-foreground/70 font-medium">
                  Live market indicators
                </p>
              </div>

              <div className="relative p-3 border border-blue-500/30 bg-blue-500/5 text-center">
                {/* Corner accent */}
                <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-blue-500/50" />
                <Flame className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-foreground mb-0.5">
                  Professional Tools
                </p>
                <p className="text-[10px] text-muted-foreground/70 font-medium">
                  Advanced trading platform
                </p>
              </div>
            </div>
          )}

          <div
            className={cn(
              "relative border-t border-border text-center",
              isMobile ? "pt-3" : "pt-4",
            )}
          >
            {/* Decorative corners for mobile */}
            {isMobile && (
              <>
                <div className="absolute top-0 left-0 w-4 h-px bg-border" />
                <div className="absolute top-0 right-0 w-4 h-px bg-border" />
              </>
            )}

            <p className="text-[10px] text-muted-foreground font-medium tracking-wider mb-0.5">
              STELS WEB3 OS v0.12.8
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              © 2024 Gliesereum Ukraine. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Welcome;
