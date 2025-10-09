/**
 * Welcome Screen - Premium Futuristic App Store
 * Advanced application launcher with neon effects and optimized performance
 */

import React, { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
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
  StatsBar,
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

      {/* Stats Bar - Desktop only, no filters active */}
      {!isMobile &&
        !searchTerm &&
        selectedCategory === "All" &&
        !showOnlyFeatured && (
        <StatsBar
          totalApps={applications.length}
          featuredApps={featuredApps.length}
          categories={APP_CATEGORIES.length - 1}
          isMobile={isMobile}
        />
      )}

      {/* Empty State */}
      {showEmptyState && <EmptyState isMobile={isMobile} />}

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

      {/* Footer - Desktop only */}
      {!isMobile && (
        <motion.div
          className="container mx-auto px-6 py-12 mt-8 border-t border-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Features */}
            <div className="grid grid-cols-3 gap-6">
              <motion.div
                className="p-4 rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground mb-1">
                  Web3 Technology
                </p>
                <p className="text-xs text-muted-foreground">
                  Secure, decentralized AI infrastructure
                </p>
              </motion.div>

              <motion.div
                className="p-4 rounded-lg bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-6 h-6 mx-auto mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mx-auto" />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">
                  Real-time Data
                </p>
                <p className="text-xs text-muted-foreground">
                  Live market data and professional indicators
                </p>
              </motion.div>

              <motion.div
                className="p-4 rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20"
                whileHover={{ scale: 1.05 }}
              >
                <Flame className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground mb-1">
                  Professional Tools
                </p>
                <p className="text-xs text-muted-foreground">
                  Advanced trading features for professionals
                </p>
              </motion.div>
            </div>

            {/* Version */}
            <div className="pt-6 border-t border-border/30">
              <p className="text-xs text-muted-foreground font-bold tracking-wider">
                STELS WEB3 OS v0.12.8
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                © 2024 Gliesereum Ukraine. All rights reserved.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile Footer */}
      {isMobile && (
        <div className="px-4 py-8 mt-8 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground font-bold tracking-wider mb-2">
            STELS WEB3 OS v0.12.8
          </p>
          <p className="text-xs text-muted-foreground">
            © 2024 Gliesereum Ukraine
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default Welcome;
