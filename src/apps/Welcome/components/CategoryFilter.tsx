/**
 * Category Filter Component
 * Futuristic category navigation with neon effects
 */

import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Code2,
  Flame,
  Globe2,
  Grid3X3,
  Layers3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { useWelcomeStore } from "../store.ts";
import type { AppCategory } from "../constants.tsx";

interface CategoryFilterProps {
  categories: readonly AppCategory[];
  categoryCounts: Record<string, number>;
  isMobile: boolean;
}

/**
 * Get icon for category
 */
function getCategoryIcon(category: AppCategory): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    All: <Grid3X3 className="w-4 h-4" />,
    Analytics: <Activity className="w-4 h-4" />,
    Trading: <TrendingUp className="w-4 h-4" />,
    Development: <Code2 className="w-4 h-4" />,
    Network: <Globe2 className="w-4 h-4" />,
    Visualization: <Layers3 className="w-4 h-4" />,
  };
  return icons[category] || <Flame className="w-4 h-4" />;
}

/**
 * Get color for category
 */
function getCategoryColor(category: AppCategory): string {
  const colors: Record<string, string> = {
    All: "hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30",
    Analytics:
      "hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30",
    Trading:
      "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30",
    Development:
      "hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500/30",
    Network:
      "hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30",
    Visualization:
      "hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30",
  };
  return colors[category] || "";
}

/**
 * Get active color for category
 */
function getCategoryActiveColor(category: AppCategory): string {
  const colors: Record<string, string> = {
    All: "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-sm",
    Analytics: "bg-blue-500/20 text-blue-500 border-blue-500/50 shadow-sm",
    Trading: "bg-green-500/20 text-green-500 border-green-500/50 shadow-sm",
    Development:
      "bg-purple-500/20 text-purple-500 border-purple-500/50 shadow-sm",
    Network:
      "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 shadow-sm",
    Visualization: "bg-pink-500/20 text-pink-500 border-pink-500/50 shadow-sm",
  };
  return colors[category] || "";
}

/**
 * Category Filter Component
 */
export function CategoryFilter({
  categories,
  categoryCounts,
  isMobile,
}: CategoryFilterProps): React.ReactElement {
  const selectedCategory = useWelcomeStore((state) => state.selectedCategory);
  const setSelectedCategory = useWelcomeStore(
    (state) => state.setSelectedCategory,
  );
  const showOnlyFeatured = useWelcomeStore((state) => state.showOnlyFeatured);
  const toggleShowOnlyFeatured = useWelcomeStore(
    (state) => state.toggleShowOnlyFeatured,
  );

  if (isMobile) {
    return (
      <div className="relative px-4 py-3 border-b border-border bg-card overflow-hidden">
        {/* Decorative line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

        {/* Horizontal scroll categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            const count = categoryCounts[category] || 0;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "relative flex items-center gap-1.5 px-2.5 py-1.5 border transition-colors whitespace-nowrap flex-shrink-0",
                  isActive
                    ? getCategoryActiveColor(category)
                    : "bg-background text-muted-foreground border-border active:bg-muted",
                )}
              >
                {/* Corner accent for active */}
                {isActive && (
                  <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-current" />
                )}

                {getCategoryIcon(category)}
                <span className="text-xs font-medium">{category}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-0.5 text-[10px] h-4 px-1",
                    isActive ? "bg-background/20" : "bg-muted",
                  )}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Featured toggle with marketing */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Button
              variant={showOnlyFeatured ? "default" : "outline"}
              size="sm"
              onClick={toggleShowOnlyFeatured}
              className={cn(
                "h-7 text-xs relative",
                showOnlyFeatured &&
                  "bg-amber-500 text-black border-amber-500 hover:bg-amber-600",
              )}
            >
              {showOnlyFeatured && (
                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-amber-400" />
              )}
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Button>
            {showOnlyFeatured && (
              <span className="text-[10px] text-amber-500 font-bold animate-pulse">
                ★ Best picks
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative border-b border-border bg-card overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

      <div className="container mx-auto px-6 py-3 relative">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              const count = categoryCounts[category] || 0;

              return (
                <Button
                  key={category}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "h-8 gap-2 px-3 transition-colors",
                    isActive
                      ? getCategoryActiveColor(category)
                      : getCategoryColor(category),
                  )}
                >
                  {getCategoryIcon(category)}
                  <span className="font-medium text-xs">{category}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-0.5 text-[10px] h-4 px-1",
                      isActive ? "bg-background/20" : "bg-muted",
                    )}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Featured toggle */}
          <Button
            variant={showOnlyFeatured ? "default" : "outline"}
            size="sm"
            onClick={toggleShowOnlyFeatured}
            className={cn(
              "h-8 gap-2 px-3 transition-colors",
              showOnlyFeatured &&
                "bg-amber-500 text-black border-amber-500 hover:bg-amber-600",
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium text-xs">Featured</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
