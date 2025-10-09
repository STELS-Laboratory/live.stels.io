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
    <div className={isMobile ? "px-4 py-16" : "container mx-auto px-6 py-24"}>
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="mb-6 flex items-center justify-center">
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
        </div>

        {/* Message */}
        <div>
          <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">
            No Applications Found
          </h3>
          <p className="text-base text-muted-foreground/70 mb-8 font-semibold leading-relaxed">
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
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400/50" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400/50" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400/50" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400/50" />

            <Button
              onClick={clearFilters}
              className="relative h-14 px-8 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-black font-black shadow-lg hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="relative mt-10 p-6 bg-muted/30 border-2 border-border/30 shadow-sm">
          {/* Corner accents */}
          <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t border-l border-border/50" />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t border-r border-border/50" />
          <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b border-l border-border/50" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b border-r border-border/50" />

          <p className="text-sm text-muted-foreground/70 font-medium relative">
            <span className="font-black text-foreground">Tip:</span>{" "}
            Try different search terms or browse all categories
          </p>
        </div>
      </div>
    </div>
  );
}
