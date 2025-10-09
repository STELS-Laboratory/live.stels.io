/**
 * Empty State Component
 * Futuristic display when no applications match filters
 */

import React from "react";
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
    <div className={isMobile ? "px-4 py-12" : "container mx-auto px-6 py-16"}>
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            {/* Decorative corners */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-border" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-border" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-border" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-border" />

            <div className="relative p-6 border-2 border-border bg-muted">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>

            <div className="absolute -top-1 -right-1 p-1.5 border-2 border-amber-500/30 bg-amber-500/10">
              <X className="w-3 h-3 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">
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
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber-500/30" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-amber-500/30" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-amber-500/30" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-amber-500/30" />

            <Button
              onClick={clearFilters}
              className="relative h-10 px-6 text-sm bg-amber-500 hover:bg-amber-600 text-black font-bold transition-colors"
            >
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="relative mt-6 p-4 bg-muted border border-border">
          {/* Corner accents */}
          <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-border" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-border" />
          <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l border-border" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-border" />

          <p className="text-xs text-muted-foreground/70 font-medium relative">
            <span className="font-bold text-foreground">Tip:</span>{" "}
            Try different search terms or browse all categories
          </p>
        </div>
      </div>
    </div>
  );
}
