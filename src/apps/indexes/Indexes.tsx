/**
 * Market Indexes Application
 * Professional Bloomberg/Palantir/Aladdin style interface
 */

import * as React from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Grid3x3,
  List,
  Search,
  Filter,
  X,
  Activity,
} from "lucide-react";
import { useIndexStore } from "./store";
import { useIndexesSync } from "./hooks/use-indexes-sync";
import { IndexCard } from "./components/index-card";
import { IndexDetail } from "./components/index-detail";
import { INDEXES_METADATA } from "./store";

/**
 * Market Indexes Application Component
 */
export default function Indexes(): React.ReactElement {
  // Use separate selectors for primitive values to avoid unnecessary re-renders
  const selectedIndex = useIndexStore((state) => state.selectedIndex);
  const searchFilter = useIndexStore((state) => state.ui.searchFilter);
  const categoryFilter = useIndexStore((state) => state.ui.categoryFilter);
  const viewMode = useIndexStore((state) => state.ui.viewMode);
  const loading = useIndexStore((state) => state.loading);
  const error = useIndexStore((state) => state.error);
  const lastUpdate = useIndexStore((state) => state.lastUpdate);
  
  // Get indexes keys string from cache - stable reference
  const indexesKeysString = useIndexStore((state) => state._indexesKeysCache);
  
  const setSelectedIndex = useIndexStore((state) => state.setSelectedIndex);
  const setViewMode = useIndexStore((state) => state.setViewMode);
  const setSearchFilter = useIndexStore((state) => state.setSearchFilter);
  const setCategoryFilter = useIndexStore((state) => state.setCategoryFilter);
  const clearError = useIndexStore((state) => state.clearError);

  // Sync data from sessionStorage
  useIndexesSync();

  // Get filtered indexes metadata - memoized with stable string dependency
  const filteredIndexes = useMemo(() => {
    const availableKeys = indexesKeysString ? indexesKeysString.split(',') : [];
    
    return Object.values(INDEXES_METADATA).filter((metadata) => {
      // Filter by search
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        if (
          !metadata.name.toLowerCase().includes(searchLower) &&
          !metadata.code.toLowerCase().includes(searchLower) &&
          !metadata.description.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Filter by category
      if (categoryFilter) {
        if (metadata.category !== categoryFilter) {
          return false;
        }
      }

      // Only show indexes that have data
      return availableKeys.includes(metadata.code);
    });
  }, [searchFilter, categoryFilter, indexesKeysString]);
  
  // Get indexes data - use selector to get the actual data (only when needed for rendering)
  const indexes = useIndexStore((state) => state.indexes);

  // Get selected index data - use selector directly
  const selectedIndexData = useIndexStore((state) => {
    if (!state.selectedIndex) return null;
    return state.indexes[state.selectedIndex] || null;
  });

  // Categories for filter
  const categories = [
    { value: "market", label: "Market" },
    { value: "sentiment", label: "Sentiment" },
    { value: "technical", label: "Technical" },
    { value: "liquidity", label: "Liquidity" },
    { value: "arbitrage", label: "Arbitrage" },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Activity className="icon-lg text-amber-500" />
                Market Indexes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time market analysis and index tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdate && (
                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(lastUpdate).toLocaleTimeString()}
                </div>
              )}
              {loading && (
                <div className="text-xs text-amber-500">Loading...</div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
              <Input
                placeholder="Search indexes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9"
              />
              {searchFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="icon-xs" />
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <Select
              value={categoryFilter || "all"}
              onValueChange={(value) =>
                setCategoryFilter(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="icon-sm mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center gap-1 border border-border rounded p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 px-2"
              >
                <Grid3x3 className="icon-sm" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 px-2"
              >
                <List className="icon-sm" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="shrink-0 bg-red-500/10 border-b border-red-500/20 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-6 w-6 p-0"
            >
              <X className="icon-xs" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0">
          {/* Indexes Grid/List */}
          <div className="overflow-y-auto p-6">
            {filteredIndexes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-muted-foreground">
                    {searchFilter || categoryFilter
                      ? "No indexes match your filters"
                      : "No indexes available"}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div
                className={cn(
                  "grid gap-4",
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1",
                )}
              >
                <AnimatePresence mode="popLayout">
                  {filteredIndexes.map((metadata) => {
                    const indexData = indexes[metadata.code] || null;
                    const isSelected = selectedIndex === metadata.code;
                    return (
                      <motion.div
                        key={metadata.code}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IndexCard
                          metadata={metadata}
                          data={indexData}
                          isSelected={isSelected}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedIndex(null);
                            } else {
                              setSelectedIndex(metadata.code);
                            }
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <AnimatePresence mode="wait">
            {selectedIndex && selectedIndexData && (
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="border-l border-border bg-card/50 backdrop-blur-sm overflow-y-auto"
              >
                <div className="p-6 h-full">
                  <IndexDetail
                    indexCode={selectedIndex}
                    data={selectedIndexData}
                    onClose={() => setSelectedIndex(null)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

