/**
 * Empty State Component
 * Futuristic display when no applications match filters
 */

import React from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useWelcomeStore } from "../store.ts";

interface EmptyStateProps {
  isMobile: boolean;
}

/**
 * Empty State Component
 */
export function EmptyState({ isMobile }: EmptyStateProps): React.ReactElement {
  const searchTerm = useWelcomeStore((state) => state.searchTerm);
  const selectedCategory = useWelcomeStore((state) => state.selectedCategory);
  const clearFilters = useWelcomeStore((state) => state.clearFilters);

  return (
    <motion.div
      className={isMobile ? "px-4 py-16" : "container mx-auto px-6 py-24"}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <motion.div
          className="mb-6 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            type: "spring",
            stiffness: 200,
          }}
        >
          <div className="relative">
            {/* Static rings */}
            <div className="absolute -inset-2 rounded-full border-2 border-amber-500/20" />
            <div className="absolute -inset-4 rounded-full border-2 border-blue-500/15" />

            <div className="relative p-6 rounded-full bg-muted/50 border-2 border-border backdrop-blur-sm">
              {/* Grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] rounded-full" />

              {/* Corner accents */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/30" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500/30" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500/30" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/30" />

              <Search className="w-12 h-12 text-muted-foreground relative z-10" />
            </div>

            <div className="absolute -top-1 -right-1 p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/30 backdrop-blur-sm">
              <X className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Applications Found
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {searchTerm
              ? (
                <>
                  No results for "<span className="font-medium">
                    {searchTerm}
                  </span>"
                  {selectedCategory !== "All" && (
                    <>
                      {" "}
                      in <span className="font-medium">{selectedCategory}</span>
                    </>
                  )}
                </>
              )
              : (
                <>
                  No applications match your current filters
                </>
              )}
          </p>

          {/* Clear filters button */}
          <div className="relative inline-block">
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400/50" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-amber-400/50" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-amber-400/50" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400/50" />

            <Button
              onClick={clearFilters}
              className="relative bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-black font-bold"
            >
              Clear All Filters
            </Button>
          </div>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">Tip:</span>{" "}
            Try different search terms or browse all categories
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
