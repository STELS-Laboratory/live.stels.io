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
      <div className="px-4 py-4 border-b border-border/30 bg-card/30">
        {/* Horizontal scroll categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent -mx-4 px-4">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            const count = categoryCounts[category] || 0;

            return (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 whitespace-nowrap flex-shrink-0",
                  isActive
                    ? getCategoryActiveColor(category)
                    : "bg-card/50 text-muted-foreground border-border/50 hover:bg-card hover:border-border",
                )}
                whileTap={{ scale: 0.95 }}
              >
                {getCategoryIcon(category)}
                <span className="text-xs font-medium">{category}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 text-xs h-5 px-1.5",
                    isActive ? "bg-white/20" : "bg-muted/50",
                  )}
                >
                  {count}
                </Badge>
              </motion.button>
            );
          })}
        </div>

        {/* Featured toggle */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <Button
            variant={showOnlyFeatured ? "default" : "outline"}
            size="sm"
            onClick={toggleShowOnlyFeatured}
            className={cn(
              "h-8 text-xs",
              showOnlyFeatured &&
                "bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30",
            )}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Featured Only
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative border-b border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="container mx-auto px-6 py-6 relative">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category, index) => {
              const isActive = selectedCategory === category;
              const count = categoryCounts[category] || 0;

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Glow effect for active button */}
                  {isActive && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 blur-lg" />
                  )}
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "h-10 gap-2.5 px-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative shadow-sm hover:shadow-md",
                      isActive
                        ? getCategoryActiveColor(category)
                        : getCategoryColor(category),
                    )}
                  >
                    {getCategoryIcon(category)}
                    <span className="font-medium">{category}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-1 text-xs h-5 px-1.5",
                        isActive ? "bg-white/20" : "bg-muted/50",
                      )}
                    >
                      {count}
                    </Badge>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Featured toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Button
              variant={showOnlyFeatured ? "default" : "outline"}
              size="sm"
              onClick={toggleShowOnlyFeatured}
              className={cn(
                "h-10 gap-2.5 px-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-sm hover:shadow-md",
                showOnlyFeatured &&
                  "bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30",
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">Featured Only</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
